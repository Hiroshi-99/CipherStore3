import { Client, Events, GatewayIntentBits, EmbedBuilder, ButtonBuilder, ButtonStyle, ActionRowBuilder } from 'discord.js';
import { supabase } from '../lib/supabase';

const DISCORD_TOKEN = import.meta.env.VITE_DISCORD_BOT_TOKEN;
const ADMIN_CHANNEL_ID = import.meta.env.VITE_DISCORD_ADMIN_CHANNEL_ID;

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// When the client is ready, run this code (only once)
client.once(Events.ClientReady, c => {
  console.log(`Discord bot ready! Logged in as ${c.user.tag}`);
  startOrdersListener();
});

// Listen for new orders and post them to Discord
async function startOrdersListener() {
  const channel = await client.channels.fetch(ADMIN_CHANNEL_ID);
  if (!channel || !channel.isTextBased()) {
    console.error('Admin channel not found or not a text channel');
    return;
  }

  // Initial fetch of pending orders
  const pendingOrders = await fetchPendingOrders();
  for (const order of pendingOrders) {
    await sendOrderEmbed(channel, order);
  }

  // Set up realtime listener for new orders
  const subscription = supabase
    .channel('orders')
    .on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'orders' 
    }, async (payload) => {
      const order = payload.new;
      await sendOrderEmbed(channel, order);
    })
    .subscribe();

  return () => {
    subscription.unsubscribe();
  };
}

async function fetchPendingOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending orders:', error);
    return [];
  }

  return data || [];
}

async function sendOrderEmbed(channel, order) {
  const paymentProofUrl = order.payment_proof 
    ? `${import.meta.env.VITE_SUPABASE_URL}/storage/v1/object/public/payment-proofs/${order.payment_proof}`
    : null;

  const embed = new EmbedBuilder()
    .setColor('#FFA500')
    .setTitle(`New Order from ${order.username}`)
    .setDescription(`Order ID: ${order.id}`)
    .addFields(
      { name: 'Status', value: 'Pending', inline: true },
      { name: 'Date', value: new Date(order.created_at).toLocaleDateString(), inline: true }
    )
    .setTimestamp();

  if (paymentProofUrl) {
    embed.addFields({ name: 'Payment Proof', value: `[View Payment Proof](${paymentProofUrl})` });
  }

  // Create approval/rejection buttons
  const approveButton = new ButtonBuilder()
    .setCustomId(`approve_${order.id}`)
    .setLabel('Approve')
    .setStyle(ButtonStyle.Success);

  const rejectButton = new ButtonBuilder()
    .setCustomId(`reject_${order.id}`)
    .setLabel('Reject')
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(approveButton, rejectButton);

  await channel.send({ embeds: [embed], components: [row] });
}

// Handle button interactions
client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isButton()) return;

  const [action, orderId] = interaction.customId.split('_');
  
  try {
    if (action === 'approve') {
      await updateOrderStatus(orderId, 'approved');
      await interaction.update({ 
        content: '✅ Order approved successfully!', 
        components: [] 
      });
    } else if (action === 'reject') {
      await updateOrderStatus(orderId, 'rejected');
      await interaction.update({ 
        content: '❌ Order rejected!', 
        components: [] 
      });
    }
  } catch (error) {
    console.error('Error updating order:', error);
    await interaction.reply({ 
      content: 'There was an error processing this order.', 
      ephemeral: true 
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

// Login to Discord with your client's token
if (DISCORD_TOKEN) {
  client.login(DISCORD_TOKEN);
} else {
  console.error('Missing Discord bot token');
}

export default client; 