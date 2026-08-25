export const PASSWORD_RULE_MESSAGE =
  'Password must be at least 6 characters long and contain both letters and at least one number (e.g. Pass123)'

export function isStrongPassword(password: string): boolean {
  if (typeof password !== 'string') return false
  const trimmed = password.trim()
  const hasMinLength = trimmed.length >= 6
  const hasLetters = /[a-zA-Z]/.test(trimmed)
  const hasNumbers = /\d/.test(trimmed)
  return hasMinLength && hasLetters && hasNumbers
}

