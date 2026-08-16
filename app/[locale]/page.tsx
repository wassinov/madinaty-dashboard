import { getTranslations } from "next-intl/server";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementBanner } from "@/components/dashboard/AnnouncementBanner";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { BrandLogo } from "@/components/shared/BrandLogo";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Megaphone, MapPinned, ClipboardList, Users } from "lucide-react";

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

const DOMAINES = [
  {
    emoji: "💧",
    color: "bg-[var(--color-surface-2)]",
    textColor: "text-[var(--d-eau)]",
    titleKey: "domain_water_title",
    descriptionKey: "domain_water_description",
  },
  {
    emoji: "🚽",
    color: "bg-[var(--color-surface-2)]",
    textColor: "text-[var(--st-ok)]",
    titleKey: "domain_sanitation_title",
    descriptionKey: "domain_sanitation_description",
  },
  {
    emoji: "🗑️",
    color: "bg-[var(--color-surface-2)]",
    textColor: "text-[var(--st-att)]",
    titleKey: "domain_waste_title",
    descriptionKey: "domain_waste_description",
  },
  {
    emoji: "💡",
    color: "bg-[var(--color-surface-2)]",
    textColor: "text-[var(--d-ecl)]",
    titleKey: "domain_lighting_title",
    descriptionKey: "domain_lighting_description",
  },
] as const;

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("hero");
  const d = new Date().getFullYear();

  const supabase = await createClient();
  const { data: announcements } = await supabase.rpc(
    "get_active_announcements",
    {
      p_wilaya_code: null,
      p_commune_code: null,
    }
  );

  return (
    <main className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <header className="bg-[var(--color-surface)] border-b px-6 py-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
        <BrandLogo size="md" align="left" />
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href={`/${locale}/login`}>
            <Button variant="outline">{t("cta_login")}</Button>
          </Link>
        </div>
      </header>

      <section className="bg-gradient-to-b from-blue-50 to-gray-50">
        <div className="container mx-auto px-4 py-16 md:py-24 text-center max-w-3xl">
          <h2 className="text-4xl md:text-5xl font-extrabold text-[var(--color-fg)] mb-4">
            {t("subtitle")}
          </h2>
          <p className="text-lg text-[var(--color-muted)] mb-8">{t("description")}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href={`/${locale}/login`}>
              <Button size="lg">{t("cta_login")}</Button>
            </Link>
            <Link href={`/${locale}/signaler`}>
              <Button size="lg" variant="outline">
                {t("cta_report")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 -mt-6 max-w-4xl">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-fg)] mb-2">
          <Megaphone className="h-4 w-4" />
          {t("announcements_title")}
        </div>
        <AnnouncementBanner
          announcements={announcements || []}
          wilayaCode={null}
          communeCode={null}
        />
      </section>

      <section className="flex-1 container mx-auto px-4 py-16">
        <h3 className="text-3xl font-bold text-center text-[var(--color-fg)] mb-12">
          {t("features_title")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {FEATURES.map(({ icon: Icon, titleKey, descriptionKey }) => (
            <div
              key={titleKey}
              className="bg-[var(--color-surface)] rounded-xl shadow-sm border p-8 text-center"
            >
              <div className="h-14 w-14 mx-auto mb-4 rounded-full bg-[var(--color-surface-2)] text-[var(--d-eau)] flex items-center justify-center">
                <Icon className="h-7 w-7" />
              </div>
              <h4 className="text-xl font-semibold text-[var(--color-fg)] mb-2">
                {t(titleKey)}
              </h4>
              <p className="text-[var(--color-muted)]">{t(descriptionKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="container mx-auto px-4 pb-16">
        <h3 className="text-3xl font-bold text-center text-[var(--color-fg)] mb-2">
          {t("domains_title")}
        </h3>
        <p className="text-[var(--color-muted)] text-center mb-12">{t("domains_subtitle")}</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {DOMAINES.map((domaine) => (
            <div
              key={domaine.titleKey}
              className="bg-[var(--color-surface)] rounded-xl shadow-sm border p-6 text-center"
            >
              <div
                className={`h-14 w-14 mx-auto mb-4 rounded-full ${domaine.color} ${domaine.textColor} flex items-center justify-center text-2xl`}
                role="img"
                aria-hidden="true"
              >
                {domaine.emoji}
              </div>
              <h4 className="text-lg font-semibold text-[var(--color-fg)] mb-1">
                {t(domaine.titleKey)}
              </h4>
              <p className="text-sm text-[var(--color-muted)]">{t(domaine.descriptionKey)}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="bg-[var(--color-surface)] border-t py-4 text-center text-sm text-gray-500">
        &copy; {d} {t("footer_copyright")}
      </footer>
    </main>
  );
}
