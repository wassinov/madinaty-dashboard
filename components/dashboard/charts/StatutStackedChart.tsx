'use client'

import { useTranslations } from 'next-intl'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'

type Datum = {
  date: string
  en_attente: number
  en_cours: number
  resolu: number
  rejete: number
}

const STATUT_COLORS: Record<string, string> = {
  en_attente: '#e8a33c',
  en_cours: '#004aad',
  resolu: '#2f9e6e',
  rejete: '#c25450',
}

const SERIES = ['en_attente', 'en_cours', 'resolu', 'rejete'] as const

export function StatutStackedChart({ data }: { data: Datum[] }) {
  const t = useTranslations('charts')
  const tStatuts = useTranslations('statuts')

  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5).replace('-', '/'),
  }))

  if (formatted.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-sm text-[var(--color-muted)]">
        {t('no_data')}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart data={formatted} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          interval={Math.max(0, Math.floor(formatted.length / 8))}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
        <Tooltip
          labelFormatter={(l) => t('evolution_tooltip_date', { label: l })}
        />
        <Legend verticalAlign="bottom" height={36} />
        {SERIES.map((s) => (
          <Bar
            key={s}
            dataKey={s}
            stackId="statut"
            name={tStatuts(s)}
            fill={STATUT_COLORS[s]}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  )
}