'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export type CitizenNotification = {
  id: string
  signalementId: string
  statut: string
  ancienStatut: string
  description: string
  createdAt: string
}

type Props = {
  /** Actif uniquement pour le rôle citoyen (l'espace ne consomme que ses propres signalements). */
  enabled: boolean
  userId: string | null
}

/**
 * Notifications web du citoyen — équivalent web du badge « Mis à jour » mobile.
 *
 * Abonnement Realtime aux UPDATE de la table `signalements` filtrés sur le
 * signalement du citoyen (RLS : le citoyen ne reçoit que ses propres lignes).
 * Une notification n'est émise que lorsqu'il y a un changement de statut réel
 * (en_attente → en_cours → resolu / rejete). Aucune table SQL supplémentaire.
 */
export function useCitizenNotifications({ enabled, userId }: Props) {
  const [notifications, setNotifications] = useState<CitizenNotification[]>([])
  const [unread, setUnread] = useState(0)

  useEffect(() => {
    if (!enabled || !userId) return

    const supabase = createClient()
    const channel = supabase
      .channel('citizen-notifications-live')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'signalements',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const oldRow = payload.old as Record<string, unknown> | undefined
          const newRow = payload.new as Record<string, unknown> | undefined
          const oldStatut = oldRow?.statut
          const newStatut = newRow?.statut
          if (!oldStatut || !newStatut || oldStatut === newStatut) return

          const createdAt = new Date().toISOString()
          setNotifications((prev) =>
            [
              {
                id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                signalementId: (newRow?.['id'] as string) ?? '',
                statut: newStatut as string,
                ancienStatut: oldStatut as string,
                description: (newRow?.['description'] as string) ?? '',
                createdAt,
              },
              ...prev,
            ].slice(0, 20)
          )
          setUnread((u) => u + 1)
        }
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [enabled, userId])

  const markAllRead = () => setUnread(0)

  return { notifications, unread, markAllRead }
}