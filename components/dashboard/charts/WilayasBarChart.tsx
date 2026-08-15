'use client'

import { useLocale, useTranslations } from 'next-intl'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'
import { wilayas } from '@/src/data/wilayas'

type Datum = { label: string; count: number }

const wilayaName = (code: string, locale: string) => {
  if (!/^\d{2}$/.test(code)) return code
  const w = wilayas.find((x) => x.code === code)
  if (!w) return code
  return locale === 'ar' ? w.nom_ar : w.nom
}

export function WilayasBarChart({ data }: { data: Datum[] }) {
  const t = useTranslations('charts')
  const locale = useLocale()

  // Tri croissant pour afficher la wilaya la plus touchée en haut.
  const ordered = [...data].sort((a, b) => a.count - b.count).map((d) => ({
    ...d,
    label: wilayaName(d.label, locale),
  }))

  if (ordered.length === 0) {
    return (
      <div className="h-[280px] flex items-center justify-center text-sm text-[var(--color-muted)]">
        {t('no_data')}
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={280}>
      <BarChart
        data={ordered}
        layout="vertical"
        margin={{ top: 10, right: 16, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="label"
          width={120}
          tick={{ fontSize: 11 }}
        />
        <Tooltip formatter={(v: number) => [v, t('bar_tooltip_count')]} />
        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
          {ordered.map((_, i) => (
            <Cell key={i} fill="var(--color-accent)" />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}