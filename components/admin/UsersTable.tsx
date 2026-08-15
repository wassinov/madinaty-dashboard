"use client";

import { useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils/formatting";
import { getWilayaOptions, getCommuneOptions } from "@/lib/utils/geoHelpers";
import { assignableRoles } from "@/lib/constants/roles";
import { updateProfil } from "@/lib/actions/users";
import type { ProfilRow } from "@/types/database";

type Props = {
  profils: ProfilRow[];
  currentRole: string;
  currentWilaya: string | null;
};

const ROLE_BADGE: Record<string, string> = {
  citoyen: "bc-st-no",
  agent: "bc-st-att",
  admin: "bc-st-no",
  super_admin_wilaya: "bc-st-no",
  admin_commune: "bc-st-run",
  direction_ade_wilaya: "bc-st-run",
  direction_ade_commune: "bc-st-run",
  agent_terrain: "bc-st-ok",
};

export function UsersTable({ profils, currentRole, currentWilaya }: Props) {
  const t = useTranslations("users");
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [isPending, startTransition] = useTransition();

  const wilayas = useMemo(() => getWilayaOptions(), []);
  const allowedRoles = assignableRoles(currentRole);

  // Périmètre imposé : un super_admin_wilaya / direction_ade_wilaya ne peut
  // gérer que les utilisateurs de sa wilaya (déjà filtré par la RPC list_profils).
  const lockedWilaya = currentRole !== "admin" ? currentWilaya : null;

  const filtered = useMemo(() => {
    return profils.filter((p) => {
      if (roleFilter && p.role !== roleFilter) return false;
      if (!search.trim()) return true;
      const q = search.trim().toLowerCase();
      return (
        p.nom_complet?.toLowerCase().includes(q) ||
        p.email?.toLowerCase().includes(q) ||
        false
      );
    });
  }, [profils, search, roleFilter]);

  const handleSave = (row: ProfilRow, next: { role: string; wilayaCode: string | null; communeCode: string | null }) => {
    startTransition(async () => {
      const result = await updateProfil({
        id: row.id,
        role: next.role as never,
        wilayaCode: next.wilayaCode,
        communeCode: next.communeCode,
      });
      if (result.success) {
        toast.success(t("save_success"));
      } else {
        toast.error(result.error ?? t("save_failed"));
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("list_title")}</CardTitle>
        <CardDescription>{t("list_description")}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtres */}
        <div className="flex flex-wrap gap-3">
          <div className="w-64">
            <Input
              placeholder={t("search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-48">
            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger>
                <SelectValue placeholder={t("all_roles")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">{t("all_roles")}</SelectItem>
                {assignableRoles(currentRole).map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`role.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">{t("list_empty")}</p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col_name")}</TableHead>
                  <TableHead>{t("col_email")}</TableHead>
                  <TableHead>{t("col_role")}</TableHead>
                  <TableHead>{t("col_territory")}</TableHead>
                  <TableHead>{t("col_created")}</TableHead>
                  <TableHead className="text-right">{t("col_actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((row) => (
                  <UserRow
                    key={row.id}
                    row={row}
                    allowedRoles={allowedRoles}
                    wilayas={wilayas}
                    lockedWilaya={lockedWilaya}
                    isSaving={isPending}
                    onSave={handleSave}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

type UserRowProps = {
  row: ProfilRow;
  allowedRoles: readonly string[];
  wilayas: { label: string; value: string }[];
  lockedWilaya: string | null;
  isSaving: boolean;
  onSave: (
    row: ProfilRow,
    next: { role: string; wilayaCode: string | null; communeCode: string | null },
  ) => void;
};

function UserRow({ row, allowedRoles, wilayas, lockedWilaya, isSaving, onSave }: UserRowProps) {
  const t = useTranslations("users");
  const [role, setRole] = useState(row.role);
  const [wilayaCode, setWilayaCode] = useState(row.wilaya_code);
  const [communeCode, setCommuneCode] = useState(row.commune_code);

  const effectiveWilaya = lockedWilaya ?? wilayaCode;
  const communes = useMemo(
    () => (effectiveWilaya ? getCommuneOptions(effectiveWilaya) : []),
    [effectiveWilaya],
  );

  const changed =
    role !== row.role ||
    wilayaCode !== row.wilaya_code ||
    communeCode !== row.commune_code;

  return (
    <TableRow>
      <TableCell>
        <div className="font-medium">{row.nom_complet ?? "—"}</div>
        <span className={`badge-s ${ROLE_BADGE[row.role] ?? "bc-st-no"}`}>
          {t(`role.${row.role}`)}
        </span>
      </TableCell>
      <TableCell className="text-sm text-[var(--color-muted)]">
        {row.email ?? "—"}
      </TableCell>
      <TableCell>
        <Select value={role} onValueChange={(v) => setRole(v)}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allowedRoles.map((r) => (
              <SelectItem key={r} value={r}>
                {t(`role.${r}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <Select
            value={effectiveWilaya ?? ""}
            onValueChange={(v) => {
              setWilayaCode(v || null);
              setCommuneCode(null);
            }}
            disabled={!!lockedWilaya}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("select_wilaya")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("no_wilaya")}</SelectItem>
              {wilayas.map((w) => (
                <SelectItem key={w.value} value={w.value}>
                  {w.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={communeCode ?? ""}
            onValueChange={(v) => setCommuneCode(v || null)}
            disabled={!effectiveWilaya}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder={t("select_commune")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">{t("no_commune")}</SelectItem>
              {communes.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </TableCell>
      <TableCell className="text-sm text-[var(--color-muted)]">
        {row.created_at ? formatDate(row.created_at) : "—"}
      </TableCell>
      <TableCell className="text-right">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={!changed || isSaving}
          onClick={() => onSave(row, { role, wilayaCode: effectiveWilaya, communeCode })}
        >
          {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <Save className="mr-1 h-4 w-4" />
          {t("save")}
        </Button>
      </TableCell>
    </TableRow>
  );
}
