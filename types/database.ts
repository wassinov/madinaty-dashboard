// ============================================================
// Types Madinaty — Signalements, Profils, Stats, Annonces
// ============================================================

// ------------------------------------------------------------
// Rôles utilisateur
// ------------------------------------------------------------
// On garde les 2 rôles legacy (admin/agent) pour la rétro-compatibilité
// et on ajoute les 5 nouveaux rôles métier.
export type UserRole =
  | 'admin'                   // legacy : super-admin global
  | 'agent'                   // legacy : agent générique
  | 'super_admin_wilaya'      // superviseur wilaya
  | 'admin_commune'           // administrateur commune
  | 'direction_ade_wilaya'    // direction ADE wilaya
  | 'direction_ade_commune'   // direction ADE communale
  | 'agent_terrain';          // agent de terrain

export type UserProfile = {
  role: UserRole
  wilayaCode: string | null
  communeCode: string | null
  secteurNom: string | null
}

// ------------------------------------------------------------
// Profil complet (table `profils` + email) — gestion des comptes
// ------------------------------------------------------------
export type ProfilRow = {
  id: string
  email: string | null
  nom_complet: string | null
  role: string
  wilaya_code: string | null
  commune_code: string | null
  secteur_nom: string | null
  created_at: string | null
}

// ------------------------------------------------------------
// Historique d'audit (timeline) — RPC get_audit_signalement
// ------------------------------------------------------------
export type AuditEntry = {
  id: string
  signalement_id: string
  user_id: string | null
  user_name: string | null
  ancien_statut: string
  nouveau_statut: string
  commentaire: string | null
  created_at: string
}

// ------------------------------------------------------------
// Signalement
// ------------------------------------------------------------
export type Signalement = {
  id: string
  user_id: string
  client_id: string
  type: 'fuite' | 'penurie' | 'qualite_eau' | 'assainissement' | 'dechets' | 'eclairage_public'
  statut: 'en_attente' | 'en_cours' | 'resolu' | 'rejete'
  description: string
  adresse_texte?: string
  latitude: number
  longitude: number
  photos: string[]
  created_at: string
  updated_at: string
  // Nouveaux champs (Phase 1)
  assigne_a?: string | null
  priorite?: 'haute' | 'moyenne' | 'basse'
  commune_code?: string | null
  retard_heures?: number | null
}

// ------------------------------------------------------------
// Stats
// ------------------------------------------------------------
export type Stats = {
  total: number
  en_attente: number
  en_cours: number
  resolu: number
  rejete: number
  users_total: number
}

export type StatsV2 = Stats & {
  par_type: { type: string; count: number }[]
  evolution_30j: { date: string; count: number }[]
  top_wilayas: { label: string; count: number }[]
}

// RPC get_stats_v3 — statistiques interactives (plage de dates, types,
// taux de résolution, durée moyenne de traitement, statuts par jour).
export type StatsV3 = StatsV2 & {
  /** % de signalements résolus parmi ceux traités (résolus + rejetés). */
  resolution_rate: number
  /** Durée moyenne de traitement en heures (signalements résolus). */
  avg_treatment_hours: number
  /** Empilement par jour des signalements créés selon leur statut courant. */
  par_statut_30j: {
    date: string
    en_attente: number
    en_cours: number
    resolu: number
    rejete: number
  }[]
}

// ------------------------------------------------------------
// Annonces
// ------------------------------------------------------------
export type Announcement = {
  id: string
  title: string
  content: string
  wilaya_code: string | null
  commune_code: string | null
  priority: 'info' | 'warning' | 'urgent'
  created_at: string
  expires_at: string | null
  is_active: boolean
}

// Version allégée retournée par la RPC mobile
export type AnnouncementMobile = {
  id: string
  title: string
  content: string
  priority: 'info' | 'warning' | 'urgent'
  created_at: string
  expires_at: string | null
}
