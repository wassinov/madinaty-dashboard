import { describe, it, expect, vi, beforeEach } from 'vitest'

// On mock `next/headers` car getUserProfile l'utilise pour lire les
// headers injectés par proxy.ts.
vi.mock('next/headers', () => ({
  headers: vi.fn(),
}))

// Mock global des types UserRole via l'import direct (aucun effet de bord).
import { headers } from 'next/headers'
import type { UserRole } from '@/types/database'
import {
  getUserProfile,
  canAssign,
  canCreateAnnouncement,
  canUpdateStatus,
} from '@/lib/utils/getUserProfile'

describe('getUserProfile', () => {
  beforeEach(() => vi.clearAllMocks())

  it('retourne un UserProfile quand tous les headers sont présents', async () => {
    ;(headers as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) =>
        ({
          'x-user-role': 'direction_ade_commune',
          'x-user-wilaya': '16',
          'x-user-commune': '16001',
          'x-user-secteur': ' Centre',
        }[name] ?? null),
    })

    const profile = await getUserProfile()
    expect(profile).not.toBeNull()
    expect(profile!.role).toBe('direction_ade_commune')
    expect(profile!.wilayaCode).toBe('16')
    expect(profile!.communeCode).toBe('16001')
  })

  it('retourne null si aucun header x-user-role', async () => {
    ;(headers as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: () => null,
    })

    const profile = await getUserProfile()
    expect(profile).toBeNull()
  })

  it('retourne des codes null quand les headers sont vides', async () => {
    ;(headers as ReturnType<typeof vi.fn>).mockResolvedValue({
      get: (name: string) =>
        name === 'x-user-role' ? 'admin' : '',
    })

    const profile = await getUserProfile()
    expect(profile).not.toBeNull()
    expect(profile!.role).toBe('admin')
    expect(profile!.wilayaCode).toBeNull()
    expect(profile!.communeCode).toBeNull()
    expect(profile!.secteurNom).toBeNull()
  })
})

describe('canAssign', () => {
  it.each([
    ['direction_ade_commune', true],
    ['admin', false],
    ['super_admin_wilaya', false],
    ['direction_ade_wilaya', false],
    ['agent_terrain', false],
    ['agent', false],
    ['admin_commune', false],
  ])('role %s -> canAssign = %s', (role, expected) => {
    expect(canAssign(role as UserRole)).toBe(expected)
  })
})

describe('canCreateAnnouncement', () => {
  it.each([
    ['super_admin_wilaya', true],
    ['direction_ade_wilaya', true],
    ['admin', true],
    ['direction_ade_commune', false],
    ['agent_terrain', false],
    ['agent', false],
    ['admin_commune', false],
  ])('role %s -> canCreateAnnouncement = %s', (role, expected) => {
    expect(canCreateAnnouncement(role as UserRole)).toBe(expected)
  })
})

describe('canUpdateStatus', () => {
  it.each([
    ['admin', true],
    ['agent', true],
    ['super_admin_wilaya', true],
    ['admin_commune', true],
    ['direction_ade_wilaya', true],
    ['direction_ade_commune', true],
    ['agent_terrain', true],
  ])('role %s -> canUpdateStatus = true', (role) => {
    expect(canUpdateStatus(role as UserRole)).toBe(true)
  })
})
