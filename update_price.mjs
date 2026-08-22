import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/courses?id=eq.520d5e53-844b-4d26-9636-53bcf2431e10`, {
    method: 'PATCH',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ price_amount: 508.23 })
  });
  console.log("Status:", res.status);
}

main();
