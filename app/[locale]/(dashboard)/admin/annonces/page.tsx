import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/utils/getUserProfile";
import { getTranslations } from "next-intl/server";
import { AnnouncementForm } from "@/components/admin/AnnouncementForm";
import { AnnouncementList } from "@/components/admin/AnnouncementList";
import { canCreateAnnouncement } from "@/lib/utils/getUserProfile";
import type { Announcement } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function AnnoncesPage() {
  const t = await getTranslations("announcements");
  const profile = await getUserProfile();

  let announcements: Announcement[] = [];
  if (profile) {
    const supabase = await createClient();
    let query = supabase
      .from("announcements")
      .select(
        "id,title,content,wilaya_code,commune_code,priority,created_at,expires_at,is_active"
      )
      .order("created_at", { ascending: false });

    if (profile.wilayaCode) {
      query = query.eq("wilaya_code", profile.wilayaCode);
    }
    if (profile.communeCode) {
      query = query.eq("commune_code", profile.communeCode);
    }

    const { data } = await query;
    announcements = (data ?? []) as Announcement[];
  }

  const canManage = profile ? canCreateAnnouncement(profile.role) : false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-fg)]">
          {t("page_title")}
        </h1>
        <p className="text-sm text-[var(--color-muted)]">
          {t("page_description")}
        </p>
      </div>

      <AnnouncementForm profile={profile} />

      <AnnouncementList announcements={announcements} canManage={canManage} />
    </div>
  );
}