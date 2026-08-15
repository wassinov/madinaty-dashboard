import type { UserRole } from '@/types/database'

// Rôles autorisés à accéder à l'interface admin (miroir de proxy.ts).
export const ADMIN_ROLES: readonly UserRole[] = [
  'admin',
  'agent',
  'super_admin_wilaya',
  'admin_commune',
  'direction_ade_wilaya',
  'direction_ade_commune',
  'agent_terrain',
]

// Rôles autorisés à modifier le statut d'un signalement (miroir de
// canUpdateStatus dans getUserProfile.ts).
export const STATUS_EDITABLE_ROLES: readonly UserRole[] = [
  'admin',
  'agent',
  'super_admin_wilaya',
  'admin_commune',
  'direction_ade_wilaya',
  'direction_ade_commune',
  'agent_terrain',
]

// Rôles autorisés à assigner un signalement à un agent (miroir de
// canAssign dans getUserProfile.ts).
export const ASSIGNABLE_ROLES: readonly UserRole[] = [
  'direction_ade_commune',
]

// Rôles autorisés à créer une annonce (miroir de canCreateAnnouncement).
export const ANNOUNCEMENT_CREATOR_ROLES: readonly UserRole[] = [
  'super_admin_wilaya',
  'direction_ade_wilaya',
  'admin',
]

// Rôles autorisés à modifier la priorité d'un signalement (miroir de
// canUpdateStatus).
export const PRIORITY_EDITABLE_ROLES: readonly UserRole[] =
  STATUS_EDITABLE_ROLES

// Rôles autorisés à gérer les comptes utilisateurs (page /admin/utilisateurs
// — miroir de list_profils / update_profil_role côté SQL).
export const USER_MANAGER_ROLES: readonly UserRole[] = [
  'admin',
  'super_admin_wilaya',
  'direction_ade_wilaya',
]

// Rôles attribuables par un super_admin_wilaya (il ne peut pas nommer
// admin ni super_admin_wilaya).
export const WILAYA_ASSIGNABLE_ROLES: readonly UserRole[] = [
  'agent_terrain',
  'admin_commune',
  'direction_ade_commune',
  'direction_ade_wilaya',
]

// Tous les rôles existants (ordre d'affichage dans la gestion des comptes).
// `citoyen` n'est pas un rôle "admin" mais doit rester attribuable.
export const ALL_ROLES = [
  'citoyen',
  'agent',
  'admin',
  'super_admin_wilaya',
  'admin_commune',
  'direction_ade_wilaya',
  'direction_ade_commune',
  'agent_terrain',
] as const

/** Liste des rôles attribuables par le profil courant (gestion des comptes). */
export function assignableRoles(role: string): readonly string[] {
  if (role === 'admin') return ALL_ROLES
  if (role === 'super_admin_wilaya') return WILAYA_ASSIGNABLE_ROLES
  if (role === 'direction_ade_wilaya')
    return WILAYA_ASSIGNABLE_ROLES.filter((r) => r !== 'direction_ade_wilaya')
  return []
}
