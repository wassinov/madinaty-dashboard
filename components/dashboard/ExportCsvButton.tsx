'use client'

import { useTranslations } from 'next-intl'
import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { Signalement } from '@/types/database'

type Props = {
  signalements: Signalement[]
  className?: string
}

const CSV_HEADERS = [
  'id',
  'type',
  'statut',
  'description',
  'adresse',
  'latitude',
  'longitude',
  'created_at',
  'updated_at',
] as const

function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) return ''
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

function buildCsv(
  rows: Signalement[],
  labels: { type: (v: string) => string; statut: (v: string) => string }
): string {
  const headerLine = CSV_HEADERS.join(',')
  const bodyLines = rows.map((s) =>
    [
      s.id,
      labels.type(s.type),
      labels.statut(s.statut),
      s.description,
      s.adresse_texte ?? '',
      s.latitude,
      s.longitude,
      s.created_at,
      s.updated_at,
    ]
      .map(escapeCsvCell)
      .join(',')
  )
  return [headerLine, ...bodyLines].join('\r\n')
}

/**
 * Export CSV de la liste de signalements affichée (pas de filtre local :
 * le jeu de données fourni est déjà scopé par le serveur).
 */
export function ExportCsvButton({ signalements, className }: Props) {
  const t = useTranslations('csv')
  const tTypes = useTranslations('types')
  const tStatuts = useTranslations('statuts')

  const handleExport = () => {
    const csv = buildCsv(signalements, {
      type: (v) => tTypes(v),
      statut: (v) => tStatuts(v),
    })
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    const today = new Date().toISOString().slice(0, 10)
    link.download = `signalements_${today}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleExport}
      disabled={signalements.length === 0}
      className={className}
      title={
        signalements.length === 0
          ? t('tooltip_empty')
          : t('tooltip_export', { count: signalements.length })
      }
    >
      <Download className="h-4 w-4" />
      {t('button')}
    </Button>
  )
}