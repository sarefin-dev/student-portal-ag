import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ReactPDF, { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

// Register standard fonts is not strictly needed for Times, it's built-in, but we must explicitly use it in styles.
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
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
    padding: 40,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fafafa',
  },
  logo: {
    fontSize: 28,
    fontFamily: 'Times-Bold',
    color: '#0f172a',
    marginBottom: 40,
    textTransform: 'uppercase',
    letterSpacing: 4
  },
  title: {
    fontSize: 48,
    fontFamily: 'Times-Bold',
    marginBottom: 20,
    color: '#0f172a',
    textTransform: 'uppercase'
  },
  subtitle: {
    fontSize: 18,
    fontFamily: 'Times-Italic',
    marginBottom: 30,
    color: '#334155'
  },
  name: {
    fontSize: 42,
    fontFamily: 'Times-Bold',
    marginBottom: 30,
    color: '#1e293b',
    borderBottom: '2pt solid #1e293b',
    paddingBottom: 10,
    paddingHorizontal: 40
  },
  course: {
    fontSize: 28,
    fontFamily: 'Times-Bold',
    marginBottom: 20,
    color: '#0f172a',
    textAlign: 'center',
    maxWidth: '85%'
  },
  summary: {
    fontSize: 14,
    fontFamily: 'Times-Roman',
    color: '#334155',
    textAlign: 'center',
    maxWidth: '75%',
    lineHeight: 1.6,
    marginBottom: 50,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    position: 'absolute',
    bottom: 80,
    paddingHorizontal: 80
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
    fontFamily: 'Times-Bold',
    color: '#1e293b'
  },
  signatureTitle: {
    fontSize: 12,
    fontFamily: 'Times-Roman',
    color: '#64748b'
  },
  metadata: {
    fontSize: 11,
    fontFamily: 'Times-Roman',
    color: '#64748b',
    position: 'absolute',
    bottom: 30,
    width: '100%',
    textAlign: 'center'
  }
});

const CertificateDocument = ({ studentName, courseTitle, courseDuration, courseSummary, issueDate, verifyCode, instructorName, host }: any) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.outerBorder}>
        <View style={styles.innerBorder}>
          <Text style={styles.logo}>ArefinLab</Text>
          <Text style={styles.title}>Certificate of Completion</Text>
          <Text style={styles.subtitle}>This is to certify that</Text>
          <Text style={styles.name}>{studentName}</Text>
          <Text style={styles.subtitle}>
            has successfully completed the {courseDuration ? `${courseDuration} course` : 'course'}
          </Text>
          <Text style={styles.course}>{courseTitle}</Text>
          
          {courseSummary ? (
            <Text style={styles.summary}>Covering: {courseSummary}</Text>
          ) : null}
          
          <View style={styles.footer}>
            <View style={styles.footerBlock}>
              <Text style={{ fontSize: 18, fontFamily: 'Times-Roman', marginBottom: 15, color: '#1e293b' }}>{issueDate}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>Date of Issue</Text>
            </View>

            <View style={styles.footerBlock}>
              <Text style={{ fontSize: 24, fontFamily: 'Times-Italic', marginBottom: 10, color: '#1e293b' }}>{instructorName}</Text>
              <View style={styles.signatureLine} />
              <Text style={styles.signatureText}>{instructorName}</Text>
              <Text style={styles.signatureTitle}>Instructor, ArefinLab</Text>
            </View>
          </View>

          <Text style={styles.metadata}>Verify at {host}/verify/{verifyCode} • ID: {verifyCode}</Text>
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

  // Fetch certificate details
  const { data: cert, error } = await supabase
    .from('certificates')
    .select('*, courses(id, title, description, outcomes, duration, ai_summary), profiles(full_name)')
    .eq('id', id)
    .single();

  if (error || !cert || !cert.courses) {
    return new NextResponse('Certificate not found', { status: 404 });
  }

  // Fetch instructor name
  let instructorName = "ArefinLab Team";
  if (cert.courses.id) {
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
      courseSummary={cert.courses?.ai_summary || null}
      issueDate={new Date(cert.issued_at).toLocaleDateString()}
      verifyCode={cert.verify_code}
      instructorName={instructorName}
      host={`${protocol}://${host}`}
    />
  );

  return new NextResponse(pdfStream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Certificate-${cert.verify_code}.pdf"`
    }
  });
}
