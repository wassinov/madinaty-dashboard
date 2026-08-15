import { getTranslations } from 'next-intl/server'
import type { Signalement } from '@/types/database'
import { SignalementTable } from '@/components/dashboard/SignalementTable'
import { ExportCsvButton } from '@/components/dashboard/ExportCsvButton'

export async function SignalementsPage({
  signalements,
  mode = 'admin',
}: {
  signalements: Signalement[]
  mode?: 'admin' | 'citoyen'
}) {
  const t = await getTranslations('reports')

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-fg)]">
            {t('page_title')}
          </h1>
          <p className="text-sm text-[var(--color-muted)]">
            {t('page_description')}
          </p>
        </div>
        <ExportCsvButton signalements={signalements} />
      </div>

      <div className="flex-1 min-h-0">
        <SignalementTable
          signalements={signalements}
          readOnly={mode === 'citoyen'}
        />
      </div>
    </div>
  )
}