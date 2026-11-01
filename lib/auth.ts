export type ValidationResult = { valid: true } | { valid: false; message: string }

export function validateEmail(email: string): ValidationResult {
  if (!email) {
    return { valid: false, message: 'Email is required.' }
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { valid: false, message: 'Please enter a valid email address.' }
  }

  return { valid: true }
}

export function validatePassword(password: string, fieldName = 'Password'): ValidationResult {
  if (!password) {
    return { valid: false, message: `${fieldName} is required.` }
  }

  if (password.length < 6) {
    return { valid: false, message: 'Password must be at least 6 characters.' }
  }

  if (password.length > 128) {
    return { valid: false, message: 'Password must be less than 128 characters.' }
  }

  return { valid: true }
}

export function validateName(name: string): ValidationResult {
  if (!name.trim()) {
    return { valid: false, message: 'Name is required.' }
  }

  if (name.trim().length < 2) {
    return { valid: false, message: 'Name must be at least 2 characters.' }
  }

  if (name.trim().length > 50) {
    return { valid: false, message: 'Name must be less than 50 characters.' }
  }

  return { valid: true }
}
