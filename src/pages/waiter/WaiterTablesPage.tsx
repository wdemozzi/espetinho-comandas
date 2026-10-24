import React, { useState, useEffect } from 'react';
import { RestaurantTable, Tab } from '../../types/database.types';
import { db } from '../../lib/databaseStore';
import { useAuth } from '../../contexts/AuthContext';
import { formatBRL } from '../../lib/currency';
import { TableStatusBadge } from '../../components/common/Badge';
import { OrderLauncherModal } from '../../components/waiter/OrderLauncherModal';
import { QrCodeModal } from '../../components/common/QrCodeModal';
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
} from 'lucide-react';

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
  const [openTabModalTable, setOpenTabModalTable] = useState<RestaurantTable | null>(null);
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [tabNotes, setTabNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    return db.subscribe(() => {
      setTables(db.getTables());
    });
  }, []);

  const handleOpenTab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openTabModalTable) return;

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

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-charcoal-900 border border-gray-700 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-300 font-semibold">{freeTablesCount} Livres</span>
          </div>
          <div className="px-3.5 py-1.5 rounded-xl bg-charcoal-900 border border-gray-700 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse" />
            <span className="text-xs text-gray-300 font-semibold">{activeTablesCount} Ocupadas</span>
          </div>
        </div>
      </div>

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
                isOccupied
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

                {/* Capacity */}
                <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-3">
                  <Users className="w-3.5 h-3.5" />
                  <span>Capacidade: até {table.capacity} pessoas</span>
                </div>

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
                    <button
                      type="button"
                      onClick={() => setSelectedTableForOrder({ table, tab: activeTab })}
                      className="w-full py-2 px-3 rounded-xl bg-ember-600 hover:bg-ember-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-ember-600/20 transition"
                    >
                      <Flame className="w-4 h-4" />
                      <span>Lançar Nova Rodada</span>
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
    </div>
  );
};
