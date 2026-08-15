'use client'

import { ReactNode } from 'react'
import { ThemeProvider } from '@/lib/context/theme-provider'
import { FilterProvider } from './FilterContext'

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <FilterProvider>{children}</FilterProvider>
    </ThemeProvider>
  )
}