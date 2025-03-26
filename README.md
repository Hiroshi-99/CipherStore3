# Store with Discord Bot Admin

This project is a store with a Discord bot for admin functionality.

## Setup

1. Create a `.env` file with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_DISCORD_BOT_TOKEN=your_discord_bot_token
   VITE_DISCORD_ADMIN_CHANNEL_ID=your_discord_channel_id
   ```

2. Create a Discord bot:
   - Go to https://discord.com/developers/applications
   - Create a new application
   - Go to the Bot tab and add a bot
   - Enable the "Message Content Intent" under Privileged Gateway Intents
   - Copy the bot token to your `.env` file
   - Use the OAuth2 URL Generator to add the bot to your server with these permissions:
     - Read Messages/View Channels
     - Send Messages
     - Embed Links
     - Attach Files
     - Read Message History
     - Use External Emojis

3. Set up the Supabase database tables as per the migrations.

4. Run the app:
   ```
   npm run dev
   ```

5. Run the Discord bot:
   ```
   npm run bot
   ```

## Features

- Store for users to place orders
- Discord bot for admins to manage orders
- Real-time notifications for new orders 