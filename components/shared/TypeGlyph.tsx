import type { CSSProperties } from 'react'

// === Glyphes vectoriels par domaine (tracés locaux, grille 24×24) ===
// Marqueurs, légende, tooltip, popup et listes partagent ces mêmes tracés SVG —
// jamais d'emojis : la rasterisation des polices émoji sur canvas produit des
// images transparentes selon l'OS. Remplissage plein, toujours visible.
export const GLYPHS: Record<string, string> = {
  // Goutte d'eau (types du domaine « eau »)
  droplet:
    'M12 3 C 14.5 6.5 18.5 11 18.5 14.5 A 6.5 6.5 0 0 1 5.5 14.5 C 5.5 11 9.5 6.5 12 3 Z',
  // Vague / écoulement (assainissement)
  wave: 'M3 10 C 6 7 9 7 12 10 C 15 13 18 13 21 10 L 21 14 C 18 11 15 11 12 14 C 9 17 6 17 3 14 Z',
  // Poubelle (déchets) : corps + couvercle + anse
  trash:
    'M7 8 L8.5 21 L15.5 21 L17 8 Z M5 5 L5 7 L19 7 L19 5 Z M9 3 L9 5 L15 5 L15 3 Z',
  // Ampoule (éclairage) : verre + culot
  bulb:
    'M12 13 A 5.5 5.5 0 1 0 12 2 A 5.5 5.5 0 1 0 12 13 Z M9 15 L9 17 L15 17 L15 15 Z M10 18 L14 18 L14 19 L10 19 Z M10 20 L14 20 L14 21 L10 21 Z',
}

/** Type -> glyphe vectoriel (les 3 types « eau » partagent la goutte). */
export const TYPE_GLYPH: Record<string, string> = {
  fuite: 'droplet',
  penurie: 'droplet',
  qualite_eau: 'droplet',
  assainissement: 'wave',
  dechets: 'trash',
  eclairage_public: 'bulb',
}

/** Domaine -> glyphe vectoriel (légende). */
export const DOMAIN_GLYPH: Record<string, string> = {
  eau: 'droplet',
  assainissement: 'wave',
  dechets: 'trash',
  eclairage_public: 'bulb',
}

/** Icône vectorielle partagée (carte, légende, listes…). */
export function TypeGlyph({
  id,
  className,
  style,
}: {
  id: string
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="currentColor"
      aria-hidden
    >
      <path d={GLYPHS[id] ?? GLYPHS.droplet} />
    </svg>
  )
}