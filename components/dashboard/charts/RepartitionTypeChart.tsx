'use client'

import { useTranslations } from 'next-intl'
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'

type Datum = { type: string; count: number }

const TYPE_HEX: Record<string, string> = {
  fuite: '#4c83e8',
  penurie: '#4c83e8',
  qualite_eau: '#4c83e8',
  assainissement: '#0f9b8e',
  dechets: '#c2590c',
  eclairage_public: '#7c5cd1',
}

export function RepartitionTypeChart({ data }: { data: Datum[] }) {
  const t = useTranslations('charts')
  const tTypes = useTranslations('types')
  const pieData = data.map((d) => ({
    name: tTypes(d.type),
    value: d.count,
    color: TYPE_HEX[d.type] ?? '#64748b',
  }))

  if (pieData.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-sm text-[var(--color-muted)]">
        {t('no_data')}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <PieChart>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          outerRadius={90}
          innerRadius={50}
          paddingAngle={2}
        >
          {pieData.map((entry, i) => (
            <Cell key={i} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip formatter={(v: number, n: string) => [v, n]} />
        <Legend verticalAlign="bottom" height={36} />
      </PieChart>
    </ResponsiveContainer>
  )
}