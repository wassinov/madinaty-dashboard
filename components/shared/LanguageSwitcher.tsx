'use client'

import { useLocale, useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import { Globe } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from '@/components/ui/select'

const LOCALES = [
  { value: 'fr', label: 'french' },
  { value: 'en', label: 'english' },
  { value: 'ar', label: 'arabic' },
]

/** Sélecteur de langue compact : icône globe ouvrant un menu des 3 langues. */
export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const locale = useLocale()
  const t = useTranslations('common')

  const handleLocaleChange = (newLocale: string) => {
    const segments = pathname.split('/')
    segments[1] = newLocale
    router.push(segments.join('/'))
  }

  return (
    <Select value={locale} onValueChange={handleLocaleChange}>
      <SelectTrigger
        data-od-id="language-toggle"
        aria-label={t('language')}
        className="h-9 w-9 shrink-0 justify-center rounded-full border-[var(--color-border)] bg-[var(--color-surface)] px-0 [&>svg:last-of-type]:hidden"
      >
        <Globe className="h-4 w-4" />
      </SelectTrigger>
      <SelectContent>
        {LOCALES.map((l) => (
          <SelectItem key={l.value} value={l.value}>
            {t(l.label)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}