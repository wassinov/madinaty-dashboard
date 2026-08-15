import { describe, it, expect } from 'vitest'
import { validateRegister } from './registerValidation'

const valid = {
  nomComplet: 'Ahmed Benali',
  email: 'ahmed@example.com',
  telephone: '0550123456',
  password: 'secret123',
  confirmPassword: 'secret123',
}

describe('validateRegister', () => {
  it('valide un formulaire correct', () => {
    expect(validateRegister(valid)).toBeNull()
  })

  it('accepte un téléphone vide', () => {
    expect(validateRegister({ ...valid, telephone: '  ' })).toBeNull()
  })

  it('signale un nom manquant', () => {
    expect(validateRegister({ ...valid, nomComplet: '' })).toBe(
      'validation_name_required'
    )
  })

  it('signale un email manquant', () => {
    expect(validateRegister({ ...valid, email: '' })).toBe(
      'validation_email_required'
    )
  })

  it.each(['ahmed', 'ahmed@', '@example.com', 'ah med@example.com'])(
    'signale un email invalide : %s',
    (email) => {
      expect(validateRegister({ ...valid, email })).toBe(
        'validation_email_invalid'
      )
    }
  )

  it('signale un téléphone invalide', () => {
    expect(validateRegister({ ...valid, telephone: 'abc' })).toBe(
      'validation_phone_invalid'
    )
  })

  it('signale un mot de passe trop court', () => {
    expect(validateRegister({ ...valid, password: '123', confirmPassword: '123' })).toBe(
      'validation_password_min_length'
    )
  })

  it('signale des mots de passe différents', () => {
    expect(validateRegister({ ...valid, confirmPassword: 'other' })).toBe(
      'validation_passwords_mismatch'
    )
  })
})