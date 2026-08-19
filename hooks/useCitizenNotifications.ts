'use client'

import { useCallback, useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CitizenNotification = {
  id: string
  signalementId: string
  statut: string
  ancienStatut: string
  description: string
  createdAt: string
  read: boolean
}

type Props = {
  /** Actif uniquement pour le rôle citoyen (l'espace ne consomme que ses propres signalements). */
  enabled: boolean
  userId: string | null
}

/** Nombre max de notifications conservées côté client (et affichées). */
const MAX_NOTIFICATIONS = 20

/**
 * Notifications web du citoyen — équivalent web du badge « Mis à jour » mobile.
 *
 * Alimenté par la table `notifications` (script SQL 26) : un trigger écrit
 * une ligne à chaque changement de statut d'un signalement appartenant au
 * citoyen. Le hook combine :
 *   1. Un fetch initial (persistance : les changements survenus pendant
 *      l'absence du citoyen apparaissent à la prochaine ouverture).
 *   2. Un abonnement Realtime aux INSERT sur `notifications` (direct).
 * La marque « non lu » est persistée via la colonne `lue` (grant UPDATE
 * restreint à cette colonne côté SQL).
 */
export function useCitizenNotifications({ enabled, userId }: Props) {
  const [notifications, setNotifications] = useState<CitizenNotification[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!enabled || !userId) return

    const supabase = createClient()
    let active = true

    // 1. Fetch initial : les notifications persistées (y compris celles
    //    reçues pendant une déconnexion) sont rechargées au montage.
    void (async () => {
      const { data } = await supabase
        .from('notifications')
        .select(
          'id, signalement_id, statut, ancien_statut, description, lue, created_at'
        )
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(MAX_NOTIFICATIONS)
      if (!active || !data) return

      const items: CitizenNotification[] = data.map((row) => ({
        id: row.id as string,
        signalementId: row.signalement_id as string,
        statut: row.statut as string,
        ancienStatut: row.ancien_statut as string,
        description: (row.description as string | null) ?? '',
        createdAt: row.created_at as string,
        read: (row.lue as boolean) ?? false,
      }))
      setNotifications(items)
      setUnread(items.filter((n) => !n.read).length)
    })()

    // 2. Direct : les nouvelles lignes insérées par le trigger arrivent en
    //    temps réel (la RLS SELECT sur `notifications` ne livre au citoyen
    //    que ses propres lignes).
    const channel = supabase
      .channel('citizen-notifications-live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Record<string, unknown>
          const id = row['id'] as string | undefined
          if (!id) return

          const item: CitizenNotification = {
            id,
            signalementId: (row['signalement_id'] as string) ?? '',
            statut: (row['statut'] as string) ?? '',
            ancienStatut: (row['ancien_statut'] as string) ?? '',
            description: (row['description'] as string) ?? '',
            createdAt: (row['created_at'] as string) ?? new Date().toISOString(),
            read: (row['lue'] as boolean) ?? false,
          }

          setNotifications((prev) => {
            if (prev.some((n) => n.id === id)) return prev
            return [item, ...prev].slice(0, MAX_NOTIFICATIONS)
          })
          if (!item.read) setUnread((u) => u + 1)
        }
      )
      .subscribe()

    return () => {
      active = false
      void supabase.removeChannel(channel)
    }
  }, [enabled, userId])

  // Marque tout comme lu localement ET en base (persistance du badge).
  const markAllRead = useCallback(() => {
    const supabase = createClient()
    setNotifications((prev) => {
      const unreadIds = prev.filter((n) => !n.read).map((n) => n.id)
      if (unreadIds.length > 0 && userId) {
        void supabase
          .from('notifications')
          .update({ lue: true })
          .eq('user_id', userId)
          .in('id', unreadIds)
      }
      return prev.map((n) => ({ ...n, read: true }))
    })
    setUnread(0)
  }, [userId])

  return { notifications, unread, markAllRead }
}