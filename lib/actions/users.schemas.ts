import { z } from "zod";

// ============================================================
// Types partagés
// ============================================================
export type ActionResult = { success: boolean; error?: string };

// ============================================================
// Schema de validation
// ============================================================

// Tuple non-readonly attendu par z.enum (tous les rôles métier).
export const ALL_ROLES = [
    "citoyen",
    "agent",
    "admin",
    "super_admin_wilaya",
    "admin_commune",
    "direction_ade_wilaya",
    "direction_ade_commune",
    "agent_terrain",
] as const;

export const updateProfilSchema = z.object({
    id: z.string().uuid("Identifiant utilisateur invalide"),
    role: z.enum(ALL_ROLES),
    wilayaCode: z
        .string()
        .trim()
        .max(2, "Code wilaya invalide")
        .nullable()
        .optional(),
    communeCode: z
        .string()
        .trim()
        .max(5, "Code commune invalide")
        .nullable()
        .optional(),
});

export type UpdateProfilInput = z.infer<typeof updateProfilSchema>;

// ============================================================
// Création d'un utilisateur (admin uniquement)
// ============================================================

// Rôles professionnels créables depuis /admin/utilisateurs. Exclut
// volontairement `citoyen` (inscription via /register) et les rôles legacy
// `admin` / `agent` (attribution réservée aux migrations / super admin).
export const CREATEABLE_ROLES = [
    "agent_terrain",
    "direction_ade_commune",
    "direction_ade_wilaya",
    "admin_commune",
    "super_admin_wilaya",
] as const;

export const createUserSchema = z.object({
    email: z
        .string()
        .trim()
        .min(1, "Email requis")
        .email("Adresse email invalide")
        .max(254, "Adresse email trop longue"),
    password: z
        .string()
        .min(6, "Le mot de passe doit contenir au moins 6 caractères")
        .max(72, "Mot de passe trop long"),
    nomComplet: z
        .string()
        .trim()
        .max(120, "Nom trop long")
        .optional()
        .or(z.literal("")),
    role: z.enum(CREATEABLE_ROLES),
    wilayaCode: z
        .string()
        .trim()
        .max(2, "Code wilaya invalide")
        .nullable()
        .optional(),
    communeCode: z
        .string()
        .trim()
        .max(5, "Code commune invalide")
        .nullable()
        .optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
