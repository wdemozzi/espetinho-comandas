/**
 * Pure integer-cent financial arithmetic library.
 * Guarantees zero floating-point rounding errors and deterministic penny allocation.
 */

export interface SplitResultParticipant {
  participantIndex: number;
  name: string;
  assignedCents: number;
  paidCents: number;
  status: 'pending' | 'partial' | 'paid';
}

/**
 * Formats integer cents into Brazilian Real (BRL) string.
 * Example: 24700 -> "R$ 247,00"
 */
export function formatBRL(cents: number): string {
  const safeCents = Math.round(Number.isFinite(cents) ? cents : 0);
  const reais = safeCents / 100;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(reais);
}

/**
 * Converts user input (e.g., "41,17" or "41.17" or 41.17) to integer cents.
 */
export function parseBRLToCents(value: string | number): number {
  if (typeof value === 'number') {
    return Math.round(value * 100);
  }
  if (!value || typeof value !== 'string') return 0;
  // Remove currency symbols, whitespace, dots, replace comma with dot
  const clean = value.replace(/[R$\s]/g, '').replace(/\./g, '').replace(',', '.');
  const num = parseFloat(clean);
  if (isNaN(num)) return 0;
  return Math.round(num * 100);
}

/**
 * Deterministic equal bill splitting algorithm.
 * Distributes remainder pennies sequentially to the first N participants.
 * Guaranteed: sum(assignedCents) === totalCents
 */
export function splitBillEqual(totalCents: number, numPeople: number): SplitResultParticipant[] {
  if (numPeople < 2 || numPeople > 10) {
    throw new Error('A divisão deve ser entre 2 e 10 pessoas');
  }
  if (totalCents < 0) {
    throw new Error('O valor total não pode ser negativo');
  }

  const baseCents = Math.floor(totalCents / numPeople);
  const remainder = totalCents % numPeople;

  const participants: SplitResultParticipant[] = [];

  for (let i = 0; i < numPeople; i++) {
    const isRemainderReceiver = i < remainder;
    const assignedCents = isRemainderReceiver ? baseCents + 1 : baseCents;

    participants.push({
      participantIndex: i + 1,
      name: `Pessoa ${i + 1}`,
      assignedCents,
      paidCents: 0,
      status: 'pending',
    });
  }

  return participants;
}

/**
 * Validates custom participant allocations.
 */
export function validateCustomSplit(
  totalCents: number,
  participants: { participantIndex: number; assignedCents: number }[]
): {
  isValid: boolean;
  distributedCents: number;
  remainingCents: number;
  message: string;
} {
  const distributedCents = participants.reduce((acc, p) => acc + (p.assignedCents || 0), 0);
  const remainingCents = totalCents - distributedCents;

  if (distributedCents > totalCents) {
    return {
      isValid: false,
      distributedCents,
      remainingCents,
      message: `A soma (${formatBRL(distributedCents)}) ultrapassa o total da conta (${formatBRL(totalCents)})`,
    };
  }

  if (remainingCents > 0) {
    return {
      isValid: false,
      distributedCents,
      remainingCents,
      message: `Ainda resta ${formatBRL(remainingCents)} não distribuído`,
    };
  }

  return {
    isValid: true,
    distributedCents,
    remainingCents: 0,
    message: 'Distribuição válida cobrindo 100% do total',
  };
}

/**
 * Calculates remaining tab balance safely.
 */
export function calculateRemainingBalance(
  totalCents: number,
  discountCents: number = 0,
  paidCents: number = 0
): number {
  const netDue = Math.max(0, totalCents - discountCents);
  return Math.max(0, netDue - paidCents);
}
