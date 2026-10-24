import React, { useState, useEffect } from 'react';
import { Order, OrderItem, ProductionSector, OrderStatus } from '../../types/database.types';
import { db } from '../../lib/databaseStore';
import { SectorBadge } from '../common/Badge';
import {
  Clock,
  CheckCircle2,
  ChefHat,
  Flame,
  Truck,
  Check,
  AlertCircle,
} from 'lucide-react';

interface OrderCardProps {
  order: Order;
  activeSectorFilter: ProductionSector | 'all';
}

export const OrderCard: React.FC<OrderCardProps> = ({ order, activeSectorFilter }) => {
  const [elapsedMinutes, setElapsedMinutes] = useState<number>(0);

  useEffect(() => {
    const calcElapsed = () => {
      const created = new Date(order.created_at).getTime();
      const diff = Math.floor((Date.now() - created) / 60000);
      setElapsedMinutes(Math.max(0, diff));
    };
    calcElapsed();
    const interval = setInterval(calcElapsed, 30000);
    return () => clearInterval(interval);
  }, [order.created_at]);

  // Filter items by sector if a specific sector tab is active
  const displayedItems = activeSectorFilter === 'all'
    ? order.items
    : order.items.filter((i) => i.sector === activeSectorFilter);

  if (displayedItems.length === 0) return null;

  const handleUpdateItemStatus = (itemId: string, status: OrderStatus) => {
    db.updateOrderItemStatus(itemId, status);
  };

  // Urgency styling based on wait time
  const isUrgent = elapsedMinutes >= 20;
  const isWarning = elapsedMinutes >= 12;

  return (
    <div
      className={`rounded-2xl border transition-all shadow-lg overflow-hidden flex flex-col justify-between ${
        isUrgent
          ? 'bg-charcoal-900 border-red-600/80 shadow-red-950/20'
          : isWarning
          ? 'bg-charcoal-900 border-amber-600/80 shadow-amber-950/20'
          : 'bg-charcoal-900 border-gray-700 shadow-black/40'
      }`}
    >
      {/* Top Banner */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${
          isUrgent
            ? 'bg-red-950/60 border-red-800 text-red-200'
            : isWarning
            ? 'bg-amber-950/60 border-amber-800 text-amber-200'
            : 'bg-charcoal-850 border-gray-800 text-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-mono font-black text-lg text-white">
            #{order.order_number}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-gray-800 text-xs font-bold text-gray-200">
            {order.table_number ? `Mesa ${String(order.table_number).padStart(2, '0')}` : order.order_type.toUpperCase()}
          </span>
          {order.customer_name && (
            <span className="text-xs text-gray-300 truncate max-w-[120px]">
              {order.customer_name}
            </span>
          )}
        </div>

        {/* Elapsed Timer */}
        <div
          className={`flex items-center gap-1 font-mono text-xs font-bold px-2.5 py-1 rounded-full border ${
            isUrgent
              ? 'bg-red-900/60 text-red-300 border-red-700 animate-pulse'
              : isWarning
              ? 'bg-amber-900/60 text-amber-300 border-amber-700'
              : 'bg-gray-800 text-gray-300 border-gray-700'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{elapsedMinutes} min</span>
        </div>
      </div>

      {/* Items list */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[360px]">
        {displayedItems.map((item: OrderItem) => {
          const isItemReady = item.status === 'ready';
          const isItemPreparing = item.status === 'preparing';
          const isItemDelivered = item.status === 'delivered';

          return (
            <div
              key={item.id}
              className={`p-3 rounded-xl border transition ${
                isItemDelivered
                  ? 'bg-gray-900/40 border-gray-800 opacity-60'
                  : isItemReady
                  ? 'bg-emerald-950/30 border-emerald-600/70 shadow-sm'
                  : isItemPreparing
                  ? 'bg-amber-950/20 border-amber-600/60'
                  : 'bg-charcoal-800/90 border-gray-700/80'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <span className="w-7 h-7 rounded-lg bg-charcoal-900 border border-gray-700 text-ember-400 font-mono font-extrabold text-sm flex items-center justify-center flex-shrink-0">
                    {item.quantity}x
                  </span>
                  <div>
                    <p className="font-bold text-sm text-white leading-tight">
                      {item.product_name}
                    </p>
                    <div className="mt-1 flex items-center gap-1.5 flex-wrap">
                      <SectorBadge sector={item.sector} />
                      {item.addons_snapshot?.map((add, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-1.5 py-0.5 rounded bg-gray-800 text-gray-300 border border-gray-700"
                        >
                          {add.name}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Status indicator badge */}
                <div>
                  {isItemDelivered ? (
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Entregue</span>
                  ) : isItemReady ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-700 px-2 py-0.5 rounded-full animate-bounce">
                      <Check className="w-3 h-3" />
                      <span>PRONTO</span>
                    </span>
                  ) : isItemPreparing ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-700 px-2 py-0.5 rounded-full">
                      <Flame className="w-3 h-3 animate-spin" />
                      <span>PREPARANDO</span>
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-gray-400 bg-gray-800 border border-gray-700 px-2 py-0.5 rounded-full">
                      NA FILA
                    </span>
                  )}
                </div>
              </div>

              {/* Notes */}
              {item.notes && (
                <div className="mt-2 p-1.5 rounded bg-charcoal-900 border border-gray-700/80 text-xs text-amber-300 flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span className="font-medium italic">Obs: {item.notes}</span>
                </div>
              )}

              {/* Action Buttons for Kitchen */}
              <div className="mt-3 pt-2 border-t border-gray-700/50 flex items-center justify-end gap-2">
                {item.status === 'received' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateItemStatus(item.id, 'preparing')}
                    className="py-1.5 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                  >
                    <ChefHat className="w-3.5 h-3.5" />
                    <span>Iniciar Preparo</span>
                  </button>
                )}

                {item.status === 'preparing' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateItemStatus(item.id, 'ready')}
                    className="py-1.5 px-3.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-600/30 transition animate-pulse"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Marcar como Pronto!</span>
                  </button>
                )}

                {item.status === 'ready' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateItemStatus(item.id, 'delivered')}
                    className="py-1.5 px-3 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 font-bold text-xs flex items-center gap-1.5 transition"
                  >
                    <Truck className="w-3.5 h-3.5" />
                    <span>Confirmar Entrega</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* General order notes or info */}
      {order.general_notes && (
        <div className="px-4 py-2 bg-charcoal-850/90 border-t border-gray-800 text-xs text-gray-400">
          <strong className="text-gray-300">Nota geral:</strong> {order.general_notes}
        </div>
      )}
    </div>
  );
};
