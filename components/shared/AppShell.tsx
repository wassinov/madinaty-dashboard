'use client'

import { useState, type ReactNode } from 'react'
import { Sidebar } from '@/components/shared/Sidebar'
import { Header } from '@/components/shared/Header'

/**
 * Shell applicatif client : gère le collapse de la sidebar (desktop) et le
 * drawer mobile (<lg) sans re-render des pages serveur.
 */
export function AppShell({
  variant = 'admin',
  children,
}: {
  variant?: 'admin' | 'citoyen'
  children: ReactNode
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Desktop : sidebar persistante (collapse inclusive) */}
      <div className="hidden lg:block">
        <Sidebar variant={variant} collapsed={collapsed} />
      </div>

      {/* Mobile : sidebar en tiroir */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}
      <div
        className={`fixed inset-y-0 start-0 z-50 transition-transform duration-300 lg:hidden ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full rtl:translate-x-full'
        }`}
      >
        <Sidebar variant={variant} onNavigate={() => setMobileOpen(false)} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header
          onToggleNav={() => setMobileOpen((v) => !v)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((v) => !v)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}