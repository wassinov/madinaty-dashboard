import { getTranslations } from "next-intl/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Stats } from "@/types/database";

type Item = {
  key: string;
  value: number;
  /** Classe colorée de la barre de progression (`.kpi-bar-*`, globals.css). */
  bar: string | null;
  odId: string;
};

export async function StatsCards({
  stats,
  showUsers = true,
  slaRetard = null,
}: {
  stats: Stats | null;
  showUsers?: boolean;
  /** Nombre de signalements dépassant le délai SLA (> 48 h), calculé côté page. */
  slaRetard?: number | null;
}) {
  const t = await getTranslations("dashboard");

  if (!stats) return <div>{t("loading")}</div>;

  const items: Item[] = [
    { key: "total", value: stats.total, bar: "kpi-bar-total", odId: "kpi-total" },
    { key: "en_attente", value: stats.en_attente, bar: "kpi-bar-att", odId: "kpi-attente" },
    { key: "en_cours", value: stats.en_cours, bar: "kpi-bar-run", odId: "kpi-cours" },
    { key: "resolu", value: stats.resolu, bar: "kpi-bar-ok", odId: "kpi-resolu" },
    ...(slaRetard !== null
      ? [{ key: "sla", value: slaRetard, bar: "kpi-bar-sla", odId: "kpi-sla" }]
      : []),
    { key: "rejete", value: stats.rejete, bar: "kpi-bar-no", odId: "kpi-rejete" },
    ...(showUsers
      ? [
          {
            key: "utilisateurs",
            value: stats.users_total,
            bar: "kpi-bar-total",
            odId: "kpi-utilisateurs",
          },
        ]
      : []),
  ];

  const pct = (v: number) =>
    Math.min(100, Math.round((v / Math.max(stats.total, 1)) * 100));

  return (
    <div
      data-od-id="kpis"
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2"
    >
      {items.map((item) => (
        <Card
          key={item.key}
          data-od-id={item.odId}
          className="border-none bg-transparent py-0.5 shadow-none"
        >
          <CardHeader className="pb-0 pt-0.5">
            <CardTitle className="text-[10px] font-medium uppercase leading-tight tracking-wider text-[var(--color-muted)]">
              {t(item.key)}
            </CardTitle>
          </CardHeader>
          <CardContent className="py-0">
            <div className="font-display text-lg font-extrabold leading-none tracking-[-0.02em] text-[var(--color-fg)] md:text-xl">
              {item.value}
            </div>
            <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
              {item.bar && (
                <div
                  className={`h-full rounded-full ${item.bar}`}
                  style={{ width: `${pct(item.value)}%` }}
                />
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}