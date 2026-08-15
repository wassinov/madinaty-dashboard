'use client'

import { useState, type ReactNode } from 'react'
import { useTranslations } from 'next-intl'
import { X, FileText } from 'lucide-react'
import type { Signalement } from '@/types/database'
import { TYPE_META, STATUT_BADGE, PRIORITY_BADGE } from '@/lib/constants'
import { formatDate } from '@/lib/utils/formatting'
import { cn } from '@/lib/utils'
import { ReportDetailModal } from '@/components/dashboard/ReportDetailModal'
import { useFilteredSignalements } from '@/lib/hooks/useFilteredSignalements'
import { Button } from '@/components/ui/button'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  signalements: Signalement[]
  /** Mode lecture seule (espace citoyen) : actions d'administration masquées. */
  readOnly?: boolean
}

/**
 * Tiroir coulissant listant les signalements (mêmes colonnes que
 * `/admin/signalements`). Ouvrable depuis l'overlay de la carte ; la liste
 * applique exactement le même filtrage que la carte
 * (`useFilteredSignalements`) pour rester synchrone.
 */
export function ReportDrawer({
  open,
  onOpenChange,
  signalements,
  readOnly = false,
}: Props) {
  const t = useTranslations('reports')
  const tTypes = useTranslations('types')
  const tStatuts = useTranslations('statuts')
  const tModal = useTranslations('modal')
  const tCommon = useTranslations('common')
  const [selected, setSelected] = useState<Signalement | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const filtered = useFilteredSignalements(signalements)
  const sorted = [...filtered].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  )

  return (
    <>
      {/* Backdrop (mobile) */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => onOpenChange(false)}
          aria-hidden
        />
      )}

      {/* Panneau coulissant : plein écran sur mobile, max-w-md en desktop */}
      <aside
        data-od-id="report-list"
        aria-hidden={!open}
        className={cn(
          'fixed inset-y-0 end-0 z-50 flex w-full max-w-md flex-col border-s border-[var(--color-border)] bg-[var(--color-surface)] shadow-2xl transition-transform duration-300',
          open
            ? 'translate-x-0'
            : 'invisible translate-x-full rtl:-translate-x-full'
        )}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[var(--color-border)] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <FileText className="h-4 w-4 shrink-0 text-[var(--color-muted)]" />
            <div className="min-w-0 leading-tight">
              <p className="text-sm font-semibold text-[var(--color-fg)]">
                {t('page_title')}
              </p>
              <p className="text-xs text-[var(--color-muted)]">
                {t('count', { count: sorted.length })}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={tCommon('close')}
            onClick={() => onOpenChange(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-[var(--color-muted)]">
              {t('empty')}
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {sorted.map((s, index) => (
                <li
                  key={s.id}
                  data-od-id={`report-${index + 1}`}
                  onClick={() => {
                    setSelected(s)
                    setModalOpen(true)
                  }}
                  className="cursor-pointer rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 transition-colors hover:bg-[var(--color-surface-2)]"
                >
                  <ReportRow
                    s={s}
                    tTypes={tTypes}
                    tStatuts={tStatuts}
                    tModal={tModal}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>
      </aside>

      <ReportDetailModal
        signalement={selected}
        open={modalOpen}
        onOpenChange={setModalOpen}
        readOnly={readOnly}
      />
    </>
  )
}

function ReportRow({
  s,
  tTypes,
  tStatuts,
  tModal,
}: {
  s: Signalement
  tTypes: (key: string) => string
  tStatuts: (key: string) => string
  tModal: (key: string) => string
}): ReactNode {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-sm font-medium text-[var(--color-fg)]">
          <span className="mr-1" aria-hidden>
            {TYPE_META[s.type]?.emoji ?? '📍'}
          </span>
          {tTypes(s.type)}
        </span>
        <span
          className={`badge-s shrink-0 ${STATUT_BADGE[s.statut] ?? 'bc-st-run'}`}
        >
          {tStatuts(s.statut)}
        </span>
      </div>

      <div className="flex items-center justify-between gap-2">
        {s.priorite ? (
          <span
            className={`badge-s ${PRIORITY_BADGE[s.priorite] ?? 'bc-pr-l'}`}
          >
            {tModal(s.priorite)}
          </span>
        ) : (
          <span className="text-xs text-[var(--color-muted)]">—</span>
        )}
        <span className="text-xs text-[var(--color-muted)]">
          {formatDate(s.created_at)}
        </span>
      </div>

      <p className="truncate text-xs text-[var(--color-muted)]">
        {s.adresse_texte || tModal('address_not_specified')}
      </p>
      <p className="line-clamp-2 text-sm text-[var(--color-fg)]">
        {s.description}
      </p>
    </div>
  )
}