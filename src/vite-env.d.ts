/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string;
  readonly VITE_SUPABASE_ANON_KEY: string;
  // Remove bot token as it won't be used in the frontend
  // readonly VITE_DISCORD_BOT_TOKEN: string;
  // readonly VITE_DISCORD_ADMIN_CHANNEL_ID: string;
  // Add other environment variables as needed
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
