import { describe, it, expect } from 'vitest';
import { validateCustomerName, validateBrazilianMobilePhone, formatPhoneMask } from './validators';

describe('Validators', () => {
  describe('validateCustomerName', () => {
    it('rejects keyboard smashing and gibberish names', () => {
      expect(validateCustomerName('Jsjsjs').isValid).toBe(false);
      expect(validateCustomerName('Bdjsjsjs').isValid).toBe(false);
      expect(validateCustomerName('Ssdssd').isValid).toBe(false);
      expect(validateCustomerName('asdfgh').isValid).toBe(false);
      expect(validateCustomerName('aaaaa').isValid).toBe(false);
    });

    it('requires first and last name (at least 2 words)', () => {
      expect(validateCustomerName('Carlos').isValid).toBe(false);
      expect(validateCustomerName('Carlos').error).toContain('Nome e Sobrenome');
      expect(validateCustomerName('Carlos Silva').isValid).toBe(true);
      expect(validateCustomerName('William Santos').isValid).toBe(true);
      expect(validateCustomerName('João da Silva').isValid).toBe(true);
    });

    it('rejects numbers and special symbols', () => {
      expect(validateCustomerName('Carlos 123').isValid).toBe(false);
      expect(validateCustomerName('Carlos @Silva').isValid).toBe(false);
    });
  });

  describe('validateBrazilianMobilePhone', () => {
    it('rejects invalid lengths and fake repetitive numbers', () => {
      expect(validateBrazilianMobilePhone('444444444445555').isValid).toBe(false);
      expect(validateBrazilianMobilePhone('44999999999').isValid).toBe(false);
      expect(validateBrazilianMobilePhone('11999999999').isValid).toBe(false);
      expect(validateBrazilianMobilePhone('00000000000').isValid).toBe(false);
      expect(validateBrazilianMobilePhone('12345').isValid).toBe(false);
    });

    it('rejects invalid DDDs and non-mobile numbers', () => {
      expect(validateBrazilianMobilePhone('00997357463').isValid).toBe(false); // Invalid DDD
      expect(validateBrazilianMobilePhone('4432223344').isValid).toBe(false); // 10 digits landline
      expect(validateBrazilianMobilePhone('44888887777').isValid).toBe(false); // Does not start with 9
    });

    it('accepts valid Brazilian mobile phones', () => {
      expect(validateBrazilianMobilePhone('44997357463').isValid).toBe(true);
      expect(validateBrazilianMobilePhone('(44) 99735-7463').isValid).toBe(true);
      expect(validateBrazilianMobilePhone('11987654321').isValid).toBe(true);
      expect(validateBrazilianMobilePhone('(41) 98877-6655').isValid).toBe(true);
    });
  });

  describe('formatPhoneMask', () => {
    it('formats phone numbers into Brazilian mask', () => {
      expect(formatPhoneMask('44997357463')).toBe('(44) 99735-7463');
      expect(formatPhoneMask('44')).toBe('(44');
      expect(formatPhoneMask('4499735')).toBe('(44) 99735');
    });
  });
});
