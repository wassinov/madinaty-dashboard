'use client'

import { useMemo, useState } from 'react'
import { useTranslations } from 'next-intl'
import { RotateCcw, List } from 'lucide-react'
import { useFilters } from '@/lib/context/FilterContext'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SIGNALEMENT_STATUTS, SIGNALEMENT_TYPES } from '@/lib/constants'
import { getWilayaOptions, getCommuneOptions } from '@/lib/utils/geoHelpers'
import { MapSearchBar } from '@/components/dashboard/MapSearchBar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Barre horizontale de filtres en chips (statut, type, wilaya, commune,
 * secteur, dates) posée dans l'overlay de la carte, sous les KPIs.
 * Remplace l'ancienne colonne flottante (`FilterPanel`).
 */
export function FilterChips({
  mode = 'admin',
  onToggleList,
  listOpen,
}: {
  mode?: 'admin' | 'citoyen'
  onToggleList?: () => void
  listOpen?: boolean
}) {
  const t = useTranslations('filters')
  const tTypes = useTranslations('types')
  const tStatuts = useTranslations('statuts')
  const { filters, setFilters, resetFilters, perimeter } = useFilters()
  const [wilayas] = useState(() => getWilayaOptions())
  const communes = useMemo(
    () => (filters.wilayaCode ? getCommuneOptions(filters.wilayaCode) : []),
    [filters.wilayaCode]
  )
  const isCitoyen = mode === 'citoyen'

  // Barre compacte : tous les contrôles sur une seule ligne (repli en vagues
  // sur petit écran), hauteur homogène h-8.
  const chipClass = cn(
    'h-8 w-auto rounded-full border-[var(--color-border)]',
    'bg-[var(--color-surface)] px-2.5 text-sm text-[var(--color-fg)]'
  )

  return (
    <div
      data-od-id="filter-panel"
      className="flex flex-wrap items-center gap-2"
      role="search"
      aria-label={t('panel_title')}
    >
      {/* Recherche (flex-1, repliable) */}
      <div className="min-w-[140px] flex-1">
        <MapSearchBar compact />
      </div>

      {/* Statut */}
      <ChipSelect
        value={filters.statut || ''}
        placeholder={t('statut')}
        onValueChange={(val) => setFilters({ statut: val || null })}
        triggerClass={cn(chipClass, 'min-w-[130px]')}
        dataOdId="filter-statut"
        items={[
          { value: '', label: t('all_statuses') },
          ...SIGNALEMENT_STATUTS.map((v) => ({
            value: v,
            label: tStatuts(v),
          })),
        ]}
      />

      {/* Type */}
      <ChipSelect
        value={filters.type || ''}
        placeholder={t('type')}
        onValueChange={(val) => setFilters({ type: val || null })}
        triggerClass={cn(chipClass, 'min-w-[130px]')}
        dataOdId="filter-type"
        items={[
          { value: '', label: t('all_types') },
          ...SIGNALEMENT_TYPES.map((v) => ({
            value: v,
            label: tTypes(v),
          })),
        ]}
      />

      {!isCitoyen && (
        <ChipSelect
          value={filters.wilayaCode || ''}
          placeholder={t('wilaya')}
          onValueChange={(val) =>
            setFilters({ wilayaCode: val || null, communeCode: null })
          }
          triggerClass={cn(chipClass, 'min-w-[120px]')}
          dataOdId="filter-wilaya"
          disabled={perimeter.wilayaLocked}
          items={[
            { value: '', label: t('all_wilayas') },
            ...wilayas.map((w) => ({ value: w.value, label: w.label })),
          ]}
        />
      )}

      {!isCitoyen && (
        <ChipSelect
          value={filters.communeCode || ''}
          placeholder={t('commune')}
          onValueChange={(val) => setFilters({ communeCode: val || null })}
          triggerClass={cn(chipClass, 'min-w-[120px]')}
          dataOdId="filter-commune"
          disabled={!filters.wilayaCode || perimeter.communeLocked}
          items={[
            { value: '', label: t('all_communes') },
            ...communes.map((c) => ({ value: c.value, label: c.label })),
          ]}
        />
      )}

      {!isCitoyen && (
        <Input
          value={filters.secteur || ''}
          onChange={(e) => setFilters({ secteur: e.target.value || null })}
          placeholder={t('secteur')}
          data-od-id="filter-secteur"
          aria-label={t('secteur')}
          className={cn(chipClass, 'min-w-[100px]')}
        />
      )}

      {/* Période : deux dates côte à côte avec un séparateur */}
      {!isCitoyen && (
        <div className="hidden items-center gap-1 lg:flex min-w-[200px]">
          <Input
            type="date"
            aria-label={t('from_date')}
            value={
              filters.dateDebut
                ? filters.dateDebut.toISOString().slice(0, 10)
                : ''
            }
            onChange={(e) =>
              setFilters({
                dateDebut: e.target.value
                  ? new Date(e.target.value + 'T00:00:00')
                  : null,
              })
            }
            className={cn(chipClass, 'min-w-[92px]')}
          />
          <span aria-hidden className="shrink-0 text-xs text-[var(--color-muted)]">
            →
          </span>
          <Input
            type="date"
            aria-label={t('to_date')}
            value={
              filters.dateFin ? filters.dateFin.toISOString().slice(0, 10) : ''
            }
            onChange={(e) =>
              setFilters({
                dateFin: e.target.value
                  ? new Date(e.target.value + 'T23:59:59.999')
                  : null,
              })
            }
            className={cn(chipClass, 'min-w-[92px]')}
          />
        </div>
      )}

      {/* Réinitialiser */}
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={resetFilters}
        data-od-id="filter-reset"
        aria-label={t('reset')}
        className="h-8 min-w-[80px] shrink-0 gap-1 text-xs"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        <span className="hidden lg:inline">{t('reset')}</span>
      </Button>

      {/* Ouverture du tiroir liste */}
      {onToggleList && (
        <Button
          type="button"
          variant={listOpen ? 'secondary' : 'outline'}
          size="sm"
          onClick={onToggleList}
          data-od-id="report-list-toggle"
          aria-expanded={listOpen}
          aria-label={t(listOpen ? 'hide_list' : 'show_list')}
          className="h-8 shrink-0"
        >
          <List className="h-4 w-4" />
          <span className="hidden md:inline">
            {t(listOpen ? 'hide_list' : 'show_list')}
          </span>
        </Button>
      )}
    </div>
  )
}

function ChipSelect({
  value,
  placeholder,
  onValueChange,
  items,
  triggerClass,
  dataOdId,
  disabled = false,
}: {
  value: string
  placeholder: string
  onValueChange: (v: string) => void
  items: { value: string; label: string }[]
  triggerClass: string
  dataOdId: string
  disabled?: boolean
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger
        className={triggerClass}
        data-od-id={dataOdId}
        disabled={disabled}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}