import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

serve(async (req) => {
  const { record } = await req.json();

  // Only process new orders with pending status
  if (record.status !== 'pending') {
    return new Response(JSON.stringify({ message: 'Not a new pending order' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  }

  try {
    // Prepare Discord webhook payload
    const paymentProofUrl = record.payment_proof 
      ? `${SUPABASE_URL}/storage/v1/object/public/payment-proofs/${record.payment_proof}`
      : 'No payment proof attached';

    const payload = {
      embeds: [
        {
          title: `New Order from ${record.username}`,
          description: `Order ID: ${record.id}`,
          color: 0xFFA500,
          fields: [
            {
              name: 'Status',
              value: 'Pending',
              inline: true,
            },
            {
              name: 'Date',
              value: new Date(record.created_at).toLocaleString(),
              inline: true,
            },
            {
              name: 'Payment Proof',
              value: typeof paymentProofUrl === 'string' ? paymentProofUrl : 'No payment proof attached',
            },
          ],
          timestamp: new Date().toISOString(),
        },
      ],
    };

    // Send to Discord webhook
    if (DISCORD_WEBHOOK_URL) {
      const response = await fetch(DISCORD_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Discord API error: ${response.statusText}`);
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
}); 