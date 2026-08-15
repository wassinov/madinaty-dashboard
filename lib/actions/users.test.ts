import { describe, it, expect } from 'vitest'
import { updateProfilSchema } from './users.schemas'
import { assignableRoles } from '../constants/roles'

const UUID = '550e8400-e29b-41d4-a716-446655440000'

describe('updateProfilSchema', () => {
  it('valide un payload minimal (role seul)', () => {
    const result = updateProfilSchema.safeParse({
      id: UUID,
      role: 'agent_terrain',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.wilayaCode).toBeUndefined()
      expect(result.data.communeCode).toBeUndefined()
    }
  })

  it('valide un payload complet avec périmètre', () => {
    const result = updateProfilSchema.safeParse({
      id: UUID,
      role: 'direction_ade_commune',
      wilayaCode: '16',
      communeCode: '1601',
    })
    expect(result.success).toBe(true)
  })

  it('accepte des valeurs null explicites', () => {
    const result = updateProfilSchema.safeParse({
      id: UUID,
      role: 'citoyen',
      wilayaCode: null,
      communeCode: null,
    })
    expect(result.success).toBe(true)
  })

  it('rejette un UUID invalide', () => {
    const result = updateProfilSchema.safeParse({
      id: 'not-a-uuid',
      role: 'admin',
    })
    expect(result.success).toBe(false)
  })

  it('rejette un rôle inconnu', () => {
    const result = updateProfilSchema.safeParse({
      id: UUID,
      role: 'super_admin',
    })
    expect(result.success).toBe(false)
  })

  it('rejette un code wilaya trop long', () => {
    const result = updateProfilSchema.safeParse({
      id: UUID,
      role: 'agent_terrain',
      wilayaCode: '016',
    })
    expect(result.success).toBe(false)
  })

  it('rejette un code commune trop long (>5)', () => {
    const result = updateProfilSchema.safeParse({
      id: UUID,
      role: 'agent_terrain',
      communeCode: '160000',
    })
    expect(result.success).toBe(false)
  })
})

describe('assignableRoles', () => {
  it('admin peut tout attribuer', () => {
    const roles = assignableRoles('admin')
    expect(roles).toContain('admin')
    expect(roles).toContain('super_admin_wilaya')
    expect(roles).toContain('citoyen')
  })

  it('super_admin_wilaya ne peut pas attribuer admin ni super_admin_wilaya', () => {
    const roles = assignableRoles('super_admin_wilaya')
    expect(roles).not.toContain('admin')
    expect(roles).not.toContain('super_admin_wilaya')
    expect(roles).toContain('agent_terrain')
    expect(roles).toContain('direction_ade_wilaya')
  })

  it('direction_ade_wilaya ne peut pas attribuer son propre rôle', () => {
    const roles = assignableRoles('direction_ade_wilaya')
    expect(roles).not.toContain('direction_ade_wilaya')
    expect(roles).not.toContain('admin')
    expect(roles).not.toContain('super_admin_wilaya')
  })

  it('un rôle non gestionnaire ne peut rien attribuer', () => {
    expect(assignableRoles('agent_terrain')).toEqual([])
    expect(assignableRoles('citoyen')).toEqual([])
  })
})
