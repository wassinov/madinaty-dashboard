"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import {
    getUserProfile,
    canAssign,
    canCreateAnnouncement,
    canUpdateStatus,
} from "@/lib/utils/getUserProfile";

type ActionResult = { success: boolean; error?: string };

// ============================================================
// 1. updateSignalementStatus — Mise à jour du statut
// ============================================================
const STATUTS = ["en_attente", "en_cours", "resolu", "rejete"] as const;

const updateSignalementStatusSchema = z.object({
    id: z.string().uuid("Identifiant de signalement invalide"),
    statut: z.enum(STATUTS),
    commentaire: z.string().trim().max(500).optional(),
});

type UpdateSignalementStatusInput = z.infer<
    typeof updateSignalementStatusSchema
>;

export async function updateSignalementStatus(
    input: UpdateSignalementStatusInput,
): Promise<ActionResult> {
    const parsed = updateSignalementStatusSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
    }
    const { id, statut, commentaire } = parsed.data;

    const profile = await getUserProfile();
    if (!profile) {
        return { success: false, error: "Non authentifié" };
    }
    if (!canUpdateStatus(profile.role)) {
        return { success: false, error: "Action non autorisée" };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Non authentifié" };
    }

    if (profile.role === "agent_terrain") {
        const { data: sig, error: sigErr } = await supabase
            .from("signalements")
            .select("assigne_a")
            .eq("id", id)
            .single();
        if (sigErr || !sig) {
            return { success: false, error: "Signalement introuvable" };
        }
        if (sig.assigne_a !== user.id) {
            return {
                success: false,
                error: "Vous ne pouvez modifier que vos signalements assignés",
            };
        }
    }

    const { error } = await supabase.rpc("update_signalement_statut", {
        p_id: id,
        p_statut: statut,
        p_commentaire: commentaire ?? null,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    return { success: true };
}

// ============================================================
// 2. assignSignalement — Assignation d'un signalement à un agent
// ============================================================
const assignSignalementSchema = z.object({
    signalementId: z.string().uuid("ID signalement invalide"),
    agentId: z.string().uuid("ID agent invalide"),
});

type AssignSignalementInput = z.infer<typeof assignSignalementSchema>;

export async function assignSignalement(
    input: AssignSignalementInput,
): Promise<ActionResult> {
    const parsed = assignSignalementSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
    }
    const { signalementId, agentId } = parsed.data;

    const profile = await getUserProfile();
    if (!profile) {
        return { success: false, error: "Non authentifié" };
    }
    if (!canAssign(profile.role)) {
        return {
            success: false,
            error: "Seule la direction ADE communale peut assigner",
        };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Non authentifié" };
    }

    // La cible doit être un agent_terrain de la commune de l'appelant.
    // `list_agents_terrain` (SECURITY DEFINER) ne renvoie que les agents
    // de terrain de la commune du direction_ade_commune (règle métier),
    // en contournant la RLS de `profils`.
    const { data: agentRows } = (await supabase.rpc(
        "list_agents_terrain"
      )) as { data: { id: string; nom_complet: string | null }[] | null };
    const target = (agentRows ?? []).find((a) => a.id === agentId);
    if (!target) {
        return {
            success: false,
            error: "L'agent introuvable ou hors de votre commune",
        };
    }

    const { data: currentSig } = await supabase
        .from("signalements")
        .select("statut")
        .eq("id", signalementId)
        .single();

    const { error: updateErr } = await supabase
        .from("signalements")
        .update({
            assigne_a: agentId,
            statut: "en_cours",
        })
        .eq("id", signalementId);

    if (updateErr) {
        return { success: false, error: updateErr.message };
    }

    try {
        await supabase.from("audit_logs").insert({
            signalement_id: signalementId,
            user_id: user.id,
            ancien_statut: currentSig?.statut ?? "en_attente",
            nouveau_statut: "en_cours",
            commentaire: `Assigné à l'agent ${agentId}`,
        });
    } catch {
        console.warn("audit_logs insert failed for assignSignalement");
    }

    revalidatePath("/admin");
    return { success: true };
}

// ============================================================
// 3. addAnnouncement — Création d'une annonce
// ============================================================
const priorityEnum = z.enum(["info", "warning", "urgent"]);

const addAnnouncementSchema = z.object({
    title: z.string().trim().min(3, "Titre trop court").max(200),
    content: z.string().trim().min(5, "Contenu trop court").max(2000),
    wilayaCode: z.string().trim().optional(),
    communeCode: z.string().trim().optional(),
    priority: priorityEnum.default("info"),
    expiresAt: z.string().datetime().optional(),
});

type AddAnnouncementInput = z.infer<typeof addAnnouncementSchema>;

export async function addAnnouncement(
    input: AddAnnouncementInput,
): Promise<ActionResult> {
    const parsed = addAnnouncementSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
    }
    const { title, content, wilayaCode, communeCode, priority, expiresAt } =
        parsed.data;

    const profile = await getUserProfile();
    if (!profile) {
        return { success: false, error: "Non authentifié" };
    }
    if (!canCreateAnnouncement(profile.role)) {
        return {
            success: false,
            error: "Seuls super_admin_wilaya et direction_ade_wilaya peuvent créer des annonces",
        };
    }

    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: "Non authentifié" };
    }

    const finalWilaya =
        profile.role === "direction_ade_wilaya" && profile.wilayaCode
            ? profile.wilayaCode
            : wilayaCode || null;

    const { error } = await supabase.from("announcements").insert({
        title,
        content,
        wilaya_code: finalWilaya,
        commune_code: communeCode || null,
        priority,
        created_by: user.id,
        expires_at: expiresAt || null,
        is_active: true,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    return { success: true };
}

// ============================================================
// 4. updateSignalementPriorite — Mettre à jour la priorité
// ============================================================
const updatePrioriteSchema = z.object({
    id: z.string().uuid(),
    priorite: z.enum(["haute", "moyenne", "basse"]),
});

export async function updateSignalementPriorite(
    input: z.infer<typeof updatePrioriteSchema>,
): Promise<ActionResult> {
    const parsed = updatePrioriteSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
    }
    const { id, priorite } = parsed.data;

    const profile = await getUserProfile();
    if (!profile) {
        return { success: false, error: "Non authentifié" };
    }
    if (!canUpdateStatus(profile.role)) {
        return { success: false, error: "Action non autorisée" };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from("signalements")
        .update({ priorite })
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/admin");
    return { success: true };
}

// ============================================================
// 5. updateAnnouncement — Mise à jour d'une annonce existante
// ============================================================
const updateAnnouncementSchema = z.object({
    id: z.string().uuid("ID annonce invalide"),
    title: z.string().trim().min(3, "Titre trop court").max(200),
    content: z.string().trim().min(5, "Contenu trop court").max(2000),
    wilayaCode: z.string().trim().optional(),
    communeCode: z.string().trim().optional(),
    priority: priorityEnum.default("info"),
    expiresAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().default(true),
});

type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

export async function updateAnnouncement(
    input: UpdateAnnouncementInput,
): Promise<ActionResult> {
    const parsed = updateAnnouncementSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
    }
    const { id, title, content, wilayaCode, communeCode, priority, expiresAt, isActive } =
        parsed.data;

    const profile = await getUserProfile();
    if (!profile) {
        return { success: false, error: "Non authentifié" };
    }
    if (!canCreateAnnouncement(profile.role)) {
        return {
            success: false,
            error: "Seuls super_admin_wilaya et direction_ade_wilaya peuvent modifier des annonces",
        };
    }

    const finalWilaya =
        profile.role === "direction_ade_wilaya" && profile.wilayaCode
            ? profile.wilayaCode
            : wilayaCode || null;

    const supabase = await createClient();
    const { error } = await supabase
        .from("announcements")
        .update({
            title,
            content,
            wilaya_code: finalWilaya,
            commune_code: communeCode || null,
            priority,
            expires_at: expiresAt || null,
            is_active: isActive,
        })
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/annonces");
    return { success: true };
}

// ============================================================
// 6. toggleAnnouncement — Activer / désactiver une annonce
// ============================================================
const toggleAnnouncementSchema = z.object({
    id: z.string().uuid("ID annonce invalide"),
    isActive: z.boolean(),
});

export async function toggleAnnouncement(
    input: z.infer<typeof toggleAnnouncementSchema>,
): Promise<ActionResult> {
    const parsed = toggleAnnouncementSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
    }
    const { id, isActive } = parsed.data;

    const profile = await getUserProfile();
    if (!profile) {
        return { success: false, error: "Non authentifié" };
    }
    if (!canCreateAnnouncement(profile.role)) {
        return { success: false, error: "Action non autorisée" };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from("announcements")
        .update({ is_active: isActive })
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/annonces");
    return { success: true };
}

// ============================================================
// 7. deleteAnnouncement — Suppression d'une annonce
// ============================================================
const deleteAnnouncementSchema = z.object({
    id: z.string().uuid("ID annonce invalide"),
});

export async function deleteAnnouncement(
    input: z.infer<typeof deleteAnnouncementSchema>,
): Promise<ActionResult> {
    const parsed = deleteAnnouncementSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
    }
    const { id } = parsed.data;

    const profile = await getUserProfile();
    if (!profile) {
        return { success: false, error: "Non authentifié" };
    }
    if (!canCreateAnnouncement(profile.role)) {
        return { success: false, error: "Action non autorisée" };
    }

    const supabase = await createClient();
    const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/annonces");
    return { success: true };
}