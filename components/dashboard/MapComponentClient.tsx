'use client'

import dynamic from 'next/dynamic'
import { Signalement } from '@/types/database'

const MapComponent = dynamic(
  () => import('@/components/dashboard/MapComponent').then((mod) => mod.MapComponent),
  {
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center bg-[var(--color-surface-2)] rounded-lg text-[var(--color-muted)]">
        Chargement de la carte...
      </div>
    ),
  }
)

export function MapComponentClient({ signalements }: { signalements: Signalement[] }) {
  return <MapComponent signalements={signalements} />
}