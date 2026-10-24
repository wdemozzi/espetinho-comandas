import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { RestaurantTable, Product, Tab } from '../../types/database.types';
import { db } from '../../lib/databaseStore';
import { useAuth } from '../../contexts/AuthContext';
import { formatBRL } from '../../lib/currency';
import {
  X,
  Plus,
  Minus,
  UtensilsCrossed,
  Flame,
  CheckCircle2,
  Trash2,
  AlertCircle,
  ShoppingBag,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';
import { SectorBadge } from '../common/Badge';

interface OrderLauncherModalProps {
  table: RestaurantTable;
  tab: Tab;
  isOpen: boolean;
  onClose: () => void;
  onOrderPlaced: () => void;
}

interface DraftItem {
  product: Product;
  quantity: number;
  selectedAddons: { name: string; price_cents: number }[];
  notes: string;
}

export const OrderLauncherModal: React.FC<OrderLauncherModalProps> = ({
  table,
  tab,
  isOpen,
  onClose,
  onOrderPlaced,
}) => {
  const { currentUser } = useAuth();
  const categories = db.getCategories();
  const products = db.getProducts();

  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(categories[0]?.id || '');
  const [draftItems, setDraftItems] = useState<DraftItem[]>([]);
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Mobile View Switcher: 'catalog' or 'cart'
  const [mobileTab, setMobileTab] = useState<'catalog' | 'cart'>('catalog');

  // Addon modal for specific product
  const [addonProduct, setAddonProduct] = useState<Product | null>(null);
  const [tempAddons, setTempAddons] = useState<{ name: string; price_cents: number }[]>([]);
  const [tempNotes, setTempNotes] = useState<string>('');

  if (!isOpen) return null;

  const currentCategoryProducts = products.filter(
    (p) => p.category_id === selectedCategoryId && p.is_available
  );

  const getProductQuantityInDraft = (productId: string) => {
    return draftItems
      .filter((i) => i.product.id === productId)
      .reduce((sum, i) => sum + i.quantity, 0);
  };

  const handleAddProductSimple = (product: Product) => {
    // If product has addons, open customization popup
    if (product.addons && product.addons.length > 0) {
      setAddonProduct(product);
      setTempAddons([]);
      setTempNotes('');
      return;
    }

    setDraftItems((prev) => {
      const existing = prev.find(
        (i) => i.product.id === product.id && i.selectedAddons.length === 0 && !i.notes
      );
      if (existing) {
        return prev.map((i) =>
          i === existing ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [
        ...prev,
        {
          product,
          quantity: 1,
          selectedAddons: [],
          notes: '',
        },
      ];
    });
  };

  const handleConfirmCustomAddon = () => {
    if (!addonProduct) return;
    setDraftItems((prev) => [
      ...prev,
      {
        product: addonProduct,
        quantity: 1,
        selectedAddons: tempAddons,
        notes: tempNotes,
      },
    ]);
    setAddonProduct(null);
  };

  const handleUpdateQuantity = (index: number, delta: number) => {
    setDraftItems((prev) => {
      const item = prev[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) {
        return prev.filter((_, idx) => idx !== index);
      }
      return prev.map((it, idx) => (idx === index ? { ...it, quantity: newQty } : it));
    });
  };

  const handleRemoveDraftItem = (index: number) => {
    setDraftItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const orderTotalCents = draftItems.reduce((acc, item) => {
    const addonsTotal = item.selectedAddons.reduce((sum, a) => sum + a.price_cents, 0);
    return acc + (item.product.price_cents + addonsTotal) * item.quantity;
  }, 0);

  const totalItemCount = draftItems.reduce((sum, i) => sum + i.quantity, 0);

  const handleConfirmOrder = () => {
    if (draftItems.length === 0) {
      setErrorMsg('Adicione pelo menos 1 item ao pedido');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg(null);

      db.createOrder({
        tab_id: tab.id,
        origin: 'waiter',
        order_type: 'dine_in',
        created_by: currentUser.id,
        general_notes: generalNotes || undefined,
        items: draftItems.map((di) => ({
          product_id: di.product.id,
          quantity: di.quantity,
          addons: di.selectedAddons,
          notes: di.notes || undefined,
        })),
      });

      setDraftItems([]);
      setGeneralNotes('');
      onOrderPlaced();
      onClose();
    } catch (err: unknown) {
      setErrorMsg((err as Error).message || 'Erro ao lançar pedido');
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center sm:p-4 bg-black/85 backdrop-blur-sm overflow-hidden">
      <div className="relative w-full h-full sm:h-auto sm:max-h-[92vh] sm:max-w-5xl bg-charcoal-900 sm:border border-gray-700 sm:rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-3.5 sm:p-5 bg-charcoal-850 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-ember-600/20 border border-ember-500/40 flex items-center justify-center text-ember-400 flex-shrink-0">
              <UtensilsCrossed className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Lançar Pedido
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-ember-950 text-ember-400 border border-ember-800 text-xs font-bold">
                  {table.label}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-gray-400">
                {tab.customer_name ? `Cliente: ${tab.customer_name}` : 'Comanda aberta'}
                {' • '}
                Garçom: <span className="text-gray-200 font-semibold">{currentUser.full_name}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition"
          >
            <X className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>

        {/* Mobile Navigation Tabs (Cardápio vs Rodada) */}
        <div className="flex lg:hidden bg-charcoal-950 border-b border-gray-800 flex-shrink-0">
          <button
            type="button"
            onClick={() => setMobileTab('catalog')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
              mobileTab === 'catalog'
                ? 'border-ember-500 text-ember-400 bg-charcoal-900'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Flame className="w-4 h-4" />
            <span>Cardápio de Produtos</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileTab('cart')}
            className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 border-b-2 transition ${
              mobileTab === 'cart'
                ? 'border-ember-500 text-ember-400 bg-charcoal-900'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              Rodada ({totalItemCount}) {orderTotalCents > 0 && `• ${formatBRL(orderTotalCents)}`}
            </span>
          </button>
        </div>

        {errorMsg && (
          <div className="m-3 p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2 flex-shrink-0">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Main Content Area: Responsive side-by-side on desktop, or tabs on mobile */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Products Catalog (Visible if mobileTab === 'catalog' OR on Desktop) */}
          <div
            className={`lg:col-span-7 flex flex-col border-b lg:border-b-0 lg:border-r border-gray-800 overflow-hidden ${
              mobileTab === 'catalog' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Category Pills */}
            <div className="flex gap-1.5 p-2.5 sm:p-3 bg-charcoal-850/90 border-b border-gray-800 overflow-x-auto flex-shrink-0 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoryId(cat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCategoryId === cat.id
                      ? 'bg-ember-600 text-white shadow'
                      : 'bg-charcoal-800 text-gray-300 hover:bg-gray-700 border border-gray-700/60'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Products List (Full height scrollable) */}
            <div className="p-3 sm:p-4 overflow-y-auto space-y-2.5 flex-1 pb-20 lg:pb-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {currentCategoryProducts.map((prod) => {
                  const qtyInDraft = getProductQuantityInDraft(prod.id);
                  const hasAddons = prod.addons && prod.addons.length > 0;

                  return (
                    <div
                      key={prod.id}
                      className={`p-3 rounded-2xl border transition flex flex-col justify-between ${
                        qtyInDraft > 0
                          ? 'bg-ember-950/20 border-ember-500/70'
                          : 'bg-charcoal-800/80 border-gray-700/80 hover:border-gray-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-bold text-sm text-gray-100 leading-snug">
                            {prod.name}
                          </span>
                          <SectorBadge sector={prod.sector} />
                        </div>
                        <p className="text-xs text-gray-400 line-clamp-2 mb-2 leading-relaxed">
                          {prod.description}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-gray-700/60">
                        <span className="font-mono font-extrabold text-ember-400 text-sm">
                          {formatBRL(prod.price_cents)}
                        </span>

                        {hasAddons ? (
                          <button
                            type="button"
                            onClick={() => handleAddProductSimple(prod)}
                            className="py-1.5 px-3 rounded-xl bg-ember-600 hover:bg-ember-500 text-white font-bold text-xs flex items-center gap-1 shadow transition"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
                            <span>{qtyInDraft > 0 ? `${qtyInDraft}x • Opções` : '+ Adicionar'}</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleAddProductSimple(prod)}
                            className="py-1.5 px-3.5 rounded-xl bg-ember-600 hover:bg-ember-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition"
                          >
                            <Plus className="w-4 h-4" />
                            <span>{qtyInDraft > 0 ? `${qtyInDraft}x Adicionar` : 'Adicionar'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Mobile Bottom Floating Bar when viewing Catalog with items */}
            {totalItemCount > 0 && (
              <div className="lg:hidden fixed bottom-0 inset-x-0 p-3 bg-charcoal-900/95 border-t border-gray-800 backdrop-blur z-20">
                <button
                  type="button"
                  onClick={() => setMobileTab('cart')}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-ember-600 via-ember-500 to-amber-500 text-white font-extrabold text-sm shadow-xl flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-4 h-4" />
                    <span>Ver Rodada ({totalItemCount} itens)</span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span>{formatBRL(orderTotalCents)}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </button>
              </div>
            )}
          </div>

          {/* Current Order Round Items (Visible if mobileTab === 'cart' OR on Desktop) */}
          <div
            className={`lg:col-span-5 flex flex-col bg-charcoal-850/70 overflow-hidden ${
              mobileTab === 'cart' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            <div className="p-3.5 border-b border-gray-800 flex items-center justify-between flex-shrink-0">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <Flame className="w-4 h-4 text-ember-400" />
                <span>Itens da Rodada ({totalItemCount})</span>
              </h3>
              <span className="font-mono font-extrabold text-ember-400 text-sm">
                {formatBRL(orderTotalCents)}
              </span>
            </div>

            {/* Draft Items List */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5">
              {draftItems.length === 0 ? (
                <div className="h-56 flex flex-col items-center justify-center text-center text-gray-500 p-4">
                  <UtensilsCrossed className="w-10 h-10 mb-2 opacity-30 text-gray-400" />
                  <p className="text-sm font-bold text-gray-300">Nenhum item adicionado ainda</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Toque na aba "Cardápio de Produtos" e selecione os itens desejados.
                  </p>
                  <button
                    type="button"
                    onClick={() => setMobileTab('catalog')}
                    className="mt-4 px-4 py-2 rounded-xl bg-charcoal-800 text-ember-400 text-xs font-bold border border-gray-700"
                  >
                    Ver Cardápio
                  </button>
                </div>
              ) : (
                draftItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-charcoal-800 border border-gray-700 space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-xs font-bold text-white">{item.product.name}</p>
                        <span className="text-[11px] text-gray-400 font-mono">
                          {formatBRL(item.product.price_cents)} un.
                        </span>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-1.5 bg-charcoal-900 border border-gray-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, -1)}
                          className="p-1 rounded text-gray-300 hover:text-white hover:bg-gray-800"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <span className="px-2 text-xs font-bold text-white font-mono">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleUpdateQuantity(idx, 1)}
                          className="p-1 rounded text-gray-300 hover:text-white hover:bg-gray-800"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveDraftItem(idx)}
                        className="text-gray-500 hover:text-red-400 p-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Addons List */}
                    {item.selectedAddons.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {item.selectedAddons.map((add, i) => (
                          <span
                            key={i}
                            className="text-[10px] px-2 py-0.5 rounded bg-charcoal-900 border border-gray-700 text-ember-300 font-medium"
                          >
                            {add.name}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Item observation */}
                    <input
                      type="text"
                      placeholder="Observação (ex: bem passado, sem sal)"
                      value={item.notes}
                      onChange={(e) => {
                        const val = e.target.value;
                        setDraftItems((prev) =>
                          prev.map((it, i) => (i === idx ? { ...it, notes: val } : it))
                        );
                      }}
                      className="w-full px-2.5 py-1.5 bg-charcoal-900 border border-gray-700 rounded-lg text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-ember-500"
                    />
                  </div>
                ))
              )}
            </div>

            {/* Bottom Actions Form */}
            <div className="p-3.5 sm:p-4 bg-charcoal-900 border-t border-gray-800 space-y-3 flex-shrink-0">
              <input
                type="text"
                placeholder="Observação geral da rodada (opcional)"
                value={generalNotes}
                onChange={(e) => setGeneralNotes(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-xl text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-ember-500"
              />

              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Total desta Rodada:</span>
                <span className="font-mono text-base font-black text-ember-400">
                  {formatBRL(orderTotalCents)}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setMobileTab('catalog')}
                  className="lg:hidden py-3 px-3 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-gray-300 font-bold text-xs border border-gray-700 transition"
                >
                  + Mais Itens
                </button>

                <button
                  type="button"
                  disabled={draftItems.length === 0 || isSubmitting}
                  onClick={handleConfirmOrder}
                  className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-ember-600 via-ember-500 to-amber-500 hover:from-ember-500 text-white font-extrabold text-sm shadow-xl shadow-ember-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Enviar para a Cozinha</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Addon / Customization Modal for Product */}
      {addonProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-charcoal-900 border border-gray-700 rounded-2xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-base text-white">{addonProduct.name}</h3>
                <p className="text-xs text-ember-400 font-mono font-bold mt-0.5">
                  {formatBRL(addonProduct.price_cents)}
                </p>
              </div>
              <button
                onClick={() => setAddonProduct(null)}
                className="p-1.5 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Addons list */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-300 uppercase tracking-wider block">
                Escolha o Ponto / Opcionais:
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {addonProduct.addons?.map((add) => {
                  const isChecked = tempAddons.some((a) => a.name === add.name);
                  return (
                    <button
                      key={add.id}
                      type="button"
                      onClick={() => {
                        setTempAddons((prev) =>
                          isChecked ? prev.filter((a) => a.name !== add.name) : [...prev, add]
                        );
                      }}
                      className={`w-full p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition ${
                        isChecked
                          ? 'bg-ember-600 text-white border-ember-500 shadow'
                          : 'bg-charcoal-800 text-gray-300 border-gray-700 hover:border-gray-600'
                      }`}
                    >
                      <span>{add.name}</span>
                      {add.price_cents > 0 && (
                        <span className="font-mono opacity-90">+{formatBRL(add.price_cents)}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="text-xs font-semibold text-gray-300 block mb-1">
                Observação (opcional):
              </label>
              <input
                type="text"
                placeholder="Ex: pouco sal, caprichar na farofa"
                value={tempNotes}
                onChange={(e) => setTempNotes(e.target.value)}
                className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-ember-500"
              />
            </div>

            <button
              type="button"
              onClick={handleConfirmCustomAddon}
              className="w-full py-3 rounded-xl bg-ember-600 hover:bg-ember-500 text-white font-extrabold text-sm shadow-lg shadow-ember-600/30 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Adicionar ao Pedido</span>
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
};
