'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { ArrowLeft } from 'lucide-react'
import { DOMAIN_KEYS, DOMAIN_META } from '@/lib/constants'

type Datum = { type: string; count: number }

// Les 3 sous-types « eau » gardent le même bleu, différenciés par motif :
// fuite = plein, qualité = hachures diagonales, pénurie = pointillés.
const WATER_BASE = '#4c83e8'
const WATER_FILL: Record<string, string> = {
  fuite: WATER_BASE,
  qualite_eau: 'url(#water-hatch)',
  penurie: 'url(#water-dots)',
}

// Définition globale des motifs : référencée par le graphe ET la légende
// (url(#id) fonctionne tant que le déf est présent dans le document).
const WaterPatterns = () => (
  <svg width="0" height="0" aria-hidden focusable="false">
    <defs>
      <pattern
        id="water-hatch"
        patternUnits="userSpaceOnUse"
        width="6"
        height="6"
      >
        <rect width="6" height="6" fill={WATER_BASE} />
        <path
          d="M-1,1 l2,-2 M0,6 l6,-6 M5,7 l2,-2"
          stroke="rgba(255,255,255,0.85)"
          strokeWidth="1.6"
        />
      </pattern>
      <pattern
        id="water-dots"
        patternUnits="userSpaceOnUse"
        width="6"
        height="6"
      >
        <rect width="6" height="6" fill={WATER_BASE} />
        <circle cx="3" cy="3" r="1.1" fill="rgba(255,255,255,0.85)" />
      </pattern>
    </defs>
  </svg>
)

// Échantillon de légende (couleur pleine ou motif).
const Swatch = ({ fill }: { fill: string }) => (
  <svg
    width="12"
    height="12"
    viewBox="0 0 12 12"
    className="shrink-0 rounded-[2px]"
    aria-hidden
  >
    <rect width="12" height="12" fill={fill} />
  </svg>
)

export function RepartitionTypeChart({ data }: { data: Datum[] }) {
  const t = useTranslations('charts')
  const tStats = useTranslations('stats')
  const tTypes = useTranslations('types')
  const tDomains = useTranslations('domains')
  const [drill, setDrill] = useState<string | null>(null)

  // Agrégation par domaine (4 domaines, ordre constant).
  const domains = DOMAIN_KEYS.map((key) => {
    const meta = DOMAIN_META[key]
    const sum = meta.types.reduce(
      (acc, type) => acc + (data.find((d) => d.type === type)?.count ?? 0),
      0
    )
    return {
      key,
      name: tDomains(meta.label),
      value: sum,
      color: meta.color,
    }
  }).filter((d) => d.value > 0)

  // Sous-types « eau » pour le drill-down.
  const eau = data.filter((d) => DOMAIN_META.eau.types.includes(d.type))

  const total = domains.reduce((s, d) => s + d.value, 0)
  const waterTotal = eau.reduce((s, d) => s + d.count, 0)

  if (total === 0) {
    return (
      <div className="flex h-[280px] items-center justify-center text-sm text-[var(--color-muted)]">
        {t('no_data')}
      </div>
    )
  }

  const isDrill = drill !== null
  const pieData = isDrill
    ? eau.map((d) => ({
        name: tTypes(d.type),
        value: d.count,
        fill: WATER_FILL[d.type] ?? WATER_BASE,
      }))
    : domains.map((d) => ({
        name: d.name,
        value: d.value,
        fill: d.color,
        key: d.key,
      }))
  const pieTotal = isDrill ? waterTotal : total

  const renderTooltip = ({
    active,
    payload,
  }: {
    active?: boolean
    payload?: Array<{ name?: string; value?: number }>
  }) => {
    if (!active || !payload?.length) return null
    const { name, value } = payload[0]
    const pct = Math.round(((value ?? 0) / pieTotal) * 100)
    return (
      <div className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs shadow-xl">
        <span className="font-semibold text-[var(--color-fg)]">{name}</span>
        <span className="ms-2 text-[var(--color-muted)]">
          {value} · {pct}%
        </span>
      </div>
    )
  }

  return (
    <div>
      <WaterPatterns />

      {isDrill && (
        <div className="mb-2 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => setDrill(null)}
            className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1 text-xs font-medium text-[var(--color-fg)] transition-colors hover:bg-[var(--color-surface)]"
          >
            <ArrowLeft className="h-3.5 w-3.5 rtl:rotate-180" />
            {t('back')}
          </button>
          <span className="text-xs text-[var(--color-muted)]">
            {tStats('repartition_title')}{' '}
            <span className="mx-1" aria-hidden>
              ›
            </span>
            <b className="font-semibold text-[var(--color-fg)]">
              {tDomains('eau')}
            </b>
          </span>
        </div>
      )}

      <div
        className={`relative h-[230px] ${isDrill ? '' : 'cursor-pointer'}`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={pieData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={52}
              paddingAngle={2}
              isAnimationActive={false}
              onClick={(d) => {
                if (!isDrill && d?.payload?.key === 'eau') setDrill('eau')
              }}
            >
              {pieData.map((entry, i) => (
                <Cell key={i} fill={entry.fill} />
              ))}
            </Pie>
            <Tooltip content={renderTooltip} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-extrabold leading-none tracking-[-0.02em] text-[var(--color-fg)]">
            {pieTotal}
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
            {t('repartition_total')}
          </span>
        </div>
      </div>

      {/* Légende groupée */}
      <div className="mt-3 flex flex-col gap-1.5 text-[13px]">
        {isDrill ? (
          <>
            <div className="flex items-center gap-2">
              <Swatch fill={WATER_BASE} />
              <span className="font-medium text-[var(--color-fg)]">
                {tDomains('eau')}
              </span>
              <span className="ms-auto font-semibold text-[var(--color-fg)]">
                {waterTotal}
              </span>
            </div>
            <div className="ms-[10px] flex flex-col gap-1 border-s border-[var(--color-border)] ps-3 text-xs">
              {eau.map((d) => (
                <div
                  key={d.type}
                  className="flex items-center gap-2 text-[var(--color-muted)]"
                >
                  <Swatch fill={WATER_FILL[d.type] ?? WATER_BASE} />
                  <span>{tTypes(d.type)}</span>
                  <span className="ms-auto font-semibold text-[var(--color-fg)]">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </>
        ) : (
          domains.map((d) => (
            <div key={d.key}>
              <div className="flex items-center gap-2">
                <Swatch fill={d.color} />
                <span className="font-medium text-[var(--color-fg)]">
                  {d.name}
                </span>
                <span className="ms-auto font-semibold text-[var(--color-fg)]">
                  {d.value}
                </span>
              </div>
              {d.key === 'eau' && eau.length > 0 && (
                <div className="ms-[10px] flex flex-col gap-1 border-s border-[var(--color-border)] ps-3 text-xs">
                  {eau.map((e) => (
                    <div
                      key={e.type}
                      className="flex items-center gap-2 text-[var(--color-muted)]"
                    >
                      <Swatch fill={WATER_FILL[e.type] ?? WATER_BASE} />
                      <span>{tTypes(e.type)}</span>
                      <span className="ms-auto font-semibold text-[var(--color-fg)]">
                        {e.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  )
}