import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { env } from '@/env';
import { PDFDocument, rgb } from 'pdf-lib';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  // Get resource
  const { data: resource } = await supabase
    .from('resources')
    .select('*')
    .eq('id', id)
    .single();

  if (!resource) {
    return new NextResponse('Resource not found', { status: 404 });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, role')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.role === 'admin';

  // Verify entitlement
  let orderItemId = null;
  if (!resource.is_free && !isAdmin) {
    const { data: orderItem } = await supabase
      .from('order_items')
      .select('id, orders!inner(student_id, status)')
      .eq('resource_id', id)
      .eq('orders.student_id', user.id)
      .eq('orders.status', 'completed')
      .limit(1)
      .maybeSingle();

    if (!orderItem) {
      // Check if student is actively enrolled in any course that attaches this resource
      const supabaseAdminCheck = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
      const { data: attachedBlocks } = await supabaseAdminCheck
        .from('content_blocks')
        .select(`
          lesson_id,
          lessons!inner (
            submodules!inner (
              modules!inner (
                course_id
              )
            )
          )
        `)
        .eq('block_type', 'file')
        .filter('payload->>resource_id', 'eq', id);

      let isEnrolledInCourse = false;
      if (attachedBlocks && attachedBlocks.length > 0) {
        for (const block of attachedBlocks) {
          const courseId = (block as any).lessons?.submodules?.modules?.course_id;
          if (courseId) {
            const { data: enrollment } = await supabaseAdminCheck
              .from('enrollments')
              .select('id')
              .eq('student_id', user.id)
              .eq('course_id', courseId)
              .eq('status', 'active')
              .limit(1)
              .maybeSingle();

            if (enrollment) {
              isEnrolledInCourse = true;
              break;
            }
          }
        }
      }

      if (!isEnrolledInCourse) {
        return new NextResponse('Payment required', { status: 403 });
      }
    } else {
      orderItemId = orderItem.id;
    }
  }

  // Check download limits
  if (resource.download_limit !== null && !isAdmin) {
    const { count } = await supabase
      .from('resource_downloads')
      .select('*', { count: 'exact', head: true })
      .eq('resource_id', id)
      .eq('student_id', user.id);

    if (count !== null && count >= resource.download_limit) {
      return new NextResponse('Download limit reached', { status: 403 });
    }
  }

  // Fetch the file using the Service Role to bypass RLS on private bucket
  const supabaseAdmin = createSupabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);
  
  const { data: fileData, error: downloadError } = await supabaseAdmin
    .storage
    .from('private_resources')
    .download(resource.storage_path);

  if (downloadError || !fileData) {
    console.error('Failed to download from storage', downloadError);
    return new NextResponse('File not found in storage', { status: 404 });
  }

  let finalBody: any = fileData; // Default to the raw blob

  // Watermark if enabled and it's a PDF
  if (resource.watermark_enabled && fileData.type === 'application/pdf') {
    try {
      const arrayBuffer = await fileData.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const pages = pdfDoc.getPages();
      const watermarkText = `Licensed to: ${profile?.full_name} (${profile?.email})`;

      pages.forEach(page => {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: 10,
          y: 10,
          size: 10,
          color: rgb(0.5, 0.5, 0.5),
          opacity: 0.5,
        });
      });

      const pdfBytes = await pdfDoc.save();
      finalBody = pdfBytes; // Uint8Array is valid for BodyInit
    } catch (err) {
      console.error('Failed to watermark PDF', err);
      // We will still return the original Blob if watermarking fails
    }
  }

  // Log the download (running as service role to ensure it logs even if the user drops off)
  await supabaseAdmin.from('resource_downloads').insert({
    resource_id: id,
    student_id: user.id,
    order_item_id: orderItemId,
    ip_address: req.headers.get('x-forwarded-for') || null
  });

  return new NextResponse(finalBody, {
    headers: {
      'Content-Type': fileData.type,
      'Content-Disposition': `attachment; filename="${resource.title}.pdf"`,
    },
  });
}
