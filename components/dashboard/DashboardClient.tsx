'use client'

import { useState, type ReactNode } from 'react'
import { Signalement } from '@/types/database'
import { MapComponent } from '@/components/dashboard/MapComponent'
import { ReportDetailModal } from '@/components/dashboard/ReportDetailModal'
import { FilterChips } from '@/components/dashboard/FilterChips'
import { useSignalementsRealtime } from '@/hooks/useSignalementsRealtime'

export function DashboardClient({
  signalements,
  readOnly = false,
  ownUserId = null,
  statsOverlay = null,
}: {
  signalements: Signalement[]
  /** Mode lecture seule (espace citoyen) : actions d'administration masquées. */
  readOnly?: boolean
  /** Si renseigné, le Realtime ne retient que les signalements de cet utilisateur. */
  ownUserId?: string | null
  /** Contenu de stats affiché au-dessus de la carte (composant serveur). */
  statsOverlay?: ReactNode
}) {
  const [liveSignalements, setLiveSignalements] =
    useState<Signalement[]>(signalements)
  const [selected, setSelected] = useState<Signalement | null>(null)
  const [open, setOpen] = useState(false)

  useSignalementsRealtime({
    initial: signalements,
    onChange: setLiveSignalements,
    filterUserId: ownUserId,
  })

  const openModal = (s: Signalement) => {
    setSelected(s)
    setOpen(true)
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-3">
        {/* KPIs au-dessus de la carte (hors overlay) */}
        {statsOverlay && <div className="shrink-0">{statsOverlay}</div>}

        {/* Carte + panneau latéral droit de filtres */}
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:flex-row">
          <div className="relative h-[420px] min-w-0 flex-1 lg:h-full">
            <MapComponent
              signalements={liveSignalements}
              onSelectSignalement={openModal}
            />
          </div>

          <aside
            data-od-id="filter-sidebar"
            className="w-full shrink-0 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3 shadow-sm lg:w-48 lg:overflow-y-auto"
          >
            <FilterChips mode={readOnly ? 'citoyen' : 'admin'} />
          </aside>
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