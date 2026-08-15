import { getTranslations } from "next-intl/server";

export default async function ForbiddenPage() {
  const t = await getTranslations("errors");

  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-[var(--st-no)]">{t("403_title")}</h1>
        <p className="text-xl mt-2">{t("403_message")}</p>
        <p className="text-[var(--color-muted)]">{t("403_hint")}</p>
      </div>
    </div>
  );
}