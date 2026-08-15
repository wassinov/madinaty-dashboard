'use client'

import { useEffect } from 'react'
import { useFilters } from '@/lib/context/FilterContext'
import type { UserProfile } from '@/types/database'

/**
 * Composant client sans rendu qui initialise le verrou de périmètre
 * du FilterContext à partir du UserProfile (passé par la page admin).
 *
 * Monté côté serveur par admin/page.tsx via `<PerimeterInit profile={...} />`.
 * Le seul effet de bord est l'appel à initPerimeter au mount.
 */
export function PerimeterInit({ profile }: { profile: UserProfile | null }) {
  const { initPerimeter } = useFilters()
  // initPerimeter est stable (useCallback dans le provider) ; on ne
  // dépend que de profile pour éviter une boucle de re-render.
  useEffect(() => {
    initPerimeter(profile)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile])
  return null
}
