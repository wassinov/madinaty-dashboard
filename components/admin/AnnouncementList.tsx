"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Megaphone, Pencil, Power, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatDate } from "@/lib/utils/formatting";
import {
  deleteAnnouncement,
  toggleAnnouncement,
  updateAnnouncement,
} from "@/lib/actions/admin";
import type { ActionResult } from "@/lib/actions/admin.schemas";
import type { Announcement } from "@/types/database";

type Props = {
  announcements: Announcement[];
  canManage: boolean;
};

const PRIORITY_BADGE: Record<Announcement["priority"], string> = {
  urgent: "bc-ann-urgent",
  warning: "bc-ann-warning",
  info: "bc-ann-info",
};

function isExpired(a: Announcement): boolean {
  if (!a.expires_at) return false;
  return new Date(a.expires_at).getTime() < Date.now();
}

export function AnnouncementList({ announcements, canManage }: Props) {
  const t = useTranslations("announcements");
  const router = useRouter();
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleToggle = (a: Announcement) => {
    startTransition(async () => {
      const result = (await toggleAnnouncement({
        id: a.id,
        isActive: !a.is_active,
      })) as ActionResult;
      if (result.success) {
        toast.success(t("toggle_success"));
        router.refresh();
      } else {
        toast.error(result.error ?? t("toggle_failed"));
      }
    });
  };

  const handleDelete = (a: Announcement) => {
    if (!window.confirm(t("delete_confirm"))) return;
    startTransition(async () => {
      const result = (await deleteAnnouncement({ id: a.id })) as ActionResult;
      if (result.success) {
        toast.success(t("delete_success"));
        router.refresh();
      } else {
        toast.error(result.error ?? t("delete_failed"));
      }
    });
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{t("list_title")}</CardTitle>
          <CardDescription>{t("list_description")}</CardDescription>
        </CardHeader>
        <CardContent>
          {announcements.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">{t("list_empty")}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("col_title")}</TableHead>
                  <TableHead>{t("col_priority")}</TableHead>
                  <TableHead>{t("col_territory")}</TableHead>
                  <TableHead>{t("col_created")}</TableHead>
                  <TableHead>{t("col_expires")}</TableHead>
                  <TableHead>{t("col_status")}</TableHead>
                  {canManage && <TableHead className="text-right">{t("col_actions")}</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((a) => {
                  const expired = isExpired(a);
                  return (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Megaphone className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
                          <div>
                            <div className="font-medium">{a.title}</div>
                            <div className="max-w-md truncate text-xs text-[var(--color-muted)]">
                              {a.content}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className={`badge-s ${PRIORITY_BADGE[a.priority]}`}>
                          {t(a.priority)}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm text-[var(--color-muted)]">
                        {a.wilaya_code ?? "—"}
                        {a.commune_code ? ` / ${a.commune_code}` : ""}
                      </TableCell>
                      <TableCell className="text-sm text-[var(--color-muted)]">
                        {formatDate(a.created_at)}
                      </TableCell>
                      <TableCell className="text-sm text-[var(--color-muted)]">
                        {a.expires_at ? formatDate(a.expires_at) : "—"}
                      </TableCell>
                      <TableCell>
                        <span
                          className={`badge-s ${
                            !a.is_active
                              ? "bc-st-no"
                              : expired
                                ? "bc-st-att"
                                : "bc-st-ok"
                          }`}
                        >
                          {!a.is_active
                            ? t("status_inactive")
                            : expired
                              ? t("status_expired")
                              : t("status_active")}
                        </span>
                      </TableCell>
                      {canManage && (
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditing(a)}
                              disabled={isPending}
                              title={t("action_edit")}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggle(a)}
                              disabled={isPending}
                              title={a.is_active ? t("action_deactivate") : t("action_activate")}
                            >
                              <Power className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="text-[var(--st-no)] hover:opacity-80"
                              onClick={() => handleDelete(a)}
                              disabled={isPending}
                              title={t("action_delete")}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {editing && (
        <EditAnnouncementDialog
          announcement={editing}
          open={true}
          onOpenChange={(open) => !open && setEditing(null)}
        />
      )}
    </>
  );
}

type EditProps = {
  announcement: Announcement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function EditAnnouncementDialog({ announcement, open, onOpenChange }: EditProps) {
  const t = useTranslations("announcements");
  const router = useRouter();
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [priority, setPriority] = useState<Announcement["priority"]>(
    announcement.priority
  );
  const [expiresAt, setExpiresAt] = useState(
    announcement.expires_at
      ? new Date(announcement.expires_at).toISOString().slice(0, 16)
      : ""
  );
  const [isPending, startUpdate] = useTransition();

  const handleSave = () => {
    startUpdate(async () => {
      const result = (await updateAnnouncement({
        id: announcement.id,
        title,
        content,
        priority,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive: announcement.is_active,
      })) as ActionResult;
      if (result.success) {
        toast.success(t("update_success"));
        onOpenChange(false);
        router.refresh();
      } else {
        toast.error(result.error ?? t("update_failed"));
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("edit_title")}</DialogTitle>
          <DialogDescription>{t("edit_description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t("field_title")}</label>
            <Input value={title} maxLength={200} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium">{t("field_content")}</label>
            <Textarea
              value={content}
              rows={4}
              maxLength={2000}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium">{t("priority_label")}</label>
              <Select
                value={priority}
                onValueChange={(v) => setPriority(v as Announcement["priority"])}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">{t("priority_info")}</SelectItem>
                  <SelectItem value="warning">{t("priority_warning")}</SelectItem>
                  <SelectItem value="urgent">{t("priority_urgent")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium">{t("expires_optional")}</label>
              <Input
                type="datetime-local"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSave}
              disabled={isPending || !title.trim() || !content.trim()}
            >
              {isPending ? t("updating") : t("save")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
