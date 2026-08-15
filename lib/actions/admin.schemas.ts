import { z } from "zod";

// ============================================================
// Types partagés
// ============================================================
export type ActionResult = { success: boolean; error?: string };

// ============================================================
// Schemas de validation
// ============================================================
const STATUTS = ["en_attente", "en_cours", "resolu", "rejete"] as const;
const priorityEnum = z.enum(["info", "warning", "urgent"]);

export const updateSignalementStatusSchema = z.object({
    id: z.string().uuid("Identifiant de signalement invalide"),
    statut: z.enum(STATUTS),
    commentaire: z.string().trim().max(500).optional(),
});

export type UpdateSignalementStatusInput = z.infer<
    typeof updateSignalementStatusSchema
>;

export const assignSignalementSchema = z.object({
    signalementId: z.string().uuid("ID signalement invalide"),
    agentId: z.string().uuid("ID agent invalide"),
});

export type AssignSignalementInput = z.infer<typeof assignSignalementSchema>;

export const addAnnouncementSchema = z.object({
    title: z.string().trim().min(3, "Titre trop court").max(200),
    content: z.string().trim().min(5, "Contenu trop court").max(2000),
    wilayaCode: z.string().trim().optional(),
    communeCode: z.string().trim().optional(),
    priority: priorityEnum.default("info"),
    expiresAt: z.string().datetime().optional(),
});

export type AddAnnouncementInput = z.infer<typeof addAnnouncementSchema>;

export const updateAnnouncementSchema = z.object({
    id: z.string().uuid("ID annonce invalide"),
    title: z.string().trim().min(3, "Titre trop court").max(200),
    content: z.string().trim().min(5, "Contenu trop court").max(2000),
    wilayaCode: z.string().trim().optional(),
    communeCode: z.string().trim().optional(),
    priority: priorityEnum.default("info"),
    expiresAt: z.string().datetime().nullable().optional(),
    isActive: z.boolean().default(true),
});

export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;

export const toggleAnnouncementSchema = z.object({
    id: z.string().uuid("ID annonce invalide"),
    isActive: z.boolean(),
});

export type ToggleAnnouncementInput = z.infer<typeof toggleAnnouncementSchema>;

export const deleteAnnouncementSchema = z.object({
    id: z.string().uuid("ID annonce invalide"),
});

export type DeleteAnnouncementInput = z.infer<typeof deleteAnnouncementSchema>;

export const updatePrioriteSchema = z.object({
    id: z.string().uuid(),
    priorite: z.enum(["haute", "moyenne", "basse"]),
});

export type UpdatePrioriteInput = z.infer<typeof updatePrioriteSchema>;