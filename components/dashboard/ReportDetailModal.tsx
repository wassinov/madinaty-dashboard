'use client'

import { useEffect, useState, useTransition } from 'react'
import Image from 'next/image'
import { useTranslations } from 'next-intl'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { createClient } from '@/lib/supabase/client'
import { AuditEntry, Signalement, UserRole } from '@/types/database'
import {
  ASSIGNABLE_ROLES,
  PRIORITY_EDITABLE_ROLES,
  STATUS_EDITABLE_ROLES,
} from '@/lib/constants/roles'
import { formatDate } from '@/lib/utils/formatting'
import {
  assignSignalement,
  updateSignalementPriorite,
  updateSignalementStatus,
} from '@/lib/actions/admin'
import type { ActionResult } from '@/lib/actions/admin.schemas'

const TYPE_COLORS_HEX: Record<string, string> = {
  fuite: '#4c83e8',
  penurie: '#4c83e8',
  qualite_eau: '#4c83e8',
  assainissement: '#0f9b8e',
  dechets: '#c2590c',
  eclairage_public: '#7c5cd1',
}

const STATUT_BADGE: Record<string, string> = {
  en_attente: 'bc-st-att',
  en_cours: 'bc-st-run',
  resolu: 'bc-st-ok',
  rejete: 'bc-st-no',
}

// Couleur hex des points de la timeline d'audit (identiques clair/sombre).
const STATUT_DOT: Record<string, string> = {
  en_attente: '#f59e0b',
  en_cours: '#00a3c4',
  resolu: '#10b981',
  rejete: '#64748b',
}

type Props = {
  signalement: Signalement | null
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Mode lecture seule (espace citoyen) : actions d'administration masquées. */
  readOnly?: boolean
}

export function ReportDetailModal({
  signalement,
  open,
  onOpenChange,
  readOnly = false,
}: Props) {
  const t = useTranslations('modal')
  const tTypes = useTranslations('types')
  const tStatuts = useTranslations('statuts')
  const supabase = createClient()
  const [commentaire, setCommentaire] = useState('')
  const [photoIndex, setPhotoIndex] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [agents, setAgents] = useState<
    { id: string; name: string | null; email: string | null }[]
  >([])
  const [canAssignRole, setCanAssignRole] = useState(false)
  const [selectedAgentId, setSelectedAgentId] = useState('')
  const [isAssigning, startAssign] = useTransition()
  const [canEditPriority, setCanEditPriority] = useState(false)
  const [canEditStatus, setCanEditStatus] = useState(false)
  const [selectedPriority, setSelectedPriority] = useState<
    'haute' | 'moyenne' | 'basse'
  >('moyenne')
  const [isUpdatingPriority, startUpdatePriority] = useTransition()
  const [audit, setAudit] = useState<AuditEntry[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- réinitialisation à l'ouverture
      setCommentaire('')
      setPhotoIndex(0)
    }
  }, [open, signalement?.id])

  useEffect(() => {
    if (!open || !signalement) return
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- valeur initiale à l'ouverture
    setSelectedAgentId(signalement.assigne_a ?? '')
    setSelectedPriority(signalement.priorite ?? 'moyenne')
    void (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user || !active) return

      const { data: self } = await supabase
        .from('profils')
        .select('role, commune_code')
        .eq('id', user.id)
        .maybeSingle()
      if (!active) return

      const role = (self?.role ?? '') as UserRole
      setCanAssignRole(self ? ASSIGNABLE_ROLES.includes(role) : false)
      setCanEditPriority(PRIORITY_EDITABLE_ROLES.includes(role))
      setCanEditStatus(STATUS_EDITABLE_ROLES.includes(role))

      // Seule la direction ADE communale peut assigner ; la RPC
      // `list_agents_terrain` (SECURITY DEFINER) renvoie les agents de
      // terrain de SA commune, en contournant la RLS de `profils`.
      if (!ASSIGNABLE_ROLES.includes(role)) return
      const { data: agentRows } = await supabase.rpc(
        'list_agents_terrain'
      )
      if (active) {
        setAgents(
          ((agentRows ?? []) as {
            id: string
            nom_complet: string | null
            email: string | null
          }[]).map((a) => ({
            id: a.id,
            name: a.nom_complet,
            email: a.email,
          }))
        )
      }
    })()
    return () => {
      active = false
    }
  }, [open, signalement, supabase])

  // Charge l'historique d'audit (timeline) à l'ouverture de la modale.
  useEffect(() => {
    if (!open || !signalement) return
    // La RPC get_audit_signalement refuse les citoyens ; en lecture seule
    // on masque simplement la section (audit vide, pas de chargement).
    if (readOnly) return
    let active = true
    // eslint-disable-next-line react-hooks/set-state-in-effect -- réinitialisation à l'ouverture
    setAuditLoading(true)
    setAudit([])
    void (async () => {
      const { data } = await supabase.rpc('get_audit_signalement', {
        p_signalement_id: signalement.id,
      })
      if (active) {
        setAudit((data ?? []) as AuditEntry[])
        setAuditLoading(false)
      }
    })()
    return () => {
      active = false
    }
  }, [open, signalement, supabase, readOnly])

  if (!signalement) return null

  const photos = signalement.photos ?? []
  const bgColor = TYPE_COLORS_HEX[signalement.type] ?? '#6b7280'

  const assignedAgent = agents.find((a) => a.id === signalement.assigne_a)
  const assignedLabel = signalement.assigne_a
    ? assignedAgent?.name ??
      assignedAgent?.email ??
      signalement.assigne_a
    : null

  const handleAssign = () => {
    if (!selectedAgentId) return
    startAssign(async () => {
      const result = (await assignSignalement({
        signalementId: signalement.id,
        agentId: selectedAgentId,
      })) as ActionResult
      if (result.success) {
        toast.success(t('assign_success'))
        onOpenChange(false)
      } else {
        toast.error(result.error ?? t('assign_failed'))
      }
    })
  }

  const handleUpdatePriority = () => {
    startUpdatePriority(async () => {
      const result = (await updateSignalementPriorite({
        id: signalement.id,
        priorite: selectedPriority,
      })) as ActionResult
      if (result.success) {
        toast.success(`${t('priority')} : ${t(selectedPriority)}`)
        onOpenChange(false)
      } else {
        toast.error(result.error ?? t('priority_failed'))
      }
    })
  }

  const handleStatus = (statut: 'en_cours' | 'resolu' | 'rejete') => {
    startTransition(async () => {
      const result = (await updateSignalementStatus({
        id: signalement.id,
        statut,
        commentaire: commentaire || undefined,
      })) as ActionResult
      if (result.success) {
        toast.success(`${t('status_updated')} : ${tStatuts(statut)}`)
        onOpenChange(false)
      } else {
        toast.error(result.error ?? t('update_failed'))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span
              className="inline-flex h-3 w-3 rounded-full"
              style={{ backgroundColor: bgColor }}
            />
            {tTypes(signalement.type)}
          </DialogTitle>
          <DialogDescription>
            {t('description')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className={`badge-s ${STATUT_BADGE[signalement.statut] ?? 'bc-st-run'}`}>
              {tStatuts(signalement.statut)}
            </span>
            <span className="text-xs text-[var(--color-muted)]">
              {formatDate(signalement.created_at)}
            </span>
          </div>

          {photos.length > 0 && (
            <div>
              <div className="relative aspect-video w-full overflow-hidden rounded-md bg-[var(--color-surface-2)]">
                <Image
                  src={photos[photoIndex]}
                  alt={`${t('photo_of')} ${photoIndex + 1}`}
                  fill
                  sizes="(max-width: 768px) 100vw, 640px"
                  className="object-cover"
                  unoptimized
                />
              </div>
              {photos.length > 1 && (
                <div className="mt-2 flex gap-2 overflow-x-auto">
                  {photos.map((url, i) => (
                    <button
                      key={url + i}
                      type="button"
                      onClick={() => setPhotoIndex(i)}
                      className={`relative h-14 w-14 shrink-0 overflow-hidden rounded border-2 ${
                        i === photoIndex
                          ? 'border-[var(--color-accent)]'
                          : 'border-transparent'
                      }`}
                    >
                      <Image
                        src={url}
                        alt={`${t('thumbnail_of')} ${i + 1}`}
                        fill
                        sizes="56px"
                        className="object-cover"
                        unoptimized
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div>
            <h4 className="mb-1 text-sm font-medium text-[var(--color-muted)]">
              {t('description_label')}
            </h4>
            <p className="text-sm">{signalement.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <h4 className="mb-1 font-medium text-[var(--color-muted)]">{t('address')}</h4>
              <p>{signalement.adresse_texte || t('address_not_specified')}</p>
            </div>
            <div>
              <h4 className="mb-1 font-medium text-[var(--color-muted)]">
                {t('coordinates')}
              </h4>
              <p>
                {signalement.latitude.toFixed(6)},{' '}
                {signalement.longitude.toFixed(6)}
              </p>
            </div>
          </div>

          {!readOnly && (
            <div>
              <h4 className="mb-1 text-sm font-medium text-[var(--color-muted)]">
                {t('internal_comment')}
              </h4>
              <Textarea
                placeholder={t('internal_comment_placeholder')}
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                rows={2}
              />
            </div>
          )}

          {canAssignRole && (
            <div className="space-y-2 border-t pt-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium text-[var(--color-muted)]">
                  {t('assignTo')}
                </h4>
                {signalement.assigne_a && (
                  <span className="text-xs text-[var(--color-muted)]">
                    {t('assignedTo')}: {assignedLabel}
                  </span>
                )}
              </div>
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
                disabled={isAssigning}
              >
                <SelectTrigger>
                  <SelectValue placeholder={t('selectAgent')} />
                </SelectTrigger>
                <SelectContent>
                  {agents.map((agent) => (
                    <SelectItem key={agent.id} value={agent.id}>
                      {agent.name ?? agent.email ?? agent.id}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="secondary"
                onClick={handleAssign}
                disabled={isAssigning || !selectedAgentId}
              >
                {isAssigning && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('assign')}
              </Button>
            </div>
          )}

          {canEditPriority && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-medium text-[var(--color-muted)]">
                {t('priority')}
              </h4>
              <Select
                value={selectedPriority}
                onValueChange={(val) =>
                  setSelectedPriority(val as 'haute' | 'moyenne' | 'basse')
                }
                disabled={isUpdatingPriority}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="haute">{t('high')}</SelectItem>
                  <SelectItem value="moyenne">{t('medium')}</SelectItem>
                  <SelectItem value="basse">{t('low')}</SelectItem>
                </SelectContent>
              </Select>
              <Button
                type="button"
                variant="secondary"
                onClick={handleUpdatePriority}
                disabled={isUpdatingPriority}
              >
                {isUpdatingPriority && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {t('updatePriority')}
              </Button>
            </div>
          )}

          {!readOnly && canEditStatus && (
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="default"
                onClick={() => handleStatus('en_cours')}
                disabled={isPending || signalement.statut === 'en_cours'}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('action_take')}
              </Button>
              <Button
                type="button"
                variant="default"
                onClick={() => handleStatus('resolu')}
                disabled={isPending || signalement.statut === 'resolu'}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('action_resolve')}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => handleStatus('rejete')}
                disabled={isPending || signalement.statut === 'rejete'}
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {t('action_reject')}
              </Button>
            </div>
          )}

          {/* Historique d'audit (réservé aux gestionnaires) */}
          {!readOnly && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="text-sm font-medium text-[var(--color-muted)]">
                {t('history')}
              </h4>
              {auditLoading ? (
                <div className="flex items-center gap-2 text-sm text-[var(--color-muted)]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t('history_loading')}
                </div>
              ) : audit.length === 0 ? (
                <p className="text-sm text-[var(--color-muted)]">{t('history_empty')}</p>
              ) : (
                <ol className="space-y-3">
                  {audit.map((entry) => (
                    <li key={entry.id} className="flex gap-3">
<span
                        className="mt-1 h-3 w-3 shrink-0 rounded-full"
                        style={{
                          backgroundColor:
                            STATUT_DOT[entry.nouveau_statut] ?? '#64748b',
                        }}
                      />
                      <div className="text-sm">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium">
                            {tStatuts(entry.nouveau_statut)}
                          </span>
                          <span className="text-xs text-[var(--color-muted)]">
                            {formatDate(entry.created_at)}
                          </span>
                        </div>
                        <p className="text-xs text-[var(--color-muted)]">
                          {entry.ancien_statut !== entry.nouveau_statut
                            ? `${tStatuts(entry.ancien_statut)} → `
                            : ''}
                          {entry.user_name ?? entry.user_id ?? t('history_unknown_user')}
                        </p>
                        {entry.commentaire && (
                          <p className="mt-1 rounded bg-[var(--color-surface-2)] px-2 py-1 text-xs">
                            {entry.commentaire}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}