'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useFilters } from '@/lib/context/FilterContext'
import { cn } from '@/lib/utils'

/**
 * Barre de recherche affichée en surimpression en haut de la carte.
 * Débounce 300 ms avant de propager le mot-clé dans le FilterContext.
 */
export function MapSearchBar({ compact = false }: { compact?: boolean }) {
  const t = useTranslations('filters')
  const { filters, setFilters } = useFilters()
  const [value, setValue] = useState(filters.searchQuery)

  // Propagation débouncée vers le contexte.
  useEffect(() => {
    const timer = setTimeout(() => {
      if (value !== filters.searchQuery) setFilters({ searchQuery: value })
    }, 300)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  // Re-synchronisation si un reset externe vide la recherche.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- resync sur reset externe
    setValue(filters.searchQuery)
  }, [filters.searchQuery])

  return (
    <div className="relative w-full">
      <Search
        className={cn(
          'absolute top-1/2 -translate-y-1/2 text-[var(--color-muted)]',
          compact ? 'start-2.5 h-3.5 w-3.5' : 'start-3 h-4 w-4'
        )}
      />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={t('search_placeholder')}
        className={cn(
          'w-full rounded-md border-[var(--color-border)] bg-[var(--color-surface)]',
          compact ? 'h-8 ps-8 pe-7 text-sm' : 'h-10 ps-9 pe-8'
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => setValue('')}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 rounded p-0.5 text-[var(--color-muted)] hover:text-[var(--color-fg)]',
            compact ? 'end-1.5' : 'end-2'
          )}
          aria-label={t('reset')}
        >
          <X className={compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
        </button>
      )}
    </div>
  )
}