// ============================================================
// Validation du formulaire d'inscription
// Règles alignées sur l'app mobile (wla_app_fresh/register_screen.dart).
// ============================================================

export type RegisterValidationError =
  | "validation_name_required"
  | "validation_email_required"
  | "validation_email_invalid"
  | "validation_phone_invalid"
  | "validation_password_min_length"
  | "validation_passwords_mismatch"
  | null;

export type RegisterForm = {
  nomComplet: string;
  email: string;
  telephone: string;
  password: string;
  confirmPassword: string;
};

export const EMAIL_REGEX = /^[\w.-]+@[\w-]+\.[\w.-]+$/;
export const PHONE_REGEX = /^\+?[0-9\s.-]{8,15}$/;
export const PASSWORD_MIN_LENGTH = 6;

/** Valide le formulaire d'inscription et renvoie la clé de traduction
 *  de la première erreur rencontrée, ou `null` si tout est valide. */
export function validateRegister(form: RegisterForm): RegisterValidationError {
  const { nomComplet, email, telephone, password, confirmPassword } = form;
  if (!nomComplet.trim()) return "validation_name_required";
  if (!email.trim()) return "validation_email_required";
  if (!EMAIL_REGEX.test(email.trim())) return "validation_email_invalid";
  if (telephone.trim() && !PHONE_REGEX.test(telephone.trim()))
    return "validation_phone_invalid";
  if (password.length < PASSWORD_MIN_LENGTH)
    return "validation_password_min_length";
  if (password !== confirmPassword) return "validation_passwords_mismatch";
  return null;
}
