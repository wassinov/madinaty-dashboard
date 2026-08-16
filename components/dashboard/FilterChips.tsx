'use client'

import { useMemo, useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { RotateCcw } from 'lucide-react'
import { useFilters } from '@/lib/context/FilterContext'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SIGNALEMENT_STATUTS } from '@/lib/constants'
import { getWilayaOptions, getCommuneOptions } from '@/lib/utils/geoHelpers'
import { MapSearchBar } from '@/components/dashboard/MapSearchBar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * Panneau latéral (à droite de la carte) regroupant tous les filtres :
 * recherche, statut, périmètre (wilaya / commune), secteur, dates et reset.
 * Le filtre « type » a été retiré : il est redondant avec la légende de la
 * carte, qui filtre déjà par domaine.
 */
export function FilterChips({
  mode = 'admin',
}: {
  mode?: 'admin' | 'citoyen'
}) {
  const t = useTranslations('filters')
  const tStatuts = useTranslations('statuts')
  const { filters, setFilters, resetFilters, perimeter } = useFilters()
  const [wilayas] = useState(() => getWilayaOptions())
  const communes = useMemo(
    () => (filters.wilayaCode ? getCommuneOptions(filters.wilayaCode) : []),
    [filters.wilayaCode]
  )
  const isCitoyen = mode === 'citoyen'

  const controlClass = cn(
    'h-8 w-full rounded-md border-[var(--color-border)]',
    'bg-[var(--color-surface)] text-sm text-[var(--color-fg)]'
  )

  return (
    <div
      data-od-id="filter-panel"
      className="flex flex-col gap-3"
      role="search"
      aria-label={t('panel_title')}
    >
      {/* Recherche */}
      <MapSearchBar compact />

      {/* Statut */}
      <Field label={t('statut')}>
        <ChipSelect
          value={filters.statut || ''}
          placeholder={t('all_statuses')}
          onValueChange={(val) => setFilters({ statut: val || null })}
          triggerClass={controlClass}
          dataOdId="filter-statut"
          items={[
            { value: '', label: t('all_statuses') },
            ...SIGNALEMENT_STATUTS.map((v) => ({
              value: v,
              label: tStatuts(v),
            })),
          ]}
        />
      </Field>

      {!isCitoyen && (
        <Field label={t('wilaya')}>
          <ChipSelect
            value={filters.wilayaCode || ''}
            placeholder={t('all_wilayas')}
            onValueChange={(val) =>
              setFilters({ wilayaCode: val || null, communeCode: null })
            }
            triggerClass={controlClass}
            dataOdId="filter-wilaya"
            disabled={perimeter.wilayaLocked}
            items={[
              { value: '', label: t('all_wilayas') },
              ...wilayas.map((w) => ({ value: w.value, label: w.label })),
            ]}
          />
        </Field>
      )}

      {!isCitoyen && (
        <Field label={t('commune')}>
          <ChipSelect
            value={filters.communeCode || ''}
            placeholder={t('all_communes')}
            onValueChange={(val) => setFilters({ communeCode: val || null })}
            triggerClass={controlClass}
            dataOdId="filter-commune"
            disabled={!filters.wilayaCode || perimeter.communeLocked}
            items={[
              { value: '', label: t('all_communes') },
              ...communes.map((c) => ({ value: c.value, label: c.label })),
            ]}
          />
        </Field>
      )}

      {!isCitoyen && (
        <Field label={t('secteur')}>
          <Input
            value={filters.secteur || ''}
            onChange={(e) => setFilters({ secteur: e.target.value || null })}
            placeholder={t('secteur')}
            data-od-id="filter-secteur"
            aria-label={t('secteur')}
            className={controlClass}
          />
        </Field>
      )}

      {/* Période : deux dates empilées (fin sous le début) */}
      {!isCitoyen && (
        <div className="flex flex-col gap-2">
          <Field label={t('from_date')}>
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
              className={controlClass}
            />
          </Field>
          <Field label={t('to_date')}>
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
              className={controlClass}
            />
          </Field>
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
        className="h-8 w-full shrink-0 gap-1 text-xs"
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {t('reset')}
      </Button>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
        {label}
      </span>
      {children}
    </label>
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