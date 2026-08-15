import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/utils/getUserProfile";
import { StatsDashboard } from "@/components/dashboard/stats/StatsDashboard";
import type { StatsV3 } from "@/types/database";
import { getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";

export default async function StatistiquesPage() {
  const t = await getTranslations("stats");
  const supabase = await createClient();
  const profile = await getUserProfile();

  // Périmètre global : uniquement les rôles legacy admin/agent. La carte
  // « utilisateurs » n'a de sens qu'à cette échelle.
  const isGlobal = profile?.role === "admin" || profile?.role === "agent";

  // La RPC get_stats_v3 impose côté serveur la visibilité du rôle et
  // accepte les filtres (plage de dates + types) déjà appliqués ici pour
  // le rendu initial ; les interactions sont re-fetchées côté client.
  const { data: initialRaw } = await supabase.rpc("get_stats_v3", {
    p_from: null,
    p_to: null,
    p_types: null,
  });
  const initial = (initialRaw ?? null) as StatsV3 | null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-fg)]">
          {t("page_title")}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">{t("page_description")}</p>
      </div>

      <StatsDashboard initial={initial} isGlobal={isGlobal} />
    </div>
  );
}