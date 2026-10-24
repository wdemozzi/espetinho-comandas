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

  // Toggle item readiness with a simple tap
  const handleToggleItemReady = (item: OrderItem) => {
    const nextStatus: OrderStatus = item.status === 'ready' ? 'preparing' : 'ready';
    db.updateOrderItemStatus(item.id, nextStatus);
  };

  // Batch update for the entire ticket
  const handleBatchUpdate = (newStatus: OrderStatus) => {
    db.updateEntireOrderStatus(order.id, newStatus, activeSectorFilter);
  };

  const isAllReady = displayedItems.every((i) => i.status === 'ready' || i.status === 'delivered');
  const isAnyPreparing = displayedItems.some((i) => i.status === 'preparing');
  const isAllDelivered = displayedItems.every((i) => i.status === 'delivered');

  // Urgency styling based on wait time
  const isUrgent = elapsedMinutes >= 20;
  const isWarning = elapsedMinutes >= 12;

  return (
    <div
      className={`rounded-2xl border transition-all shadow-xl overflow-hidden flex flex-col justify-between ${
        isAllDelivered
          ? 'bg-charcoal-900 border-gray-800 opacity-60'
          : isAllReady
          ? 'bg-charcoal-900 border-emerald-500 shadow-emerald-950/20'
          : isUrgent
          ? 'bg-charcoal-900 border-red-500 shadow-red-950/30'
          : isWarning
          ? 'bg-charcoal-900 border-amber-500 shadow-amber-950/20'
          : 'bg-charcoal-900 border-gray-700'
      }`}
    >
      {/* Ticket Header */}
      <div
        className={`px-4 py-3 border-b flex items-center justify-between ${
          isAllReady
            ? 'bg-emerald-950/70 border-emerald-800/80 text-emerald-200'
            : isUrgent
            ? 'bg-red-950/70 border-red-800 text-red-200'
            : isWarning
            ? 'bg-amber-950/70 border-amber-800 text-amber-200'
            : 'bg-charcoal-850 border-gray-800 text-gray-200'
        }`}
      >
        <div className="flex items-center gap-2.5">
          <span className="font-black text-base sm:text-lg text-white">
            {order.table_number ? `Mesa ${String(order.table_number).padStart(2, '0')}` : order.order_type.toUpperCase()}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-black/40 text-xs font-mono font-bold text-gray-300">
            #{order.order_number}
          </span>
          {order.customer_name && (
            <span className="text-xs text-gray-400 truncate max-w-[100px] hidden sm:inline">
              ({order.customer_name.split(' ')[0]})
            </span>
          )}
        </div>

        {/* Elapsed Timer & Overall Status */}
        <div className="flex items-center gap-2">
          {order.status === 'pending_confirmation' ? (
            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-amber-900/80 text-amber-300 border border-amber-600 animate-pulse">
              AGUARDANDO WHATSAPP
            </span>
          ) : isAllReady ? (
            <span className="text-[11px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-900/80 text-emerald-300 border border-emerald-600 animate-pulse">
              PRONTO
            </span>
          ) : isAnyPreparing ? (
            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-900/60 text-amber-300 border border-amber-700 flex items-center gap-1">
              <Flame className="w-3 h-3 text-amber-400 animate-pulse" />
              <span>PREPARANDO</span>
            </span>
          ) : (
            <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded-full bg-charcoal-800 text-gray-400 border border-gray-700">
              NA FILA
            </span>
          )}

          <div
            className={`flex items-center gap-1 font-mono text-xs font-bold px-2 py-0.5 rounded-lg border ${
              isUrgent
                ? 'bg-red-900/80 text-red-200 border-red-700'
                : 'bg-charcoal-800 text-gray-300 border-gray-700'
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>{elapsedMinutes}m</span>
          </div>
        </div>
      </div>

      {/* ANTI-TROTE: Pending Confirmation Warning Banner */}
      {order.status === 'pending_confirmation' && (
        <div className="p-3 bg-amber-950/70 border-b border-amber-800/80 text-amber-200 text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold flex items-center gap-1.5 text-amber-300">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              <span>Pedido Online (Retirada no Balcão)</span>
            </span>
            <span className="text-[10px] bg-red-900/90 text-red-100 font-black px-2 py-0.5 rounded border border-red-700">
              NÃO ASSAR AINDA
            </span>
          </div>
          <p className="text-[11px] text-gray-300">
            Cliente: <strong className="text-white">{order.customer_name}</strong> • Tel: <strong className="text-white">{order.customer_phone || 'Não informado'}</strong>
          </p>
          <div className="flex items-center gap-2 pt-1">
            {order.customer_phone && (
              <a
                href={`https://wa.me/55${order.customer_phone.replace(/\D/g, '')}?text=Ol%C3%A1%20${encodeURIComponent(order.customer_name || 'Cliente')}!%20Recebemos%20seu%20Pedido%20%23${order.order_number}%20na%20CT%20Conveni%C3%AAncia.%20Podemos%20iniciar%20o%20preparo%20na%20brasa%3F`}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 text-emerald-300 border border-emerald-700 text-xs font-bold flex items-center gap-1 transition"
              >
                <span>WhatsApp</span>
              </a>
            )}
            <button
              type="button"
              onClick={() => db.confirmPendingOrder(order.id)}
              className="flex-1 py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow transition flex items-center justify-center gap-1"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirmar & Assar</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Tem certeza que deseja recusar este pedido (trote/sem resposta)?')) {
                  db.cancelPendingOrder(order.id, 'Cancelado por falta de confirmação no WhatsApp');
                }
              }}
              className="py-1.5 px-2.5 rounded-lg bg-red-950/80 hover:bg-red-900 text-red-300 border border-red-800 text-xs font-bold transition"
              title="Cancelar / Trote"
            >
              <span>Recusar</span>
            </button>
          </div>
        </div>
      )}

      {/* Clean Items Ticket Body (No repetitive giant buttons) */}
      <div className="p-3.5 space-y-2 flex-1 overflow-y-auto">
        <p className="text-[10px] uppercase font-bold text-gray-500 tracking-wider px-1">
          Toque no item para marcar individualmente:
        </p>

        {displayedItems.map((item: OrderItem) => {
          const isItemReady = item.status === 'ready' || item.status === 'delivered';

          return (
            <div
              key={item.id}
              onClick={() => handleToggleItemReady(item)}
              className={`p-2.5 rounded-xl border cursor-pointer transition flex items-center justify-between gap-3 ${
                isItemReady
                  ? 'bg-emerald-950/20 border-emerald-800/60 opacity-80'
                  : 'bg-charcoal-800/90 border-gray-700 hover:border-ember-500/60'
              }`}
            >
              <div className="flex items-start gap-2.5 flex-1">
                <span
                  className={`w-7 h-7 rounded-lg font-mono font-black text-sm flex items-center justify-center flex-shrink-0 ${
                    isItemReady
                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                      : 'bg-charcoal-900 text-ember-400 border border-gray-700'
                  }`}
                >
                  {item.quantity}x
                </span>

                <div className="space-y-0.5">
                  <p
                    className={`font-bold text-sm leading-snug ${
                      isItemReady ? 'line-through text-gray-400' : 'text-white'
                    }`}
                  >
                    {item.product_name}
                  </p>

                  {/* Addons and Notes in one clean row */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <SectorBadge sector={item.sector} />
                    {item.addons_snapshot?.map((add, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-1.5 py-0.5 rounded bg-charcoal-900 text-amber-300 border border-amber-900/60 font-medium"
                      >
                        {add.name}
                      </span>
                    ))}
                    {item.notes && (
                      <span className="text-[10px] text-amber-400 italic">
                        Obs: {item.notes}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Simple Check Indicator */}
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center border flex-shrink-0 transition ${
                  isItemReady
                    ? 'bg-emerald-600 border-emerald-500 text-white'
                    : 'bg-charcoal-900 border-gray-700 text-transparent hover:border-gray-500'
                }`}
              >
                <Check className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}

        {order.general_notes && (
          <div className="p-2 rounded-lg bg-charcoal-850 border border-gray-800 text-[11px] text-amber-300 italic flex items-center gap-1.5 mt-2">
            <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Nota do pedido: {order.general_notes}</span>
          </div>
        )}
      </div>

      {/* SINGLE SOLID ACTION BUTTON PER TICKET */}
      <div className="p-3 bg-charcoal-850 border-t border-gray-800 flex-shrink-0">
        {order.status === 'pending_confirmation' ? (
          <div className="text-center py-1 text-xs font-bold text-amber-400 flex items-center justify-center gap-1.5">
            <AlertCircle className="w-4 h-4 text-amber-400" />
            <span>Aguardando confirmação do cliente para liberar preparo</span>
          </div>
        ) : !isAnyPreparing && !isAllReady && !isAllDelivered ? (
          <button
            type="button"
            onClick={() => handleBatchUpdate('preparing')}
            className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs sm:text-sm shadow-lg shadow-amber-600/30 flex items-center justify-center gap-2 transition"
          >
            <ChefHat className="w-4 h-4" />
            <span>Iniciar Preparo deste Pedido</span>
          </button>
        ) : null}

        {isAnyPreparing && !isAllReady && !isAllDelivered && (
          <button
            type="button"
            onClick={() => handleBatchUpdate('ready')}
            className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs sm:text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition animate-pulse"
          >
            <CheckCircle2 className="w-5 h-5" />
            <span>Marcar Pedido Pronto!</span>
          </button>
        )}

        {isAllReady && !isAllDelivered && (
          <button
            type="button"
            onClick={() => handleBatchUpdate('delivered')}
            className="w-full py-3 px-4 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-gray-200 border border-gray-700 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 transition"
          >
            <Truck className="w-4 h-4 text-emerald-400" />
            <span>Confirmar Entrega ao Garçom</span>
          </button>
        )}

        {isAllDelivered && (
          <div className="text-center py-1 text-xs font-bold text-gray-500 uppercase tracking-wider">
            Pedido Entregue
          </div>
        )}
      </div>
    </div>
  );
};
