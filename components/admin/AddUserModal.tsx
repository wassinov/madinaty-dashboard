"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Sparkles, UserPlus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createUser } from "@/lib/actions/users";
import { CREATEABLE_ROLES } from "@/lib/actions/users.schemas";
import { assignableRoles } from "@/lib/constants/roles";
import {
  getWilayaOptions,
  getCommuneOptions,
  type WilayaOption,
} from "@/lib/utils/geoHelpers";

type Props = {
  currentRole: string;
  /** Périmètre imposé : un super_admin_wilaya / direction_ade_wilaya ne
   *  peut créer que dans sa wilaya (verrou quelques / server action). */
  currentWilaya: string | null;
};

/** Mot de passe aléatoire fort mais lisible (>= 10 caractères). */
function generatePassword(): string {
  const lower = "abcdefghjkmnpqrstuvwxyz";
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const digits = "23456789";
  const symbols = "!@#$%";
  const parts = [upper, lower, digits, symbols];
  let out = "";
  for (const part of parts) out += part[crypto.getRandomValues(new Uint32Array(1))[0] % part.length];
  while (out.length < 12) {
    const part = parts[Math.floor(Math.random() * parts.length)];
    out += part[Math.floor(Math.random() * part.length)];
  }
  return out;
}

export function AddUserModal({ currentRole, currentWilaya }: Props) {
  const t = useTranslations("users");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const wilayas: WilayaOption[] = useMemo(() => getWilayaOptions(), []);

  // Rôles proposés : intersectables par le profil courant, hors citoyen/legacy.
  const allowedRoles = useMemo(
    () =>
      assignableRoles(currentRole).filter((r) =>
        CREATEABLE_ROLES.includes(r as never)
      ),
    [currentRole]
  );

  const lockedWilaya = currentRole !== "admin" ? currentWilaya : null;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nomComplet, setNomComplet] = useState("");
  const [role, setRole] = useState<string>("");
  const [wilayaCode, setWilayaCode] = useState(lockedWilaya ?? "");
  const [communeCode, setCommuneCode] = useState("");
  const [communes, setCommunes] = useState(() =>
    lockedWilaya ? getCommuneOptions(lockedWilaya) : []
  );

  const reset = () => {
    setEmail("");
    setPassword("");
    setNomComplet("");
    setRole("");
    setWilayaCode(lockedWilaya ?? "");
    setCommuneCode("");
    setCommunes(lockedWilaya ? getCommuneOptions(lockedWilaya) : []);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) reset();
  };

  const handleRoleChange = (value: string) => {
    setRole(value);
  };

  const handleWilayaChange = (value: string) => {
    setWilayaCode(value);
    setCommuneCode("");
    setCommunes(value ? getCommuneOptions(value) : []);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await createUser({
        email: email.trim(),
        password,
        nomComplet: nomComplet.trim(),
        role: role as (typeof CREATEABLE_ROLES)[number],
        wilayaCode: lockedWilaya ?? (wilayaCode.trim() || null),
        communeCode: communeCode.trim() || null,
      });

      if (result.success) {
        toast.success(t("add_success"));
        router.refresh();
        setOpen(false);
        reset();
      } else {
        toast.error(result.error ?? t("add_failed"));
      }
    });
  };

  const canSubmit =
    !!email.trim() && !!password && !!role && !isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button type="button" data-od-id="add-user-button">
          <UserPlus className="h-4 w-4" />
          {t("add_user")}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{t("add_title")}</DialogTitle>
          <DialogDescription>{t("add_description")}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <label htmlFor="add-user-email" className="text-sm font-medium">
              {t("field_email")}
            </label>
            <Input
              id="add-user-email"
              type="email"
              autoComplete="off"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="prenom.nom@exemple.dz"
              disabled={isPending}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="add-user-password" className="text-sm font-medium">
              {t("field_password")}
            </label>
            <div className="flex gap-2">
              <Input
                id="add-user-password"
                type="text"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={isPending}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label={t("generate_password")}
                title={t("generate_password")}
                onClick={() => setPassword(generatePassword())}
                disabled={isPending}
              >
                <Sparkles className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <label htmlFor="add-user-name" className="text-sm font-medium">
              {t("field_name")}
            </label>
            <Input
              id="add-user-name"
              autoComplete="off"
              value={nomComplet}
              onChange={(e) => setNomComplet(e.target.value)}
              placeholder={t("field_name_placeholder")}
              disabled={isPending}
            />
          </div>

          <div className="grid gap-2">
            <label htmlFor="add-user-role" className="text-sm font-medium">
              {t("field_role")}
            </label>
            <Select value={role} onValueChange={handleRoleChange}>
              <SelectTrigger id="add-user-role">
                <SelectValue placeholder={t("select_role")} />
              </SelectTrigger>
              <SelectContent>
                {allowedRoles.map((r) => (
                  <SelectItem key={r} value={r}>
                    {t(`role.${r}`)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("wilaya")}</label>
              <Select
                value={lockedWilaya ?? wilayaCode}
                onValueChange={handleWilayaChange}
                disabled={!!lockedWilaya || isPending}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_wilaya")} />
                </SelectTrigger>
                <SelectContent>
                  {!lockedWilaya && (
                    <SelectItem value="">{t("no_wilaya")}</SelectItem>
                  )}
                  {wilayas.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <label className="text-sm font-medium">{t("commune")}</label>
              <Select
                value={communeCode}
                onValueChange={setCommuneCode}
                disabled={!(lockedWilaya ?? wilayaCode) || isPending}
              >
                <SelectTrigger>
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
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isPending}
          >
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            data-od-id="add-user-submit"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t("adding") : t("add_submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}