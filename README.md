# Store with Discord Bot Admin

This project is a store with a Discord bot for admin functionality.

## Project Structure
- Frontend: Hosted on Netlify
- Discord Bot: Hosted separately on a service like Heroku, Railway, or Render

## Frontend Setup (Netlify)

1. Create a `.env` file with the following variables:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. Deploy to Netlify:
   - Connect your GitHub repository
   - Set the build command to `npm run build`
   - Set the publish directory to `dist`
   - Add the environment variables in Netlify's dashboard

## Discord Bot Setup

1. Create a Discord bot:
   - Go to https://discord.com/developers/applications
   - Create a new application
   - Go to the Bot tab and add a bot
   - Enable the "Message Content Intent" under Privileged Gateway Intents
   - Copy the bot token
   - Use the OAuth2 URL Generator to add the bot to your server with these permissions:
     - Read Messages/View Channels
     - Send Messages
     - Embed Links
     - Attach Files
     - Read Message History
     - Use External Emojis

2. Deploy to a hosting service (examples below):

   ### Heroku
   ```
   heroku create
   heroku config:set DISCORD_BOT_TOKEN=your_token
   heroku config:set DISCORD_ADMIN_CHANNEL_ID=your_channel_id
   heroku config:set SUPABASE_URL=your_supabase_url
   heroku config:set SUPABASE_ANON_KEY=your_supabase_anon_key
   git push heroku main
   ```

   ### Railway
   - Create a new project
   - Connect your GitHub repository
   - Add the environment variables:
     - DISCORD_BOT_TOKEN=your_token
     - DISCORD_ADMIN_CHANNEL_ID=your_channel_id
     - SUPABASE_URL=your_supabase_url
     - SUPABASE_ANON_KEY=your_supabase_anon_key
   - Set the build command: `npm run build`
   - Set the start command: `npm run bot`

3. Configure Netlify redirects by creating a `_redirects` file in your public directory:
   ```
   /*    /index.html   200
   ```

## Features

- Store for users to place orders
- Discord bot for admins to manage orders
- Real-time notifications for new orders 