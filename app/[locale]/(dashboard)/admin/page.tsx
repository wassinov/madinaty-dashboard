import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/utils/getUserProfile";
import { StatsCards } from "@/components/dashboard/StatsCards";
import { DashboardClient } from "@/components/dashboard/DashboardClient";
import { AnnouncementBanner } from "@/components/dashboard/AnnouncementBanner";
import { PerimeterInit } from "@/components/dashboard/PerimeterInit";
import { Suspense } from "react";
import { getTranslations, getLocale } from "next-intl/server";
import type { Signalement } from "@/types/database";

export const dynamic = "force-dynamic";

/** Nombre de signalements dépassant le délai SLA (> 48 h). */
function countSlaRetard(signalements: Signalement[]): number {
  return signalements.filter(
    (s) => s.retard_heures != null && s.retard_heures > 48
  ).length;
}

export default async function AdminPage() {
  const t = await getTranslations("common");
  const locale = await getLocale();
  const profile = await getUserProfile();

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

  const { data: stats, error: statsError } = await supabase.rpc("get_stats_v2", {
    p_wilaya_code: wilayaCode,
    p_commune_code: communeCode,
    p_secteur: null,
    p_retard_only: false,
  });
  if (statsError) console.error("get_stats_v2 error:", statsError);

  const { data: signalements, error: signalementsError } = await supabase.rpc(
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
  if (signalementsError)
    console.error("get_signalements error:", signalementsError);

  const { data: announcements } = await supabase.rpc(
    "get_active_announcements",
    {
      p_wilaya_code: wilayaCode,
      p_commune_code: communeCode,
    }
  );

  const slaRetard = countSlaRetard(signalements || []);

  return (
    <div className="flex flex-col h-full space-y-3">
      <PerimeterInit profile={profile} />

      <AnnouncementBanner
        announcements={announcements || []}
        wilayaCode={wilayaCode}
        communeCode={communeCode}
        seeAllHref={`/${locale}/admin/annonces`}
      />

      <div className="flex-1 min-h-0">
        <DashboardClient
          signalements={signalements || []}
          statsOverlay={
            <Suspense fallback={<div>{t("loading_stats")}</div>}>
              <StatsCards stats={stats} showUsers={false} slaRetard={slaRetard} />
            </Suspense>
          }
        />
      </div>
    </div>
  );
}