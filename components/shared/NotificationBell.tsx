'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { TypeGlyph } from '@/components/shared/TypeGlyph'
import { STATUT_COLORS } from '@/lib/constants'
import type { CitizenNotification } from '@/hooks/useCitizenNotifications'

/**
 * Cloche de notifications du citoyen (équivalent web du badge « Mis à jour »
 * mobile) : dropdown des changements de statut reçus en temps réel.
 */
export function NotificationBell({
  notifications,
  unread,
  markAllRead,
}: {
  notifications: CitizenNotification[]
  unread: number
  markAllRead: () => void
}) {
  const t = useTranslations('notifications')
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDocClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [open])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next) markAllRead()
  }

  const reportsHref = `/${locale}/espace/signalements`

  return (
    <div ref={ref} className="relative shrink-0">
      <Button
        variant="ghost"
        size="icon"
        data-od-id="notifications"
        aria-label={t('title')}
        className="relative"
        onClick={toggle}
      >
        <Bell className="h-4 w-4" />
        {unread > 0 && (
          <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--st-no)]" />
        )}
      </Button>

      {open && (
        <div className="absolute end-0 top-full z-50 mt-2 w-80 max-w-[90vw] overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-xl">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-3 py-2">
            <p className="text-sm font-semibold text-[var(--color-fg)]">
              {t('title')}
            </p>
            {unread > 0 && (
              <span className="text-xs text-[var(--color-muted)]">
                {t('unread', { count: unread })}
              </span>
            )}
          </div>

          <ul className="max-h-72 overflow-y-auto">
            {notifications.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-[var(--color-muted)]">
                {t('empty')}
              </li>
            ) : (
              notifications.map((n) => (
                <li
                  key={n.id}
                  className="border-b border-[var(--color-border)] last:border-0"
                >
                  <Link
                    href={reportsHref}
                    onClick={() => setOpen(false)}
                    className="flex items-start gap-2.5 px-3 py-2.5 transition-colors hover:bg-[var(--color-surface-2)]"
                  >
                    <TypeGlyph
                      id="droplet"
                      className="mt-0.5 h-4 w-4 shrink-0"
                      style={{
                        color:
                          STATUT_COLORS[n.statut as keyof typeof STATUT_COLORS] ??
                          '#6b7280',
                      }}
                    />
                    <div className="min-w-0">
                      <p className="text-sm text-[var(--color-fg)]">
                        {t(`statut_${n.statut}`)}
                      </p>
                      <p className="mt-0.5 truncate text-xs text-[var(--color-muted)]">
                        {n.description}
                      </p>
                    </div>
                  </Link>
                </li>
              ))
            )}
          </ul>

          {notifications.length > 0 && (
            <Link
              href={reportsHref}
              onClick={() => setOpen(false)}
              className="block border-t border-[var(--color-border)] px-3 py-2 text-center text-xs font-medium text-[var(--color-accent)] transition-colors hover:bg-[var(--color-surface-2)]"
            >
              {t('view_all')}
            </Link>
          )}
        </div>
      )}
    </div>
  )
}