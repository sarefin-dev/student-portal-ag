import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function clearTestingData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  console.log("Clearing payments...");
  await supabase.from('payments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  
  console.log("Clearing pending verifications...");
  await supabase.from('pending_verifications').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("Clearing received transactions...");
  await supabase.from('received_transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("Clearing order items...");
  await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("Clearing orders...");
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("Clearing enrollments...");
  await supabase.from('enrollments').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log("Done! Database is clean for new testing.");
}

clearTestingData().catch(console.error);
