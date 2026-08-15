import { createClient } from "@/lib/supabase/server";
import { SignalementsPage } from "@/components/dashboard/SignalementsPage";

export const dynamic = "force-dynamic";

export default async function EspaceSignalementsPage() {
  const supabase = await createClient();

  // La RPC get_signalements impose le périmètre côté serveur : un citoyen
  // ne reçoit que ses propres signalements (périmètres null).
  const { data: signalements, error } = await supabase.rpc(
    "get_signalements",
    {
      p_limit: 500,
      p_offset: 0,
      p_statut: null,
      p_wilaya_code: null,
      p_commune_code: null,
      p_secteur: null,
      p_retard_only: false,
      p_assigne_a: null,
    }
  );
  if (error) console.error("get_signalements error:", error);

  return (
    <SignalementsPage signalements={signalements || []} mode="citoyen" />
  );
}