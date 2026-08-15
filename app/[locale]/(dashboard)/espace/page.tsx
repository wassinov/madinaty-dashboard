import Link from "next/link";
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

export default async function EspacePage() {
  const t = await getTranslations("common");
  const tEspace = await getTranslations("espace");
  const locale = await getLocale();
  const profile = await getUserProfile();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ownUserId = user?.id ?? null;

  // Nom affiché dans le message de bienvenue : nom complet du profil si
  // renseigné, sinon l'e-mail du compte.
  let displayName = user?.email ?? "";
  if (user) {
    const { data: profileRow } = await supabase
      .from("profils")
      .select("nom_complet")
      .eq("id", user.id)
      .maybeSingle();
    if (profileRow?.nom_complet) displayName = profileRow.nom_complet;
  }

  // Les RPC get_stats_v2 et get_signalements imposent le périmètre côté
  // serveur : un citoyen ne reçoit que ses propres signalements. On passe
  // des périmètres null — le rôle fait le tri.
  const { data: stats, error: statsError } = await supabase.rpc("get_stats_v2", {
    p_wilaya_code: null,
    p_commune_code: null,
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
      p_wilaya_code: null,
      p_commune_code: null,
      p_secteur: null,
      p_retard_only: false,
      p_assigne_a: null,
    }
  );
  if (signalementsError)
    console.error("get_signalements error:", signalementsError);

  const { data: announcements } = await supabase.rpc(
    "get_active_announcements",
    {
      p_wilaya_code: null,
      p_commune_code: null,
    }
  );

  const slaRetard = countSlaRetard(signalements || []);

  return (
    <div className="flex flex-col h-full space-y-3">
      <PerimeterInit profile={profile} />

      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-fg)]">
            {tEspace("welcome", { name: displayName })}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">{tEspace("page_description")}</p>
        </div>
        <Link
          href={`/${locale}/signaler`}
          className="inline-flex items-center gap-2 rounded-md bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          {tEspace("cta_report")}
        </Link>
      </div>

      <AnnouncementBanner
        announcements={announcements || []}
        wilayaCode={null}
        communeCode={null}
      />

      <div className="flex-1 min-h-0">
        <DashboardClient
          signalements={signalements || []}
          readOnly
          ownUserId={ownUserId}
          statsOverlay={
            <Suspense fallback={<div>{t("loading_stats")}</div>}>
              <StatsCards
                stats={stats}
                showUsers={false}
                slaRetard={slaRetard}
              />
            </Suspense>
          }
        />
      </div>
    </div>
  );
}
