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
    { id: 'all', label: 'Todos os Setores', icon: Layers },
    { id: 'churrasqueira', label: 'Churrasqueira', icon: Flame },
    { id: 'cozinha', label: 'Cozinha / Porções', icon: Soup },
    { id: 'bar', label: 'Bar & Bebidas', icon: Beer },
  ];

  // Filter orders by active vs history
  const activeOrders = orders.filter((o) =>
    activeViewMode === 'active' ? o.status !== 'delivered' && o.status !== 'cancelled' : o.status === 'delivered'
  );

  const pendingItemsCount = orders
    .flatMap((o) => o.items)
    .filter((i) => i.status === 'received' || i.status === 'preparing').length;

  const readyItemsCount = orders
    .flatMap((o) => o.items)
    .filter((i) => i.status === 'ready').length;

  return (
    <div className="space-y-6">
      {/* KDS Header */}
      <div className="bg-charcoal-850 p-4 sm:p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 border border-orange-500/40 flex items-center justify-center text-orange-400">
              <ChefHat className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                Painel da Cozinha & KDS
              </h1>
              <p className="text-xs text-gray-400">
                Gerenciamento de produção em tempo real com separação por setores
              </p>
            </div>
          </div>
        </div>

        {/* Real-time counters & audio chime */}
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-charcoal-900 border border-gray-700 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs text-gray-300 font-semibold">{pendingItemsCount} Em fila/preparo</span>
          </div>

          <div className="px-3.5 py-1.5 rounded-xl bg-charcoal-900 border border-gray-700 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-xs text-gray-300 font-semibold">{readyItemsCount} Prontos</span>
          </div>

          <button
            type="button"
            onClick={() => soundService.playOrderReady()}
            title="Testar sinal sonoro de pedido pronto"
            className="p-2 rounded-xl bg-charcoal-900 hover:bg-gray-700 border border-gray-700 text-amber-400 flex items-center gap-1.5 text-xs font-semibold transition"
          >
            <Volume2 className="w-4 h-4" />
            <span className="hidden sm:inline">Testar Som</span>
          </button>
        </div>
      </div>

      {/* Sector Pills and Active/History Toggle */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Sector Tabs */}
        <div className="flex items-center gap-1.5 bg-charcoal-850 p-1.5 rounded-xl border border-gray-800 overflow-x-auto w-full sm:w-auto">
          {sectors.map((sec) => {
            const Icon = sec.icon;
            const isActive = activeSector === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setActiveSector(sec.id as ProductionSector | 'all')}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  isActive
                    ? 'bg-ember-600 text-white shadow-md shadow-ember-700/30'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-charcoal-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{sec.label}</span>
              </button>
            );
          })}
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-charcoal-850 p-1 rounded-xl border border-gray-800">
          <button
            onClick={() => setActiveViewMode('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeViewMode === 'active'
                ? 'bg-charcoal-800 text-ember-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Fila Ativa ({activeOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveViewMode('history')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
              activeViewMode === 'history'
                ? 'bg-charcoal-800 text-emerald-400'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Histórico Entregues</span>
          </button>
        </div>
      </div>

      {/* Orders Cards Grid */}
      {activeOrders.length === 0 ? (
        <div className="h-64 rounded-2xl bg-charcoal-850/60 border border-gray-800 flex flex-col items-center justify-center text-center p-6 text-gray-400">
          <Sparkles className="w-10 h-10 text-amber-500/50 mb-3" />
          <h3 className="text-base font-bold text-gray-200">
            {activeViewMode === 'active' ? 'Nenhum pedido pendente no momento' : 'Nenhum pedido no histórico'}
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-sm">
            Novos pedidos lançados pelo garçom ou pelo cardápio QR aparecerão automaticamente aqui com aviso sonoro.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
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
