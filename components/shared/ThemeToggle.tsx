'use client'

import { useSyncExternalStore } from 'react'
import { useTheme } from '@teispace/next-themes'
import { useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'

/** Bascule clair/sombre (tokens OKLCh de la charte). */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme()
  const t = useTranslations('header')
  // Hydratation : l'icône n'est fiable qu'une fois monté côté client.
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  )

  return (
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
  )
}