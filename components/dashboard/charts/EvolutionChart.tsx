'use client'

import { useTranslations } from 'next-intl'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

type Datum = { date: string; count: number }

export function EvolutionChart({ data }: { data: Datum[] }) {
  const t = useTranslations('charts')
  const formatted = data.map((d) => ({
    ...d,
    label: d.date.slice(5).replace('-', '/'),
  }))

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart
        data={formatted}
        margin={{ top: 10, right: 16, left: 0, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11 }}
          interval={Math.max(0, Math.floor(formatted.length / 8))}
        />
        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={32} />
        <Tooltip
          labelFormatter={(l) => t('evolution_tooltip_date', { label: l })}
          formatter={(v: number) => [v, t('evolution_tooltip_count')]}
        />
        <Line
          type="monotone"
          dataKey="count"
          stroke="var(--color-accent)"
          strokeWidth={2}
          dot={{ r: 2 }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}