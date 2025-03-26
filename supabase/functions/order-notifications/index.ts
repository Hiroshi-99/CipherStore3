import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const DISCORD_WEBHOOK_URL = Deno.env.get('DISCORD_WEBHOOK_URL');
const DISCORD_INTERACTION_URL = Deno.env.get('DISCORD_INTERACTION_URL');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
);

serve(async (req) => {
  // Handle Discord interactions (button clicks)
  if (req.headers.get('content-type')?.includes('application/json') && 
      req.url.includes('/discord-interaction')) {
    const body = await req.json();
    
    // Handle Discord interaction
    if (body.type === 1) {
      // Ping/verification
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }
    
    if (body.type === 2) { // Application command or component interaction
      const interaction = body;
      const customId = interaction.data.custom_id;
      
      if (!customId) {
        return new Response(JSON.stringify({ error: 'Invalid interaction' }), {
          headers: { 'Content-Type': 'application/json' },
          status: 400,
        });
      }
      
      const [action, orderId] = customId.split('_');
      
      try {
        if (action === 'approve') {
          await updateOrderStatus(orderId, 'approved');
          return new Response(JSON.stringify({
            type: 4, // Channel message with source
            data: {
              content: '✅ Order approved successfully!',
              flags: 64 // Ephemeral
            }
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        } else if (action === 'reject') {
          await updateOrderStatus(orderId, 'rejected');
          return new Response(JSON.stringify({
            type: 4, // Channel message with source
            data: {
              content: '❌ Order rejected!',
              flags: 64 // Ephemeral
            }
          }), {
            headers: { 'Content-Type': 'application/json' },
          });
        }
      } catch (error) {
        return new Response(JSON.stringify({
          type: 4,
          data: {
            content: 'Error updating order status: ' + error.message,
            flags: 64
          }
        }), {
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
    
    return new Response(JSON.stringify({ error: 'Unknown interaction type' }), {
      headers: { 'Content-Type': 'application/json' },
      status: 400,
    });
  }

  // Handle database triggers (new orders)
  try {
    const { record } = await req.json();

    // Only process new orders with pending status
    if (record.status !== 'pending') {
      return new Response(JSON.stringify({ message: 'Not a new pending order' }), {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      });
    }

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
        }
      ],
      components: [
        {
          type: 1,
          components: [
            {
              type: 2,
              style: 3, // Success
              label: "Approve",
              custom_id: `approve_${record.id}`
            },
            {
              type: 2,
              style: 4, // Danger
              label: "Reject",
              custom_id: `reject_${record.id}`
            }
          ]
        }
      ]
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

async function updateOrderStatus(orderId, status) {
  const { error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId);

  if (error) throw error;
} 