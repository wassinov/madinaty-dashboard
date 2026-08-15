'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import type { Signalement } from '@/types/database'
import { TYPE_META, STATUT_BADGE, PRIORITY_BADGE } from '@/lib/constants'
import { formatDate } from '@/lib/utils/formatting'
import { ReportDetailModal } from '@/components/dashboard/ReportDetailModal'

type Props = {
  signalements: Signalement[]
  /** Mode lecture seule (espace citoyen) : actions d'administration masquées. */
  readOnly?: boolean
}

/** Tableau complet des signalements, trié du plus récent au plus ancien. */
export function SignalementTable({
  signalements,
  readOnly = false,
}: Props) {
  const t = useTranslations('reports')
  const tTypes = useTranslations('types')
  const tStatuts = useTranslations('statuts')
  const tModal = useTranslations('modal')
  const [selected, setSelected] = useState<Signalement | null>(null)
  const [open, setOpen] = useState(false)

  const sorted = [...signalements].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <>
      <div className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-sm">
        <div className="max-h-[70vh] overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10 bg-[var(--color-surface-2)] text-left">
              <tr className="border-b border-[var(--color-border)] text-xs uppercase tracking-wide text-[var(--color-muted)]">
                <th className="px-4 py-3 font-medium">{t('col_type')}</th>
                <th className="px-4 py-3 font-medium">{t('col_statut')}</th>
                <th className="px-4 py-3 font-medium">{t('col_priorite')}</th>
                <th className="px-4 py-3 font-medium">{t('col_date')}</th>
                <th className="px-4 py-3 font-medium">{t('col_adresse')}</th>
                <th className="px-4 py-3 font-medium">{t('col_description')}</th>
              </tr>
            </thead>
            <tbody>
              {sorted.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-10 text-center text-muted-foreground"
                  >
                    {t('empty')}
                  </td>
                </tr>
              ) : (
                sorted.map((s) => (
                  <tr
                    key={s.id}
                    onClick={() => {
                      setSelected(s)
                      setOpen(true)
                    }}
                    className="cursor-pointer border-b border-[var(--color-border)] transition-colors hover:bg-[var(--color-surface-2)]"
                  >
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className="mr-1" aria-hidden>
                        {TYPE_META[s.type]?.emoji ?? '📍'}
                      </span>
                      {tTypes(s.type)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      <span className={`badge-s ${STATUT_BADGE[s.statut] ?? 'bc-st-run'}`}>
                        {tStatuts(s.statut)}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5">
                      {s.priorite ? (
                        <span className={`badge-s ${PRIORITY_BADGE[s.priorite] ?? 'bc-pr-l'}`}>
                          {tModal(s.priorite)}
                        </span>
                      ) : (
                        <span className="text-[var(--color-muted)]">—</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2.5 text-[var(--color-muted)]">
                      {formatDate(s.created_at)}
                    </td>
                    <td className="max-w-[240px] truncate px-4 py-2.5 text-[var(--color-muted)]">
                      {s.adresse_texte || tModal('address_not_specified')}
                    </td>
                    <td className="max-w-[320px] px-4 py-2.5">
                      <span className="line-clamp-2">{s.description}</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <ReportDetailModal
        signalement={selected}
        open={open}
        onOpenChange={setOpen}
        readOnly={readOnly}
      />
    </>
  )
}