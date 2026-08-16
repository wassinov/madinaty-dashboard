'use client'

import { useMemo } from 'react'
import type { Signalement } from '@/types/database'
import { useFilters } from '@/lib/context/FilterContext'
import { matchesDomain } from '@/lib/constants'

/**
 * Applique les filtres du `FilterContext` à une liste de signalements.
 * Logique unique partagée entre la carte (`MapComponent`) et les autres vues
 * (liste des signalements) : toutes les vues restent par construction synchrones.
 */
export function useFilteredSignalements(
  signalements: Signalement[]
): Signalement[] {
  const { filters, perimeter } = useFilters()

  return useMemo(() => {
    const q = filters.searchQuery.trim().toLowerCase()
    return signalements.filter((s) => {
      if (filters.statut && s.statut !== filters.statut) return false
      if (filters.type && s.type !== filters.type) return false
      if (!matchesDomain(s, filters.domaine)) return false
      // Périmètre verrouillé : le serveur filtre déjà par commune_code,
      // on n'ajoute pas de re-filtre local redondant.
      if (
        !perimeter.communeLocked &&
        filters.communeCode &&
        s.commune_code !== filters.communeCode
      )
        return false
      // Pour les périmètres restreints (agent terrain / direction), la carte
      // ne montre que les missions ouvertes afin de réduire la charge visuelle.
      // Un filtre statut explicite (ex. « résolu ») re-affiche ces éléments.
      if (
        !filters.statut &&
        (perimeter.communeLocked || perimeter.wilayaLocked) &&
        (s.statut === 'resolu' || s.statut === 'rejete')
      )
        return false
      if (q) {
        const hay = `${s.description} ${s.adresse_texte ?? ''}`.toLowerCase()
        if (!hay.includes(q)) return false
      }
      return true
    })
  }, [signalements, filters, perimeter])
}