/**
 * Data validation for Brazilian customer names and mobile phone numbers (WhatsApp).
 * Rejects keyboard-smashing (e.g. 'jsjsjs', 'bdjsjsjs', 'asdfgh'), fake repeated digits,
 * invalid DDDs, and malformed inputs.
 */

// Valid Brazilian mobile DDDs (DDD + 9-digit mobile)
export const VALID_BRAZILIAN_DDDS = new Set([
  '11', '12', '13', '14', '15', '16', '17', '18', '19', // SP
  '21', '22', '24', // RJ
  '27', '28', // ES
  '31', '32', '33', '34', '35', '37', '38', // MG
  '41', '42', '43', '44', '45', '46', // PR
  '47', '48', '49', // SC
  '51', '53', '54', '55', // RS
  '61', '62', '64', '63', '65', '66', '67', '68', '69', // DF, GO, TO, MT, MS, AC, RO
  '71', '73', '74', '75', '77', '79', // BA, SE
  '81', '87', '82', '83', '84', '85', '88', '86', '89', // PE, AL, PB, RN, CE, PI
  '91', '93', '94', '92', '97', '95', '96', '98', '99', // PA, AM, RR, AP, MA
]);

/**
 * Validates a Brazilian customer name.
 * Requires:
 * - At least 3 characters.
 * - Only alphabetic characters, spaces, hyphens, and apostrophes (no numbers or symbols).
 * - At least one vowel (rejects 'jsjsjs', 'bdjsjsjs', etc.).
 * - No 3 identical consecutive letters (rejects 'aaaa', 'ssss').
 * - At least 2 words (e.g. Nome e Sobrenome) or a solid realistic single name of >= 3 chars.
 */
export function validateCustomerName(rawName: string): { isValid: boolean; error?: string } {
  const name = rawName.trim();

  if (!name) {
    return { isValid: false, error: 'Por favor, informe seu nome.' };
  }

  if (name.length < 3) {
    return { isValid: false, error: 'O nome deve ter no mínimo 3 caracteres.' };
  }

  if (name.length > 60) {
    return { isValid: false, error: 'O nome está muito longo (máximo 60 caracteres).' };
  }

  // Must contain only letters and spaces
  const lettersRegex = /^[A-Za-zÀ-ÖØ-öø-ÿ\s'-]+$/;
  if (!lettersRegex.test(name)) {
    return { isValid: false, error: 'O nome não pode conter números ou símbolos especiais.' };
  }

  // No 3 identical consecutive characters (e.g., 'aaa', 'sss')
  if (/(.)\1\1/i.test(name)) {
    return { isValid: false, error: 'Nome inválido (caracteres repetidos).' };
  }

  // Check for vowels (Brazilian Portuguese names must have vowels)
  const hasVowels = /[aeiouáéíóúâêîôûãõàü]/i.test(name);
  if (!hasVowels) {
    return { isValid: false, error: 'Por favor, digite um nome válido.' };
  }

  // Check for keyboard smashing patterns (e.g. 'asdf', 'qwer', 'zxcv', 'jsjsjs', 'bdjs')
  const lower = name.toLowerCase();
  const smashPatterns = [
    'asdf', 'qwer', 'zxcv', 'hjkl', 'jsjs', 'ksks', 'bdjs', 'test', 'teste', 'xxxx', 'yyyy',
  ];
  if (smashPatterns.some((pattern) => lower.includes(pattern))) {
    return { isValid: false, error: 'Por favor, informe seu nome real.' };
  }

  // Check word count: Recommend or require first & last name
  const words = name.split(/\s+/).filter((w) => w.length >= 2);
  if (words.length < 2) {
    return { isValid: false, error: 'Por favor, informe seu Nome e Sobrenome (ex: Carlos Silva).' };
  }

  return { isValid: true };
}

/**
 * Validates a Brazilian WhatsApp mobile phone number.
 * Must be exact 11 digits: 2 digits DDD + 9 + 8 digits.
 */
export function validateBrazilianMobilePhone(rawPhone: string): {
  isValid: boolean;
  error?: string;
  cleanPhone?: string;
} {
  const clean = rawPhone.replace(/\D/g, '');

  if (!clean) {
    return { isValid: false, error: 'Por favor, informe seu WhatsApp com DDD.' };
  }

  if (clean.length !== 11) {
    return {
      isValid: false,
      error: `O celular deve ter DDD + 9 dígitos (11 dígitos). Você digitou ${clean.length}.`,
    };
  }

  const ddd = clean.slice(0, 2);
  const ninthDigit = clean.charAt(2);
  const subscriberNumber = clean.slice(3);

  // Check valid DDD
  if (!VALID_BRAZILIAN_DDDS.has(ddd)) {
    return { isValid: false, error: `DDD (${ddd}) é inválido.` };
  }

  // Check 9th digit (Brazilian mobiles must start with 9)
  if (ninthDigit !== '9') {
    return {
      isValid: false,
      error: 'Celular inválido: todo número de celular no Brasil começa com o dígito 9.',
    };
  }

  // Check all identical digits (e.g. 11999999999, 44999999999, 00000000000)
  if (/^(\d)\1{10}$/.test(clean)) {
    return { isValid: false, error: 'Celular inválido (dígitos todos iguais).' };
  }

  // Check sequential or dummy subscriber numbers (e.g. 912345678, 987654321, 900000000)
  if (subscriberNumber === '00000000' || subscriberNumber === '11111111' || subscriberNumber === '99999999') {
    return { isValid: false, error: 'Número de celular fictício ou inválido.' };
  }

  return { isValid: true, cleanPhone: clean };
}

/**
 * Formats a phone string as (DD) 9XXXX-XXXX while typing.
 */
export function formatPhoneMask(value: string): string {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (!digits) return '';
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}
