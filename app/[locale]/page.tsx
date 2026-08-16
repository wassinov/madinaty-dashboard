import { getTranslations } from "next-intl/server";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { BrandLogo } from "@/components/shared/BrandLogo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MapPinned, ClipboardList, Users } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

const FEATURES = [
  {
    icon: MapPinned,
    titleKey: "feature_report_title",
    descriptionKey: "feature_report_description",
  },
  {
    icon: ClipboardList,
    titleKey: "feature_track_title",
    descriptionKey: "feature_track_description",
  },
  {
    icon: Users,
    titleKey: "feature_manage_title",
    descriptionKey: "feature_manage_description",
  },
] as const;

// Glyphes vectoriels des domaines (identiques à ceux de la carte du dashboard).
const DOMAIN_PATHS: Record<string, string> = {
  eau: "M12 3 C 14.5 6.5 18.5 11 18.5 14.5 A 6.5 6.5 0 0 1 5.5 14.5 C 5.5 11 9.5 6.5 12 3 Z",
  ass: "M3 10 C 6 7 9 7 12 10 C 15 13 18 13 21 10 L 21 14 C 18 11 15 11 12 14 C 9 17 6 17 3 14 Z",
  dec: "M7 8 L8.5 21 L15.5 21 L17 8 Z M5 5 L5 7 L19 7 L19 5 Z M9 3 L9 5 L15 5 L15 3 Z",
  ecl: "M12 13 A 5.5 5.5 0 1 0 12 2 A 5.5 5.5 0 1 0 12 13 Z M9 15 L9 17 L15 17 L15 15 Z M10 18 L14 18 L14 19 L10 19 Z M10 20 L14 20 L14 21 L10 21 Z",
};

const DOMAINES = [
  {
    glyph: "eau",
    color: "var(--d-eau)",
    titleKey: "domain_water_title",
    descriptionKey: "domain_water_description",
  },
  {
    glyph: "ass",
    color: "var(--d-ass)",
    titleKey: "domain_sanitation_title",
    descriptionKey: "domain_sanitation_description",
  },
  {
    glyph: "dec",
    color: "var(--d-dec)",
    titleKey: "domain_waste_title",
    descriptionKey: "domain_waste_description",
  },
  {
    glyph: "ecl",
    color: "var(--d-ecl)",
    titleKey: "domain_lighting_title",
    descriptionKey: "domain_lighting_description",
  },
] as const;

const STATS = [
  { value: "12 480", suffix: "+", labelKey: "stat_treated_label" },
  { value: "87", suffix: " %", labelKey: "stat_resolution_label" },
  { value: "58", suffix: "", labelKey: "stat_wilayas_label" },
  { value: "48", suffix: " h", labelKey: "stat_delay_label" },
] as const;

// Épingles décoratives du visuel héro (carte fictive).
const HERO_PINS = [
  { glyph: "eau", titleKey: "domain_water_title", color: "var(--d-eau)", style: { top: "52px", left: "24%" } },
  { glyph: "ass", titleKey: "domain_sanitation_title", color: "var(--d-ass)", style: { top: "118px", left: "58%" } },
  { glyph: "dec", titleKey: "domain_waste_title", color: "var(--d-dec)", style: { top: "76px", left: "78%" } },
  { glyph: "ecl", titleKey: "domain_lighting_title", color: "var(--d-ecl)", style: { top: "180px", left: "38%" } },
] as const;

const LIVE_COUNTS: Record<string, string> = {
  eau: "225",
  ass: "80",
  dec: "55",
  ecl: "40",
};

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("hero");
  const year = new Date().getFullYear();

  return (
    <main className="min-h-screen flex flex-col bg-[var(--color-bg)]">
      {/* ===== Header ===== */}
      <header className="sticky top-0 z-30 border-b border-[var(--color-border)] bg-[var(--color-surface)]/90 backdrop-blur">
        <div className="mx-auto flex h-[72px] max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
          <BrandLogo size="md" align="left" />
          <nav className="hidden items-center gap-6 text-sm font-medium text-[var(--color-fg)] md:flex">
            <Link href={`/${locale}`} className="hover:text-[var(--color-accent)]">
              {t("nav_home")}
            </Link>
            <Link href={`/${locale}/signaler`} className="hover:text-[var(--color-accent)]">
              {t("nav_report")}
            </Link>
            <Link href={`/${locale}/login`} className="hover:text-[var(--color-accent)]">
              {t("nav_track")}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <LanguageSwitcher />
            <Link href={`/${locale}/login`}>
              <Button className="bg-[#004AAD] text-white hover:bg-[#003a8c]">
                {t("cta_login")}
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ===== Hero ===== */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-bg)] [background-image:radial-gradient(1100px_460px_at_80%_-10%,color-mix(in_oklch,#004aad_14%,transparent),transparent_60%)]">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:py-24">
          <div>
            <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1.5 text-xs font-semibold text-[#004AAD]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22c55e]" />
              {t("badge")}
            </span>
            <h1 className="text-4xl font-extrabold tracking-tight text-[var(--color-fg)] md:text-5xl">
              {t("subtitle")}{" "}
              <em className="text-[#004AAD]">{t("subtitle_em")}</em>{" "}
              {t("subtitle_after")}
            </h1>
            <p className="mt-4 max-w-md text-base leading-relaxed text-[var(--color-muted)] md:text-lg">
              {t("lead")}
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href={`/${locale}/signaler`}>
                <Button
                  size="lg"
                  className="bg-[#004AAD] text-white hover:bg-[#003a8c]"
                >
                  {t("cta_report")}
                </Button>
              </Link>
              <Link href={`/${locale}/login`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="hover:border-[#004AAD] hover:bg-transparent hover:text-[#004AAD]"
                >
                  {t("cta_login")}
                </Button>
              </Link>
            </div>
            <p className="mt-8 text-sm text-[var(--color-muted)]">{t("trust")}</p>
          </div>

          {/* Visuel produit décoratif */}
          <div className="relative hidden lg:block" aria-hidden="true">
            <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl">
              <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-4 py-3">
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
              </div>
              <div
                className="relative h-[250px]"
                style={{
                  backgroundImage:
                    "linear-gradient(rgba(120,140,165,.14) 1px, transparent 1px), linear-gradient(90deg, rgba(120,140,165,.14) 1px, transparent 1px)",
                  backgroundSize: "26px 26px",
                }}
              >
                {HERO_PINS.map((pin) => (
                  <span key={pin.glyph} className="absolute" style={pin.style}>
                    <svg width="16" height="20" viewBox="0 0 16 20">
                      <path
                        d="M8 0C4.4 0 1.6 2.9 1.6 6.5c0 4.9 6.4 13.5 6.4 13.5S14.4 11.4 14.4 6.5C14.4 2.9 11.6 0 8 0Z"
                        fill={pin.color}
                      />
                      <circle cx="8" cy="6.5" r="2.6" fill="#fff" />
                    </svg>
                  </span>
                ))}
              </div>
            </div>
            <div className="absolute -bottom-6 right-4 w-52 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 shadow-xl">
              <p className="text-xs font-semibold text-[var(--color-fg)]">{t("domains_title")}</p>
              {DOMAINES.map((d) => (
                <div
                  key={d.glyph}
                  className="mt-2 flex items-center gap-2 text-xs text-[var(--color-muted)]"
                >
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: d.color }}
                  />
                  {t(d.titleKey)}
                  <b className="ml-auto font-semibold text-[var(--color-fg)]">
                    {LIVE_COUNTS[d.glyph]}
                  </b>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== Stats ===== */}
      <section className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-10 sm:px-6 lg:grid-cols-4">
          {STATS.map((s) => (
            <div key={s.labelKey} className="text-center">
              <div className="text-3xl font-extrabold tracking-tight text-[var(--color-fg)]">
                {s.value}
                <span className="text-xl font-bold text-[#004AAD]">
                  {s.suffix}
                </span>
              </div>
              <div className="mt-1 text-sm text-[var(--color-muted)]">
                {t(s.labelKey)}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Comment ça marche ===== */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <h2 className="text-3xl font-bold text-[var(--color-fg)]">
            {t("features_title")}
          </h2>
          <p className="mt-2 text-[var(--color-muted)]">
            {t("features_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 gap-7 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, titleKey, descriptionKey }, i) => (
            <div
              key={titleKey}
              className="relative rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-7"
            >
              <span className="absolute right-6 top-5 text-4xl font-extrabold tracking-tighter text-[var(--color-border)]">
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[color-mix(in_oklch,#004aad_14%,transparent)] text-[#004AAD]">
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-fg)]">
                {t(titleKey)}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-[var(--color-muted)]">
                {t(descriptionKey)}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Domaines ===== */}
      <section className="border-y border-[var(--color-border)] bg-[var(--color-bg)]">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold text-[var(--color-fg)]">
              {t("domains_title")}
            </h2>
            <p className="mt-2 text-[var(--color-muted)]">
              {t("domains_subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DOMAINES.map((d) => (
              <div
                key={d.glyph}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-6 text-center transition-transform hover:-translate-y-1"
              >
                <div
                  className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full"
                  style={{
                    background: `color-mix(in oklch, ${d.color} 14%, transparent)`,
                  }}
                >
                  <svg width="28" height="28" viewBox="0 0 24 24">
                    <path d={DOMAIN_PATHS[d.glyph]} fill="#fff" />
                  </svg>
                </div>
                <h3 className="text-[17px] font-semibold text-[var(--color-fg)]">
                  {t(d.titleKey)}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--color-muted)]">
                  {t(d.descriptionKey)}
                </p>
                <Link
                  href={`/${locale}/signaler`}
                  className="mt-3 inline-block text-[13px] font-semibold"
                  style={{ color: d.color }}
                >
                  {t("domain_more")} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA final ===== */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-3xl bg-gradient-to-r from-[#003a8c] to-[#0066d6] px-8 py-14 text-center text-white">
          <h2 className="text-3xl font-bold">{t("cta_band_title")}</h2>
          <p className="mx-auto mt-2 max-w-md text-sm opacity-90">
            {t("cta_band_description")}
          </p>
          <div className="mt-7">
            <Link href={`/${locale}/register`}>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white text-[#004AAD] hover:bg-[color-mix(in_oklch,#004aad_14%,transparent)]"
              >
                {t("cta_signup")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-7 text-sm text-gray-500 sm:px-6">
          <BrandLogo size="sm" slogan={false} />
          <span>
            © {year} {t("footer_copyright")}
          </span>
          <span className="text-[var(--st-ok)]">{t("footer_tagline")}</span>
        </div>
      </footer>
    </main>
  );
}