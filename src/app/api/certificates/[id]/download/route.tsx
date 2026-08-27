import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ReactPDF, { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';
import fs from 'fs';
import path from 'path';

// Register standard fonts is not strictly needed for Times, it's built-in, but we must explicitly use it in styles.
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerBorder: {
    border: '4pt solid #0f172a',
    padding: 6,
    width: '100%',
    height: '100%',
  },
  innerBorder: {
    border: '1pt solid #0f172a',
    paddingTop: 30,
    paddingBottom: 20,
    paddingHorizontal: 30,
    width: '100%',
    height: '100%',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fafafa',
  },
  contentWrapper: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
    color: '#0f172a',
    marginBottom: 30,
    textTransform: 'uppercase',
    letterSpacing: 4
  },
  logoImage: {
    height: 40,
    marginBottom: 30,
    objectFit: 'contain'
  },
  title: {
    fontSize: 36,
    fontFamily: 'Times-Bold',
    marginBottom: 16,
    color: '#0f172a',
    textTransform: 'uppercase',
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 16,
    fontFamily: 'Times-Italic',
    marginBottom: 20,
    color: '#334155',
    textAlign: 'center'
  },
  name: {
    fontSize: 36,
    fontFamily: 'Times-Bold',
    marginBottom: 20,
    color: '#1e293b',
    borderBottom: '1pt solid #1e293b',
    paddingBottom: 8,
    paddingHorizontal: 30,
    textAlign: 'center'
  },
  course: {
    fontSize: 24,
    fontFamily: 'Times-Bold',
    marginBottom: 16,
    color: '#0f172a',
    textAlign: 'center',
    maxWidth: '85%'
  },
  summary: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
    color: '#334155',
    textAlign: 'center',
    maxWidth: '75%',
    lineHeight: 1.5,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 50,
    marginTop: 20,
    marginBottom: 10,
  },
  footerBlock: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  signatureLine: {
    width: 200,
    height: 1,
    backgroundColor: '#1e293b',
    marginBottom: 8
  },
  signatureImage: {
    height: 35,
    marginBottom: 5,
    objectFit: 'contain'
  },
  signatureText: {
    fontSize: 12,
    fontFamily: 'Times-Bold',
    color: '#1e293b'
  },
  signatureTitle: {
    fontSize: 10,
    fontFamily: 'Times-Roman',
    color: '#64748b'
  },
  metadata: {
    fontSize: 10,
    fontFamily: 'Times-Roman',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10
  }
});

const CertificateDocument = ({ studentName, courseTitle, courseDuration, courseSummary, issueDate, verifyCode, instructorName, instructorTitle, host, logoBase64, signatureImage }: any) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.outerBorder}>
        <View style={styles.innerBorder}>
          <View style={styles.contentWrapper}>
            {logoBase64 ? (
              <Image src={logoBase64} style={styles.logoImage} />
            ) : (
              <Text style={styles.logoText}>ArefinLab</Text>
            )}
            
            <Text style={styles.title}>CERTIFICATE OF COMPLETION</Text>
            <Text style={styles.subtitle}>This is to certify that</Text>
            <Text style={styles.name}>{studentName}</Text>
            <Text style={styles.subtitle}>
              has successfully completed the {courseDuration ? `${courseDuration} course` : 'course'}
            </Text>
            <Text style={styles.course}>{courseTitle}</Text>
            
            {courseSummary ? (
              <Text style={styles.summary}>Covering: {courseSummary}</Text>
            ) : null}
          </View>
          
          <View style={styles.footer}>
            <View style={styles.footerBlock}>
              <Text style={{ fontSize: 16, fontFamily: 'Times-Roman', marginBottom: 12, color: '#1e293b' }}>{issueDate}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>Date of Issue</Text>
            </View>

            <View style={styles.footerBlock}>
              {signatureImage ? (
                <Image src={signatureImage} style={styles.signatureImage} />
              ) : (
                <Text style={{ fontSize: 20, fontFamily: 'Times-Italic', marginBottom: 8, color: '#1e293b' }}>{instructorName}</Text>
              )}
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>{instructorName}</Text>
              <Text style={styles.signatureTitle}>{instructorTitle || 'Instructor, ArefinLab'}</Text>
            </View>
          </View>

          <Text style={styles.metadata}>Verify at {host}/verify/{verifyCode} â€¢ ID: {verifyCode}</Text>
        </View>
      </View>
    </Page>
  </Document>
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Get host for verification URL
  const host = req.headers.get('host') || 'arefinlab.com';
  const protocol = host.includes('localhost') ? 'http' : 'https';

  // Check for local logo.png and signature.png as fallbacks
  let logoBase64 = null;
  let localSignatureBase64 = null;
  try {
    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
    }
    
    const signaturePath = path.join(process.cwd(), 'public', 'signature.png');
    if (fs.existsSync(signaturePath)) {
      const sigBuffer = fs.readFileSync(signaturePath);
      localSignatureBase64 = `data:image/png;base64,${sigBuffer.toString('base64')}`;
    }
  } catch (err) {
    console.error("Could not load local images:", err);
  }

  // Fetch certificate details
  const { data: cert, error } = await supabase
    .from('certificates')
    .select('*, courses(id, title, description, outcomes, duration, ai_summary), profiles(full_name)')
    .eq('id', id)
    .single();

  if (error || !cert || !cert.courses) {
    return new NextResponse('Certificate not found', { status: 404 });
  }

  // Fetch instructor credentials
  let instructorName = "ArefinLab Team";
  let instructorTitle = "Instructor, ArefinLab";
  let finalSignature = localSignatureBase64;

  if (cert.courses.id) {
    const { data: assignment } = await supabase
      .from('instructor_assignments')
      .select('profiles(full_name, instructor_title, signature_url)')
      .eq('course_id', cert.courses.id)
      .order('is_lead', { ascending: false })
      .limit(1)
      .maybeSingle();
      
    if (assignment?.profiles) {
      const profile = Array.isArray(assignment.profiles) ? assignment.profiles[0] : assignment.profiles;
      if (profile?.full_name) {
        instructorName = profile.full_name;
      }
      if (profile?.instructor_title) {
        instructorTitle = profile.instructor_title;
      }
      if (profile?.signature_url) {
        finalSignature = profile.signature_url;
      }
    }
  }

  // Generate PDF
  const pdfStream = await ReactPDF.renderToStream(
    <CertificateDocument 
      studentName={cert.profiles?.full_name || 'Student'}
      courseTitle={cert.courses?.title || 'Course'}
      courseDuration={cert.courses?.duration || null}
      courseSummary={cert.courses?.ai_summary || null}
      issueDate={new Date(cert.issued_at).toLocaleDateString()}
      verifyCode={cert.verify_code}
      instructorName={instructorName}
      instructorTitle={instructorTitle}
      host={`${protocol}://${host}`}
      logoBase64={logoBase64}
      signatureImage={finalSignature}
    />
  );

  return new NextResponse(pdfStream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Certificate-${cert.verify_code}.pdf"`
    }
  });
}

