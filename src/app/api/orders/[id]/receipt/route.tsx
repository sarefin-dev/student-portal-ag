import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'Helvetica' },
  header: { fontSize: 24, marginBottom: 20, textAlign: 'center', fontWeight: 'bold' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  label: { fontSize: 12, color: '#666' },
  value: { fontSize: 12, fontWeight: 'bold' },
  section: { marginTop: 20, marginBottom: 20, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: '#eee' },
  tableHeader: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#000', paddingBottom: 5, marginBottom: 10 },
  tableRow: { flexDirection: 'row', marginBottom: 5 },
  col1: { width: '70%', fontSize: 12 },
  col2: { width: '30%', fontSize: 12, textAlign: 'right' },
  totalRow: { flexDirection: 'row', marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: '#000' },
  footer: { position: 'absolute', bottom: 40, left: 40, right: 40, textAlign: 'center', fontSize: 10, color: '#999' }
});

const ReceiptPDF = ({ order }: { order: any }) => (
  <Document>
    <Page size="A4" style={styles.page}>
      <Text style={styles.header}>ArefinLab Student Portal</Text>
      <Text style={{ textAlign: 'center', fontSize: 14, marginBottom: 30, color: '#666' }}>Payment Receipt</Text>
      
      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Order ID:</Text>
          <Text style={styles.value}>{order.id}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date:</Text>
          <Text style={styles.value}>{new Date(order.created_at).toLocaleString()}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Student:</Text>
          <Text style={styles.value}>{order.profiles?.full_name || order.profiles?.email}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Status:</Text>
          <Text style={styles.value}>{order.status.toUpperCase()}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Item</Text>
          <Text style={styles.col2}>Amount</Text>
        </View>
        {order.order_items.map((item: any) => (
          <View style={styles.tableRow} key={item.id}>
            <Text style={styles.col1}>{item.courses?.title || 'Course Enrollment'}</Text>
            <Text style={styles.col2}>{order.currency} {item.unit_price_amount}</Text>
          </View>
        ))}
        <View style={styles.totalRow}>
          <Text style={[styles.col1, { fontWeight: 'bold' }]}>Total Paid</Text>
          <Text style={[styles.col2, { fontWeight: 'bold' }]}>{order.currency} {order.total_amount}</Text>
        </View>
      </View>

      {order.payments && order.payments.length > 0 && (
        <View style={styles.section}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 10 }}>Transactions</Text>
          {order.payments.map((p: any) => (
            <View style={styles.row} key={p.id}>
              <Text style={styles.col1}>{p.method.toUpperCase()} • TrxID: {p.trx_id}</Text>
              <Text style={styles.col2}>{order.currency} {p.amount}</Text>
            </View>
          ))}
        </View>
      )}

      <Text style={styles.footer}>Thank you for learning with ArefinLab!</Text>
    </Page>
  </Document>
);

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: order } = await supabase
    .from('orders')
    .select('*, profiles(*), order_items(*, courses(*)), payments(*)')
    .eq('id', id)
    .single();

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  if (order.student_id !== user.id) {
    // Admins can download anyone's receipt, but students only their own
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  const stream = await renderToStream(<ReceiptPDF order={order} />);
  
  return new NextResponse(stream as unknown as ReadableStream, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="receipt-${order.id.substring(0, 8)}.pdf"`,
    },
  });
}
