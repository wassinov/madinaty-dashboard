'use client'

import { useMemo, useState, useTransition } from 'react'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { EvolutionChart } from '@/components/dashboard/charts/EvolutionChart'
import { RepartitionTypeChart } from '@/components/dashboard/charts/RepartitionTypeChart'
import { WilayasBarChart } from '@/components/dashboard/charts/WilayasBarChart'
import { StatutStackedChart } from '@/components/dashboard/charts/StatutStackedChart'
import type { StatsV3 } from '@/types/database'

const TYPES = [
  'fuite',
  'penurie',
  'qualite_eau',
  'assainissement',
  'dechets',
  'eclairage_public',
] as const

const KPI_BARS: Record<string, string> = {
  total: 'kpi-bar-total',
  en_attente: 'kpi-bar-att',
  en_cours: 'kpi-bar-run',
  resolu: 'kpi-bar-ok',
  rejete: 'kpi-bar-no',
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function daysAgoISO(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

export function StatsDashboard({
  initial,
  isGlobal,
}: {
  initial: StatsV3 | null
  isGlobal: boolean
}) {
  const t = useTranslations('stats')
  const tDash = useTranslations('dashboard')
  const tFilters = useTranslations('filters')
  const tCommon = useTranslations('common')
  const tTypes = useTranslations('types')

  const [from, setFrom] = useState(daysAgoISO(29))
  const [to, setTo] = useState(todayISO())
  const [types, setTypes] = useState<string[]>([])
  const [data, setData] = useState<StatsV3 | null>(initial)
  const [isPending, startTransition] = useTransition()

  const showUsers = isGlobal && data !== null

  const toggleType = (type: string) => {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((x) => x !== type) : [...prev, type]
    )
  }

  const refresh = () => {
    startTransition(async () => {
      const supabase = createClient()
      const { data: result, error } = await supabase.rpc('get_stats_v3', {
        p_from: from || null,
        p_to: to || null,
        p_types: types.length > 0 ? types : null,
      })
      if (!error) setData((result as StatsV3 | null) ?? null)
    })
  }

  const kpiItems = useMemo(() => {
    if (!data) return []
    const items: {
      key: string
      value: number | string
      pct: number
      bar: string | null
    }[] = [
      { key: 'total', value: data.total, pct: 100, bar: KPI_BARS.total },
      { key: 'en_attente', value: data.en_attente, pct: 0, bar: KPI_BARS.en_attente },
      { key: 'en_cours', value: data.en_cours, pct: 0, bar: KPI_BARS.en_cours },
      { key: 'resolu', value: data.resolu, pct: 0, bar: KPI_BARS.resolu },
      { key: 'rejete', value: data.rejete, pct: 0, bar: KPI_BARS.rejete },
      {
        key: 'resolution_rate',
        value: `${Math.round(data.resolution_rate)} %`,
        pct: 0,
        bar: null,
      },
      {
        key: 'avg_treatment_hours',
        value: `${Math.round(data.avg_treatment_hours)} h`,
        pct: 0,
        bar: null,
      },
      ...(showUsers
        ? [{ key: 'utilisateurs', value: data.users_total, pct: 0, bar: 'kpi-bar-total' }]
        : []),
    ]
    const div = Math.max(data.total, 1)
    return items.map((it) => ({
      ...it,
      pct: it.bar ? Math.min(100, Math.round((Number(it.value) / div) * 100)) : 0,
    }))
  }, [data, showUsers])

  return (
    <div className="space-y-6">
      {/* Barre de filtres interactifs */}
      <Card data-od-id="stats-filters" className="border-none bg-transparent shadow-none px-0">
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="grid gap-1">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              {tFilters('from_date')}
            </label>
            <Input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className="h-9 w-[9.5rem] text-sm"
              data-od-id="stats-from"
            />
          </div>
          <div className="grid gap-1">
            <label className="text-xs font-medium text-[var(--color-muted)]">
              {tFilters('to_date')}
            </label>
            <Input
              type="date"
              value={to}
              min={from}
              onChange={(e) => setTo(e.target.value)}
              className="h-9 w-[9.5rem] text-sm"
              data-od-id="stats-to"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-[var(--color-muted)]">
              {t('types_label')}
            </span>
            <Button
              type="button"
              size="sm"
              variant={types.length === 0 ? 'default' : 'outline'}
              onClick={() => setTypes([])}
              data-od-id="stats-type-all"
            >
              {tCommon('all')}
            </Button>
            {TYPES.map((type) => {
              const active = types.includes(type)
              return (
                <Button
                  key={type}
                  type="button"
                  size="sm"
                  variant={active ? 'default' : 'outline'}
                  onClick={() => toggleType(type)}
                  data-od-id={`stats-type-${type}`}
                >
                  {tTypes(type)}
                </Button>
              )
            })}
          </div>

          <Button
            type="button"
            onClick={refresh}
            disabled={isPending}
            data-od-id="stats-apply"
          >
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {isPending ? t('loading') : t('apply')}
          </Button>
        </CardContent>
      </Card>

      {/* KPIs */}
      <div
        data-od-id="kpis"
        className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-2"
      >
        {kpiItems.map((item) => (
          <Card
            key={item.key}
            data-od-id={`kpi-${item.key}`}
            className="border-none bg-transparent py-0.5 shadow-none"
          >
            <CardHeader className="pb-0 pt-0.5">
              <CardTitle className="text-[10px] font-medium uppercase leading-tight tracking-wider text-[var(--color-muted)]">
                {tDash(item.key)}
              </CardTitle>
            </CardHeader>
            <CardContent className="py-0">
              <div className="font-display text-lg font-extrabold leading-none tracking-[-0.02em] text-[var(--color-fg)] md:text-xl">
                {item.value}
              </div>
              {item.bar && (
                <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-[var(--color-surface-2)]">
                  <div
                    className={`h-full rounded-full ${item.bar}`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('evolution_title')}</CardTitle>
            <CardDescription>{t('evolution_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {data ? (
              <EvolutionChart data={data.evolution_30j} />
            ) : (
              <EmptyChart label={t('no_data')} />
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>{t('statut_evolution_title')}</CardTitle>
            <CardDescription>{t('statut_evolution_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {data ? (
              <StatutStackedChart data={data.par_statut_30j} />
            ) : (
              <EmptyChart label={t('no_data')} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('repartition_title')}</CardTitle>
            <CardDescription>{t('repartition_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {data ? (
              <RepartitionTypeChart data={data.par_type} />
            ) : (
              <EmptyChart label={t('no_data')} />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('top_wilayas_title')}</CardTitle>
            <CardDescription>{t('top_wilayas_description')}</CardDescription>
          </CardHeader>
          <CardContent>
            {data ? (
              <WilayasBarChart data={data.top_wilayas} />
            ) : (
              <EmptyChart label={t('no_data')} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function EmptyChart({ label }: { label: string }) {
  return (
    <div className="h-[280px] flex items-center justify-center text-sm text-[var(--color-muted)]">
      {label}
    </div>
  )
}