'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import Link from 'next/link'
import { Megaphone, Lightbulb, X, ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Announcement } from '@/types/database'

type Props = {
  announcements: Announcement[]
  wilayaCode?: string | null
  communeCode?: string | null
  /** Les conseils (tips) ne s'affichent que pour les citoyens (espace). */
  showTips?: boolean
  /** Lien « Voir toutes » (ex: /fr/admin/annonces) ; absent = bouton masqué. */
  seeAllHref?: string
}

const TIP_COUNT = 5
const MARQUEE_MS = 28000

const PRIORITY_STYLES: Record<Announcement['priority'], string> = {
  urgent: 'bc-ann-urgent',
  warning: 'bc-ann-warning',
  info: 'bc-ann-info',
}

const TIP_STYLE = 'bc-ann-tip'

type Item =
  | { kind: 'tip'; text: string }
  | { kind: 'annonce'; announcement: Announcement }

export function AnnouncementBanner({
  announcements,
  wilayaCode,
  communeCode,
  showTips = true,
  seeAllHref,
}: Props) {
  const t = useTranslations('announcements')
  const [items, setItems] = useState<Announcement[]>(announcements)
  const [dismissed, setDismissed] = useState(false)
  const [paused, setPaused] = useState(false)

  const refresh = useCallback(async () => {
    const supabase = createClient()
    const { data } = await supabase.rpc('get_active_announcements', {
      p_wilaya_code: wilayaCode ?? null,
      p_commune_code: communeCode ?? null,
    })
    setItems((data as Announcement[]) ?? [])
  }, [wilayaCode, communeCode])

  // Temps réel : dès qu'une annonce est créée/modifiée/supprimée, on
  // re-fetch les annonces actives du périmètre (filtrage serveur).
  useEffect(() => {
    const supabase = createClient()
    const channel = supabase
      .channel('announcements-live')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'announcements' },
        () => {
          void refresh()
        }
      )
      .subscribe()
    return () => {
      void supabase.removeChannel(channel)
    }
  }, [refresh])

  useEffect(() => {
    try {
      if (sessionStorage.getItem('wla_banners_dismissed') === '1') {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- source persistante externe
        setDismissed(true)
      }
    } catch {
      // sessionStorage peut être indisponible (SSR, navigation privée)
    }
  }, [])

  const sorted = [...items].sort((a, b) => {
    const weight: Record<Announcement['priority'], number> = {
      urgent: 0,
      warning: 1,
      info: 2,
    }
    if (weight[a.priority] !== weight[b.priority])
      return weight[a.priority] - weight[b.priority]
    return b.created_at.localeCompare(a.created_at)
  })

  const bannerItems: Item[] = [
    ...sorted.map((a) => ({ kind: 'annonce' as const, announcement: a })),
    ...(showTips
      ? Array.from({ length: TIP_COUNT }, (_, i) => ({
          kind: 'tip' as const,
          text: t(`tips.items.${i}`),
        }))
      : []),
  ]

  if (dismissed || bannerItems.length === 0) return null

  // Couleur du bandeau : la priorité la plus critique présente.
  const hasUrgent = sorted.some((a) => a.priority === 'urgent')
  const hasWarning = sorted.some((a) => a.priority === 'warning')
  const style = hasUrgent
    ? PRIORITY_STYLES.urgent
    : hasWarning
      ? PRIORITY_STYLES.warning
      : bannerItems.some((i) => i.kind !== 'tip')
        ? PRIORITY_STYLES.info
        : TIP_STYLE

  const dismiss = () => {
    setDismissed(true)
    try {
      sessionStorage.setItem('wla_banners_dismissed', '1')
    } catch {}
  }

  const hasAnnonces = sorted.length > 0
  const track = [...bannerItems, ...bannerItems]

  return (
    <div
      data-od-id="announcements-banner"
      className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm badge-s ${style}`}
      role="region"
      aria-label={t('tips.label')}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white/60 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide">
        {hasAnnonces ? (
          <>
            <Megaphone className="h-3 w-3" />
            {t('label')}
          </>
        ) : (
          <>
            <Lightbulb className="h-3 w-3" />
            {t('tips.label')}
          </>
        )}
      </span>

      <div className="relative min-w-0 flex-1 overflow-hidden">
        <div
          className="marquee-track flex w-max gap-8"
          style={{
            animation: `marquee-scroll ${MARQUEE_MS}ms linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
          }}
        >
          {track.map((item, i) => (
            <span
              key={`${item.kind}-${i}`}
              className="inline-flex shrink-0 items-center gap-2 whitespace-nowrap"
              aria-hidden={i >= bannerItems.length}
            >
              {item.kind === 'tip' ? (
                <span className="truncate">{item.text}</span>
              ) : (
                <>
                  <span className="font-semibold">
                    {item.announcement.title}
                  </span>
                  <span className="opacity-80">
                    — {item.announcement.content}
                  </span>
                </>
              )}
            </span>
          ))}
        </div>
      </div>

      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white/60 px-2.5 py-1 text-xs font-semibold transition-opacity hover:opacity-80"
        >
          {t('see_all')}
          <ArrowRight className="h-3 w-3 rtl:rotate-180" />
        </Link>
      )}

      <button
        type="button"
        onClick={dismiss}
        aria-label={t('close_banner')}
        className="shrink-0 rounded p-1 opacity-70 hover:bg-white/40 hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  )
}