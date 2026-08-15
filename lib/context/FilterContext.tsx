'use client'

import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react'
import type { UserProfile } from '@/types/database'

export type FilterState = {
  statut: string | null
  type: string | null
  /** Domaine (eau / assainissement / dechets / eclairage_public) */
  domaine: string | null
  wilayaCode: string | null
  communeCode: string | null
  secteur: string | null
  dateDebut: Date | null
  dateFin: Date | null
  searchQuery: string
}

/**
 * Informations de périmètre déduites du UserProfile :
 * - wilayaLocked  : l'utilisateur est limité à une wilaya (agent, direction)
 * - communeLocked : l'utilisateur est limité à une commune (agent_terrain,
 *   direction_ade_commune)
 */
type PerimeterLock = {
  wilayaLocked: boolean
  communeLocked: boolean
  fixedWilayaCode: string | null
  fixedCommuneCode: string | null
}

type FilterContextType = {
  filters: FilterState
  setFilters: (filters: Partial<FilterState>) => void
  resetFilters: () => void
  /** Verrou de périmètre (déduit du profil utilisateur) */
  perimeter: PerimeterLock
  /** Initialise le verrou de périmètre (appelé depuis la page admin) */
  initPerimeter: (profile: UserProfile | null) => void
}

const defaultFilters: FilterState = {
  statut: null,
  type: null,
  domaine: null,
  wilayaCode: null,
  communeCode: null,
  secteur: null,
  dateDebut: null,
  dateFin: null,
  searchQuery: '',
}

const defaultPerimeter: PerimeterLock = {
  wilayaLocked: false,
  communeLocked: false,
  fixedWilayaCode: null,
  fixedCommuneCode: null,
}

const FilterContext = createContext<FilterContextType | undefined>(undefined)

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFiltersState] = useState<FilterState>(defaultFilters)
  const [perimeter, setPerimeter] = useState<PerimeterLock>(defaultPerimeter)

  const setFilters = (newFilters: Partial<FilterState>) => {
    setFiltersState((prev) => {
      // Empêcher la modification des champs verrouillés par le périmètre
      const merged: FilterState = { ...prev, ...newFilters }
      if (perimeter.wilayaLocked && perimeter.fixedWilayaCode) {
        merged.wilayaCode = perimeter.fixedWilayaCode
      }
      if (perimeter.communeLocked && perimeter.fixedCommuneCode) {
        merged.communeCode = perimeter.fixedCommuneCode
      }
      return merged
    })
  }

  const resetFilters = () => {
    setFiltersState({
      ...defaultFilters,
      wilayaCode: perimeter.fixedWilayaCode,
      communeCode: perimeter.fixedCommuneCode,
    })
  }

  const initPerimeter = useCallback((profile: UserProfile | null) => {
    if (!profile) {
      setPerimeter(defaultPerimeter)
      return
    }
    // Cas spécial : agent_terrain -> verrouillé sur sa commune + wilaya
    // direction_ade_commune -> verrouillé sur sa commune
    // direction_ade_wilaya / super_admin_wilaya -> verrouillé sur sa wilaya
    // admin (legacy) -> pas de verrou
    const role = profile.role
    const wilayaLocked =
      role === 'agent_terrain' ||
      role === 'admin_commune' ||
      role === 'direction_ade_commune' ||
      role === 'direction_ade_wilaya' ||
      role === 'super_admin_wilaya'
    const communeLocked =
      role === 'agent_terrain' ||
      role === 'admin_commune' ||
      role === 'direction_ade_commune'

    const newPerimeter: PerimeterLock = {
      wilayaLocked,
      communeLocked,
      fixedWilayaCode: profile.wilayaCode,
      fixedCommuneCode: profile.communeCode,
    }
    setPerimeter(newPerimeter)

    // Appliquer les valeurs fixes aux filtres
    setFiltersState((prev) => ({
      ...prev,
      wilayaCode: wilayaLocked ? profile.wilayaCode : prev.wilayaCode,
      communeCode: communeLocked ? profile.communeCode : prev.communeCode,
    }))
  }, [])

  return (
    <FilterContext.Provider
      value={{ filters, setFilters, resetFilters, perimeter, initPerimeter }}
    >
      {children}
    </FilterContext.Provider>
  )
}

export function useFilters() {
  const context = useContext(FilterContext)
  if (context === undefined) {
    throw new Error('useFilters must be used within a FilterProvider')
  }
  return context
}
