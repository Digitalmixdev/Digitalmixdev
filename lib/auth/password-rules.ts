export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 6 characters'

export function isStrongPassword(password: string): boolean {
  return typeof password === 'string' && password.trim().length >= 6
}

