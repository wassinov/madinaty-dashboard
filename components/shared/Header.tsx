'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { ThemeToggle } from '@/components/shared/ThemeToggle'
import { BrandLogo } from '@/components/shared/BrandLogo'
import { wilayas } from '../../src/data/wilayas'
import { getCommuneByCode } from '@/lib/utils/geoHelpers'
import { Menu, ChevronsLeft, ChevronsRight, MapPin, Bell } from 'lucide-react'

type Profile = {
  email: string
  nomComplet: string | null
  role: string
  wilayaCode: string | null
  communeCode: string | null
}

export function Header({
  onToggleNav,
  collapsed = false,
  onToggleCollapse,
}: {
  onToggleNav?: () => void
  /** État de collapse de la sidebar (desktop). */
  collapsed?: boolean
  onToggleCollapse?: () => void
}) {
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('header')
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)

  useEffect(() => {
    let active = true
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !active) {
        if (active) setProfile(null)
        return
      }
      const { data: row } = await supabase
        .from('profils')
        .select('nom_complet, role, wilaya_code, commune_code')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return
      setProfile({
        email: user.email ?? '',
        nomComplet: row?.nom_complet ?? null,
        role: (row?.role as string) ?? 'citoyen',
        wilayaCode: row?.wilaya_code ?? null,
        communeCode: row?.commune_code ?? null,
      })
    })()
    return () => {
      active = false
    }
  }, [supabase])

  // Titre de section courant, déduit du pathname.
  const isEspace = pathname?.startsWith(`/${locale}/espace`)
  const sectionTitle = isEspace ? t('my_reports') : t('welcome')

  // Sélecteur de territoire (lecture seule) : le périmètre est verrouillé
  // par le rôle, on affiche « Commune · Wilaya » dérivé du profil.
  const wilaya = profile?.wilayaCode
    ? wilayas.find((w) => w.code === profile.wilayaCode)
    : null
  const commune = profile?.communeCode
    ? getCommuneByCode(profile.communeCode)
    : null
  const territoryLabel = commune
    ? `${commune.nom} · ${wilaya?.nom ?? ''}`
    : wilaya?.nom ?? null

  return (
    <header
      data-od-id="header"
      className="grid h-16 shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-3 border-b bg-[var(--color-surface)] px-4"
    >
      <div className="flex min-w-0 items-center gap-2">
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={collapsed ? t('expand') : t('collapse')}
            onClick={onToggleCollapse}
            className="hidden lg:inline-flex shrink-0"
          >
            {collapsed ? (
              <ChevronsRight className="h-5 w-5" />
            ) : (
              <ChevronsLeft className="h-5 w-5" />
            )}
          </Button>
        )}
        {onToggleNav && (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t('menu')}
            onClick={onToggleNav}
            className="lg:hidden shrink-0"
          >
            <Menu className="h-5 w-5" />
          </Button>
        )}
        <div className="flex min-w-0 flex-col leading-tight">
          <h1
            data-od-id="page-title"
            className="truncate text-[15px] font-semibold text-[var(--color-fg)]"
          >
            {sectionTitle}
          </h1>
        </div>
      </div>

      <div className="justify-self-center">
        <BrandLogo size="md" />
      </div>

      <div className="flex items-center justify-end gap-2">
        {territoryLabel && (
          <div
            data-od-id="territory-picker"
            className="hidden items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-1.5 text-xs font-medium text-[var(--color-fg)] md:inline-flex"
          >
            <MapPin className="h-3.5 w-3.5 text-[var(--color-accent)]" />
            <span className="max-w-[200px] truncate">{territoryLabel}</span>
          </div>
        )}

        {/* Notifications (icône + point d'alerte) */}
        <Button
          variant="ghost"
          size="icon"
          data-od-id="notifications"
          aria-label={t('notifications')}
          className="relative shrink-0"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute end-1.5 top-1.5 h-2 w-2 rounded-full bg-[var(--st-no)]" />
        </Button>

        {/* Theme toggle */}
        <ThemeToggle />

        {/* Language switcher (icône globe) */}
        <LanguageSwitcher />
      </div>
    </header>
  )
}