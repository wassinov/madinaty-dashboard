import { createClient } from "@/lib/supabase/server";
import { getUserProfile } from "@/lib/utils/getUserProfile";
import { getTranslations } from "next-intl/server";
import { UsersTable } from "@/components/admin/UsersTable";
import { AddUserModal } from "@/components/admin/AddUserModal";
import { USER_MANAGER_ROLES } from "@/lib/constants/roles";
import type { ProfilRow } from "@/types/database";

export const dynamic = "force-dynamic";

export default async function UtilisateursPage() {
  const t = await getTranslations("users");
  const profile = await getUserProfile();

  let profils: ProfilRow[] = [];
  let isManager = false;
  if (profile && USER_MANAGER_ROLES.includes(profile.role)) {
    isManager = true;
    const supabase = await createClient();
    const { data } = await supabase.rpc("list_profils", {
      p_role: null,
      p_wilaya_code: null,
      p_commune_code: null,
      p_search: null,
    });
    profils = (data ?? []) as ProfilRow[];
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">
            {t("page_title")}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">{t("page_description")}</p>
        </div>

        {isManager && (
          <AddUserModal
            currentRole={profile?.role ?? "citoyen"}
            currentWilaya={profile?.wilayaCode ?? null}
          />
        )}
      </div>

      {isManager ? (
        <UsersTable
          profils={profils}
          currentRole={profile?.role ?? "citoyen"}
          currentWilaya={profile?.wilayaCode ?? null}
        />
      ) : (
        <p className="text-sm text-[var(--color-muted)]">{t("access_denied")}</p>
      )}
    </div>
  );
}
