import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/utils/getUserProfile";
import { SignalementsPage } from "@/components/dashboard/SignalementsPage";

export const dynamic = "force-dynamic";

export default async function AdminSignalementsPage() {
  const profile = await getUserProfile();

  // Le périmètre du profil est transmis à la RPC : un agent terrain ne voit
  // que sa commune, une direction sa wilaya, un admin global toute la base.
  const wilayaCode = profile?.wilayaCode ?? null;
  const communeCode = profile?.communeCode ?? null;
  const isAgentTerrain = profile?.role === "agent_terrain";
  let agentId: string | null = null;
  if (isAgentTerrain) {
    const supaAuth = await createClient();
    const {
      data: { user },
    } = await supaAuth.auth.getUser();
    agentId = user?.id ?? null;
  }

  const supabase = await createClient();
  const { data: signalements, error } = await supabase.rpc(
    "get_signalements",
    {
      p_limit: 500,
      p_offset: 0,
      p_statut: null,
      p_wilaya_code: wilayaCode,
      p_commune_code: communeCode,
      p_secteur: null,
      p_retard_only: false,
      p_assigne_a: agentId,
    }
  );
  if (error) console.error("get_signalements error:", error);

  return (
    <SignalementsPage signalements={signalements || []} mode="admin" />
  );
}