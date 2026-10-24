import React, { useState, useEffect } from 'react';
import { Order, ProductionSector } from '../../types/database.types';
import { db } from '../../lib/databaseStore';
import { OrderCard } from '../../components/kitchen/OrderCard';
import { soundService } from '../../lib/sound';
import {
  ChefHat,
  Flame,
  Soup,
  Beer,
  Layers,
  Volume2,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const KitchenKdsPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>(db.getOrders());
  const [activeSector, setActiveSector] = useState<ProductionSector | 'all'>('all');
  const [activeViewMode, setActiveViewMode] = useState<'active' | 'history'>('active');

  useEffect(() => {
    return db.subscribe(() => {
      setOrders(db.getOrders());
    });
  }, []);

  const sectors = [
    { id: 'all', label: 'Todos', icon: Layers },
    { id: 'churrasqueira', label: 'Churrasqueira', icon: Flame },
    { id: 'cozinha', label: 'Cozinha', icon: Soup },
    { id: 'bar', label: 'Bar', icon: Beer },
  ];

  // Filter orders by active vs history
  const activeOrders = orders.filter((o) =>
    activeViewMode === 'active' ? o.status !== 'delivered' && o.status !== 'cancelled' : o.status === 'delivered'
  );

  const pendingCount = orders
    .flatMap((o) => o.items)
    .filter((i) => i.status === 'received' || i.status === 'preparing').length;

  const readyCount = orders
    .flatMap((o) => o.items)
    .filter((i) => i.status === 'ready').length;

  return (
    <div className="space-y-4">
      {/* Sleek KDS Header bar */}
      <div className="bg-charcoal-850 p-3 sm:p-5 rounded-2xl border border-gray-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400 flex-shrink-0">
            <ChefHat className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>Cozinha & KDS</span>
              <span className="text-xs px-2 py-0.5 rounded bg-charcoal-900 text-amber-400 border border-gray-700 font-mono">
                {pendingCount} pendente(s)
              </span>
            </h1>
            <p className="text-[11px] text-gray-400 hidden sm:block">
              Atualização em tempo real para produção e expedição
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {readyCount > 0 && (
            <span className="text-xs px-2.5 py-1 rounded-xl bg-emerald-950 text-emerald-400 border border-emerald-700 font-bold animate-pulse">
              {readyCount} pronto(s)
            </span>
          )}

          <button
            type="button"
            onClick={() => soundService.playOrderReady()}
            title="Testar sinal sonoro de pedido pronto"
            className="p-2 rounded-xl bg-charcoal-900 hover:bg-gray-700 border border-gray-700 text-amber-400 transition"
          >
            <Volume2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sector Filter & Queue Toggle */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
        {/* Sector Tabs */}
        <div className="flex items-center gap-1.5 bg-charcoal-850 p-1.5 rounded-xl border border-gray-800 overflow-x-auto no-scrollbar">
          {sectors.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSector === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSector(sec.id as ProductionSector | 'all')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-ember-600 text-white shadow'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-charcoal-800'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-charcoal-850 p-1 rounded-xl border border-gray-800 self-end sm:self-auto">
          <button
            onClick={() => setActiveViewMode('active')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              activeViewMode === 'active'
                ? 'bg-charcoal-800 text-ember-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Fila Ativa ({activeOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveViewMode('history')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
              activeViewMode === 'history'
                ? 'bg-charcoal-800 text-emerald-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Histórico</span>
          </button>
        </div>
      </div>

      {/* Orders Cards Grid */}
      {activeOrders.length === 0 ? (
        <div className="h-56 rounded-2xl bg-charcoal-850/60 border border-gray-800 flex flex-col items-center justify-center text-center p-6 text-gray-400">
          <Sparkles className="w-10 h-10 text-amber-500/50 mb-2" />
          <h3 className="text-sm font-bold text-gray-200">
            {activeViewMode === 'active' ? 'Nenhum pedido pendente na cozinha' : 'Nenhum pedido no histórico'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Novos pedidos do garçom ou dos clientes aparecerão aqui automaticamente com bipe sonoro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {activeOrders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              activeSectorFilter={activeSector}
            />
          ))}
        </div>
      )}
    </div>
  );
};
