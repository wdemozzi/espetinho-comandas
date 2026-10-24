import React from 'react';
import { createPortal } from 'react-dom';
import { Order } from '../../types/database.types';
import { db } from '../../lib/databaseStore';
import {
  BellRing,
  X,
  CheckCircle2,
  UtensilsCrossed,
  ShoppingBag,
  MessageCircle,
  Clock,
  Sparkles,
} from 'lucide-react';

interface ExpeditionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExpeditionModal: React.FC<ExpeditionModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const readyOrders = db.getReadyOrders();
  const tableOrders = readyOrders.filter((o) => o.table_number != null);
  const takeoutOrders = readyOrders.filter((o) => o.table_number == null);

  const handleDeliver = (orderId: string) => {
    db.deliverOrder(orderId);
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl bg-charcoal-900 border border-emerald-500/70 rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <BellRing className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <span>Expedição & Prontos para Entrega</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                  {readyOrders.length} pedido(s)
                </span>
              </h2>
              <p className="text-xs text-gray-400">
                Itens assados e finalizados pela cozinha aguardando entrega aos clientes
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content list */}
        <div className="overflow-y-auto py-4 space-y-4 flex-1">
          {readyOrders.length === 0 ? (
            <div className="text-center py-12 space-y-2 text-gray-500">
              <CheckCircle2 className="w-12 h-12 mx-auto text-gray-600" />
              <p className="text-sm font-bold text-gray-400">Nenhum pedido aguardando expedição no momento.</p>
              <p className="text-xs text-gray-500">Quando a cozinha marcar pedidos como prontos, eles aparecerão aqui instantaneamente.</p>
            </div>
          ) : (
            <>
              {/* Table orders section */}
              {tableOrders.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider px-1">
                    <UtensilsCrossed className="w-3.5 h-3.5" />
                    <span>Levar às Mesas ({tableOrders.length})</span>
                  </div>

                  <div className="space-y-2.5">
                    {tableOrders.map((order) => {
                      const readyItems = order.items.filter((i) => i.status === 'ready' || i.status === 'delivered');
                      return (
                        <div
                          key={order.id}
                          className="p-4 rounded-2xl bg-charcoal-850 border border-emerald-500/40 hover:border-emerald-500 transition shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-xl bg-ember-600 text-white font-black text-sm">
                                Mesa {String(order.table_number).padStart(2, '0')}
                              </span>
                              <span className="text-xs font-mono font-bold text-gray-400">
                                #{order.order_number}
                              </span>
                              {order.customer_name && (
                                <span className="text-xs font-bold text-gray-300">
                                  • {order.customer_name}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {readyItems.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-700/60 text-emerald-300 text-xs font-bold"
                                >
                                  {item.quantity}x {item.product_name}
                                  {item.addons_snapshot && item.addons_snapshot.length > 0 && (
                                    <span className="text-emerald-400/70 font-normal"> ({item.addons_snapshot.map((a: { name: string }) => a.name).join(', ')})</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => handleDeliver(order.id)}
                              className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Entregue na Mesa</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Takeout orders section */}
              {takeoutOrders.length > 0 && (
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-purple-400 uppercase tracking-wider px-1">
                    <ShoppingBag className="w-3.5 h-3.5" />
                    <span>Retirada no Balcão ({takeoutOrders.length})</span>
                  </div>

                  <div className="space-y-2.5">
                    {takeoutOrders.map((order) => {
                      const cleanPhone = (order.customer_phone || '').replace(/\D/g, '');
                      const readyItems = order.items.filter((i) => i.status === 'ready' || i.status === 'delivered');
                      const waText = `Olá ${order.customer_name || 'Cliente'}! Seus espetinhos do Pedido #${order.order_number} acabaram de sair quentinhos da brasa na CT Conveniência e estão prontos para retirada no balcão!`;

                      return (
                        <div
                          key={order.id}
                          className="p-4 rounded-2xl bg-charcoal-850 border border-purple-500/40 hover:border-purple-500 transition shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                        >
                          <div className="space-y-1.5">
                            <div className="flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-xl bg-purple-600 text-white font-black text-sm">
                                Balcão #{order.order_number}
                              </span>
                              {order.customer_name && (
                                <span className="text-xs font-bold text-white">
                                  {order.customer_name}
                                </span>
                              )}
                              {order.customer_phone && (
                                <span className="text-xs text-gray-400 font-mono">
                                  • {order.customer_phone}
                                </span>
                              )}
                            </div>

                            <div className="flex flex-wrap gap-1.5 pt-0.5">
                              {readyItems.map((item, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-0.5 rounded-lg bg-purple-950/80 border border-purple-700/60 text-purple-300 text-xs font-bold"
                                >
                                  {item.quantity}x {item.product_name}
                                  {item.addons_snapshot && item.addons_snapshot.length > 0 && (
                                    <span className="text-purple-400/70 font-normal"> ({item.addons_snapshot.map((a: { name: string }) => a.name).join(', ')})</span>
                                  )}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {cleanPhone && (
                              <a
                                href={`https://wa.me/55${cleanPhone}?text=${encodeURIComponent(waText)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="px-3 py-2.5 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/80 text-emerald-300 font-bold text-xs flex items-center justify-center gap-1.5 transition"
                              >
                                <MessageCircle className="w-4 h-4 text-emerald-400" />
                                <span>Avisar WhatsApp</span>
                              </a>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeliver(order.id)}
                              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-purple-600/30 transition transform active:scale-95"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              <span>Entregar ao Cliente</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-gray-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};
