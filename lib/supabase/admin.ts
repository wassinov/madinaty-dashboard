import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Client Supabase à privilèges élevés (clé `service_role`) — réservé aux
 * Server Actions d'administration (création de comptes, corrections hors
 * RLS). JAMAIS importé ni utilisé côté client.
 *
 * Retourne `null` si la clé n'est pas configurée sur le serveur
 * (vérifier `SUPABASE_SERVICE_ROLE_KEY` dans `.env.local`).
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: {
      // Client serveur de courte durée : pas de refresh de session ni de
      // persistance, on appelle uniquement l'API d'administration.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}