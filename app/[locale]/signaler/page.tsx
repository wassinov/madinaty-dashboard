import { getTranslations } from "next-intl/server";
import { ReportFormWithMap } from "@/components/ReportFormWithMap";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { getUserProfile } from "@/lib/utils/getUserProfile";
import { ADMIN_ROLES } from "@/lib/constants/roles";
import type { UserRole } from "@/types/database";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

type Props = {
  params: Promise<{ locale: string }>;
};

export default async function SignalerPage({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations("public");
  const d = new Date().getFullYear();

  // Lien de retour selon le profil : gestionnaire -> /admin,
  // citoyen -> /espace, non connecté -> landing.
  const profile = await getUserProfile();
  const role: string | null = profile?.role ?? null;
  const dashboardHref =
    role && ADMIN_ROLES.includes(role as UserRole)
      ? `/${locale}/admin`
      : role === "citoyen"
        ? `/${locale}/espace`
        : `/${locale}`;

  return (
    <main className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <header className="bg-[var(--color-surface)] border-b px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center space-x-2">
          <Link
            href={dashboardHref}
            className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-sm font-medium text-[var(--color-muted)] hover:text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">{t("back_to_dashboard")}</span>
          </Link>
          <span className="text-2xl" role="img" aria-hidden="true">💧</span>
          <h1 className="text-xl font-bold text-[var(--color-fg)]">{t("title")}</h1>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher />
          <Link href={`/${locale}/login`}>
            <Button variant="outline">{t("admin_access")}</Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 py-8">
        <div className="text-center mb-8 max-w-2xl mx-auto">
          <h2 className="text-3xl font-extrabold text-[var(--color-fg)] mb-2">
            {t("subtitle")}
          </h2>
          <p className="text-[var(--color-muted)]">{t("description")}</p>
        </div>

        <ReportFormWithMap />
      </div>

      <footer className="bg-[var(--color-surface)] border-t py-4 text-center text-sm text-[var(--color-muted)]">
        &copy; {d} {t("footer_copyright")}
      </footer>
    </main>
  );
}
