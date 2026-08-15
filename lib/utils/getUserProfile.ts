import { headers } from 'next/headers'
import type { UserProfile, UserRole } from '@/types/database'
import {
  ASSIGNABLE_ROLES,
  ANNOUNCEMENT_CREATOR_ROLES,
  STATUS_EDITABLE_ROLES,
} from '@/lib/constants/roles'

/**
 * Récupère le profil utilisateur injecté par le middleware `proxy.ts`.
 *
 * Le middleware (`proxy.ts`) authentifie l'utilisateur, récupère son
 * profil dans la table `profils` (rôle + périmètre territorial), puis
 * injecte ces valeurs dans 4 headers de la requête :
 *   - `x-user-role`
 *   - `x-user-wilaya`
 *   - `x-user-commune`
 *   - `x-user-secteur`
 *
 * Cette fonction lit ces headers côté Server Component / Server Action
 * pour renvoyer un objet typé `UserProfile` utilisable directement.
 *
 * @returns Le profil utilisateur ou `null` si non authentifié.
 */
export async function getUserProfile(): Promise<UserProfile | null> {
  const headerList = await headers()
  const role = headerList.get('x-user-role')
  const wilayaCode = headerList.get('x-user-wilaya')
  const communeCode = headerList.get('x-user-commune')
  const secteurNom = headerList.get('x-user-secteur')

  // Aucun header -> l'utilisateur n'est pas encore authentifié
  // (ou le middleware n'est pas passé sur cette route).
  if (!role) return null

  return {
    role: role as UserRole,
    wilayaCode: wilayaCode || null,
    communeCode: communeCode || null,
    secteurNom: secteurNom || null,
  }
}

/**
 * Vérifie si un rôle donné est autorisé à assigner un signalement.
 * Seule la direction ADE communale (ou admin legacy) peut assigner.
 */
export function canAssign(role: UserRole): boolean {
  return ASSIGNABLE_ROLES.includes(role)
}

/**
 * Vérifie si un rôle donné peut créer une annonce.
 * Seuls les super_admin_wilaya, direction_ade_wilaya et admin (legacy).
 */
export function canCreateAnnouncement(role: UserRole): boolean {
  return ANNOUNCEMENT_CREATOR_ROLES.includes(role)
}

/**
 * Vérifie si un rôle donné peut modifier le statut d'un signalement.
 * Tous les rôles admin/agent (anciens et nouveaux) le peuvent, mais
 * avec des restrictions de périmètre (vérifiées côté RPC / Server Action).
 */
export function canUpdateStatus(role: UserRole): boolean {
  return STATUS_EDITABLE_ROLES.includes(role)
}
