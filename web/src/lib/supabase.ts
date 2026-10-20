import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey =
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  const missing = [
    !supabaseUrl && "VITE_SUPABASE_URL",
    !supabaseKey && "VITE_SUPABASE_PUBLISHABLE_KEY (or VITE_SUPABASE_ANON_KEY)",
  ].filter(Boolean).join(", ");
  
  throw new Error(
    `[AthlonIQ Dev Config Error] Missing Supabase environment configuration: ${missing}. Please add them to web/.env.local`
  );
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: "athloniq_auth_session",
  },
});
