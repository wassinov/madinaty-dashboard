'use client'

import { useState, type ReactNode } from 'react'
import { Signalement } from '@/types/database'
import { MapComponent } from '@/components/dashboard/MapComponent'
import { ReportDetailModal } from '@/components/dashboard/ReportDetailModal'
import { ReportDrawer } from '@/components/dashboard/ReportDrawer'
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
  /** Contenu de stats affiché en surimpression sur le map (composant serveur). */
  statsOverlay?: ReactNode
}) {
  const [liveSignalements, setLiveSignalements] =
    useState<Signalement[]>(signalements)
  const [selected, setSelected] = useState<Signalement | null>(null)
  const [open, setOpen] = useState(false)
  const [listOpen, setListOpen] = useState(false)

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
      <div className="relative h-full flex-1 min-w-0 min-h-[400px]">
        <MapComponent
          signalements={liveSignalements}
          onSelectSignalement={openModal}
        />
        {/* Stats + filtres en surimpression, en haut de la carte : KPIs puis
            barre horizontale de filtres (chips) + ouverture du tiroir liste. */}
        <div className="pointer-events-none absolute inset-x-3 top-3 z-30">
          <div className="pointer-events-auto flex flex-col gap-3 rounded-lg bg-[var(--color-surface)]/85 p-3 shadow-lg backdrop-blur-md">
            {statsOverlay && <div className="min-w-0">{statsOverlay}</div>}
            <FilterChips
              mode={readOnly ? 'citoyen' : 'admin'}
              onToggleList={() => setListOpen((v) => !v)}
              listOpen={listOpen}
            />
          </div>
        </div>

        <ReportDrawer
          open={listOpen}
          onOpenChange={setListOpen}
          signalements={liveSignalements}
          readOnly={readOnly}
        />
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