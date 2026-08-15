"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserProfile } from "@/lib/utils/getUserProfile";
import {
    USER_MANAGER_ROLES,
    WILAYA_ASSIGNABLE_ROLES,
} from "@/lib/constants/roles";
import {
    ActionResult,
    createUserSchema,
    CreateUserInput,
    updateProfilSchema,
    UpdateProfilInput,
} from "./users.schemas";

// ============================================================
// updateProfil — Mise à jour du rôle + périmètre d'un utilisateur
// ============================================================

/**
 * Met à jour le rôle et le périmètre territorial d'un utilisateur.
 *
 * Permissions (miroir de la RPC `update_profil_role` côté SQL) :
 * - admin : tout rôle / périmètre
 * - super_admin_wilaya : rôles opérationnels dans sa wilaya uniquement
 * - direction_ade_wilaya : rôles opérationnels (hors pair) dans sa wilaya
 */
export async function updateProfil(
    input: UpdateProfilInput,
): Promise<ActionResult> {
    const parsed = updateProfilSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
    }
    const { id, role, wilayaCode, communeCode } = parsed.data;

    const profile = await getUserProfile();
    if (!profile) {
        return { success: false, error: "Non authentifié" };
    }
    if (!USER_MANAGER_ROLES.includes(profile.role)) {
        return { success: false, error: "Action non autorisée" };
    }

    // Règles d'escalade côté application (double sécurité avec la RPC).
    if (profile.role !== "admin") {
        if (role === "admin" || role === "super_admin_wilaya") {
            return { success: false, error: "Rôle non attribuable par votre profil" };
        }
        if (profile.role === "direction_ade_wilaya" && role === "direction_ade_wilaya") {
            return { success: false, error: "Rôle non attribuable par votre profil" };
        }
        // Le périmètre cible doit rester dans la wilaya de l'appelant.
        if (profile.wilayaCode && wilayaCode !== profile.wilayaCode) {
            return { success: false, error: "Périmètre hors de votre wilaya" };
        }
    }

    // Une commune sans wilaya est invalide.
    if (communeCode && !wilayaCode) {
        return { success: false, error: "Une commune requiert une wilaya" };
    }
    if (wilayaCode && communeCode && !communeCode.startsWith(wilayaCode)) {
        return { success: false, error: "La commune n'appartient pas à la wilaya" };
    }

    const supabase = await createClient();
    const { error } = await supabase.rpc("update_profil_role", {
        p_id: id,
        p_role: role,
        p_wilaya_code: wilayaCode || null,
        p_commune_code: communeCode || null,
    });

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath("/admin/utilisateurs");
    return { success: true };
}

// ============================================================
// createUser — Création d'un compte professionnel (admin uniquement)
// ============================================================

/**
 * Crée un utilisateur : compte `auth.users` (via l'API admin, clé
 * service_role) + rôle / périmètre appliqués sur le profil.
 *
 * Permissions (miroir de `updateProfil`) :
 * - admin : tout rôle professionnel, tout périmètre (hors citoyen / legacy)
 * - super_admin_wilaya : rôles opérationnels dans sa wilaya
 * - direction_ade_wilaya : rôles opérationnels (hors pair) dans sa wilaya
 *
 * Les citoyens s'inscrivent via /register : aucune création de compte
 * citoyen ici.
 */
export async function createUser(
    input: CreateUserInput,
): Promise<ActionResult> {
    const parsed = createUserSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: parsed.error.issues[0]?.message };
    }
    const { email, password, nomComplet, role, wilayaCode, communeCode } =
        parsed.data;

    const profile = await getUserProfile();
    if (!profile) {
        return { success: false, error: "Non authentifié" };
    }
    if (!USER_MANAGER_ROLES.includes(profile.role)) {
        return { success: false, error: "Action non autorisée" };
    }

    // Règles d'escalade (double sécurité avec la UI `assignableRoles`).
    if (profile.role !== "admin") {
        if (!WILAYA_ASSIGNABLE_ROLES.includes(role)) {
            return { success: false, error: "Rôle non attribuable par votre profil" };
        }
        if (
            profile.role === "direction_ade_wilaya" &&
            role === "direction_ade_wilaya"
        ) {
            return { success: false, error: "Rôle non attribuable par votre profil" };
        }
        // Le périmètre cible doit rester dans la wilaya de l'appelant.
        if (profile.wilayaCode && wilayaCode !== profile.wilayaCode) {
            return { success: false, error: "Périmètre hors de votre wilaya" };
        }
    }

    // Une commune sans wilaya est invalide.
    if (communeCode && !wilayaCode) {
        return { success: false, error: "Une commune requiert une wilaya" };
    }
    if (wilayaCode && communeCode && !communeCode.startsWith(wilayaCode)) {
        return { success: false, error: "La commune n'appartient pas à la wilaya" };
    }

    const admin = createAdminClient();
    if (!admin) {
        return {
            success: false,
            error: "Clé service_role non configurée sur le serveur",
        };
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
            nom_complet: nomComplet || null,
            telephone: null,
        },
    });
    if (createError || !created.user) {
        return { success: false, error: createError?.message ?? "Échec de la création du compte" };
    }

    // Applique le rôle et le périmètre sur le profil. Le trigger d'inscription
    // a pu créer un profil par défaut (citoyen) : on le met à jour, sinon on
    // l'insère.
    const profil: {
        role: string;
        wilaya_code: string | null;
        commune_code: string | null;
    } = {
        role,
        wilaya_code: wilayaCode || null,
        commune_code: communeCode || null,
    };
    const { data: updated, error: updateError } = await admin
        .from("profils")
        .update(profil)
        .eq("id", created.user.id)
        .select("id");
    if (updateError) {
        await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
        return { success: false, error: `Profil non appliqué : ${updateError.message}` };
    }

    if (!updated || updated.length === 0) {
        // Aucun profil préexistant (pas de trigger) : on le crée.
        const { error: insertError } = await admin.from("profils").insert({
            id: created.user.id,
            nom_complet: nomComplet || null,
            role,
            wilaya_code: wilayaCode || null,
            commune_code: communeCode || null,
        });
        if (insertError) {
            await admin.auth.admin.deleteUser(created.user.id).catch(() => {});
            return {
                success: false,
                error: `Profil non créé : ${insertError.message}`,
            };
        }
    } else {
        // Profil préexistant : on complète le nom complet s'il était vide.
        if (nomComplet) {
            await admin
                .from("profils")
                .update({ nom_complet: nomComplet })
                .eq("id", created.user.id);
        }
    }

    revalidatePath("/admin/utilisateurs");
    return { success: true };
}
