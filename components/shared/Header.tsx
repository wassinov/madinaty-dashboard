'use client'

import { useEffect, useSyncExternalStore, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import { useTheme } from '@teispace/next-themes'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher'
import { wilayas } from '../../src/data/wilayas'
import { getCommuneByCode } from '@/lib/utils/geoHelpers'
import {
  LogOut,
  Moon,
  Sun,
  User as UserIcon,
  Menu,
  ChevronsLeft,
  ChevronsRight,
  MapPin,
  Bell,
} from 'lucide-react'

type Profile = {
  email: string
  nomComplet: string | null
  role: string
  wilayaCode: string | null
  communeCode: string | null
}

const ROLE_LABEL_MAP: Record<string, string> = {
  admin: 'role_admin',
  agent: 'role_agent',
  super_admin_wilaya: 'role_admin',
  admin_commune: 'role_admin',
  direction_ade_wilaya: 'role_admin',
  direction_ade_commune: 'role_admin',
  agent_terrain: 'role_agent',
}

const ROLE_BADGE_MAP: Record<string, string> = {
  admin: 'bc-st-no',
  agent: 'bc-st-att',
  super_admin_wilaya: 'bc-st-no',
  admin_commune: 'bc-st-no',
  direction_ade_wilaya: 'bc-st-no',
  direction_ade_commune: 'bc-st-no',
  agent_terrain: 'bc-st-att',
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
  const router = useRouter()
  const locale = useLocale()
  const pathname = usePathname()
  const t = useTranslations('header')
  const { resolvedTheme, setTheme } = useTheme()
  const supabase = createClient()
  const [profile, setProfile] = useState<Profile | null>(null)
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

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

  const handleLogout = () => {
    void (async () => {
      await supabase.auth.signOut()
      toast.info(t('logout_success'))
      router.push(`/${locale}/login`)
    })()
  }

  const initials =
    profile?.nomComplet && profile.nomComplet.trim().length > 0
      ? profile.nomComplet
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase())
          .join('')
      : (profile?.email[0] ?? '?').toUpperCase()

  const roleKey = ROLE_LABEL_MAP[profile?.role ?? ''] ?? 'role_citoyen'
  const roleLabel = t(roleKey)
  const roleBadgeClass =
    ROLE_BADGE_MAP[profile?.role ?? ''] ?? 'bc-st-run'

  // Titre de section courant, déduit du pathname.
  const isEspace = pathname?.startsWith(`/${locale}/espace`)
  const sectionTitle = isEspace ? t('my_reports') : t('dashboard_title')

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
      className="flex h-16 shrink-0 items-center justify-between gap-3 border-b bg-[var(--color-surface)] px-4"
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

      <div className="flex items-center gap-2">
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
        <Button
          variant="ghost"
          size="icon"
          data-od-id="theme-toggle"
          aria-label={t('toggle_theme')}
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="shrink-0"
        >
          {mounted && resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4" />
          ) : (
            <Moon className="h-4 w-4" />
          )}
        </Button>

        {/* Language switcher (icône globe) */}
        <LanguageSwitcher />

        {profile && (
          <div className="flex items-center gap-2.5">
            <div className="hidden sm:flex flex-col items-end leading-tight">
              <span className="text-sm font-medium text-[var(--color-fg)]">
                {profile.nomComplet ?? profile.email}
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                {profile.email}
              </span>
            </div>
            <Badge variant="outline" className={`hidden md:inline-flex ${roleBadgeClass}`}>
              {roleLabel}
            </Badge>
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-primary-foreground)]">
              {initials}
            </div>
          </div>
        )}
        {!profile && (
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--color-surface-2)]">
            <UserIcon className="h-4 w-4 text-[var(--color-muted)]" />
          </div>
        )}
        <Button variant="outline" onClick={handleLogout} data-od-id="logout">
          <LogOut className="h-4 w-4" />
          <span className="hidden sm:inline">{t('logout')}</span>
        </Button>
      </div>
    </header>
  )
}