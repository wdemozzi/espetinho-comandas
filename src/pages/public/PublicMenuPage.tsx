import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../lib/databaseStore';
import { Product, RestaurantTable, Category } from '../../types/database.types';
import { formatBRL } from '../../lib/currency';
import { SectorBadge } from '../../components/common/Badge';
import { validateCustomerName, validateBrazilianMobilePhone, formatPhoneMask, validateTextNoProfanity } from '../../lib/validators';
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
  Share2,
  Copy,
  Check,
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

  // Follow-up pós-adição para produtos de escolha única (1 sabor por item, ex: Catupiry, Caipirinha)
  const [singleChoiceFollowUp, setSingleChoiceFollowUp] = useState<{
    product: Product;
    lastAddonName: string;
    countAdded: number;
    stepNumber: number;
  } | null>(null);
  const [flavorStepCount, setFlavorStepCount] = useState<number>(1);

  // Checkout form (dine_in for table QR, takeout for web catalog)
  const [orderType, setOrderType] = useState<'dine_in' | 'takeout'>('takeout');
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [orderSuccessId, setOrderSuccessId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedShareToast, setCopiedShareToast] = useState<boolean>(false);

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
    setModalNotes('');
    setSingleChoiceFollowUp(null);
    setFlavorStepCount(1);

    const isGenericSingle =
      product.addon_selection_mode === 'single' ||
      (product.addons && product.addons.some((a) => a.addon_type === 'single')) ||
      product.name.toLowerCase().includes('catupiry') ||
      product.name.toLowerCase().includes('caipirin') ||
      product.name.toLowerCase().includes('caipira') ||
      product.name.toLowerCase().includes('sabor') ||
      (product.addon_selection_mode !== 'multiple' &&
        Boolean(product.addons && product.addons.length >= 2 && product.addons.every((a) => a.price_cents === 0)));

    if (isGenericSingle && product.addons && product.addons.length > 0) {
      const defaultOption =
        product.addons.find((a) => a.price_cents === 0) ||
        product.addons[0];
      setModalSelectedAddons(defaultOption ? [{ name: defaultOption.name, price_cents: defaultOption.price_cents }] : []);
    } else {
      setModalSelectedAddons([]);
    }
  };

  const handleSelectSingleAddon = (addon: { name: string; price_cents: number }) => {
    setModalSelectedAddons([{ name: addon.name, price_cents: addon.price_cents }]);
  };

  const handleToggleAddon = (addon: { name: string; price_cents: number }) => {
    setModalSelectedAddons((prev) => {
      const exists = prev.some((a) => a.name === addon.name);
      return exists ? prev.filter((a) => a.name !== addon.name) : [...prev, addon];
    });
  };

  const handleAddToCartFromModal = () => {
    if (!activeModalProduct) return;

    const isGenericSingle =
      activeModalProduct.addon_selection_mode === 'single' ||
      (activeModalProduct.addons && activeModalProduct.addons.some((a) => a.addon_type === 'single')) ||
      activeModalProduct.name.toLowerCase().includes('catupiry') ||
      activeModalProduct.name.toLowerCase().includes('caipirin') ||
      activeModalProduct.name.toLowerCase().includes('caipira') ||
      activeModalProduct.name.toLowerCase().includes('sabor') ||
      (activeModalProduct.addon_selection_mode !== 'multiple' &&
        Boolean(activeModalProduct.addons && activeModalProduct.addons.length >= 2 && activeModalProduct.addons.every((a) => a.price_cents === 0)));

    const selectedFlavor = modalSelectedAddons[0]?.name.replace(/^(Espeto|Sabor):\s*/i, '') || 'Opção selecionada';
    const currentProduct = activeModalProduct;
    const currentNotes = modalNotes;
    const currentAddons = [...modalSelectedAddons];
    const currentQuantity = modalQuantity;
    const currentStep = flavorStepCount;

    setCart((prev) => [
      ...prev,
      {
        product: currentProduct,
        quantity: currentQuantity,
        selectedAddons: currentAddons,
        notes: currentNotes,
      },
    ]);

    // Se for produto com escolha única (1 sabor por espeto/bebida), exibe imediatamente a opção de pedir mais outro sabor
    if (isGenericSingle) {
      setSingleChoiceFollowUp({
        product: currentProduct,
        lastAddonName: selectedFlavor,
        countAdded: currentQuantity,
        stepNumber: currentStep,
      });
      return;
    }

    setActiveModalProduct(null);
  };

  // Follow-up: Escolher outro sabor para o próximo espetinho / bebida
  const handlePickAnotherFlavor = () => {
    if (!singleChoiceFollowUp) return;
    setFlavorStepCount((prev) => prev + 1);
    setModalSelectedAddons([]);
    setModalQuantity(1);
    setModalNotes('');
    setSingleChoiceFollowUp(null);
  };

  // Follow-up: Manter o mesmo sabor (+1)
  const handleRepeatSameFlavor = () => {
    if (!singleChoiceFollowUp) return;
    const { product } = singleChoiceFollowUp;
    setCart((prev) => {
      const lastIndex = prev.length - 1;
      if (lastIndex >= 0 && prev[lastIndex].product.id === product.id) {
        return prev.map((item, idx) =>
          idx === lastIndex ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      return prev;
    });
    setSingleChoiceFollowUp((prev) =>
      prev ? { ...prev, countAdded: prev.countAdded + 1 } : null
    );
  };

  // Follow-up: Concluir e fechar modal
  const handleFinishFollowUp = () => {
    setSingleChoiceFollowUp(null);
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
    const nameCheck = validateCustomerName(customerName);
    if (!nameCheck.isValid) {
      setErrorMessage(nameCheck.error || 'Por favor informe um nome válido.');
      return;
    }

    if (!table) {
      const phoneCheck = validateBrazilianMobilePhone(customerPhone);
      if (!phoneCheck.isValid) {
        setErrorMessage(phoneCheck.error || 'Por favor informe um WhatsApp válido com DDD.');
        return;
      }
    } else if (customerPhone.trim()) {
      const phoneCheck = validateBrazilianMobilePhone(customerPhone);
      if (!phoneCheck.isValid) {
        setErrorMessage(phoneCheck.error || 'WhatsApp informado é inválido.');
        return;
      }
    }

    if (generalNotes && generalNotes.trim()) {
      const notesCheck = validateTextNoProfanity(generalNotes, 'observação geral');
      if (!notesCheck.isValid) {
        setErrorMessage(notesCheck.error || 'A observação contém termos inadequados.');
        return;
      }
    }

    for (const item of cart) {
      if (item.notes && item.notes.trim()) {
        const itemNoteCheck = validateTextNoProfanity(item.notes, `observação do item "${item.product.name}"`);
        if (!itemNoteCheck.isValid) {
          setErrorMessage(itemNoteCheck.error || 'Observação contém termos inadequados.');
          return;
        }
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
              <span>•</span>
              <button
                type="button"
                onClick={() => {
                  const shareUrl = window.location.origin + (table ? `/?mesa=${table.table_number}` : '/?view=cardapio');
                  if (navigator.share) {
                    navigator.share({
                      title: `${establishment.name} - Cardápio Digital`,
                      text: 'Acesse nosso cardápio de espetinhos e bebidas!',
                      url: shareUrl,
                    }).catch(() => {});
                  } else {
                    navigator.clipboard.writeText(shareUrl);
                    setCopiedShareToast(true);
                    setTimeout(() => setCopiedShareToast(false), 2500);
                  }
                }}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-900 border border-purple-700/60 text-purple-300 hover:text-white text-[11px] font-bold transition shadow-sm"
              >
                {copiedShareToast ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Link Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Compartilhar Cardápio</span>
                  </>
                )}
              </button>
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
          {/* Aba de Promoções em destaque */}
          {products.some((p) => p.is_promo && p.is_available) && (
            <button
              onClick={() => setSelectedCategory('promos')}
              className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition flex items-center gap-1.5 ${
                selectedCategory === 'promos'
                  ? 'bg-gradient-to-r from-red-600 via-orange-500 to-amber-500 text-white shadow-lg shadow-orange-600/40 ring-2 ring-yellow-400 animate-pulse'
                  : 'bg-red-950/60 text-orange-300 border border-red-700/60 hover:bg-red-900/60'
              }`}
            >
              <span>🔥</span>
              <span>Ofertas CT</span>
              <span className="ml-1 px-1.5 py-0.2 bg-red-600 text-[10px] text-white rounded-full">
                {products.filter((p) => p.is_promo && p.is_available).length}
              </span>
            </button>
          )}

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
            .filter((p) => (selectedCategory === 'promos' ? p.is_promo : p.category_id === selectedCategory) && p.is_available)
            .map((product) => (
              <div
                key={product.id}
                onClick={() => openProductModal(product)}
                className={`group p-4 rounded-2xl bg-charcoal-850/80 border transition cursor-pointer flex gap-4 items-center justify-between ${
                  product.is_promo
                    ? 'border-amber-500/60 shadow-[0_0_15px_rgba(245,158,11,0.15)] hover:border-amber-400 hover:shadow-[0_0_20px_rgba(245,158,11,0.25)]'
                    : 'border-gray-800 hover:border-ember-500/50'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    {product.is_promo && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md shadow-red-600/30 border border-yellow-300/40 animate-pulse">
                        {product.promo_tag || '🔥 OFERTA'}
                      </span>
                    )}
                    <h3 className="font-bold text-sm text-white group-hover:text-ember-400 transition">
                      {product.name}
                    </h3>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2 pt-1 flex-wrap">
                    {product.is_promo && product.original_price_cents && product.original_price_cents > product.price_cents ? (
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-[11px] text-gray-400 line-through font-mono">
                          {formatBRL(product.original_price_cents)}
                        </span>
                        <span className="font-mono font-black text-amber-400 text-sm">
                          {formatBRL(product.price_cents)}
                        </span>
                      </div>
                    ) : (
                      <span className="font-mono font-black text-ember-400 text-sm">
                        {formatBRL(product.price_cents)}
                      </span>
                    )}
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
            {activeModalProduct.image_url && !singleChoiceFollowUp && (
              <div className="h-44 w-full bg-charcoal-950 overflow-hidden relative">
                <img
                  src={activeModalProduct.image_url}
                  alt={activeModalProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleFinishFollowUp}
                  className="absolute right-3 top-3 p-2 rounded-full bg-black/60 text-white hover:bg-black transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Top Bar if image is hidden or in follow-up */}
            {(!activeModalProduct.image_url || singleChoiceFollowUp) && (
              <div className="p-3 bg-charcoal-850 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-ember-400" />
                  <span className="font-extrabold text-sm text-white">{activeModalProduct.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleFinishFollowUp}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-charcoal-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            )}

            {singleChoiceFollowUp ? (
              /* TELA DE DECISÃO: ESCOLHER OUTRO SABOR OU MANTER O MESMO */
              <div className="p-5 space-y-4 overflow-y-auto flex-1">
                <div className="p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/50 flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-400 flex-shrink-0">
                    <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white">
                      {singleChoiceFollowUp.product.name} Adicionado!
                    </h4>
                    <p className="text-xs text-emerald-300 font-bold mt-0.5">
                      Sabor escolhido: <span className="text-white underline">{singleChoiceFollowUp.lastAddonName}</span>
                    </p>
                    <p className="text-[11px] text-gray-300 mt-1">
                      {singleChoiceFollowUp.countAdded > 1
                        ? `${singleChoiceFollowUp.countAdded} unidades deste sabor já estão na sua sacola.`
                        : '1 unidade já adicionada à sua sacola.'}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-charcoal-850 border border-amber-500/40 space-y-3">
                  <div className="flex items-center gap-2 text-amber-300 font-extrabold text-xs uppercase tracking-wide">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Deseja adicionar mais um {singleChoiceFollowUp.product.name.toLowerCase().includes('caipirinha') ? 'copo' : 'espeto'}?</span>
                  </div>

                  <div className="space-y-2">
                    {/* Opção 1: Escolher outro sabor */}
                    <button
                      type="button"
                      onClick={handlePickAnotherFlavor}
                      className="w-full py-3 px-3.5 rounded-xl bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-400 text-white font-extrabold text-xs flex items-center justify-between shadow-lg shadow-amber-600/30 transition active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2">
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>Escolher OUTRO sabor (para o próximo)</span>
                      </div>
                      <span className="text-[11px] bg-black/30 px-2 py-0.5 rounded font-mono font-bold">
                        +{formatBRL(singleChoiceFollowUp.product.price_cents)}
                      </span>
                    </button>

                    {/* Opção 2: Manter o mesmo sabor */}
                    <button
                      type="button"
                      onClick={handleRepeatSameFlavor}
                      className="w-full py-3 px-3.5 rounded-xl bg-charcoal-800 hover:bg-gray-700 border border-gray-600 text-gray-100 font-bold text-xs flex items-center justify-between transition active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2 text-left truncate">
                        <span className="text-base">🔁</span>
                        <span className="truncate">Manter o MESMO sabor (+1 {singleChoiceFollowUp.lastAddonName})</span>
                      </div>
                      <span className="text-[11px] bg-charcoal-900 px-2 py-0.5 rounded font-mono text-gray-300 font-bold">
                        +{formatBRL(singleChoiceFollowUp.product.price_cents)}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleFinishFollowUp}
                    className="w-full py-2.5 rounded-xl bg-charcoal-800 hover:bg-charcoal-700 text-gray-300 hover:text-white font-bold text-xs flex items-center justify-center gap-1.5 border border-gray-700 transition"
                  >
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Concluir e ver Sacola ({cartItemsCount} {cartItemsCount === 1 ? 'item' : 'itens'})</span>
                  </button>
                </div>
              </div>
            ) : (
              /* FORMULÁRIO NORMAL DE ESCOLHA DO PRODUTO */
              <>
                <div className="p-5 space-y-4 overflow-y-auto flex-1">
                  {/* Banner caso esteja no 2º espeto em diante */}
                  {flavorStepCount > 1 && (
                    <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl text-amber-200 text-xs flex items-center justify-between animate-pulse">
                      <span className="font-bold flex items-center gap-1.5">
                        <span>🍢</span>
                        <span>{flavorStepCount}º Espeto • Escolha o próximo sabor:</span>
                      </span>
                      <span className="text-[10px] bg-amber-600 text-white font-mono font-bold px-2 py-0.5 rounded">
                        1 Incluso
                      </span>
                    </div>
                  )}

                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {activeModalProduct.is_promo && (
                        <div className="mb-1.5">
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-red-600 to-amber-500 text-white shadow-md shadow-red-600/30 border border-yellow-300/40 animate-pulse">
                            {activeModalProduct.promo_tag || '🔥 OFERTA ESPECIAL'}
                          </span>
                        </div>
                      )}
                      <h3 className="text-lg font-extrabold text-white">{activeModalProduct.name}</h3>
                      <p className="text-xs text-gray-400 mt-1">{activeModalProduct.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      {activeModalProduct.is_promo && activeModalProduct.original_price_cents && activeModalProduct.original_price_cents > activeModalProduct.price_cents && (
                        <p className="text-xs text-gray-400 line-through font-mono">
                          {formatBRL(activeModalProduct.original_price_cents * modalQuantity)}
                        </p>
                      )}
                      <p className="font-mono font-black text-amber-400 text-lg">
                        {formatBRL(
                          (activeModalProduct.price_cents + modalSelectedAddons.reduce((sum, a) => sum + a.price_cents, 0)) * modalQuantity
                        )}
                      </p>
                      {modalSelectedAddons.length > 0 && (
                        <span className="text-[10px] text-purple-300 font-semibold">
                          +{modalSelectedAddons.length} complementos
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Addons Selection */}
                  {activeModalProduct.addons && activeModalProduct.addons.length > 0 && (() => {
                    const isGenericSingle =
                      activeModalProduct.addon_selection_mode === 'single' ||
                      (activeModalProduct.addons && activeModalProduct.addons.some((a) => a.addon_type === 'single')) ||
                      activeModalProduct.name.toLowerCase().includes('catupiry') ||
                      activeModalProduct.name.toLowerCase().includes('caipirin') ||
                      activeModalProduct.name.toLowerCase().includes('caipira') ||
                      activeModalProduct.name.toLowerCase().includes('sabor') ||
                      (activeModalProduct.addon_selection_mode !== 'multiple' &&
                        Boolean(activeModalProduct.addons && activeModalProduct.addons.length >= 2 && activeModalProduct.addons.every((a) => a.price_cents === 0)));

                    const groupTitle =
                      activeModalProduct.addon_group_title ||
                      (activeModalProduct.name.toLowerCase().includes('espet')
                        ? 'Escolha o Tipo de Espeto (1 Incluso):'
                        : activeModalProduct.name.toLowerCase().includes('caipirin') || activeModalProduct.name.toLowerCase().includes('caipira')
                        ? 'Escolha o Sabor da Caipirinha (1 Incluso):'
                        : 'Escolha 1 Opção (Incluso no Valor):');

                    if (isGenericSingle) {
                      return (
                        <div className="space-y-2 pt-2 border-t border-gray-800">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-amber-300 flex items-center gap-1.5 uppercase tracking-wider">
                              <span>🔘</span>
                              <span>{groupTitle}</span>
                            </h4>
                            <span className="text-[10px] text-amber-400 font-mono font-bold px-2 py-0.5 rounded bg-amber-900/60 border border-amber-700/50">
                              1 Obrigatório
                            </span>
                          </div>

                          {/* Dica explicativa */}
                          <div className="p-2.5 rounded-xl bg-amber-950/25 border border-amber-800/40 space-y-0.5">
                            <p className="text-[11px] text-amber-200/90 font-medium">
                              💡 No valor de {formatBRL(activeModalProduct.price_cents)} está incluso <strong>1 sabor por unidade</strong>.
                            </p>
                            <p className="text-[10px] text-gray-400">
                              Quer sabores diferentes? Ao clicar em Adicionar, você poderá escolher o próximo sabor com 1 clique!
                            </p>
                          </div>

                          <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                            {activeModalProduct.addons.map((add) => {
                              const isSelected = modalSelectedAddons.some((a) => a.name === add.name);
                              return (
                                <div
                                  key={add.id}
                                  onClick={() => handleSelectSingleAddon({ name: add.name, price_cents: add.price_cents })}
                                  className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition ${
                                    isSelected
                                      ? 'bg-amber-600 text-white border-amber-500 shadow-md font-bold'
                                      : 'bg-charcoal-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-4 h-4 rounded-full flex items-center justify-center border text-[9px] ${
                                        isSelected ? 'bg-white text-amber-700 border-white font-black' : 'border-gray-500 bg-charcoal-900'
                                      }`}
                                    >
                                      {isSelected ? '●' : ''}
                                    </div>
                                    <span>{add.name.replace(/^(Espeto|Sabor):\s*/i, '')}</span>
                                  </div>
                                  <span
                                    className={`font-mono text-xs font-bold ${
                                      isSelected ? 'text-white' : add.price_cents > 0 ? 'text-amber-400' : 'text-emerald-400'
                                    }`}
                                  >
                                    {add.price_cents > 0 ? `+${formatBRL(add.price_cents)}` : 'Incluso'}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-2 pt-2 border-t border-gray-800">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                            {activeModalProduct.name.toLowerCase().includes('açaí') || activeModalProduct.name.toLowerCase().includes('acai')
                              ? '🍧 Escolha seus Complementos:'
                              : activeModalProduct.name.toLowerCase().includes('jantinha')
                              ? '🍽️ Espetos & Acompanhamentos:'
                              : '✨ Complementos & Opcionais:'}
                          </h4>
                          <span className="text-[10px] text-gray-400 font-mono">
                            {modalSelectedAddons.length} selecionado(s)
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                          {activeModalProduct.addons.map((add) => {
                            const isSelected = modalSelectedAddons.some((a) => a.name === add.name);
                            return (
                              <div
                                key={add.id}
                                onClick={() => handleToggleAddon({ name: add.name, price_cents: add.price_cents })}
                                className={`p-2.5 rounded-xl border cursor-pointer flex items-center justify-between text-xs transition ${
                                  isSelected
                                    ? 'bg-ember-600 text-white border-ember-500 shadow-md font-bold'
                                    : 'bg-charcoal-800 border-gray-700 text-gray-300 hover:border-gray-600'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <div className={`w-4 h-4 rounded flex items-center justify-center border text-[10px] ${isSelected ? 'bg-white text-ember-600 border-white' : 'border-gray-600 bg-charcoal-900'}`}>
                                    {isSelected ? '✓' : ''}
                                  </div>
                                  <span>{add.name}</span>
                                </div>
                                <span className={`font-mono text-xs font-bold ${isSelected ? 'text-white' : add.price_cents > 0 ? 'text-amber-400' : 'text-gray-400'}`}>
                                  {add.price_cents > 0 ? `+${formatBRL(add.price_cents)}` : 'Incluso'}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Notes */}
                  <div className="pt-2 border-t border-gray-800 space-y-1.5">
                    <label className="text-xs font-bold text-gray-300 block">
                      Alguma observação para o pedido?
                    </label>
                    <input
                      type="text"
                      placeholder={
                        activeModalProduct.name.toLowerCase().includes('açaí') || activeModalProduct.name.toLowerCase().includes('acai')
                          ? 'Ex: Leite condensado no fundo, caprichar no ninho...'
                          : 'Ex: Ao ponto, sem vinagrete, pouco sal...'
                      }
                      value={modalNotes}
                      onChange={(e) => setModalNotes(e.target.value)}
                      className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-ember-500"
                    />

                    {/* Atalhos de observações */}
                    <div className="flex flex-wrap gap-1">
                      {(activeModalProduct.name.toLowerCase().includes('açaí') || activeModalProduct.name.toLowerCase().includes('acai')) ? (
                        ['Sem banana', 'Ninho no fundo', 'Caprichar na calda', 'Pouco doce'].map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setModalNotes((prev) => prev ? `${prev}, ${sug}` : sug)}
                            className="text-[10px] px-2 py-0.5 rounded bg-charcoal-800 border border-gray-700 hover:border-ember-500 text-gray-300 hover:text-white transition"
                          >
                            +{sug}
                          </button>
                        ))
                      ) : (
                        ['Ao ponto', 'Bem passado', 'Pouco sal', 'Sem vinagrete', 'Sem farofa'].map((sug) => (
                          <button
                            key={sug}
                            type="button"
                            onClick={() => setModalNotes((prev) => prev ? `${prev}, ${sug}` : sug)}
                            className="text-[10px] px-2 py-0.5 rounded bg-charcoal-800 border border-gray-700 hover:border-ember-500 text-gray-300 hover:text-white transition"
                          >
                            +{sug}
                          </button>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="flex items-center justify-between pt-2 border-t border-gray-800">
                    <div className="space-y-0.5 pr-2">
                      <span className="text-xs font-bold text-gray-300">Quantidade:</span>
                      {activeModalProduct.addon_selection_mode === 'single' ||
                      activeModalProduct.name.toLowerCase().includes('catupiry') ||
                      activeModalProduct.name.toLowerCase().includes('caipirinha') ? (
                        <p className="text-[10px] text-amber-400/90 leading-tight">
                          {modalQuantity === 1
                            ? 'Dica: para sabores variados, adicione 1 por vez!'
                            : `⚠️ ${modalQuantity} unidades com o MESMO sabor (${modalSelectedAddons[0]?.name.replace(/^(Espeto|Sabor):\s*/i, '') || 'selecionado'}).`}
                        </p>
                      ) : null}
                    </div>
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
                    <span>
                      {flavorStepCount > 1
                        ? `Adicionar ${flavorStepCount}º Item à Sacola`
                        : 'Adicionar à Sacola'}
                    </span>
                    <span className="font-mono">
                      {formatBRL(
                        (activeModalProduct.price_cents +
                          modalSelectedAddons.reduce((acc, a) => acc + a.price_cents, 0)) *
                          modalQuantity
                      )}
                    </span>
                  </button>
                </div>
              </>
            )}
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
                  <label className="text-[11px] font-semibold text-gray-300 block mb-1">Seu Nome e Sobrenome:</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: William Souza"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-ember-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-300 block mb-1">
                    {table ? 'WhatsApp com DDD (Opcional):' : 'WhatsApp com DDD (Obrigatório):'}
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
                    <input
                      type="tel"
                      required={!table}
                      maxLength={15}
                      placeholder="(44) 99992-3965"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(formatPhoneMask(e.target.value))}
                      className="w-full pl-9 pr-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-ember-500 font-mono"
                    />
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1">
                    {table
                      ? 'Informe seu WhatsApp para receber comprovante e atualizações do pedido.'
                      : 'Número real com DDD para confirmação e aviso de retirada no balcão.'}
                  </p>
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
                href={`https://wa.me/5544999923965?text=${encodeURIComponent(
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
