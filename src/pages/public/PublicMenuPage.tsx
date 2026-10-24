import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../lib/databaseStore';
import { Product, RestaurantTable, Category } from '../../types/database.types';
import { formatBRL } from '../../lib/currency';
import { SectorBadge } from '../../components/common/Badge';
import {
  Flame,
  ShoppingBag,
  Plus,
  Minus,
  X,
  CheckCircle2,
  Phone,
  User,
  MapPin,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  AlertCircle,
} from 'lucide-react';

interface PublicMenuPageProps {
  tableToken?: string | null;
  onOrderCompleted?: (orderId: string) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedAddons: { name: string; price_cents: number }[];
  notes: string;
}

export const PublicMenuPage: React.FC<PublicMenuPageProps> = ({
  tableToken,
  onOrderCompleted,
}) => {
  const establishment = db.getEstablishment();
  const categories = db.getCategories();
  const products = db.getProducts();

  // Validate table if token passed
  const [table, setTable] = useState<RestaurantTable | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || '');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isBagOpen, setIsBagOpen] = useState<boolean>(false);

  // Selected product modal for choosing addons & notes
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [modalSelectedAddons, setModalSelectedAddons] = useState<{ name: string; price_cents: number }[]>([]);
  const [modalNotes, setModalNotes] = useState<string>('');

  // Checkout form (dine_in for table QR, takeout for web catalog)
  const [orderType, setOrderType] = useState<'dine_in' | 'takeout'>('takeout');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tableToken) {
      const foundTable = db.getTableByQrToken(tableToken);
      if (foundTable) {
        setTable(foundTable);
        setOrderType('dine_in');
      }
    } else {
      setOrderType('takeout');
    }
  }, [tableToken]);

  const openProductModal = (product: Product) => {
    setActiveModalProduct(product);
    setModalQuantity(1);
    setModalSelectedAddons([]);
    setModalNotes('');
  };

  const handleToggleAddon = (addon: { name: string; price_cents: number }) => {
    setModalSelectedAddons((prev) => {
      const exists = prev.some((a) => a.name === addon.name);
      return exists ? prev.filter((a) => a.name !== addon.name) : [...prev, addon];
    });
  };

  const handleAddToCartFromModal = () => {
    if (!activeModalProduct) return;
    setCart((prev) => [
      ...prev,
      {
        product: activeModalProduct,
        quantity: modalQuantity,
        selectedAddons: modalSelectedAddons,
        notes: modalNotes,
      },
    ]);
    setActiveModalProduct(null);
  };

  const handleUpdateCartQty = (index: number, delta: number) => {
    setCart((prev) => {
      const item = prev[index];
      const newQty = item.quantity + delta;
      if (newQty <= 0) return prev.filter((_, idx) => idx !== index);
      return prev.map((it, idx) => (idx === index ? { ...it, quantity: newQty } : it));
    });
  };

  const cartTotalCents = cart.reduce((acc, item) => {
    const addonsTotal = item.selectedAddons.reduce((sum, a) => sum + a.price_cents, 0);
    return acc + (item.product.price_cents + addonsTotal) * item.quantity;
  }, 0);

  const cartItemsCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  // Submit Order with anti-duplication protection
  const handleConfirmOrder = () => {
    if (cart.length === 0) {
      setErrorMessage('Sua sacola está vazia.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Por favor informe seu nome.');
      return;
    }
    if (!table) {
      const cleanPhone = customerPhone.replace(/\D/g, '');
      if (cleanPhone.length < 10) {
        setErrorMessage('Por favor informe seu WhatsApp com DDD (mínimo 10 dígitos) para confirmação do pedido.');
        return;
      }
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      let tabId: string | undefined;

      // If at table, associate with or open comanda for this table
      if (table) {
        let activeTab = table.active_tab || db.getTabs().find((t) => t.table_id === table.id && t.status === 'open');
        if (!activeTab) {
          activeTab = db.openTab({
            table_id: table.id,
            opened_by_user_id: 'client_qr',
            customer_name: customerName,
            customer_phone: customerPhone,
            notes: 'Aberto via QR Code do Cliente',
          });
        }
        tabId = activeTab.id;
      }

      const order = db.createOrder({
        tab_id: tabId,
        origin: table ? 'table_qr' : 'external_catalog',
        order_type: orderType,
        customer_name: customerName,
        customer_phone: customerPhone,
        general_notes: generalNotes || undefined,
        items: cart.map((ci) => ({
          product_id: ci.product.id,
          quantity: ci.quantity,
          addons: ci.selectedAddons,
          notes: ci.notes || undefined,
        })),
      });

      setOrderSuccessId(order.id);
      setCart([]);
      setIsBagOpen(false);

      if (onOrderCompleted) {
        onOrderCompleted(order.id);
      }
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao enviar pedido.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a17] text-gray-100 pb-24">
      {/* Hero / Brand Banner */}
      <div className="relative bg-gradient-to-b from-charcoal-850 to-charcoal-900 border-b border-gray-800 p-5 sm:p-8">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
          <div className="relative">
            <img
              src="/ct-logo.png"
              alt={establishment.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-contain shadow-2xl shadow-purple-600/50 border-2 border-purple-500/40 bg-charcoal-950 p-1 flex-shrink-0"
            />
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-charcoal-900" />
          </div>

          <div className="space-y-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center justify-center sm:justify-start gap-2">
              <span>{establishment.name}</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-400 max-w-xl">{establishment.description}</p>
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-gray-400">
              <span className="flex items-center gap-1 text-amber-400 font-medium">
                <Clock className="w-3.5 h-3.5" />
                <span>{establishment.opening_hours}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1 text-gray-300">
                <Phone className="w-3.5 h-3.5" />
                <span>{establishment.phone}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Table Banner or Delivery Badge */}
        <div className="max-w-4xl mx-auto mt-4">
          {table ? (
            <div className="p-3 rounded-xl bg-ember-950/50 border border-ember-800/80 flex items-center justify-between text-xs text-ember-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>
                  Você está conectado na <strong className="text-white font-bold">{table.label}</strong>
                </span>
              </div>
              <span className="text-[11px] bg-ember-900/60 px-2 py-0.5 rounded text-ember-200">
                Atendimento na Mesa
              </span>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-center justify-between text-xs text-purple-200">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-purple-400" />
                <span>Cardápio Oficial para Pedidos com <strong>Retirada no Balcão</strong></span>
              </div>
              <span className="text-[11px] bg-purple-900/60 px-2.5 py-0.5 rounded-full text-purple-200 font-semibold border border-purple-700/50">
                Pague e Retire
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Categories Sticky Bar */}
      <div className="sticky top-0 z-30 bg-[#0c0a17]/95 backdrop-blur border-b border-gray-800 py-3 px-4">
        <div className="max-w-4xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar">
          {categories.map((cat: Category) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === cat.id
                  ? 'bg-ember-600 text-white shadow-lg shadow-ember-600/30 ring-2 ring-ember-400'
                  : 'bg-charcoal-800 text-gray-400 hover:text-gray-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Products Feed */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {products
            .filter((p) => p.category_id === selectedCategory && p.is_available)
            .map((product) => (
              <div
                key={product.id}
                onClick={() => openProductModal(product)}
                className="group p-4 rounded-2xl bg-charcoal-850/80 border border-gray-800 hover:border-ember-500/50 transition cursor-pointer flex gap-4 items-center justify-between"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-white group-hover:text-ember-400 transition">
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span className="font-mono font-black text-ember-400 text-sm">
                      {formatBRL(product.price_cents)}
                    </span>
                    <SectorBadge sector={product.sector} />
                  </div>
                </div>

                {product.image_url && (
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-charcoal-900 border border-gray-700 flex-shrink-0">
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </div>
                )}
              </div>
            ))}
        </div>
      </div>

      {/* Floating Bottom Cart Bar */}
      {cartItemsCount > 0 && !isBagOpen && (
        <div className="fixed bottom-4 inset-x-4 max-w-lg mx-auto z-40">
          <button
            type="button"
            onClick={() => setIsBagOpen(true)}
            className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-ember-600 via-ember-500 to-amber-500 text-white font-extrabold text-sm shadow-2xl shadow-ember-600/40 flex items-center justify-between ring-2 ring-white/20 animate-pulse"
          >
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-lg bg-black/30 flex items-center justify-center font-mono text-xs">
                {cartItemsCount}
              </span>
              <span>Ver Minha Sacola</span>
            </div>
            <div className="flex items-center gap-2 font-mono text-base">
              <span>{formatBRL(cartTotalCents)}</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Modal: Customize & Add Product to Cart */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md bg-charcoal-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
            {activeModalProduct.image_url && (
              <div className="h-44 w-full bg-charcoal-950 overflow-hidden relative">
                <img
                  src={activeModalProduct.image_url}
                  alt={activeModalProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={() => setActiveModalProduct(null)}
                  className="absolute right-3 top-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            <div className="p-5 space-y-4 overflow-y-auto flex-1">
              <div>
                <h3 className="text-lg font-extrabold text-white">{activeModalProduct.name}</h3>
                <p className="text-xs text-gray-400 mt-1">{activeModalProduct.description}</p>
                <p className="font-mono font-black text-ember-400 text-base mt-2">
                  {formatBRL(activeModalProduct.price_cents)}
                </p>
              </div>

              {/* Addons Selection */}
              {activeModalProduct.addons && activeModalProduct.addons.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                    Ponto / Acompanhamentos Opcionais:
                  </h4>
                  <div className="space-y-1.5">
                    {activeModalProduct.addons.map((add) => {
                      const isSelected = modalSelectedAddons.some((a) => a.name === add.name);
                      return (
                        <div
                          key={add.id}
                          onClick={() => handleToggleAddon({ name: add.name, price_cents: add.price_cents })}
                          className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition ${
                            isSelected
                              ? 'bg-ember-950/60 border-ember-500 text-white'
                              : 'bg-charcoal-800 border-gray-700 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <span>{add.name}</span>
                          {add.price_cents > 0 && (
                            <span className="font-mono text-ember-400 font-bold">
                              +{formatBRL(add.price_cents)}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Notes */}
              <div className="pt-2 border-t border-gray-800">
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  Alguma observação para a cozinha?
                </label>
                <input
                  type="text"
                  placeholder="Ex: sem cebola, ponto mais para mal passada"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-ember-500"
                />
              </div>

              {/* Quantity */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                <span className="text-xs font-bold text-gray-300">Quantidade:</span>
                <div className="flex items-center gap-2 bg-charcoal-800 border border-gray-700 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                    className="p-1 rounded text-gray-300 hover:text-white"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold text-white px-2 text-sm">{modalQuantity}</span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity(modalQuantity + 1)}
                    className="p-1 rounded text-gray-300 hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Bottom Button */}
            <div className="p-4 bg-charcoal-850 border-t border-gray-800">
              <button
                type="button"
                onClick={handleAddToCartFromModal}
                className="w-full py-3 px-4 rounded-xl bg-ember-600 hover:bg-ember-500 text-white font-extrabold text-sm shadow-lg shadow-ember-600/30 flex items-center justify-between transition"
              >
                <span>Adicionar à Sacola</span>
                <span className="font-mono">
                  {formatBRL(
                    (activeModalProduct.price_cents +
                      modalSelectedAddons.reduce((acc, a) => acc + a.price_cents, 0)) *
                      modalQuantity
                  )}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer / Full Modal: Sacola & Checkout */}
      {isBagOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-charcoal-900 border border-gray-700 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 bg-charcoal-850 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-ember-400" />
                <h3 className="font-extrabold text-base text-white">Sua Sacola de Pedidos</h3>
              </div>
              <button
                onClick={() => setIsBagOpen(false)}
                className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="m-3 p-3 rounded-lg bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Bag Items list */}
            <div className="p-4 space-y-3 overflow-y-auto flex-1">
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-charcoal-800 border border-gray-700 flex items-center justify-between gap-3"
                >
                  <div className="space-y-0.5 flex-1">
                    <p className="font-bold text-xs text-white">{item.product.name}</p>
                    {item.selectedAddons.length > 0 && (
                      <p className="text-[11px] text-gray-400">
                        {item.selectedAddons.map((a) => a.name).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-amber-300 italic">Obs: {item.notes}</p>
                    )}
                    <p className="font-mono text-xs font-bold text-ember-400">
                      {formatBRL(
                        (item.product.price_cents +
                          item.selectedAddons.reduce((acc, a) => acc + a.price_cents, 0)) *
                          item.quantity
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-charcoal-900 border border-gray-700 rounded-lg p-0.5">
                    <button
                      type="button"
                      onClick={() => handleUpdateCartQty(idx, -1)}
                      className="p-1 rounded text-gray-300 hover:text-white"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="font-mono text-xs font-bold text-white px-2">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateCartQty(idx, 1)}
                      className="p-1 rounded text-gray-300 hover:text-white"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}

              {/* Checkout Form */}
              <div className="space-y-3 pt-3 border-t border-gray-800">
                <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                  Dados para Confirmação:
                </h4>

                {!table && (
                  <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-start gap-2.5 text-xs text-purple-200">
                    <ShoppingBag className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-white">Modalidade: Retirada no Balcão</p>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        Retire na <strong className="text-gray-300">{establishment.name}</strong> • {establishment.address}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 block mb-1">Seu Nome:</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: João da Silva"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-ember-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 block mb-1">WhatsApp / Telefone para Contato:</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
                    <input
                      type="text"
                      placeholder="(44) 99999-9999"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-ember-500"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Avisaremos por WhatsApp assim que os itens estiverem prontos para retirada.</p>
                </div>
              </div>
            </div>

            {/* Bottom Finalize */}
            <div className="p-4 bg-charcoal-850 border-t border-gray-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400">Total a Pagar:</span>
                <span className="font-mono text-lg font-black text-ember-400">
                  {formatBRL(cartTotalCents)}
                </span>
              </div>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleConfirmOrder}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 transition disabled:opacity-50"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Confirmar e Enviar Pedido</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Order Success Confirmation Modal */}
      {orderSuccessId && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-charcoal-900 border border-emerald-500/80 rounded-2xl p-6 text-center space-y-4 shadow-2xl my-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600/20 border border-emerald-500 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-xl font-black text-white">
                {table ? 'Pedido Confirmado na Mesa!' : 'Pedido Registrado!'}
              </h3>
              <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                {table
                  ? 'Seu pedido foi enviado diretamente para a nossa cozinha e será entregue na sua mesa!'
                  : 'Para iniciarmos o preparo dos seus espetinhos na brasa, confirme seu pedido pelo nosso WhatsApp abaixo:'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-charcoal-800 border border-gray-700 text-xs space-y-1">
              <p className="text-gray-400">Código do Pedido:</p>
              <p className="font-mono text-sm font-bold text-ember-400">{orderSuccessId}</p>
            </div>

            {!table && (
              <a
                href={`https://wa.me/5544997357463?text=${encodeURIComponent(
                  `Olá CT Conveniência! Acabei de fazer o Pedido #${orderSuccessId} no nome de ${customerName}. Gostaria de confirmar para começarem a assar!`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/40"
              >
                <span>Confirmar no WhatsApp (1 Clique)</span>
              </a>
            )}

            <button
              type="button"
              onClick={() => setOrderSuccessId(null)}
              className="w-full py-2.5 px-4 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition"
            >
              Concluir
            </button>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
