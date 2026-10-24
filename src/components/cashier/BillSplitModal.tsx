import React, { useState, useEffect } from 'react';
import { Tab, PaymentMethod, SplitMode, BillSplit } from '../../types/database.types';
import {
  formatBRL,
  splitBillEqual,
  parseBRLToCents,
  validateCustomSplit,
  calculateRemainingBalance,
} from '../../lib/currency';
import { db } from '../../lib/databaseStore';
import { useAuth } from '../../contexts/AuthContext';
import {
  X,
  Users,
  Divide,
  SlidersHorizontal,
  CheckCircle2,
  Clock,
  CreditCard,
  QrCode,
  Banknote,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

interface BillSplitModalProps {
  tab: Tab;
  isOpen: boolean;
  onClose: () => void;
  onTabUpdated: () => void;
}

export const BillSplitModal: React.FC<BillSplitModalProps> = ({
  tab,
  isOpen,
  onClose,
  onTabUpdated,
}) => {
  const { currentUser } = useAuth();
  const [numPeople, setNumPeople] = useState<number>(2);
  const [mode, setMode] = useState<SplitMode>('equal');
  const [customInputs, setCustomInputs] = useState<Record<number, string>>({});
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const netTotalCents = Math.max(0, tab.total_cents - tab.discount_cents);
  const existingSplit = tab.splits?.[0] || db.getTabById(tab.id)?.splits?.[0];

  // Initialize or synchronize participants
  useEffect(() => {
    if (existingSplit) {
      setNumPeople(existingSplit.num_people);
      setMode(existingSplit.mode);
    } else {
      setNumPeople(2);
      setMode('equal');
    }
  }, [existingSplit, isOpen]);

  if (!isOpen) return null;

  // Real-time calculation for Mode A (Equal)
  const equalCalculatedParts = splitBillEqual(netTotalCents, numPeople);

  // Real-time calculation for Mode B (Custom)
  const customParticipantsList = Array.from({ length: numPeople }, (_, idx) => {
    const rawVal = customInputs[idx + 1] || '';
    const cents = parseBRLToCents(rawVal);
    return {
      participantIndex: idx + 1,
      name: `Pessoa ${idx + 1}`,
      assigned_cents: cents,
    };
  });

  const customValidation = validateCustomSplit(
    netTotalCents,
    customParticipantsList.map((p) => ({ participantIndex: p.participantIndex, assignedCents: p.assigned_cents }))
  );

  // Save / Apply Split
  const handleApplySplit = () => {
    try {
      setErrorMsg(null);
      if (mode === 'equal') {
        db.createBillSplit({
          tab_id: tab.id,
          created_by: currentUser.id,
          mode: 'equal',
          num_people: numPeople,
        });
      } else {
        if (!customValidation.isValid) {
          setErrorMsg(customValidation.message);
          return;
        }
        db.createBillSplit({
          tab_id: tab.id,
          created_by: currentUser.id,
          mode: 'custom',
          num_people: numPeople,
          customParticipants: customParticipantsList,
        });
      }
      setSuccessMsg(`Divisão em ${numPeople} pessoas configurada com sucesso!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      onTabUpdated();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Erro ao aplicar divisão');
    }
  };

  // Open participant payment panel
  const handleSelectParticipantForPayment = (participant: {
    id: string;
    name: string;
    assigned_cents: number;
    paid_cents: number;
  }) => {
    const remaining = participant.assigned_cents - participant.paid_cents;
    setSelectedParticipantId(participant.id);
    setPaymentAmountInput((remaining / 100).toFixed(2));
    setErrorMsg(null);
  };

  // Execute Payment for participant
  const handleConfirmParticipantPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedParticipantId) return;

    const amountCents = parseBRLToCents(paymentAmountInput);
    if (amountCents <= 0) {
      setErrorMsg('Informe um valor de pagamento maior que R$ 0,00');
      return;
    }

    try {
      db.recordPayment({
        tab_id: tab.id,
        amount_cents: amountCents,
        method: paymentMethod,
        recorded_by: currentUser.id,
        split_participant_id: selectedParticipantId,
        notes: paymentNotes || undefined,
      });

      setSuccessMsg('Pagamento registrado com sucesso!');
      setSelectedParticipantId(null);
      setPaymentAmountInput('');
      setPaymentNotes('');
      setTimeout(() => setSuccessMsg(null), 3000);
      onTabUpdated();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Erro ao registrar pagamento');
    }
  };

  const hasAnyPaymentsRegistered = (tab.payments && tab.payments.length > 0) || tab.paid_cents > 0;
  const currentSplit = db.getTabById(tab.id)?.splits?.[0];
  const remainingTabBalance = calculateRemainingBalance(tab.total_cents, tab.discount_cents, tab.paid_cents);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-charcoal-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden my-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-charcoal-850 via-charcoal-900 to-charcoal-850 p-4 sm:p-6 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-ember-600/20 border border-ember-500/40 flex items-center justify-center text-ember-400">
              <Divide className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Dividir Conta da Comanda</h2>
                <span className="px-2 py-0.5 rounded bg-gray-800 text-xs font-semibold text-gray-300">
                  {tab.table ? tab.table.label : 'Comanda Balcão'}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Total a pagar: <strong className="text-ember-400 font-mono text-sm">{formatBRL(netTotalCents)}</strong>
                {' • '}
                Restante:{' '}
                <strong className={`font-mono text-sm ${remainingTabBalance === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {formatBRL(remainingTabBalance)}
                </strong>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Alerts */}
        {errorMsg && (
          <div className="m-4 p-3 rounded-xl bg-red-950/70 border border-red-800/80 text-red-200 text-sm flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="m-4 p-3 rounded-xl bg-emerald-950/70 border border-emerald-800/80 text-emerald-200 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Select Mode and People Count (Locked if payments already started) */}
          <div className="bg-charcoal-850 p-4 sm:p-5 rounded-xl border border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <Users className="w-4 h-4 text-ember-400" />
                  <span>1. Definir Quantidade de Pessoas e Modo de Divisão</span>
                </h3>
                <p className="text-xs text-gray-400">Selecione entre 2 e 10 participantes</p>
              </div>

              {hasAnyPaymentsRegistered && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-amber-950/50 border border-amber-800/70 text-amber-300 text-xs">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pagamentos já iniciados. Estrutura protegida contra alterações silenciosas.</span>
                </div>
              )}
            </div>

            {/* People Buttons (2 to 10) */}
            <div>
              <label className="text-xs font-semibold text-gray-400 block mb-2">Número de Pessoas:</label>
              <div className="grid grid-cols-5 sm:grid-cols-9 gap-2">
                {[2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    disabled={hasAnyPaymentsRegistered}
                    onClick={() => setNumPeople(num)}
                    className={`py-2 px-3 rounded-lg text-sm font-bold transition flex flex-col items-center justify-center ${
                      numPeople === num
                        ? 'bg-ember-600 text-white shadow-lg shadow-ember-600/30 ring-2 ring-ember-400'
                        : 'bg-charcoal-800 text-gray-300 hover:bg-gray-700 border border-gray-700 disabled:opacity-50'
                    }`}
                  >
                    <span>{num}</span>
                    <span className="text-[10px] font-normal opacity-70">pessoas</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Mode Selector */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                disabled={hasAnyPaymentsRegistered}
                onClick={() => setMode('equal')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  mode === 'equal'
                    ? 'bg-ember-950/40 border-ember-500 text-white'
                    : 'bg-charcoal-800 border-gray-700 text-gray-400 hover:text-gray-200 disabled:opacity-50'
                }`}
              >
                <Divide className={`w-5 h-5 mt-0.5 ${mode === 'equal' ? 'text-ember-400' : 'text-gray-500'}`} />
                <div>
                  <p className="text-sm font-bold text-gray-100">MODO A — Dividir Igualmente</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Divisão determinística exata com distribuição de centavos sem sobras ou arredondamento imperfeito.
                  </p>
                </div>
              </button>

              <button
                type="button"
                disabled={hasAnyPaymentsRegistered}
                onClick={() => setMode('custom')}
                className={`p-3.5 rounded-xl border text-left transition flex items-start gap-3 ${
                  mode === 'custom'
                    ? 'bg-ember-950/40 border-ember-500 text-white'
                    : 'bg-charcoal-800 border-gray-700 text-gray-400 hover:text-gray-200 disabled:opacity-50'
                }`}
              >
                <SlidersHorizontal className={`w-5 h-5 mt-0.5 ${mode === 'custom' ? 'text-ember-400' : 'text-gray-500'}`} />
                <div>
                  <p className="text-sm font-bold text-gray-100">MODO B — Valores Personalizados</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Defina quanto cada pessoa consumiu, com validação de 100% de cobertura da conta.
                  </p>
                </div>
              </button>
            </div>

            {/* Mode B: Inputs for each participant */}
            {mode === 'custom' && !currentSplit && (
              <div className="p-4 rounded-xl bg-charcoal-900 border border-gray-700 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-gray-300">Atribuir Valores Individuais (R$):</span>
                  <span
                    className={`font-mono font-bold ${
                      customValidation.remainingCents === 0
                        ? 'text-emerald-400'
                        : customValidation.remainingCents > 0
                        ? 'text-amber-400'
                        : 'text-red-400'
                    }`}
                  >
                    Restante não atribuído: {formatBRL(customValidation.remainingCents)}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {Array.from({ length: numPeople }, (_, i) => {
                    const idx = i + 1;
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-400 w-20">Pessoa {idx}:</span>
                        <div className="relative flex-1">
                          <span className="absolute left-2.5 top-2 text-xs text-gray-500">R$</span>
                          <input
                            type="text"
                            placeholder="0,00"
                            value={customInputs[idx] || ''}
                            onChange={(e) =>
                              setCustomInputs({ ...customInputs, [idx]: e.target.value })
                            }
                            className="w-full pl-8 pr-3 py-1.5 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-ember-500"
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Apply Split Button */}
            {!currentSplit && (
              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  onClick={handleApplySplit}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-ember-600 to-ember-500 hover:from-ember-500 hover:to-ember-400 text-white font-bold text-sm shadow-lg shadow-ember-600/30 flex items-center gap-2 transition"
                >
                  <Divide className="w-4 h-4" />
                  <span>Aplicar Divisão da Conta</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Step 2: Participants List & Payment Registration */}
          <div className="bg-charcoal-850 p-4 sm:p-5 rounded-xl border border-gray-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-gray-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>2. Controle Individual de Pagamentos por Participante</span>
                </h3>
                <p className="text-xs text-gray-400">
                  Registre pagamentos parciais ou totais individualmente com Pix, Dinheiro ou Cartão
                </p>
              </div>
            </div>

            {/* Participants Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(currentSplit ? currentSplit.participants : equalCalculatedParts).map((p) => {
                const assigned = 'assigned_cents' in p ? p.assigned_cents : (p as { assignedCents: number }).assignedCents;
                const paid = 'paid_cents' in p ? p.paid_cents : (p as { paidCents: number }).paidCents;
                const isPaid = p.status === 'paid' || paid >= assigned;
                const isPartial = p.status === 'partial' || (paid > 0 && paid < assigned);
                const remaining = Math.max(0, assigned - paid);

                return (
                  <div
                    key={p.name}
                    className={`p-3.5 rounded-xl border transition ${
                      isPaid
                        ? 'bg-emerald-950/20 border-emerald-800/60'
                        : isPartial
                        ? 'bg-amber-950/20 border-amber-800/60'
                        : 'bg-charcoal-800/80 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm text-white flex items-center gap-1.5">
                        <Users className="w-3.5 h-3.5 text-gray-400" />
                        <span>{p.name}</span>
                      </span>

                      {isPaid ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>PAGO</span>
                        </span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950 text-amber-400 border border-amber-800">
                          <Clock className="w-3 h-3" />
                          <span>PARCIAL</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold bg-gray-800 text-gray-400 border border-gray-700">
                          <span>PENDENTE</span>
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-xs py-1 border-t border-gray-700/60">
                      <span className="text-gray-400">Valor Atribuído:</span>
                      <span className="font-mono font-bold text-gray-200">{formatBRL(assigned)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-t border-gray-700/60">
                      <span className="text-gray-400">Total Pago:</span>
                      <span className="font-mono font-bold text-emerald-400">{formatBRL(paid)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs py-1 border-t border-gray-700/60">
                      <span className="text-gray-400">Saldo Devido:</span>
                      <span className={`font-mono font-bold ${remaining === 0 ? 'text-gray-500' : 'text-amber-400'}`}>
                        {formatBRL(remaining)}
                      </span>
                    </div>

                    {!isPaid && currentSplit && (
                      <div className="mt-3 pt-2 border-t border-gray-700/60">
                        <button
                          type="button"
                          onClick={() =>
                            handleSelectParticipantForPayment({
                              id: (p as { id: string }).id,
                              name: p.name,
                              assigned_cents: assigned,
                              paid_cents: paid,
                            })
                          }
                          className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>Receber de {p.name}</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Individual Payment Execution Form */}
            {selectedParticipantId && (
              <form
                onSubmit={handleConfirmParticipantPayment}
                className="mt-4 p-4 rounded-xl bg-charcoal-900 border-2 border-emerald-500/70 space-y-4 animate-in fade-in"
              >
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Registrar Pagamento de Participante</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setSelectedParticipantId(null)}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Cancelar
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Amount */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Valor do Pagamento (R$):</label>
                    <input
                      type="text"
                      required
                      value={paymentAmountInput}
                      onChange={(e) => setPaymentAmountInput(e.target.value)}
                      placeholder="0,00"
                      className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-white font-mono text-base font-bold focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  {/* Method */}
                  <div>
                    <label className="text-xs font-semibold text-gray-400 block mb-1">Método de Pagamento:</label>
                    <div className="grid grid-cols-2 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('pix')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition ${
                          paymentMethod === 'pix'
                            ? 'bg-cyan-950 text-cyan-300 border-cyan-500'
                            : 'bg-charcoal-800 text-gray-300 border-gray-700'
                        }`}
                      >
                        <QrCode className="w-3.5 h-3.5" />
                        <span>PIX</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('cash')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition ${
                          paymentMethod === 'cash'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-500'
                            : 'bg-charcoal-800 text-gray-300 border-gray-700'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>Dinheiro</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('credit_card')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition ${
                          paymentMethod === 'credit_card'
                            ? 'bg-purple-950 text-purple-300 border-purple-500'
                            : 'bg-charcoal-800 text-gray-300 border-gray-700'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Crédito</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('debit_card')}
                        className={`py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1 border transition ${
                          paymentMethod === 'debit_card'
                            ? 'bg-blue-950 text-blue-300 border-blue-500'
                            : 'bg-charcoal-800 text-gray-300 border-gray-700'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>Débito</span>
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="flex items-end">
                    <button
                      type="submit"
                      className="w-full py-2.5 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 transition"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirmar Recebimento</span>
                    </button>
                  </div>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-charcoal-850 p-4 sm:p-5 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-xs text-gray-400">
            Total Pago:{' '}
            <strong className="text-emerald-400 font-mono text-sm">{formatBRL(tab.paid_cents)}</strong>
            {' • '}
            Saldo Pendente:{' '}
            <strong
              className={`font-mono text-sm ${
                remainingTabBalance === 0 ? 'text-emerald-400' : 'text-amber-400'
              }`}
            >
              {formatBRL(remainingTabBalance)}
            </strong>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-200 font-bold text-sm border border-gray-700 transition"
          >
            Concluir / Fechar Modal
          </button>
        </div>
      </div>
    </div>
  );
};
