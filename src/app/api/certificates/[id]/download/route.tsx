import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ReactPDF, { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 60,
    alignItems: 'center',
    justifyContent: 'center',
    border: '10pt solid #1e293b'
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 2
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    color: '#64748b'
  },
  name: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 30,
    color: '#1e293b',
    borderBottom: '2pt solid #1e293b',
    paddingBottom: 10,
    paddingHorizontal: 20
  },
  course: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 60,
    color: '#0f172a',
    textAlign: 'center',
    maxWidth: '80%'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
    bottom: 60,
    paddingHorizontal: 60
  },
  footerBlock: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  signatureLine: {
    width: 200,
    height: 1,
    backgroundColor: '#1e293b',
    marginBottom: 10
  },
  signatureText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b'
  },
  signatureTitle: {
    fontSize: 12,
    color: '#64748b'
  },
  metadata: {
    fontSize: 10,
    color: '#94a3b8',
    position: 'absolute',
    bottom: 20,
    width: '100%',
    textAlign: 'center'
  }
});

const CertificateDocument = ({ studentName, courseTitle, courseDuration, issueDate, verifyCode, instructorName }: any) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Text style={styles.logo}>ArefinLab</Text>
      <Text style={styles.title}>Certificate of Completion</Text>
      <Text style={styles.subtitle}>This is to certify that</Text>
      <Text style={styles.name}>{studentName}</Text>
      <Text style={styles.subtitle}>
        has successfully completed the {courseDuration ? `${courseDuration} course` : 'course'}
      </Text>
      <Text style={styles.course}>{courseTitle}</Text>
      
      <View style={styles.footer}>
        <View style={styles.footerBlock}>
          <Text style={{ fontSize: 16, marginBottom: 15, color: '#1e293b' }}>{issueDate}</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>Date of Issue</Text>
        </View>

        <View style={styles.footerBlock}>
          <Text style={{ fontSize: 18, fontFamily: 'Times-Italic', marginBottom: 15, color: '#1e293b' }}>{instructorName}</Text>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureText}>{instructorName}</Text>
          <Text style={styles.signatureTitle}>Instructor, ArefinLab.com</Text>
        </View>
      </View>

      <Text style={styles.metadata}>Verify at arefinlab.com/verify/{verifyCode} • ID: {verifyCode}</Text>
    </Page>
  </Document>
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch certificate details
  const { data: cert, error } = await supabase
    .from('certificates')
    .select('*, courses(id, title, duration), profiles(full_name)')
    .eq('id', id)
    .single();

  if (error || !cert) {
    return new NextResponse('Certificate not found', { status: 404 });
  }

  // Fetch instructor name
  let instructorName = "ArefinLab Team";
  if (cert.courses?.id) {
    const { data: assignment } = await supabase
      .from('instructor_assignments')
      .select('profiles(full_name)')
      .eq('course_id', cert.courses.id)
      .limit(1)
      .maybeSingle();
      
    if (assignment?.profiles) {
      const profile = Array.isArray(assignment.profiles) ? assignment.profiles[0] : assignment.profiles;
      if (profile?.full_name) {
        instructorName = profile.full_name;
      }
    }
  }

  // Generate PDF
  const pdfStream = await ReactPDF.renderToStream(
    <CertificateDocument 
      studentName={cert.profiles?.full_name || 'Student'}
      courseTitle={cert.courses?.title || 'Course'}
      courseDuration={cert.courses?.duration || null}
      issueDate={new Date(cert.issued_at).toLocaleDateString()}
      verifyCode={cert.verify_code}
      instructorName={instructorName}
    />
  );

  return new NextResponse(pdfStream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Certificate-${cert.verify_code}.pdf"`
    }
  });
}
