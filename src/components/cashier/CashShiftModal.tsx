import React, { useState } from 'react';
import { db } from '../../lib/databaseStore';
import { useAuth } from '../../contexts/AuthContext';
import { formatBRL } from '../../lib/currency';
import { CashMovementType, CashShift } from '../../types/database.types';
import {
  X,
  Lock,
  Unlock,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  Share2,
  Clock,
  Coins,
  Receipt,
  PlusCircle,
  MinusCircle,
} from 'lucide-react';

interface CashShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CashShiftModal: React.FC<CashShiftModalProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useAuth();
  const establishment = db.getEstablishment();
  const currentShift = db.getCurrentCashShift();
  const summary = db.getCashShiftSummary(currentShift?.id);

  // Open Shift Form State
  const [initialCashStr, setInitialCashStr] = useState<string>('100,00');
  const [openNotes, setOpenNotes] = useState<string>('');

  // Movement Form State (Sangria / Suprimento)
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<CashMovementType>('sangria');
  const [movementAmountStr, setMovementAmountStr] = useState<string>('50,00');
  const [movementReason, setMovementReason] = useState<string>('');

  // Close Shift Form State
  const [isClosingConfirmOpen, setIsClosingConfirmOpen] = useState(false);
  const [actualCashStr, setActualCashStr] = useState<string>('');
  const [closeNotes, setCloseNotes] = useState<string>('');

  const [feedbackError, setFeedbackError] = useState<string | null>(null);
  const [feedbackSuccess, setFeedbackSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  // Helper parsing "100,00" -> 10000 cents
  const parseCurrencyInput = (val: string): number => {
    const clean = val.replace(/[^\d]/g, '');
    return parseInt(clean, 10) || 0;
  };

  // 1. Abrir Caixa
  const handleOpenShift = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setFeedbackError(null);
      const initialCents = parseCurrencyInput(initialCashStr);
      if (initialCents < 0) {
        setFeedbackError('Informe um valor válido para o fundo de troco.');
        return;
      }
      db.openCashShift({
        initial_cash_cents: initialCents,
        opened_by_user_id: currentUser.id,
        opened_by_name: currentUser.full_name,
        notes: openNotes || undefined,
      });
      setFeedbackSuccess('Caixa aberto com sucesso! Bom turno de vendas.');
    } catch (err: unknown) {
      setFeedbackError((err as Error).message || 'Erro ao abrir caixa');
    }
  };

  // 2. Registrar Sangria ou Suprimento
  const handleAddMovement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    try {
      setFeedbackError(null);
      const amountCents = parseCurrencyInput(movementAmountStr);
      if (amountCents <= 0) {
        setFeedbackError('O valor deve ser maior que zero.');
        return;
      }
      if (!movementReason.trim()) {
        setFeedbackError('Por favor informe o motivo da movimentação (ex: Pagamento de Gelo, Troco).');
        return;
      }

      db.addCashMovement({
        shift_id: currentShift.id,
        type: movementType,
        amount_cents: amountCents,
        reason: movementReason.trim(),
        created_by_name: currentUser.full_name,
      });

      setFeedbackSuccess(
        movementType === 'sangria'
          ? `Sangria de ${formatBRL(amountCents)} registrada.`
          : `Suprimento de ${formatBRL(amountCents)} registrado.`
      );
      setIsMovementModalOpen(false);
      setMovementReason('');
    } catch (err: unknown) {
      setFeedbackError((err as Error).message || 'Erro ao registrar movimentação');
    }
  };

  // 3. Encerrar Caixa
  const handleCloseShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentShift) return;
    try {
      setFeedbackError(null);
      const actualCents = actualCashStr ? parseCurrencyInput(actualCashStr) : summary.expected_cash_cents;
      const closed = db.closeCashShift({
        shift_id: currentShift.id,
        closed_by_user_id: currentUser.id,
        closed_by_name: currentUser.full_name,
        actual_cash_cents: actualCents,
        notes: closeNotes || undefined,
      });

      setFeedbackSuccess(`Caixa encerrado com sucesso.`);
      setIsClosingConfirmOpen(false);
    } catch (err: unknown) {
      setFeedbackError((err as Error).message || 'Erro ao fechar caixa');
    }
  };

  // 4. Enviar Relatório de Fechamento no WhatsApp do Dono
  const handleSendWhatsAppReport = () => {
    if (!currentShift) return;
    const nowStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const dateStr = new Date().toLocaleDateString('pt-BR');

    let text = `📊 *FECHAMENTO DE CAIXA - ${establishment.name.toUpperCase()}*\n`;
    text += `📅 *Data:* ${dateStr} às ${nowStr}\n`;
    text += `👤 *Operador:* ${currentUser.full_name}\n`;
    text += `--------------------------------\n`;
    text += `💵 *Fundo de Troco Inicial:* ${formatBRL(summary.initial_cash_cents)}\n`;
    text += `💰 *Vendas em Dinheiro:* ${formatBRL(summary.total_cash_sales_cents)}\n`;
    text += `⚡ *Vendas em PIX:* ${formatBRL(summary.total_pix_sales_cents)}\n`;
    text += `💳 *Vendas em Cartão:* ${formatBRL(summary.total_card_sales_cents)}\n`;
    text += `--------------------------------\n`;
    text += `🔥 *TOTAL VENDIDO NO TURNO:* ${formatBRL(summary.total_sales_cents)}\n`;
    text += `--------------------------------\n`;
    if (summary.total_sangrias_cents > 0) {
      text += `🔻 *Sangrias / Retiradas:* -${formatBRL(summary.total_sangrias_cents)}\n`;
    }
    if (summary.total_suprimentos_cents > 0) {
      text += `🔺 *Suprimentos de Troco:* +${formatBRL(summary.total_suprimentos_cents)}\n`;
    }
    text += `📥 *Dinheiro Esperado na Gaveta:* ${formatBRL(summary.expected_cash_cents)}\n`;
    if (currentShift.status === 'closed' && typeof currentShift.actual_cash_cents === 'number') {
      text += `💵 *Dinheiro Contado:* ${formatBRL(currentShift.actual_cash_cents)}\n`;
      const diff = currentShift.difference_cents || 0;
      if (diff === 0) text += `✅ *Gaveta Conferida:* 100% batendo certinho!\n`;
      else if (diff > 0) text += `⚠️ *Sobra na Gaveta:* +${formatBRL(diff)}\n`;
      else text += `❌ *Falta na Gaveta:* -${formatBRL(Math.abs(diff))}\n`;
    }
    text += `--------------------------------\n`;
    text += `Sistema CT Conveniência 🍻`;

    const cleanPhone = establishment.phone?.replace(/\D/g, '') || '44997357463';
    const url = `https://wa.me/55${cleanPhone}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-charcoal-900 border border-gray-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-charcoal-850 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ember-600/20 border border-ember-500/40 flex items-center justify-center text-ember-400">
              {currentShift ? <Unlock className="w-5 h-5 text-emerald-400" /> : <Lock className="w-5 h-5 text-amber-400" />}
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Controle de Caixa & Gaveta</span>
                {currentShift ? (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-950 border border-emerald-600 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Aberto
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 text-[11px] font-bold">
                    Fechado
                  </span>
                )}
              </h3>
              <p className="text-xs text-gray-400">
                {currentShift
                  ? `Iniciado por ${currentShift.opened_by_name} às ${new Date(currentShift.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                  : 'Abra o turno do dia para controlar o dinheiro e fechamento de vendas'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-charcoal-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {feedbackError && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/80 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{feedbackError}</span>
            </div>
          )}
          {feedbackSuccess && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{feedbackSuccess}</span>
            </div>
          )}

          {/* CASO 1: CAIXA FECHADO -> FORMULÁRIO DE ABERTURA */}
          {!currentShift ? (
            <form onSubmit={handleOpenShift} className="space-y-4">
              <div className="p-4 rounded-xl bg-charcoal-850 border border-gray-800 text-xs text-gray-300 space-y-2">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-ember-400" />
                  Abrir Caixa para o Turno de Hoje:
                </span>
                <p className="text-gray-400">
                  Informe com quanto dinheiro em notas e moedas você está iniciando a gaveta (Fundo de Troco). O sistema acompanhará todas as entradas, sangrias e calculará o saldo esperado no encerramento.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Fundo de Troco Inicial na Gaveta (R$):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold text-sm">R$</span>
                  <input
                    type="text"
                    required
                    value={initialCashStr}
                    onChange={(e) => setInitialCashStr(e.target.value)}
                    placeholder="100,00"
                    className="w-full pl-10 pr-4 py-2.5 bg-charcoal-800 border border-gray-700 rounded-xl text-white font-mono font-bold text-base focus:outline-none focus:border-ember-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-1.5">
                  Observações iniciais (opcional):
                </label>
                <input
                  type="text"
                  value={openNotes}
                  onChange={(e) => setOpenNotes(e.target.value)}
                  placeholder="Ex: Turno da Noite, troco em notas de R$ 10 e moedas"
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-ember-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-ember-600 hover:bg-ember-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-ember-600/30 transition transform active:scale-98"
              >
                <Unlock className="w-4 h-4" />
                <span>Abrir Caixa Agora</span>
              </button>
            </form>
          ) : (
            /* CASO 2: CAIXA ABERTO -> DASHBOARD DO TURNO */
            <div className="space-y-4">
              {/* Cards de Métricas */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-charcoal-850 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block">Fundo Inicial:</span>
                  <span className="font-mono font-bold text-white text-sm">
                    {formatBRL(summary.initial_cash_cents)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-charcoal-850 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block">Em Dinheiro:</span>
                  <span className="font-mono font-bold text-emerald-400 text-sm">
                    +{formatBRL(summary.total_cash_sales_cents)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-charcoal-850 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block">Em PIX:</span>
                  <span className="font-mono font-bold text-cyan-400 text-sm">
                    +{formatBRL(summary.total_pix_sales_cents)}
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-charcoal-850 border border-gray-800">
                  <span className="text-[11px] text-gray-400 block">Em Cartão:</span>
                  <span className="font-mono font-bold text-purple-400 text-sm">
                    +{formatBRL(summary.total_card_sales_cents)}
                  </span>
                </div>
              </div>

              {/* Total Geral de Vendas */}
              <div className="p-4 rounded-xl bg-charcoal-850 border border-ember-600/40 flex items-center justify-between">
                <div>
                  <span className="text-xs text-gray-400 block">Faturamento Total do Turno:</span>
                  <span className="font-mono font-black text-xl text-ember-400">
                    {formatBRL(summary.total_sales_cents)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-gray-400 block">Esperado na Gaveta:</span>
                  <span className="font-mono font-black text-lg text-emerald-400">
                    {formatBRL(summary.expected_cash_cents)}
                  </span>
                </div>
              </div>

              {/* Movimentações do Turno (Sangrias & Suprimentos) */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Receipt className="w-3.5 h-3.5 text-ember-400" />
                    <span>Movimentações de Gaveta ({currentShift.movements.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setMovementType('sangria');
                      setIsMovementModalOpen(true);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-gray-700 text-gray-300 font-bold text-xs flex items-center gap-1 transition"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-ember-400" />
                    <span>Sangria / Suprimento</span>
                  </button>
                </div>

                {currentShift.movements.length === 0 ? (
                  <div className="p-3 rounded-xl bg-charcoal-950/60 border border-gray-800 text-center text-xs text-gray-500">
                    Nenhuma sangria ou suprimento registrado neste turno.
                  </div>
                ) : (
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {currentShift.movements.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-charcoal-950 border border-gray-800 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          {m.type === 'sangria' ? (
                            <MinusCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                          ) : (
                            <PlusCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                          )}
                          <div>
                            <span className="font-bold text-white block">{m.reason}</span>
                            <span className="text-[10px] text-gray-400">
                              {new Date(m.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • por {m.created_by_name}
                            </span>
                          </div>
                        </div>
                        <span
                          className={`font-mono font-bold ${
                            m.type === 'sangria' ? 'text-red-400' : 'text-emerald-400'
                          }`}
                        >
                          {m.type === 'sangria' ? '-' : '+'}
                          {formatBRL(m.amount_cents)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botões de Ação */}
              <div className="pt-2 border-t border-gray-800 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleSendWhatsAppReport}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-600/20 transition transform active:scale-95"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Enviar no WhatsApp do Dono</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setActualCashStr((summary.expected_cash_cents / 100).toFixed(2).replace('.', ','));
                    setIsClosingConfirmOpen(true);
                  }}
                  className="py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-red-600/20 transition transform active:scale-95"
                >
                  <Lock className="w-4 h-4" />
                  <span>Encerrar Caixa do Dia</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SUB-MODAL: NOVA SANGRIA / SUPRIMENTO */}
      {isMovementModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-charcoal-900 border border-gray-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <h3 className="font-black text-white text-sm">Registrar Movimentação</h3>
              <button onClick={() => setIsMovementModalOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddMovement} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1.5">Tipo:</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementType('sangria')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      movementType === 'sangria'
                        ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                        : 'bg-charcoal-800 text-gray-400 hover:bg-charcoal-700'
                    }`}
                  >
                    <MinusCircle className="w-3.5 h-3.5" />
                    <span>Sangria (Retirada)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementType('suprimento')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                      movementType === 'suprimento'
                        ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                        : 'bg-charcoal-800 text-gray-400 hover:bg-charcoal-700'
                    }`}
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Suprimento (Entrada)</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Valor (R$):</label>
                <input
                  type="text"
                  required
                  value={movementAmountStr}
                  onChange={(e) => setMovementAmountStr(e.target.value)}
                  placeholder="50,00"
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-xl text-sm font-mono font-bold text-white focus:outline-none focus:border-ember-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Motivo / Descrição:</label>
                <input
                  type="text"
                  required
                  value={movementReason}
                  onChange={(e) => setMovementReason(e.target.value)}
                  placeholder="Ex: Pagamento entregador de carvão, compra de gelo"
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-ember-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMovementModalOpen(false)}
                  className="px-3 py-2 rounded-xl bg-charcoal-800 text-gray-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-ember-600 hover:bg-ember-500 text-white text-xs font-bold shadow-md shadow-ember-600/30"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL: CONFIRMAR FECHAMENTO DE CAIXA */}
      {isClosingConfirmOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-charcoal-900 border border-gray-700 w-full max-w-sm rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <h3 className="font-black text-white text-sm flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-400" />
                <span>Conferência de Gaveta</span>
              </h3>
              <button onClick={() => setIsClosingConfirmOpen(false)} className="text-gray-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCloseShift} className="space-y-3">
              <div className="p-3 rounded-xl bg-charcoal-850 border border-gray-800 text-xs space-y-1">
                <div className="flex justify-between text-gray-400">
                  <span>Esperado na gaveta:</span>
                  <span className="font-mono font-bold text-white">{formatBRL(summary.expected_cash_cents)}</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Valor Real Contado na Gaveta (R$):
                </label>
                <input
                  type="text"
                  required
                  value={actualCashStr}
                  onChange={(e) => setActualCashStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full px-3 py-2.5 bg-charcoal-800 border border-gray-700 rounded-xl text-base font-mono font-bold text-white focus:outline-none focus:border-ember-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">Observações do Fechamento:</label>
                <input
                  type="text"
                  value={closeNotes}
                  onChange={(e) => setCloseNotes(e.target.value)}
                  placeholder="Ex: Turno encerrado sem pendências"
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-xl text-xs text-white focus:outline-none focus:border-ember-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsClosingConfirmOpen(false)}
                  className="px-3 py-2 rounded-xl bg-charcoal-800 text-gray-300 text-xs font-bold"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30"
                >
                  Confirmar Encerramento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
