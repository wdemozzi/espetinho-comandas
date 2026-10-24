import { describe, it, expect } from 'vitest';
import {
  splitBillEqual,
  formatBRL,
  validateCustomSplit,
  parseBRLToCents,
  calculateRemainingBalance,
} from './currency';

describe('Financial Logic & Integer Cents Bill Splitting', () => {
  it('formats BRL currency correctly', () => {
    expect(formatBRL(24700)).toContain('247,00');
    expect(formatBRL(4117)).toContain('41,17');
    expect(formatBRL(4116)).toContain('41,16');
    expect(formatBRL(0)).toContain('0,00');
  });

  it('parses formatted BRL strings into exact integer cents', () => {
    expect(parseBRLToCents('R$ 247,00')).toBe(24700);
    expect(parseBRLToCents('41,17')).toBe(4117);
    expect(parseBRLToCents('10')).toBe(1000);
    expect(parseBRLToCents(50.25)).toBe(5025);
  });

  it('correctly splits R$ 247,00 (24700 cents) between 6 people with exact penny distribution', () => {
    // Exact example from user specification:
    // Total da conta: R$ 247,00. Quantidade: 6 pessoas.
    // Pessoa 1: R$ 41,17
    // Pessoa 2: R$ 41,17
    // Pessoa 3: R$ 41,17
    // Pessoa 4: R$ 41,17
    // Pessoa 5: R$ 41,16
    // Pessoa 6: R$ 41,16
    // Soma = exatamente 24700 centavos
    const participants = splitBillEqual(24700, 6);

    expect(participants).toHaveLength(6);
    expect(participants[0].assignedCents).toBe(4117);
    expect(participants[1].assignedCents).toBe(4117);
    expect(participants[2].assignedCents).toBe(4117);
    expect(participants[3].assignedCents).toBe(4117);
    expect(participants[4].assignedCents).toBe(4116);
    expect(participants[5].assignedCents).toBe(4116);

    const sum = participants.reduce((acc, p) => acc + p.assignedCents, 0);
    expect(sum).toBe(24700);
  });

  it('guarantees sum(assignedCents) === totalCents for any amount and people count from 2 to 10', () => {
    const testCases = [
      { total: 10000, people: 3 }, // R$ 100 / 3
      { total: 5317, people: 4 },  // R$ 53,17 / 4
      { total: 12589, people: 7 }, // R$ 125,89 / 7
      { total: 99999, people: 10 },// R$ 999,99 / 10
      { total: 1, people: 5 },     // 1 cent / 5
      { total: 0, people: 2 },     // 0 cents
    ];

    for (const { total, people } of testCases) {
      const parts = splitBillEqual(total, people);
      const sum = parts.reduce((acc, p) => acc + p.assignedCents, 0);
      expect(sum).toBe(total);
      // The maximum difference between any two participants should never exceed 1 cent
      const minCents = Math.min(...parts.map(p => p.assignedCents));
      const maxCents = Math.max(...parts.map(p => p.assignedCents));
      expect(maxCents - minCents).toBeLessThanOrEqual(1);
    }
  });

  it('validates custom splits correctly', () => {
    const total = 10000; // R$ 100,00

    // Valid: exact match
    const valid = validateCustomSplit(total, [
      { participantIndex: 1, assignedCents: 6000 },
      { participantIndex: 2, assignedCents: 4000 },
    ]);
    expect(valid.isValid).toBe(true);
    expect(valid.remainingCents).toBe(0);

    // Invalid: exceeds total
    const overflow = validateCustomSplit(total, [
      { participantIndex: 1, assignedCents: 7000 },
      { participantIndex: 2, assignedCents: 4000 },
    ]);
    expect(overflow.isValid).toBe(false);
    expect(overflow.remainingCents).toBe(-1000);

    // Incomplete: remaining unassigned
    const incomplete = validateCustomSplit(total, [
      { participantIndex: 1, assignedCents: 5000 },
      { participantIndex: 2, assignedCents: 3000 },
    ]);
    expect(incomplete.isValid).toBe(false);
    expect(incomplete.remainingCents).toBe(2000);
  });

  it('calculates remaining balance preventing overpayment or negative values', () => {
    expect(calculateRemainingBalance(10000, 1000, 4000)).toBe(5000); // 100 - 10 discount - 40 paid = 50
    expect(calculateRemainingBalance(10000, 0, 10000)).toBe(0);
    expect(calculateRemainingBalance(10000, 0, 12000)).toBe(0); // caps at 0
  });
});
