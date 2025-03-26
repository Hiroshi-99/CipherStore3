import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { sendTelegramNotification, sendTelegramImage } from '../lib/telegramNotifications';

interface OrderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function OrderModal({ isOpen, onClose }: OrderModalProps) {
  const [username, setUsername] = useState('');
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentProof(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (!paymentProof) throw new Error('Please upload payment proof');
      if (!username.trim()) throw new Error('Please enter your Minecraft username');

      // Upload payment proof
      const fileExt = paymentProof.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError, data } = await supabase.storage
        .from('payment-proofs')
        .upload(`${user.id}/${fileName}`, paymentProof);

      if (uploadError) throw uploadError;

      // Create order
      const { error: orderError, data: orderData } = await supabase.from('orders').insert({
        user_id: user.id,
        username: username.trim(),
        payment_proof: data.path,
        status: 'pending'
      }).select();

      if (orderError) throw orderError;

      // Send Telegram notification for new pending order
      const orderInfo = orderData && orderData[0];
      if (orderInfo) {
        console.log('Preparing to send notification for new order:', orderInfo.id);
        
        // Get a public URL for the uploaded image
        const { data: publicUrlData } = supabase.storage
          .from('payment-proofs')
          .getPublicUrl(data.path);
        
        const imageUrl = publicUrlData.publicUrl;
        
        const message = `
<b>🔔 NEW PENDING ORDER!</b>

<b>Minecraft Username:</b> ${username.trim()}
<b>Order ID:</b> ${orderInfo.id}
<b>Status:</b> PENDING
<b>Date:</b> ${new Date().toLocaleString()}

⚠️ Please check the admin panel to review this order.
`;
        
        try {
          // First try to send the image with a brief caption
          if (imageUrl) {
            const imageSent = await sendTelegramImage(
              imageUrl,
              `🔔 Payment proof for order ${orderInfo.id} by ${username.trim()}`
            );
            
            console.log('Payment proof image sent to Telegram:', imageSent);
            
            // If image sending failed, include a link to the image in the text notification
            if (!imageSent) {
              const messageWithLink = message + `\n\n<a href="${imageUrl}">View Payment Proof</a>`;
              await sendTelegramNotification(messageWithLink);
            }
          } else {
            // Just send the text notification if we couldn't get a public URL
            await sendTelegramNotification(message);
          }
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
          
          // Try sending just the text as a last resort
          try {
            await sendTelegramNotification(message);
          } catch {
            console.error('Failed to send even the text notification');
          }
        }
      }

      toast.success('Order submitted successfully!');
      setUsername('');
      setPaymentProof(null);
      onClose();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-gray-800/95 rounded-2xl p-8 max-w-md w-full m-4 relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-bold text-white mb-6">Complete Your Order</h2>

        {/* QR Code Display */}
        <div className="mb-8 text-center">
          <p className="text-gray-300 mb-4">Scan the QR code below to pay:</p>
          <div className="bg-white p-4 rounded-lg inline-block">
            <img 
              src="https://i.imgur.com/xmzqO4S.jpeg" 
              alt="Payment QR Code"
              className="w-48 h-48 mx-auto"
            />
          </div>
          <p className="text-sm text-gray-400 mt-2">Amount: $9.99</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-3 text-white focus:outline-none focus:ring-2 focus:ring-emerald-400"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Payment Proof (QR Code Screenshot)
            </label>
            <div className="relative">
              <input
                type="file"
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="payment-proof"
                required
              />
              <label
                htmlFor="payment-proof"
                className="w-full bg-gray-700/50 border border-gray-600 rounded-lg py-2 px-3 text-white flex items-center justify-center gap-2 cursor-pointer hover:bg-gray-600/50 transition duration-300"
              >
                <Upload size={20} />
                {paymentProof ? paymentProof.name : 'Upload QR Code Screenshot'}
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg py-2 px-4 transition duration-300 disabled:opacity-50"
          >
            {loading ? 'Processing...' : 'Submit Order'}
          </button>
        </form>
      </div>
    </div>
  );
}