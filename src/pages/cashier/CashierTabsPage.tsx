import React, { useState, useEffect } from 'react';
import { Tab, PaymentMethod } from '../../types/database.types';
import { db } from '../../lib/databaseStore';
import { useAuth } from '../../contexts/AuthContext';
import { formatBRL, calculateRemainingBalance, parseBRLToCents } from '../../lib/currency';
import { TabStatusBadge } from '../../components/common/Badge';
import { BillSplitModal } from '../../components/cashier/BillSplitModal';
import {
  Receipt,
  Divide,
  CreditCard,
  QrCode,
  Banknote,
  CheckCircle2,
  Lock,
  Clock,
  History,
  AlertCircle,
  Eye,
  X,
  BellRing,
  MessageCircle,
  ShoppingBag,
} from 'lucide-react';

interface CashierTabsPageProps {
  initialTabId?: string;
}

export const CashierTabsPage: React.FC<CashierTabsPageProps> = ({ initialTabId }) => {
  const { currentUser } = useAuth();
  const [tabs, setTabs] = useState<Tab[]>(db.getTabs());
  const [selectedTabId, setSelectedTabId] = useState<string | null>(initialTabId || null);
  const [activeSplitTab, setActiveSplitTab] = useState<Tab | null>(null);
  const [activeViewMode, setActiveViewMode] = useState<'open' | 'history'>('open');

  // Fast direct payment form
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('pix');
  const [paymentNotes, setPaymentNotes] = useState<string>('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  useEffect(() => {
    return db.subscribe(() => {
      setTabs(db.getTabs());
    });
  }, []);

  const openTabs = tabs.filter((t) => t.status === 'open' || t.status === 'closing');
  const historyTabs = tabs.filter((t) => t.status === 'paid' || t.status === 'cancelled');

  const displayedTabs = activeViewMode === 'open' ? openTabs : historyTabs;
  const takeoutReadyOrders = db.getReadyOrders().filter((o) => o.table_number == null);

  // Selected tab details
  const selectedTab = tabs.find((t) => t.id === selectedTabId) || (displayedTabs.length > 0 ? displayedTabs[0] : null);

  const netTotalCents = selectedTab ? Math.max(0, selectedTab.total_cents - selectedTab.discount_cents) : 0;
  const remainingCents = selectedTab ? calculateRemainingBalance(selectedTab.total_cents, selectedTab.discount_cents, selectedTab.paid_cents) : 0;

  // Direct tab payment (without split)
  const handleDirectPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTab) return;

    const amountCents = parseBRLToCents(paymentAmountInput);
    if (amountCents <= 0) {
      setActionError('Informe um valor de pagamento maior que R$ 0,00');
      return;
    }

    try {
      setActionError(null);
      db.recordPayment({
        tab_id: selectedTab.id,
        amount_cents: amountCents,
        method: paymentMethod,
        recorded_by: currentUser.id,
        notes: paymentNotes || undefined,
      });

      setActionSuccess(`Pagamento de ${formatBRL(amountCents)} recebido com sucesso!`);
      setPaymentAmountInput('');
      setPaymentNotes('');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setActionError((err as Error).message || 'Erro ao registrar pagamento');
    }
  };

  // Close tab safely
  const handleCloseTab = () => {
    if (!selectedTab) return;

    try {
      setActionError(null);
      db.closeTab(selectedTab.id, currentUser.id);
      setActionSuccess('Comanda encerrada com sucesso e mesa liberada!');
      setTimeout(() => setActionSuccess(null), 3000);
    } catch (err: unknown) {
      setActionError((err as Error).message || 'Erro ao encerrar comanda');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-charcoal-850 p-4 sm:p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Receipt className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Frente de Caixa & Fechamento de Comandas
              </h1>
              <p className="text-xs text-gray-400">
                Recebimento seguro, divisão em até 10 pessoas e quitação em centavos
              </p>
            </div>
          </div>
        </div>

        {/* View mode toggle */}
        <div className="flex items-center gap-1 bg-charcoal-900 p-1 rounded-xl border border-gray-700">
          <button
            onClick={() => setActiveViewMode('open')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeViewMode === 'open'
                ? 'bg-charcoal-800 text-ember-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Comandas Abertas ({openTabs.length})</span>
          </button>

          <button
            onClick={() => setActiveViewMode('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeViewMode === 'history'
                ? 'bg-charcoal-800 text-emerald-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico Encerradas ({historyTabs.length})</span>
          </button>
        </div>
      </div>

      {/* EXPEDITION READY FOR TAKEOUT BANNER */}
      {takeoutReadyOrders.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-purple-950/60 border-2 border-purple-500 shadow-2xl shadow-purple-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-purple-500/20 border border-purple-400 flex items-center justify-center text-purple-300">
                <ShoppingBag className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white">
                  Expedição Balcão: {takeoutReadyOrders.length} pedido(s) pronto(s) para retirada!
                </h2>
                <p className="text-xs text-purple-300/80">
                  Os espetinhos já saíram da brasa. Chame o cliente pelo nome ou avise com 1 clique no WhatsApp.
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-purple-600 text-white font-black animate-pulse hidden sm:inline">
              Retirada no Balcão
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {takeoutReadyOrders.map((order) => {
              const cleanPhone = (order.customer_phone || '').replace(/\D/g, '');
              const readyItems = order.items.filter((i) => i.status === 'ready' || i.status === 'delivered');
              const waText = `Olá ${order.customer_name || 'Cliente'}! Seus espetinhos do Pedido #${order.order_number} acabaram de sair quentinhos da brasa na CT Conveniência e estão prontos para retirada no balcão!`;

              return (
                <div
                  key={order.id}
                  className="p-3.5 rounded-xl bg-charcoal-900 border border-purple-500/60 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-purple-600 text-white font-black text-xs">
                        Balcão #{order.order_number}
                      </span>
                      {order.customer_name && (
                        <span className="text-xs font-bold text-gray-200 truncate">({order.customer_name})</span>
                      )}
                    </div>
                    <p className="text-xs text-purple-300 font-semibold mt-1 truncate">
                      {readyItems.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {cleanPhone && (
                      <a
                        href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(waText)}`}
                        target="_blank"
                        rel="noreferrer"
                        title="Avisar cliente no WhatsApp"
                        className="p-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-400 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                      </a>
                    )}

                    <button
                      type="button"
                      onClick={() => db.deliverOrder(order.id)}
                      className="px-3 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-purple-600/30 transition transform active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Entregar</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {actionError && (
        <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-800 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Main Grid: Tabs list on left, Tab details & actions on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: List of Comandas (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
            {activeViewMode === 'open' ? 'Comandas em Atendimento' : 'Comandas Finalizadas'}
          </h3>

          {displayedTabs.length === 0 ? (
            <div className="p-6 rounded-2xl bg-charcoal-850/60 border border-gray-800 text-center text-gray-500 text-xs">
              Nenhuma comanda encontrada neste filtro.
            </div>
          ) : (
            displayedTabs.map((tab) => {
              const isSelected = selectedTab?.id === tab.id;
              const tabPending = calculateRemainingBalance(tab.total_cents, tab.discount_cents, tab.paid_cents);

              return (
                <div
                  key={tab.id}
                  onClick={() => setSelectedTabId(tab.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    isSelected
                      ? 'bg-charcoal-850 border-ember-500 shadow-lg shadow-ember-950/20'
                      : 'bg-charcoal-900 border-gray-800 hover:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-bold text-sm text-white">
                      {tab.table ? tab.table.label : 'Balcão / Avulso'}
                    </span>
                    <TabStatusBadge status={tab.status} />
                  </div>

                  <p className="text-xs text-gray-400 truncate mb-3">
                    {tab.customer_name || 'Cliente não identificado'}
                  </p>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800">
                    <span className="text-gray-400">Total:</span>
                    <span className="font-mono font-bold text-gray-200">{formatBRL(tab.total_cents)}</span>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-gray-400">Saldo Pendente:</span>
                    <span
                      className={`font-mono font-bold ${
                        tabPending === 0 ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {formatBRL(tabPending)}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right Column: Active Tab Details, Split & Close Actions (8 cols) */}
        {selectedTab ? (
          <div className="lg:col-span-8 space-y-6">
            <div className="bg-charcoal-850 rounded-2xl border border-gray-800 p-5 sm:p-6 space-y-6">
              {/* Header Info */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-gray-800">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-black text-white">
                      {selectedTab.table ? selectedTab.table.label : 'Comanda'}
                    </h2>
                    <TabStatusBadge status={selectedTab.status} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Cliente: <strong className="text-gray-200">{selectedTab.customer_name || 'Sem nome informado'}</strong>
                    {selectedTab.customer_phone && ` • Tel: ${selectedTab.customer_phone}`}
                  </p>
                </div>

                {/* THE HIGHLIGHTED "DIVIDIR CONTA" BUTTON (Rule 10.1) */}
                {selectedTab.status !== 'paid' && selectedTab.status !== 'cancelled' && (
                  <button
                    type="button"
                    onClick={() => setActiveSplitTab(selectedTab)}
                    className="py-3 px-5 rounded-xl bg-gradient-to-r from-ember-600 via-ember-500 to-amber-500 hover:from-ember-500 hover:to-amber-400 text-white font-extrabold text-sm shadow-xl shadow-ember-600/30 ring-2 ring-ember-400/50 flex items-center gap-2 transition transform hover:scale-[1.02]"
                  >
                    <Divide className="w-5 h-5" />
                    <span>DIVIDIR CONTA</span>
                  </button>
                )}
              </div>

              {/* Financial Balance Summary (Rule 10.5) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3.5 rounded-xl bg-charcoal-900 border border-gray-700">
                  <p className="text-[11px] text-gray-400 font-semibold uppercase">Total da Comanda</p>
                  <p className="text-lg font-mono font-extrabold text-white mt-0.5">
                    {formatBRL(selectedTab.total_cents)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-charcoal-900 border border-gray-700">
                  <p className="text-[11px] text-gray-400 font-semibold uppercase">Descontos</p>
                  <p className="text-lg font-mono font-extrabold text-gray-300 mt-0.5">
                    {formatBRL(selectedTab.discount_cents)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-charcoal-900 border border-emerald-900/60">
                  <p className="text-[11px] text-emerald-400 font-semibold uppercase">Total Pago</p>
                  <p className="text-lg font-mono font-extrabold text-emerald-400 mt-0.5">
                    {formatBRL(selectedTab.paid_cents)}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-charcoal-900 border border-amber-900/60">
                  <p className="text-[11px] text-amber-400 font-semibold uppercase">Saldo Pendente</p>
                  <p
                    className={`text-lg font-mono font-extrabold mt-0.5 ${
                      remainingCents === 0 ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {formatBRL(remainingCents)}
                  </p>
                </div>
              </div>

              {/* Active Bill Split Status if created */}
              {selectedTab.splits && selectedTab.splits.length > 0 && (
                <div className="p-4 rounded-xl bg-charcoal-900 border border-ember-800/60 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-ember-400 flex items-center gap-1.5">
                      <Divide className="w-4 h-4" />
                      <span>
                        Divisão Ativa: {selectedTab.splits[0].num_people} Pessoas ({selectedTab.splits[0].mode === 'equal' ? 'Modo A - Igual' : 'Modo B - Personalizado'})
                      </span>
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveSplitTab(selectedTab)}
                      className="text-xs text-ember-400 hover:text-white font-bold underline"
                    >
                      Gerenciar Participantes
                    </button>
                  </div>

                  {/* Quick status bar of participants */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                    {selectedTab.splits[0].participants.map((part) => {
                      const isPartPaid = part.paid_cents >= part.assigned_cents;
                      return (
                        <div
                          key={part.id}
                          className={`p-2 rounded-lg text-center border ${
                            isPartPaid
                              ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300'
                              : 'bg-charcoal-800 border-gray-700 text-gray-300'
                          }`}
                        >
                          <p className="text-[11px] font-bold truncate">{part.name}</p>
                          <p className="text-xs font-mono font-bold mt-0.5">
                            {formatBRL(part.assigned_cents)}
                          </p>
                          <p className="text-[10px] font-semibold mt-0.5">
                            {isPartPaid ? 'QUITADO' : `PAGO: ${formatBRL(part.paid_cents)}`}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Itemized Order Breakdown */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Itens Consumidos por Rodada ({selectedTab.orders?.length || 0} rodadas)
                </h4>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {selectedTab.orders?.map((order) => (
                    <div key={order.id} className="p-3 rounded-xl bg-charcoal-900 border border-gray-800 text-xs">
                      <div className="flex items-center justify-between text-gray-400 mb-2 pb-1 border-b border-gray-800">
                        <span>Rodada #{order.order_number}</span>
                        <span>{new Date(order.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <div className="space-y-1.5">
                        {order.items.map((it) => (
                          <div key={it.id} className="flex items-center justify-between text-gray-300">
                            <span>
                              <strong className="text-ember-400">{it.quantity}x</strong> {it.product_name}
                              {it.addons_snapshot?.length > 0 && (
                                <span className="text-[11px] text-gray-500 ml-1">
                                  ({it.addons_snapshot.map(a => a.name).join(', ')})
                                </span>
                              )}
                            </span>
                            <span className="font-mono text-gray-200">{formatBRL(it.total_cents)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Direct Payment Panel (When not using or before splitting) */}
              {selectedTab.status !== 'paid' && selectedTab.status !== 'cancelled' && remainingCents > 0 && (
                <form
                  onSubmit={handleDirectPayment}
                  className="p-4 rounded-xl bg-charcoal-900 border border-gray-700 space-y-3"
                >
                  <h4 className="text-xs font-bold text-gray-200 flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-emerald-400" />
                    <span>Registrar Pagamento Único ou Parcial no Balcão</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 block mb-1">Valor (R$):</label>
                      <input
                        type="text"
                        placeholder={(remainingCents / 100).toFixed(2)}
                        value={paymentAmountInput}
                        onChange={(e) => setPaymentAmountInput(e.target.value)}
                        className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-white font-mono font-bold text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold text-gray-400 block mb-1">Forma de Pagamento:</label>
                      <div className="grid grid-cols-2 gap-1">
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('pix')}
                          className={`py-1.5 px-2 rounded text-xs font-bold border transition ${
                            paymentMethod === 'pix' ? 'bg-cyan-950 text-cyan-300 border-cyan-500' : 'bg-charcoal-800 text-gray-400 border-gray-700'
                          }`}
                        >
                          PIX
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('cash')}
                          className={`py-1.5 px-2 rounded text-xs font-bold border transition ${
                            paymentMethod === 'cash' ? 'bg-emerald-950 text-emerald-300 border-emerald-500' : 'bg-charcoal-800 text-gray-400 border-gray-700'
                          }`}
                        >
                          Dinheiro
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('credit_card')}
                          className={`py-1.5 px-2 rounded text-xs font-bold border transition ${
                            paymentMethod === 'credit_card' ? 'bg-purple-950 text-purple-300 border-purple-500' : 'bg-charcoal-800 text-gray-400 border-gray-700'
                          }`}
                        >
                          Crédito
                        </button>
                        <button
                          type="button"
                          onClick={() => setPaymentMethod('debit_card')}
                          className={`py-1.5 px-2 rounded text-xs font-bold border transition ${
                            paymentMethod === 'debit_card' ? 'bg-blue-950 text-blue-300 border-blue-500' : 'bg-charcoal-800 text-gray-400 border-gray-700'
                          }`}
                        >
                          Débito
                        </button>
                      </div>
                    </div>

                    <div className="flex items-end">
                      <button
                        type="submit"
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/30 transition flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Confirmar Pagamento</span>
                      </button>
                    </div>
                  </div>
                </form>
              )}

              {/* Payments History on this tab */}
              {selectedTab.payments && selectedTab.payments.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                    Histórico de Pagamentos Confirmados ({selectedTab.payments.length})
                  </h4>
                  <div className="space-y-1.5">
                    {selectedTab.payments.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-lg bg-charcoal-900 border border-gray-800 flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-bold text-white uppercase">{p.method}</span>
                          {p.participant_name && (
                            <span className="text-ember-400 font-semibold">({p.participant_name})</span>
                          )}
                          <span className="text-gray-500">• Operador: {p.recorded_by_name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-emerald-400">{formatBRL(p.amount_cents)}</span>
                          <span className="text-gray-500 text-[11px]">
                            {new Date(p.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Close Tab Final Action (Rule 10.4: Impedir encerramento com saldo pendente) */}
              {selectedTab.status !== 'paid' && selectedTab.status !== 'cancelled' && (
                <div className="pt-4 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="text-xs text-gray-400">
                    {remainingCents > 0 ? (
                      <span className="text-amber-400 flex items-center gap-1.5 font-semibold">
                        <Lock className="w-4 h-4" />
                        <span>Encerramento bloqueado: quite o saldo restante de {formatBRL(remainingCents)}</span>
                      </span>
                    ) : (
                      <span className="text-emerald-400 flex items-center gap-1.5 font-semibold">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Saldo quitado integralmente! Pronto para encerramento.</span>
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    disabled={remainingCents > 0}
                    onClick={handleCloseTab}
                    className="w-full sm:w-auto py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-800 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-extrabold text-sm shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span>Encerrar Comanda e Liberar Mesa</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 p-12 rounded-2xl bg-charcoal-850 border border-gray-800 flex flex-col items-center justify-center text-center text-gray-500">
            <Receipt className="w-12 h-12 mb-3 opacity-30" />
            <h3 className="text-base font-bold text-gray-300">Selecione uma comanda ao lado</h3>
            <p className="text-xs text-gray-500 mt-1">Consulte o consumo, realize divisões ou receba pagamentos</p>
          </div>
        )}
      </div>

      {/* Bill Split Modal */}
      {activeSplitTab && (
        <BillSplitModal
          tab={activeSplitTab}
          isOpen={true}
          onClose={() => setActiveSplitTab(null)}
          onTabUpdated={() => {
            setTabs(db.getTabs());
          }}
        />
      )}
    </div>
  );
};
