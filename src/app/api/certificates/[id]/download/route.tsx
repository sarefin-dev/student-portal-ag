import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 50, backgroundColor: '#ffffff' },
  border: { border: '4px solid #1a365d', padding: 40, height: '100%', textAlign: 'center' },
  header: { fontSize: 36, color: '#1a365d', marginBottom: 20, fontWeight: 'bold' },
  subtitle: { fontSize: 18, color: '#4a5568', marginBottom: 40 },
  studentName: { fontSize: 32, color: '#2d3748', marginBottom: 40, fontWeight: 'bold' },
  body: { fontSize: 16, color: '#4a5568', marginBottom: 20 },
  courseName: { fontSize: 24, color: '#2d3748', marginBottom: 40, fontWeight: 'bold' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, flexDirection: 'row', justifyContent: 'space-between' },
  signatureBlock: { borderTop: '1px solid #cbd5e0', paddingTop: 10, width: 200, textAlign: 'center' },
  signatureText: { fontSize: 12, color: '#4a5568' },
  verifyText: { fontSize: 10, color: '#a0aec0', marginTop: 20 }
});

const CertificatePDF = ({ cert }: { cert: any }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.border}>
        <Text style={styles.header}>Certificate of Completion</Text>
        <Text style={styles.subtitle}>This is to certify that</Text>
        <Text style={styles.studentName}>{cert.enrollments.profiles.full_name}</Text>
        <Text style={styles.body}>has successfully completed the course</Text>
        <Text style={styles.courseName}>{cert.enrollments.courses.title}</Text>
        <Text style={styles.body}>on {new Date(cert.issued_at).toLocaleDateString()}</Text>

        <Text style={styles.verifyText}>Verify at: {process.env.NEXT_PUBLIC_APP_URL}/verify/{cert.verify_code}</Text>

        <View style={styles.footer}>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureText}>Course Instructor</Text>
          </View>
          <View style={styles.signatureBlock}>
            <Text style={styles.signatureText}>ArefinLab Director</Text>
          </View>
        </View>
      </View>
    </Page>
  </Document>
);

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();

  // We can fetch by verify_code or ID. Let's assume ID.
  const { data: cert, error } = await supabase
    .from('certificates')
    .select('*, enrollments(profiles(full_name), courses(title))')
    .eq('id', id)
    .single();

  if (error || !cert) {
    return NextResponse.json({ error: 'Certificate not found' }, { status: 404 });
  }

  const stream = await renderToStream(<CertificatePDF cert={cert} />);
  
  return new NextResponse(stream as any, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="Certificate-${cert.verify_code}.pdf"`,
    },
  });
}
