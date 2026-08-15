'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'
import type { LucideIcon } from 'lucide-react'
import {
  LayoutDashboard,
  BarChart3,
  Megaphone,
  Users,
  MapPinned,
  ClipboardList,
} from 'lucide-react'
import { cn } from '@/lib/utils/formatting'
import { createClient } from '@/lib/supabase/client'

type SidebarVariant = 'admin' | 'citoyen'

type NavItemDef = {
  name: string
  href: string
  icon: LucideIcon
  exact?: boolean
  odId: string
}

type NavGroupDef = {
  label: string
  items: NavItemDef[]
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

export function Sidebar({
  variant = 'admin',
  collapsed = false,
  onNavigate,
}: {
  variant?: SidebarVariant
  /** True = sidebar en mode réduit (64px), uniquement icônes. */
  collapsed?: boolean
  /** Ferme le drawer mobile après navigation. */
  onNavigate?: () => void
}) {
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('sidebar')
  const tHeader = useTranslations('header')
  const [profile, setProfile] = useState<{
    nomComplet: string | null
    email: string
    role: string
  } | null>(null)

  useEffect(() => {
    let active = true
    const supabase = createClient()
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !active) return
      const { data: row } = await supabase
        .from('profils')
        .select('nom_complet, role')
        .eq('id', user.id)
        .maybeSingle()
      if (!active) return
      setProfile({
        nomComplet: row?.nom_complet ?? null,
        email: user.email ?? '',
        role: (row?.role as string) ?? 'citoyen',
      })
    })()
    return () => {
      active = false
    }
  }, [])

  const citoyenNav: NavItemDef[] = [
    {
      name: t('home'),
      href: `/${locale}/espace`,
      icon: LayoutDashboard,
      exact: true,
      odId: 'nav-home',
    },
    {
      name: t('signaler'),
      href: `/${locale}/signaler`,
      icon: MapPinned,
      odId: 'nav-signaler',
    },
    {
      name: t('reports'),
      href: `/${locale}/espace/signalements`,
      icon: ClipboardList,
      odId: 'nav-reports',
    },
  ]

  const adminGroups: NavGroupDef[] = [
    {
      label: t('group_pilotage'),
      items: [
        {
          name: t('home'),
          href: `/${locale}/admin`,
          icon: LayoutDashboard,
          exact: true,
          odId: 'nav-home',
        },
        {
          name: t('reports'),
          href: `/${locale}/admin/signalements`,
          icon: ClipboardList,
          odId: 'nav-signalements',
        },
      ],
    },
    {
      label: t('group_analyse'),
      items: [
        {
          name: t('statistics'),
          href: `/${locale}/admin/statistiques`,
          icon: BarChart3,
          odId: 'nav-statistiques',
        },
      ],
    },
    {
      label: t('group_administration'),
      items: [
        {
          name: t('announcements'),
          href: `/${locale}/admin/annonces`,
          icon: Megaphone,
          odId: 'nav-annonces',
        },
        {
          name: t('users'),
          href: `/${locale}/admin/utilisateurs`,
          icon: Users,
          odId: 'nav-utilisateurs',
        },
      ],
    },
  ]

  const isActive = (href: string, exact?: boolean) =>
    exact
      ? pathname === href
      : pathname === href || pathname?.startsWith(href + '/')

  const initials =
    profile?.nomComplet && profile.nomComplet.trim().length > 0
      ? profile.nomComplet
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((p) => p[0]?.toUpperCase())
          .join('')
      : (profile?.email[0] ?? '?').toUpperCase()

  const roleLabel = tHeader(
    ROLE_LABEL_MAP[profile?.role ?? ''] ?? 'role_citoyen'
  )

  return (
    <aside
      data-od-id="sidebar"
      className={cn(
        'relative flex h-full flex-col border-e border-[var(--color-border)] bg-[var(--color-surface)] transition-all duration-200',
        collapsed ? 'w-16' : 'w-64'
      )}
    >
      <div
        className={cn(
          'flex items-center border-b border-[var(--color-border)]',
          collapsed ? 'justify-center px-0 py-4' : 'gap-2.5 px-4 py-4'
        )}
      >
        <Image
          src="/mansourah-blue.png"
          alt="Mansourah"
          width={32}
          height={32}
          className="h-8 w-8 shrink-0 rounded-md object-cover"
        />
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <span className="font-brand block text-xl text-[var(--color-fg)]">
              {t('wla_brand')}
            </span>
            <span className="block text-[10px] uppercase tracking-wider text-[var(--color-muted)]">
              {t('brand_subtitle')}
            </span>
          </div>
        )}
      </div>

      <nav
        className={cn(
          'flex-1 overflow-y-auto',
          collapsed ? 'p-2' : 'p-3',
          variant === 'admin' && 'space-y-4'
        )}
      >
        {variant === 'citoyen' ? (
          <ul className="space-y-1">
            {citoyenNav.map((item) => (
              <NavItem
                key={item.odId}
                item={item}
                active={isActive(item.href, item.exact)}
                collapsed={collapsed}
                onNavigate={onNavigate}
              />
            ))}
          </ul>
        ) : (
          adminGroups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="px-3 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-[var(--color-muted)]">
                  {group.label}
                </p>
              )}
              <ul className="space-y-1">
                {group.items.map((item) => (
                  <NavItem
                    key={item.odId}
                    item={item}
                    active={isActive(item.href, item.exact)}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                ))}
              </ul>
            </div>
          ))
        )}
      </nav>

      <div
        className={cn(
          'flex items-center gap-2 border-t border-[var(--color-border)] py-3',
          collapsed ? 'justify-center px-2' : 'px-3'
        )}
      >
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-accent)] text-sm font-semibold text-[var(--color-primary-foreground)]">
          {initials}
        </div>
        {!collapsed && (
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-medium text-[var(--color-fg)]">
              {profile?.nomComplet ?? profile?.email}
            </p>
            <p className="truncate text-xs text-[var(--color-muted)]">
              {roleLabel}
            </p>
          </div>
        )}
      </div>
    </aside>
  )
}

function NavItem({
  item,
  active,
  collapsed,
  onNavigate,
}: {
  item: NavItemDef
  active: boolean
  collapsed: boolean
  onNavigate?: () => void
}) {
  return (
    <li>
      <Link
        href={item.href}
        onClick={onNavigate}
        title={collapsed ? item.name : undefined}
        data-od-id={item.odId}
        className={cn(
          'flex items-center rounded-md transition-colors',
          collapsed ? 'justify-center px-0 py-2.5' : 'gap-3 px-3 py-2',
          active
            ? 'bg-[var(--color-accent)]/10 font-medium text-[var(--color-accent)]'
            : 'text-[var(--color-fg)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-accent-strong)]'
        )}
      >
        <item.icon className="h-4 w-4 shrink-0" />
        {!collapsed && item.name}
      </Link>
    </li>
  )
}