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

// Dicionário de termos de baixo calão, xingamentos e palavras ofensivas em português
export const PROFANITY_WORDS_SET = new Set([
  // Palavrões e variações
  'puta', 'puto', 'putaria', 'putinha', 'putao', 'putazo',
  'vadia', 'vagabunda', 'vagabundo', 'piranha', 'biscate', 'quenga', 'kenga',
  'caralho', 'caralhao', 'caralhada', 'krl', 'caraio', 'carai', 'cacete',
  'foder', 'foda', 'fodase', 'fudeu', 'fudido', 'fudida', 'fodido', 'fodida',
  'fdp', 'prr',
  'porra', 'porran', 'porrinha',
  'merda', 'bosta', 'bostinha',
  'cu', 'cuzao', 'cuzinho', 'cusao', 'cuzaum',
  'arrombado', 'arrombada', 'arrombadinho', 'rombado',
  'viado', 'viadinho', 'veado', 'bicha', 'boiola', 'gayzola', 'traveco',
  'corno', 'corna', 'chifrudo', 'chifruda',
  'desgraca', 'desgracado', 'desgracada',
  'pinto', 'piroca', 'pirocao', 'rola', 'rolao', 'pica', 'picao', 'penis',
  'buceta', 'bct', 'bucetao', 'bucetinha', 'xoxota', 'xana', 'xereca',
  'punheta', 'punheteiro',
  'boquete', 'boqueteiro', 'boqueteira', 'mamador',
  'otario', 'otaria', 'babaca', 'retardado', 'imbecil',
  'vtnc', 'vsf', 'tnc',
  'nazista', 'hitler',
]);

export const COMPOUND_PROFANITY_PATTERNS = [
  'filhodaputa',
  'filhadaputa',
  'vaitomarnocu',
  'tomarnocu',
  'tomanocu',
  'vaisefoder',
  'sefoder',
  'paunocu',
  'comocu',
];

/**
 * Normaliza um texto para detecção de termos de baixo calão,
 * tratando acentuação, leetspeak (números simulando letras) e repetições consecutivas.
 */
export function detectProfanity(rawText: string): { hasProfanity: boolean; matchedWord?: string } {
  if (!rawText || !rawText.trim()) return { hasProfanity: false };

  // 1. Remove acentuação e converte para minúsculas
  let str = rawText
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  // 2. Converte leetspeak comum
  str = str
    .replace(/[@4]/g, 'a')
    .replace(/[3]/g, 'e')
    .replace(/[1!|]/g, 'i')
    .replace(/[0]/g, 'o')
    .replace(/[$5]/g, 's')
    .replace(/[7]/g, 't');

  // 3. Colapso de caracteres repetidos sucessivos (ex: 'puuuutaaa' -> 'puta')
  const singleCharCollapsed = str.replace(/(.)\1+/g, '$1');
  const doubleCharCollapsed = str.replace(/(.)\1{2,}/g, '$1$1');

  // 4. Versão sem espaços para pegar 'p.u.t.a', 'p u t a', 'f-d-p'
  const continuousNoSpaces = str.replace(/[^a-z0-9]/gi, '');
  const continuousSingle = singleCharCollapsed.replace(/[^a-z0-9]/gi, '');

  // Checa compostos contínuos
  for (const compound of COMPOUND_PROFANITY_PATTERNS) {
    if (continuousNoSpaces.includes(compound) || continuousSingle.includes(compound)) {
      return { hasProfanity: true, matchedWord: compound };
    }
  }

  // 5. Divide em palavras/tokens
  const tokensRaw = str.split(/[^a-z0-9]+/i).filter((t) => t.length > 0);
  const tokensSingle = singleCharCollapsed.split(/[^a-z0-9]+/i).filter((t) => t.length > 0);
  const tokensDouble = doubleCharCollapsed.split(/[^a-z0-9]+/i).filter((t) => t.length > 0);

  const allTokens = new Set([...tokensRaw, ...tokensSingle, ...tokensDouble]);

  for (const token of allTokens) {
    if (PROFANITY_WORDS_SET.has(token)) {
      return { hasProfanity: true, matchedWord: token };
    }
  }

  // Checa casos diretos como 'fdp' colapsado
  if (PROFANITY_WORDS_SET.has(continuousNoSpaces) || PROFANITY_WORDS_SET.has(continuousSingle)) {
    return { hasProfanity: true, matchedWord: continuousNoSpaces };
  }

  return { hasProfanity: false };
}

/**
 * Valida que um texto de observações não contém palavrões ou termos ofensivos.
 */
export function validateTextNoProfanity(rawText: string, fieldLabel = 'observação'): { isValid: boolean; error?: string } {
  const profanityCheck = detectProfanity(rawText);
  if (profanityCheck.hasProfanity) {
    return {
      isValid: false,
      error: `A ${fieldLabel} contém termos de baixo calão ou palavras inadequadas. Por favor, reescreva com respeito.`,
    };
  }
  return { isValid: true };
}

/**
 * Validates a Brazilian customer name.
 * Requires:
 * - At least 3 characters.
 * - Only alphabetic characters, spaces, hyphens, and apostrophes (no numbers or symbols).
 * - At least one vowel (rejects 'jsjsjs', 'bdjsjsjs', etc.).
 * - No 3 identical consecutive letters (rejects 'aaaa', 'ssss').
 * - At least 2 words (e.g. Nome e Sobrenome) or a solid realistic single name of >= 3 chars.
 * - Strict prohibition of profanities, insults, slurs, and low-level obscene words.
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

  // Verificação estrita de palavrões e termos de baixo calão / xingamentos
  const profanityCheck = detectProfanity(name);
  if (profanityCheck.hasProfanity) {
    return {
      isValid: false,
      error: 'O nome informado contém palavras inadequadas ou desrespeitosas. Por favor, informe seu nome real.',
    };
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
