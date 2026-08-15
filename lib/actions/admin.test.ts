import { describe, it, expect } from 'vitest'
import {
  assignSignalementSchema,
  addAnnouncementSchema,
  updateSignalementStatusSchema,
  updateAnnouncementSchema,
  toggleAnnouncementSchema,
  deleteAnnouncementSchema,
} from './admin.schemas'

describe('Schemas de validation des Server Actions', () => {
  describe('updateSignalementStatusSchema', () => {
    it('valide un payload correct', () => {
      const result = updateSignalementStatusSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        statut: 'en_cours',
        commentaire: 'Changement de statut',
      })
      expect(result.success).toBe(true)
    })

    it('rejette un UUID invalide', () => {
      const result = updateSignalementStatusSchema.safeParse({
        id: 'not-a-uuid',
        statut: 'en_cours',
      })
      expect(result.success).toBe(false)
    })

    it('rejette un statut inconnu', () => {
      const result = updateSignalementStatusSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        statut: 'en_attente_pro_max',
      })
      expect(result.success).toBe(false)
    })

    it('accepte un commentaire optionnel manquant', () => {
      const result = updateSignalementStatusSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        statut: 'resolu',
      })
      expect(result.success).toBe(true)
    })

    it('rejette un commentaire trop long (>500)', () => {
      const result = updateSignalementStatusSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        statut: 'resolu',
        commentaire: 'x'.repeat(501),
      })
      expect(result.success).toBe(false)
    })
  })

  describe('assignSignalementSchema', () => {
    it('valide deux UUIDs valides', () => {
      const result = assignSignalementSchema.safeParse({
        signalementId: '550e8400-e29b-41d4-a716-446655440000',
        agentId: '600e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(true)
    })

    it('rejette un signalementId invalide', () => {
      const result = assignSignalementSchema.safeParse({
        signalementId: 'abc',
        agentId: '600e8400-e29b-41d4-a716-446655440001',
      })
      expect(result.success).toBe(false)
    })

    it('rejette un agentId invalide', () => {
      const result = assignSignalementSchema.safeParse({
        signalementId: '550e8400-e29b-41d4-a716-446655440000',
        agentId: '',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('addAnnouncementSchema', () => {
    it('valide un payload minimal', () => {
      const result = addAnnouncementSchema.safeParse({
        title: 'Coupure eau',
        content: 'Maintenance prévue demain matin.',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priority).toBe('info')
      }
    })

    it('rejette un titre trop court (<3)', () => {
      const result = addAnnouncementSchema.safeParse({
        title: 'A',
        content: 'Contenu valide.',
      })
      expect(result.success).toBe(false)
    })

    it('rejette un contenu trop court (<5)', () => {
      const result = addAnnouncementSchema.safeParse({
        title: 'Coupure',
        content: 'A B',
      })
      expect(result.success).toBe(false)
    })

    it('rejette une priorité inconnue', () => {
      const result = addAnnouncementSchema.safeParse({
        title: 'Coupure',
        content: 'Contenu valide.',
        priority: 'critical',
      })
      expect(result.success).toBe(false)
    })

    it('accepte les 3 priorités valides', () => {
      for (const p of ['info', 'warning', 'urgent'] as const) {
        const result = addAnnouncementSchema.safeParse({
          title: 'Coupure',
          content: 'Contenu valide.',
          priority: p,
        })
        expect(result.success).toBe(true)
      }
    })
  })

  describe('updateAnnouncementSchema', () => {
    it('valide un payload minimal', () => {
      const result = updateAnnouncementSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Coupure eau',
        content: 'Maintenance prévue demain matin.',
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.priority).toBe('info')
        expect(result.data.isActive).toBe(true)
      }
    })

    it('rejette un UUID invalide', () => {
      const result = updateAnnouncementSchema.safeParse({
        id: 'abc',
        title: 'Coupure eau',
        content: 'Maintenance prévue demain matin.',
      })
      expect(result.success).toBe(false)
    })

    it('rejette un titre trop court', () => {
      const result = updateAnnouncementSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'A',
        content: 'Contenu valide.',
      })
      expect(result.success).toBe(false)
    })

    it('accepte isActive explicite', () => {
      const result = updateAnnouncementSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Coupure eau',
        content: 'Maintenance prévue demain matin.',
        isActive: false,
      })
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.isActive).toBe(false)
      }
    })

    it('accepte expiresAt null', () => {
      const result = updateAnnouncementSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        title: 'Coupure eau',
        content: 'Maintenance prévue demain matin.',
        expiresAt: null,
      })
      expect(result.success).toBe(true)
    })
  })

  describe('toggleAnnouncementSchema', () => {
    it('valide un payload correct', () => {
      const result = toggleAnnouncementSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
        isActive: false,
      })
      expect(result.success).toBe(true)
    })

    it('rejette un UUID invalide', () => {
      const result = toggleAnnouncementSchema.safeParse({
        id: '',
        isActive: true,
      })
      expect(result.success).toBe(false)
    })

    it('rejette un isActive manquant', () => {
      const result = toggleAnnouncementSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(false)
    })
  })

  describe('deleteAnnouncementSchema', () => {
    it('valide un UUID correct', () => {
      const result = deleteAnnouncementSchema.safeParse({
        id: '550e8400-e29b-41d4-a716-446655440000',
      })
      expect(result.success).toBe(true)
    })

    it('rejette un UUID invalide', () => {
      const result = deleteAnnouncementSchema.safeParse({
        id: 'not-a-uuid',
      })
      expect(result.success).toBe(false)
    })
  })
})
