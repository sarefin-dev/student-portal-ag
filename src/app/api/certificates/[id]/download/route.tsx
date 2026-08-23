import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import ReactPDF, { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#ffffff',
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    border: '10pt solid #1e293b'
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#0f172a'
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    color: '#64748b'
  },
  name: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#1e293b',
    borderBottom: '2pt solid #1e293b',
    paddingBottom: 10
  },
  course: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 40,
    color: '#0f172a'
  },
  date: {
    fontSize: 14,
    color: '#64748b',
    position: 'absolute',
    bottom: 50,
    right: 50
  },
  id: {
    fontSize: 12,
    color: '#94a3b8',
    position: 'absolute',
    bottom: 50,
    left: 50
  }
});

const CertificateDocument = ({ studentName, courseTitle, issueDate, verifyCode }: any) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <Text style={styles.title}>Certificate of Completion</Text>
      <Text style={styles.subtitle}>This is to certify that</Text>
      <Text style={styles.name}>{studentName}</Text>
      <Text style={styles.subtitle}>has successfully completed the course</Text>
      <Text style={styles.course}>{courseTitle}</Text>
      <Text style={styles.date}>Issued: {issueDate}</Text>
      <Text style={styles.id}>Verify: {verifyCode}</Text>
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
    .select('*, courses(title), profiles(full_name)')
    .eq('id', id)
    .single();

  if (error || !cert) {
    return new NextResponse('Certificate not found', { status: 404 });
  }

  // Generate PDF
  const pdfStream = await ReactPDF.renderToStream(
    <CertificateDocument 
      studentName={cert.profiles?.full_name || 'Student'}
      courseTitle={cert.courses?.title || 'Course'}
      issueDate={new Date(cert.issued_at).toLocaleDateString()}
      verifyCode={cert.verify_code}
    />
  );

  return new NextResponse(pdfStream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="Certificate-${cert.verify_code}.pdf"`
    }
  });
}
