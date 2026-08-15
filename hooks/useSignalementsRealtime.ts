'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Signalement } from '@/types/database'

type Props = {
  initial: Signalement[]
  onChange: (signalements: Signalement[]) => void
  /** Si renseigné, seules les mutations portant sur ce user_id sont prises en compte. */
  filterUserId?: string | null
}

/**
 * Abonnement Supabase Realtime à la table `signalements`.
 *
 * Fusionne en direct INSERT / UPDATE / DELETE sur la liste initiale
 * et appelle `onChange` à chaque mutation. Conçu pour un usage client —
 * la liste initiale provient d'un Server Component via RPC.
 */
export function useSignalementsRealtime({
  initial,
  onChange,
  filterUserId,
}: Props) {
  const listRef = useRef<Signalement[]>(initial)

  const belongs = (row: Record<string, unknown>) =>
    !filterUserId || (row['user_id'] as string) === filterUserId

  useEffect(() => {
    listRef.current = initial
    onChange(initial)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initial])

  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('public:signalements-dashboard')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'signalements' },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          if (!belongs(row)) return
          const s = rowToSignalement(row)
          if (!s) return
          listRef.current = [s, ...listRef.current.filter((x) => x.id !== s.id)]
          onChange(listRef.current)
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'signalements' },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          if (!belongs(row)) return
          const s = rowToSignalement(row)
          if (!s) return
          listRef.current = listRef.current.map((x) =>
            x.id === s.id ? { ...x, ...s } : x
          )
          onChange(listRef.current)
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'signalements' },
        (payload) => {
          const old = payload.old as Record<string, unknown>
          if (!belongs(old)) return
          const id = old['id'] as string | undefined
          if (!id) return
          listRef.current = listRef.current.filter((x) => x.id !== id)
          onChange(listRef.current)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
}

/**
 * Convertit une ligne Realtime brute en `Signalement`.
 *
 * Les coordonnées sont lues directement depuis les colonnes
 * `latitude` / `longitude` (double precision) — la colonne PostGIS
 * `geom` n'est plus analysée (WKT).
 */
function rowToSignalement(row: Record<string, unknown>): Signalement | null {
  try {
    const id = row['id'] as string | undefined
    if (!id) return null

    const latitude = Number(row['latitude']) || 0
    const longitude = Number(row['longitude']) || 0

    return {
      id,
      user_id: (row['user_id'] as string) ?? '',
      client_id: (row['client_id'] as string) ?? '',
      type: (row['type'] as Signalement['type']) ?? 'fuite',
      statut: (row['statut'] as Signalement['statut']) ?? 'en_attente',
      description: (row['description'] as string) ?? '',
      adresse_texte: (row['adresse_texte'] as string) ?? undefined,
      latitude,
      longitude,
      photos: (row['photos'] as string[]) ?? [],
      commune_code: (row['commune_code'] as string | null) ?? null,
      priorite: (row['priorite'] as Signalement['priorite']) ?? undefined,
      assigne_a: (row['assigne_a'] as string | null) ?? null,
      retard_heures:
        (row['retard_heures'] as number | null) ?? undefined,
      created_at: (row['created_at'] as string) ?? new Date().toISOString(),
      updated_at: (row['updated_at'] as string) ?? new Date().toISOString(),
    }
  } catch {
    return null
  }
}
