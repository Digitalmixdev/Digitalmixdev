export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 6 characters and include letters and numbers'

export function isStrongPassword(password: string): boolean {
  return password.length >= 6 && /[A-Za-z]/.test(password) && /\d/.test(password)
}
