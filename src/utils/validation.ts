/**
 * Валидация email и телефонов для CRM-системы
 */

/**
 * Проверяет формат email
 * @param email - строка для проверки
 * @returns true если email валиден, false иначе
 */
export function validateEmail(email: string): boolean {
  if (!email || email.trim() === '') return true
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * Проверяет формат телефона
 * Поддерживаемые форматы:
 * - +7XXXXXXXXXX (11 цифр, начинается с +7)
 * - 8XXXXXXXXXX (11 цифр, начинается с 8)
 * - 10-значный номер (только цифры)
 * @param phone - строка для проверки
 * @returns true если телефон валиден, false иначе
 */
export function validatePhone(phone: string): boolean {
  if (!phone || phone.trim() === '') return true
  // Убираем пробелы и дефисы для проверки
  const cleanedPhone = phone.replace(/[\s-]/g, '')
  const phoneRegex = /^\+7\d{10}$|^8\d{10}$|^\d{10}$/
  return phoneRegex.test(cleanedPhone)
}

/**
 * Проверяет контакт (email или телефон)
 * Используется для поля customer_contact, где допустим оба формата
 * @param contact - строка для проверки
 * @returns true если контакт валиден, false иначе
 */
export function validateCustomerContact(contact: string): boolean {
  if (!contact || contact.trim() === '') return true
  return validateEmail(contact) || validatePhone(contact)
}

/**
 * Возвращает сообщение об ошибке для поля
 * @param field - имя поля ('email', 'phone', 'customer_contact')
 * @param value - текущее значение поля
 * @returns сообщение об ошибке или пустая строка если нет ошибки
 */
export function getValidationError(field: 'email' | 'phone' | 'customer_contact', value: string): string {
  if (!value || value.trim() === '') return ''
  
  switch (field) {
    case 'email':
      return 'Некорректный формат email'
    case 'phone':
      return 'Некорректный формат телефона. Используйте +7XXXXXXXXXX, 8XXXXXXXXXX или 10 цифр'
    case 'customer_contact':
      return 'Некорректный формат. Используйте email или телефон'
    default:
      return ''
  }
}
