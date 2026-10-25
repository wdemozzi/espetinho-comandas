import React, { useState, useEffect } from 'react';
import { RestaurantTable, Tab } from '../../types/database.types';
import { db } from '../../lib/databaseStore';
import { useAuth } from '../../contexts/AuthContext';
import { formatBRL } from '../../lib/currency';
import { TableStatusBadge } from '../../components/common/Badge';
import { OrderLauncherModal } from '../../components/waiter/OrderLauncherModal';
import { QrCodeModal } from '../../components/common/QrCodeModal';
import { TableTransferModal } from '../../components/waiter/TableTransferModal';
import { PreBillModal } from '../../components/cashier/PreBillModal';
import { detectProfanity, validateTextNoProfanity } from '../../lib/validators';
import {
  UtensilsCrossed,
  Plus,
  Users,
  QrCode,
  Flame,
  CheckCircle2,
  Clock,
  AlertCircle,
  Receipt,
  X,
  BellRing,
  ArrowRightLeft,
  Link2,
  Unlink,
  Volume2,
} from 'lucide-react';
import { soundService, OrderReadyAlertData } from '../../lib/sound';

interface WaiterTablesPageProps {
  onNavigateToCashier?: (tabId: string) => void;
}

export const WaiterTablesPage: React.FC<WaiterTablesPageProps> = ({ onNavigateToCashier }) => {
  const { currentUser } = useAuth();
  const [tables, setTables] = useState<RestaurantTable[]>(db.getTables());
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<{
    table: RestaurantTable;
    tab: Tab;
  } | null>(null);
  const [selectedTableForQr, setSelectedTableForQr] = useState<RestaurantTable | null>(null);
  const [selectedTableForTransfer, setSelectedTableForTransfer] = useState<{
    table: RestaurantTable;
    tab: Tab;
  } | null>(null);
  const [selectedTabForPreBill, setSelectedTabForPreBill] = useState<Tab | null>(null);
  const [openTabModalTable, setOpenTabModalTable] = useState<RestaurantTable | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [tabNotes, setTabNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeReadyAlert, setActiveReadyAlert] = useState<OrderReadyAlertData | null>(null);
  const [testedAudio, setTestedAudio] = useState<boolean>(false);

  useEffect(() => {
    const unsubDb = db.subscribe(() => {
      setTables(db.getTables());
    });

    const unsubAlert = db.onOrderReady((alert) => {
      setActiveReadyAlert(alert);
    });

    return () => {
      unsubDb();
      unsubAlert();
    };
  }, []);

  const handleOpenTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openTabModalTable) return;

    if (customerName.trim()) {
      const profCheck = detectProfanity(customerName);
      if (profCheck.hasProfanity) {
        setErrorMsg('Nome do cliente contém palavras inadequadas ou desrespeitosas.');
        return;
      }
    }
    if (tabNotes.trim()) {
      const notesCheck = validateTextNoProfanity(tabNotes, 'observação');
      if (!notesCheck.isValid) {
        setErrorMsg(notesCheck.error || 'A observação contém termos inadequados.');
        return;
      }
    }

    try {
      setErrorMsg(null);
      const newTab = db.openTab({
        table_id: openTabModalTable.id,
        opened_by_user_id: currentUser.id,
        customer_name: customerName || undefined,
        customer_phone: customerPhone || undefined,
        notes: tabNotes || undefined,
      });

      // Directly open order launcher for convenience
      setSelectedTableForOrder({
        table: openTabModalTable,
        tab: newTab,
      });

      setOpenTabModalTable(null);
      setCustomerName('');
      setCustomerPhone('');
      setTabNotes('');
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Erro ao abrir comanda');
    }
  };

  const activeTablesCount = tables.filter((t) => t.status === 'ocupada').length;
  const freeTablesCount = tables.filter((t) => t.status === 'livre').length;
  const tableReadyOrders = db.getReadyOrders().filter((o) => o.table_number != null);

  return (
    <div className="space-y-6">
      {/* Top Bar Summary */}
      <div className="bg-charcoal-850 p-4 sm:p-6 rounded-2xl border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <UtensilsCrossed className="w-6 h-6 text-ember-400" />
            <span>Mapa de Mesas & Comandas</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 mt-1">
            Selecione uma mesa para abrir comanda, lançar rodadas de pedidos ou consultar consumo
          </p>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
          <button
            type="button"
            onClick={async () => {
              await soundService.requestNotificationPermission();
              soundService.playOrderReady({
                tableNumber: 3,
                orderNumber: 100,
                itemsSummary: 'Teste de sinal sonoro e vibração',
              });
              setTestedAudio(true);
            }}
            title="Ativar e testar alertas sonoros e notificações no celular"
            className="px-3 py-1.5 rounded-xl bg-charcoal-900 hover:bg-charcoal-800 border border-emerald-600/70 text-emerald-400 text-xs font-bold flex items-center gap-1.5 transition active:scale-95 shadow-sm"
          >
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{testedAudio ? 'Alertas Ativos ✅' : 'Ativar Avisos Sonoros'}</span>
          </button>

          <div className="px-3 py-1.5 rounded-xl bg-charcoal-900 border border-gray-700 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-300 font-semibold">{freeTablesCount} Livres</span>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-charcoal-900 border border-gray-700 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs text-gray-300 font-semibold">{activeTablesCount} Ocupadas</span>
          </div>
        </div>
      </div>

      {/* FLOATING REAL-TIME ORDER READY TOAST FOR WAITERS */}
      {activeReadyAlert && (
        <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 p-4 rounded-2xl bg-emerald-950/95 border-2 border-emerald-400 text-white shadow-2xl shadow-emerald-950/90 flex items-start justify-between gap-3 backdrop-blur-md animate-bounce">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 flex-shrink-0 animate-pulse">
              <BellRing className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-800 text-emerald-100">
                  Pronto na Brasa!
                </span>
                {activeReadyAlert.orderNumber && (
                  <span className="text-xs font-bold text-emerald-300">
                    #{activeReadyAlert.orderNumber}
                  </span>
                )}
              </div>
              <h3 className="font-black text-sm text-white mt-1">
                {activeReadyAlert.tableNumber ? `Mesa ${String(activeReadyAlert.tableNumber).padStart(2, '0')}` : 'Balcão'}
                {activeReadyAlert.customerName ? ` (${activeReadyAlert.customerName})` : ''}
              </h3>
              <p className="text-xs text-emerald-200 font-medium mt-0.5">
                {activeReadyAlert.itemsSummary || 'Espetinhos prontos para servir!'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setActiveReadyAlert(null)}
            className="p-1 text-emerald-300 hover:text-white rounded-lg hover:bg-emerald-900/60 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* EXPEDITION READY TO SERVE BANNER */}
      {tableReadyOrders.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-emerald-950/60 border-2 border-emerald-500 shadow-2xl shadow-emerald-950/40 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300">
                <BellRing className="w-4 h-4 animate-bounce" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-white">
                  Expedição: {tableReadyOrders.length} pedido(s) pronto(s) para levar à mesa!
                </h2>
                <p className="text-xs text-emerald-300/80">
                  A cozinha finalizou o preparo. Garçom, retire na bancada e entregue na mesa indicada.
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-600 text-white font-black animate-pulse hidden sm:inline">
              Pronto na Brasa
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {tableReadyOrders.map((order) => {
              const readyItems = order.items.filter((i) => i.status === 'ready' || i.status === 'delivered');
              return (
                <div
                  key={order.id}
                  className="p-3.5 rounded-xl bg-charcoal-900 border border-emerald-500/60 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-lg bg-ember-600 text-white font-black text-xs">
                        Mesa {String(order.table_number).padStart(2, '0')}
                      </span>
                      <span className="text-[11px] font-mono text-gray-400">#{order.order_number}</span>
                      {order.customer_name && (
                        <span className="text-xs font-bold text-gray-200 truncate">({order.customer_name.split(' ')[0]})</span>
                      )}
                    </div>
                    <p className="text-xs text-emerald-300 font-semibold mt-1 truncate">
                      {readyItems.map((i) => `${i.quantity}x ${i.product_name}`).join(', ')}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => db.deliverOrder(order.id)}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1 shadow-md shadow-emerald-600/30 transition transform active:scale-95 flex-shrink-0"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Entregar</span>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tables Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {tables.map((table) => {
          const isOccupied = table.status === 'ocupada';
          const activeTab = table.active_tab;
          const pendingReadyItems = activeTab?.orders?.flatMap(o => o.items).filter(i => i.status === 'ready').length || 0;

          return (
            <div
              key={table.id}
              className={`rounded-2xl border transition-all p-4 flex flex-col justify-between ${
                pendingReadyItems > 0
                  ? 'bg-charcoal-900 border-emerald-500 shadow-xl shadow-emerald-950/30 ring-2 ring-emerald-500/40'
                  : isOccupied
                  ? 'bg-charcoal-900 border-ember-600/70 shadow-lg shadow-ember-950/20'
                  : 'bg-charcoal-850/80 border-gray-800 hover:border-gray-700'
              }`}
            >
              <div>
                {/* Table Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-black text-white tracking-tight">{table.label}</span>
                    <TableStatusBadge status={table.status} />
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedTableForQr(table)}
                    title="Exibir QR Code da Mesa"
                    className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-gray-700 text-gray-400 hover:text-white transition"
                  >
                    <QrCode className="w-4 h-4" />
                  </button>
                </div>

                {/* Capacity & Linked Table Info */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-2">
                  <Users className="w-3.5 h-3.5" />
                  <span>Capacidade: até {table.capacity} pessoas</span>
                </div>

                {/* Secondary Linked Table Banner */}
                {table.linked_table_label && (
                  <div className="p-2 mb-3 rounded-xl bg-ember-950/60 border border-ember-600/50 flex items-center justify-between text-xs">
                    <span className="text-ember-300 font-bold flex items-center gap-1.5 truncate">
                      <Link2 className="w-3.5 h-3.5 text-ember-400 flex-shrink-0" />
                      <span>{table.linked_table_label}</span>
                    </span>
                    {activeTab && (
                      <button
                        type="button"
                        onClick={() => db.unlinkTableFromTab(activeTab.id, table.id)}
                        className="px-2 py-0.5 rounded-md bg-red-950/80 hover:bg-red-900 border border-red-700/60 text-red-300 font-bold text-[10px] flex items-center gap-1 transition"
                        title="Desmembrar mesa e torná-la livre"
                      >
                        <Unlink className="w-3 h-3" />
                        <span>Desmembrar</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Occupied Table Info */}
                {isOccupied && activeTab && (
                  <div className="space-y-2 p-3 rounded-xl bg-charcoal-850 border border-gray-800 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Cliente:</span>
                      <span className="font-semibold text-gray-200 truncate max-w-[140px]">
                        {activeTab.customer_name || 'Sem nome'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Consumo Acumulado:</span>
                      <span className="font-mono font-bold text-ember-400 text-sm">
                        {formatBRL(activeTab.total_cents)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Rodadas de Pedidos:</span>
                      <span className="font-mono font-bold text-gray-300">
                        {activeTab.orders?.length || 0} rodadas
                      </span>
                    </div>

                    {/* Mesas juntas a esta comanda */}
                    {activeTab.joined_table_labels && activeTab.joined_table_labels.length > 0 && (
                      <div className="flex items-center justify-between text-ember-300 font-semibold pt-1 border-t border-gray-800">
                        <span className="flex items-center gap-1">
                          <Link2 className="w-3 h-3 text-ember-400" />
                          <span>Mesas Juntas:</span>
                        </span>
                        <span className="truncate max-w-[120px] text-right">
                          {activeTab.joined_table_labels.join(', ')}
                        </span>
                      </div>
                    )}

                    {/* Ready alert */}
                    {pendingReadyItems > 0 && (
                      <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5 animate-bounce">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{pendingReadyItems} item(ns) pronto(s) para entrega!</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Table Action Buttons */}
              <div className="mt-4 pt-3 border-t border-gray-800 space-y-2">
                {isOccupied && activeTab ? (
                  <>
                    {pendingReadyItems > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          activeTab.orders?.forEach((o) => {
                            if (o.items.some((i) => i.status === 'ready')) {
                              db.deliverOrder(o.id);
                            }
                          });
                        }}
                        className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition animate-pulse transform active:scale-95"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Entregar Itens na Mesa</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedTableForOrder({ table, tab: activeTab })}
                      className="w-full py-2 px-3 rounded-xl bg-ember-600 hover:bg-ember-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-ember-600/20 transition"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Lançar Nova Rodada</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedTabForPreBill(activeTab)}
                      className="w-full py-1.5 px-3 rounded-lg bg-charcoal-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <Receipt className="w-3.5 h-3.5 text-ember-400" />
                      <span>Ver Pré-Conta (Conferência)</span>
                    </button>

                    {onNavigateToCashier && (
                      <button
                        type="button"
                        onClick={() => onNavigateToCashier(activeTab.id)}
                        className="w-full py-1.5 px-3 rounded-lg bg-charcoal-800 hover:bg-gray-700 text-gray-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                      >
                        <Receipt className="w-3.5 h-3.5" />
                        <span>Consultar Conta / Caixa</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setSelectedTableForTransfer({ table, tab: activeTab })}
                      className="w-full py-1.5 px-3 rounded-lg bg-charcoal-850 hover:bg-gray-700 border border-gray-700 text-gray-300 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                    >
                      <ArrowRightLeft className="w-3.5 h-3.5 text-ember-400" />
                      <span>Trocar / Juntar Mesa</span>
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setOpenTabModalTable(table);
                      setErrorMsg(null);
                    }}
                    className="w-full py-2 px-3 rounded-xl bg-gray-800 hover:bg-ember-600 hover:text-white text-gray-200 font-bold text-xs flex items-center justify-center gap-1.5 border border-gray-700 transition"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Abrir Comanda</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Open Tab */}
      {openTabModalTable && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-charcoal-900 border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <button
              onClick={() => setOpenTabModalTable(null)}
              className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ember-600/20 border border-ember-500/40 flex items-center justify-center text-ember-400">
                <UtensilsCrossed className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Abrir Comanda</h3>
                <p className="text-xs text-ember-400 font-semibold">{openTabModalTable.label}</p>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleOpenTab} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Nome do Cliente / Responsável (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Carlos ou Família Silva"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-ember-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  WhatsApp / Telefone (opcional):
                </label>
                <input
                  type="text"
                  placeholder="(44) 99999-9999"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-ember-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Observações iniciais (opcional):
                </label>
                <textarea
                  rows={2}
                  placeholder="Ex: Aniversário, cliente preferencial"
                  value={tabNotes}
                  onChange={(e) => setTabNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-ember-500 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setOpenTabModalTable(null)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-ember-600 hover:bg-ember-500 text-white text-xs font-bold shadow-md shadow-ember-600/30 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Confirmar Abertura</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Order Launcher */}
      {selectedTableForOrder && (
        <OrderLauncherModal
          table={selectedTableForOrder.table}
          tab={selectedTableForOrder.tab}
          isOpen={true}
          onClose={() => setSelectedTableForOrder(null)}
          onOrderPlaced={() => {
            setTables(db.getTables());
          }}
        />
      )}

      {/* Modal: Table QR Code */}
      {selectedTableForQr && (
        <QrCodeModal
          table={selectedTableForQr}
          isOpen={true}
          onClose={() => setSelectedTableForQr(null)}
        />
      )}

      {/* Modal: Transfer / Join Table */}
      {selectedTableForTransfer && (
        <TableTransferModal
          currentTable={selectedTableForTransfer.table}
          currentTab={selectedTableForTransfer.tab}
          allTables={tables}
          onClose={() => setSelectedTableForTransfer(null)}
          onSuccess={() => {
            setTables(db.getTables());
          }}
        />
      )}

      {/* Modal: Pre-Bill Receipt */}
      {selectedTabForPreBill && (
        <PreBillModal
          tab={selectedTabForPreBill}
          establishment={db.getEstablishment()}
          onClose={() => setSelectedTabForPreBill(null)}
        />
      )}
    </div>
  );
};
