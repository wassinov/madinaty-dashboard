"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Loader2, Megaphone } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { addAnnouncement } from "@/lib/actions/admin";
import { getWilayaOptions, getCommuneOptions } from "@/lib/utils/geoHelpers";
import type { UserProfile } from "@/types/database";

type Props = {
  profile: UserProfile | null;
};

export function AnnouncementForm({ profile }: Props) {
  const t = useTranslations("announcements");
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [priority, setPriority] = useState<"info" | "warning" | "urgent">(
    "info"
  );
  const [wilayaCode, setWilayaCode] = useState(profile?.wilayaCode ?? "");
  const [communeCode, setCommuneCode] = useState(profile?.communeCode ?? "");
  const [expiresAt, setExpiresAt] = useState("");
  const [isPending, startTransition] = useTransition();

  const [wilayas] = useState(() => getWilayaOptions());
  const [communes, setCommunes] = useState(() =>
    wilayaCode ? getCommuneOptions(wilayaCode) : []
  );

  const canCreate = profile
    ? ["super_admin_wilaya", "direction_ade_wilaya", "admin"].includes(
        profile.role
      )
    : false;

  if (!profile) return null;

  const handleWilayaChange = (value: string) => {
    setWilayaCode(value);
    setCommuneCode("");
    setCommunes(value ? getCommuneOptions(value) : []);
  };

  const handleSubmit = () => {
    startTransition(async () => {
      const result = await addAnnouncement({
        title,
        content,
        wilayaCode: wilayaCode || undefined,
        communeCode: communeCode || undefined,
        priority,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      });

      if (result.success) {
        toast.success(t("create_success"));
        setTitle("");
        setContent("");
        setPriority("info");
        setExpiresAt("");
        router.refresh();
      } else {
        toast.error(result.error ?? t("create_failed"));
      }
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Megaphone className="h-5 w-5 text-[var(--color-accent)]" />
          {t("form_title")}
        </CardTitle>
        <CardDescription>{t("form_description")}</CardDescription>
      </CardHeader>
      <CardContent>
        {!canCreate && (
          <p className="mb-4 rounded-md badge-s bc-ann-warning px-3 py-2 text-sm">
            {t("manage_hint")}
          </p>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <label
              htmlFor="announcement-title"
              className="block text-sm font-medium mb-1"
            >
              {t("field_title")}
            </label>
            <Input
              id="announcement-title"
              placeholder={t("placeholder_title")}
              value={title}
              maxLength={200}
              disabled={isPending || !canCreate}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="announcement-content"
              className="block text-sm font-medium mb-1"
            >
              {t("field_content")}
            </label>
            <Textarea
              id="announcement-content"
              placeholder={t("placeholder_content")}
              value={content}
              rows={4}
              maxLength={2000}
              disabled={isPending || !canCreate}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">
                {t("priority_label")}
              </label>
              <Select
                value={priority}
                onValueChange={(val) =>
                  setPriority(val as "info" | "warning" | "urgent")
                }
                disabled={isPending || !canCreate}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">{t("priority_info")}</SelectItem>
                  <SelectItem value="warning">
                    {t("priority_warning")}
                  </SelectItem>
                  <SelectItem value="urgent">{t("priority_urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">
                {t("expires_optional")}
              </label>
              <Input
                type="datetime-local"
                value={expiresAt}
                disabled={isPending || !canCreate}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">{t("wilaya")}</label>
              <Select
                value={wilayaCode}
                onValueChange={handleWilayaChange}
                disabled={isPending || !canCreate || !!profile.wilayaCode}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_wilaya")} />
                </SelectTrigger>
                <SelectContent>
                  {wilayas.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium mb-1">
                {t("commune")}
              </label>
              <Select
                value={communeCode}
                onValueChange={setCommuneCode}
                disabled={
                  isPending || !canCreate || !wilayaCode || !!profile.communeCode
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder={t("select_commune")} />
                </SelectTrigger>
                <SelectContent>
                  {communes.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending || !canCreate || !title.trim() || !content.trim()}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? t("submitting") : t("submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}