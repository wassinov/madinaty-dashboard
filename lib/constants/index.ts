export const SIGNALEMENT_TYPES = [
  'fuite',
  'penurie',
  'qualite_eau',
  'assainissement',
  'dechets',
  'eclairage_public',
] as const

// Style MapLibre avec labels rues/lieux (latin + arabe, retombe sur `name`
// OSM contrairement à CARTO qui ne lit que `name_en`). Gratuit, sans clé API.
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

// Style sombre (Dark Mode) — OpenFreeMap « Fiord » : sombre mais doux
// (gris-bleu), plus lisible que le Dark Matter quasi noir. Même hébergeur
// sans clé que le style clair ; libellés OSM (latin + arabe).
export const MAP_STYLE_URL_DARK = 'https://tiles.openfreemap.org/styles/fiord'

export const SIGNALEMENT_STATUTS = [
  'en_attente',
  'en_cours',
  'resolu',
  'rejete',
] as const

export const STATUT_COLORS = {
  en_attente: '#f59e0b',
  en_cours: '#00a3c4',
  resolu: '#10b981',
  rejete: '#64748b',
} as const

/** Métadonnées d'affichage par type de signalement (emoji + couleur hex). */
export const TYPE_META: Record<string, { emoji: string; color: string }> = {
  fuite: { emoji: '💧', color: '#4c83e8' },
  penurie: { emoji: '🚱', color: '#4c83e8' },
  qualite_eau: { emoji: '🧪', color: '#4c83e8' },
  assainissement: { emoji: '🚽', color: '#0f9b8e' },
  dechets: { emoji: '🗑️', color: '#c2590c' },
  eclairage_public: { emoji: '💡', color: '#7c5cd1' },
}

/** Emoji de marqueur par type (l'eau partage le même pictogramme). */
export const MARKER_EMOJI: Record<string, string> = {
  fuite: '💧',
  penurie: '💧',
  qualite_eau: '💧',
  assainissement: '🌀',
  dechets: '♻️',
  eclairage_public: '💡',
}

/** Fond de pastille du marqueur par type (couleurs par sous-type). */
export const MARKER_BG_HEX: Record<string, string> = {
  fuite: '#ef4444',
  penurie: '#f59e0b',
  qualite_eau: '#3b82f6',
  assainissement: '#0f9b8e',
  dechets: '#c2590c',
  eclairage_public: '#7c5cd1',
}

// === Domaines (groupes de types) ===
export const DOMAIN_TYPES: Record<string, string[]> = {
  eau: ['fuite', 'penurie', 'qualite_eau'],
  assainissement: ['assainissement'],
  dechets: ['dechets'],
  eclairage_public: ['eclairage_public'],
}

/** Ordre d'affichage des domaines (légende interactive de la carte). */
export const DOMAIN_KEYS = [
  'eau',
  'assainissement',
  'dechets',
  'eclairage_public',
] as const

/** Métadonnées par domaine pour la légende (pastille + sous-types). */
export const DOMAIN_META: Record<
  string,
  {
    emoji: string
    color: string
    /** Clé i18n `domains.*` de l'étiquette du domaine. */
    label: string
    types: string[]
  }
> = {
  eau: {
    emoji: '💧',
    color: '#4c83e8',
    label: 'eau',
    types: DOMAIN_TYPES.eau,
  },
  assainissement: {
    emoji: '🌀',
    color: '#0f9b8e',
    label: 'assainissement',
    types: DOMAIN_TYPES.assainissement,
  },
  dechets: {
    emoji: '♻️',
    color: '#c2590c',
    label: 'dechets',
    types: DOMAIN_TYPES.dechets,
  },
  eclairage_public: {
    emoji: '💡',
    color: '#7c5cd1',
    label: 'eclairage',
    types: DOMAIN_TYPES.eclairage_public,
  },
}

/** Classe de badge (`.bc-st-*`, globals.css) pour chaque statut. */
export const STATUT_BADGE: Record<string, string> = {
  en_attente: 'bc-st-att',
  en_cours: 'bc-st-run',
  resolu: 'bc-st-ok',
  rejete: 'bc-st-no',
}

/** Classe de badge (`.bc-pr-*`, globals.css) pour chaque priorité. */
export const PRIORITY_BADGE: Record<string, string> = {
  haute: 'bc-pr-h',
  moyenne: 'bc-pr-m',
  basse: 'bc-pr-l',
}

/** Un signalement appartient-il au domaine sélectionné ? (null = tous) */
export function matchesDomain(s: { type: string }, domaine: string | null) {
  if (!domaine) return true
  const types = DOMAIN_TYPES[domaine]
  return !!types && types.includes(s.type)
}