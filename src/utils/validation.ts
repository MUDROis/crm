export function isValidEmail(email: string): boolean {
  if (!email) return true // пустое поле не вызывает ошибку
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export function isValidPhone(phone: string): boolean {
  if (!phone) return true
  const cleaned = phone.replace(/[\s()\-]/g, '')
  return /^(\+?7|8)?\d{10}$/.test(cleaned)
}