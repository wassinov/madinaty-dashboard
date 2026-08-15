import { ReactNode } from 'react'
import { AppShell } from '@/components/shared/AppShell'

export default function AdminLayout({ children }: { children: ReactNode }) {
  return <AppShell variant="admin">{children}</AppShell>
}