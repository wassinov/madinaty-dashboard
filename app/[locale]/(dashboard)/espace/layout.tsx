import { ReactNode } from 'react'
import { AppShell } from '@/components/shared/AppShell'

export default function EspaceLayout({ children }: { children: ReactNode }) {
  return <AppShell variant="citoyen">{children}</AppShell>
}