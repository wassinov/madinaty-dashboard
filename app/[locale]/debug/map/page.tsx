'use client'

import { FilterProvider } from '@/lib/context/FilterContext'
import { MapComponent } from '@/components/dashboard/MapComponent'
import type { Signalement } from '@/types/database'

const now = new Date().toISOString()

const MOCK: Signalement[] = [
  {
    id: 'm1',
    user_id: 'u1',
    client_id: 'c1',
    type: 'fuite',
    statut: 'en_cours',
    description: 'Fuite devant la mosquée',
    adresse_texte: 'Alger centre',
    latitude: 36.7538,
    longitude: 3.0588,
    photos: [],
    created_at: now,
    updated_at: now,
    commune_code: '16001',
    priorite: 'haute',
  },
  {
    id: 'm2',
    user_id: 'u1',
    client_id: 'c1',
    type: 'dechets',
    statut: 'en_attente',
    description: 'Déchets sur la place',
    adresse_texte: 'Hydra',
    latitude: 36.761,
    longitude: 3.0402,
    photos: [],
    created_at: now,
    updated_at: now,
    commune_code: '16028',
    priorite: 'moyenne',
  },
  {
    id: 'm3',
    user_id: 'u2',
    client_id: 'c1',
    type: 'eclairage_public',
    statut: 'resolu',
    description: 'Lampadaire HS rue Didouche',
    adresse_texte: 'Bab El Oued',
    latitude: 36.79,
    longitude: 3.051,
    photos: [],
    created_at: now,
    updated_at: now,
    commune_code: '16003',
    priorite: 'basse',
  },
  {
    id: 'm4',
    user_id: 'u2',
    client_id: 'c1',
    type: 'penurie',
    statut: 'en_attente',
    description: 'Pénurie dans le quartier',
    adresse_texte: 'Bir Mourad Rais',
    latitude: 36.74,
    longitude: 3.035,
    photos: [],
    created_at: now,
    updated_at: now,
    commune_code: '16024',
    priorite: 'haute',
  },
]

export default function DebugMapPage() {
  return (
    <div className="h-screen w-screen bg-gray-100 p-4">
      <FilterProvider>
        <div className="relative h-full w-full flex-1 min-w-0 min-h-[400px] rounded-lg overflow-hidden">
          <MapComponent signalements={MOCK} />
        </div>
      </FilterProvider>
      <pre
        id="map-diag"
        className="mt-4 rounded bg-black text-green-400 p-3 text-xs whitespace-pre-wrap"
      />
    </div>
  )
}