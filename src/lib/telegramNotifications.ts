/**
 * Utility for sending Telegram notifications
 */

/**
 * Send a notification to the configured Telegram chat
 * @param message The message to send
 * @returns Promise that resolves when the message is sent
 */
export async function sendTelegramNotification(message: string): Promise<boolean> {
  try {
    const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
    const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
    
    console.log('Sending Telegram notification with:', { botToken: !!botToken, chatId: !!chatId });
    
    if (!botToken || !chatId) {
      console.error('Telegram bot token or chat ID not configured');
      return false;
    }
    
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
      }),
    });
    
    const data = await response.json();
    console.log('Telegram API response:', data);
    return data.ok === true;
  } catch (error) {
    console.error('Failed to send Telegram notification:', error);
    return false;
  }
}

// Add this function to test your Telegram bot
export async function testTelegramNotification(): Promise<boolean> {
  return sendTelegramNotification(`
<b>🧪 TEST NOTIFICATION</b>

This is a test message sent at ${new Date().toLocaleString()}.
If you're seeing this, your Telegram notifications are working properly!
`);
}

// Add this function to help debug environment variables
export function checkTelegramConfig(): { hasToken: boolean, hasChatId: boolean } {
  const botToken = import.meta.env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = import.meta.env.VITE_TELEGRAM_CHAT_ID;
  
  return {
    hasToken: !!botToken,
    hasChatId: !!chatId
  };
} 