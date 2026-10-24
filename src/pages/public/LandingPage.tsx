import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../lib/databaseStore';
import { Product, Category, Order } from '../../types/database.types';
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
  Clock,
  ArrowRight,
  Sparkles,
  MapPin,
  Star,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Lock,
  ExternalLink,
  MessageCircle,
  Award,
  Zap,
  Check,
  Copy,
  AlertTriangle,
} from 'lucide-react';

interface LandingPageProps {
  onStaffLoginClick: () => void;
  onOrderCompleted?: (orderId: string) => void;
}

interface CartItem {
  product: Product;
  quantity: number;
  selectedAddons: { name: string; price_cents: number }[];
  notes: string;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onStaffLoginClick,
  onOrderCompleted,
}) => {
  const establishment = db.getEstablishment();
  const categories = db.getCategories();
  const products = db.getProducts();

  const [selectedCategory, setSelectedCategory] = useState<string>(categories[0]?.id || '');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isBagOpen, setIsBagOpen] = useState<boolean>(false);

  // Selected product modal for choosing addons & notes
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [modalQuantity, setModalQuantity] = useState<number>(1);
  const [modalSelectedAddons, setModalSelectedAddons] = useState<{ name: string; price_cents: number }[]>([]);
  const [modalNotes, setModalNotes] = useState<string>('');

  // Checkout form (takeout exclusively)
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [generalNotes, setGeneralNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submittedOrder, setSubmittedOrder] = useState<Order | null>(null);
  const [copiedPix, setCopiedPix] = useState<boolean>(false);
  const [logoTapCount, setLogoTapCount] = useState<number>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // FAQ Accordion State
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const handleLogoTap = () => {
    setLogoTapCount((prev) => {
      const next = prev + 1;
      if (next >= 5) {
        onStaffLoginClick();
        return 0;
      }
      return next;
    });
    setTimeout(() => setLogoTapCount(0), 4000);
  };

  const openProductModal = (product: Product) => {
    setActiveModalProduct(product);
    setModalQuantity(1);
    setModalSelectedAddons([]);
    setModalNotes('');
  };

  const handleToggleAddon = (addon: { name: string; price_cents: number }) => {
    setModalSelectedAddons((prev) => {
      const exists = prev.some((a) => a.name === addon.name);
      if (exists) {
        return prev.filter((a) => a.name !== addon.name);
      } else {
        return [...prev, addon];
      }
    });
  };

  const handleAddToCart = () => {
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
      const updated = [...prev];
      const newQty = updated[index].quantity + delta;
      if (newQty <= 0) {
        return updated.filter((_, i) => i !== index);
      }
      updated[index].quantity = newQty;
      return updated;
    });
  };

  const cartTotalCents = cart.reduce((sum, item) => {
    const addonsTotal = item.selectedAddons.reduce((acc, a) => acc + a.price_cents, 0);
    return sum + (item.product.price_cents + addonsTotal) * item.quantity;
  }, 0);

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Submit Order for Takeout (with Anti-Trote Validation)
  const handleConfirmOrder = () => {
    if (cart.length === 0) {
      setErrorMessage('Sua sacola está vazia.');
      return;
    }
    if (!customerName.trim()) {
      setErrorMessage('Por favor informe seu nome.');
      return;
    }
    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Por favor informe seu WhatsApp com DDD (mínimo 10 dígitos) para confirmação do pedido.');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const order = db.createOrder({
        origin: 'external_catalog',
        order_type: 'takeout',
        customer_name: customerName.trim(),
        customer_phone: customerPhone.trim(),
        general_notes: generalNotes || undefined,
        items: cart.map((ci) => ({
          product_id: ci.product.id,
          quantity: ci.quantity,
          addons: ci.selectedAddons,
          notes: ci.notes || undefined,
        })),
      });

      setSubmittedOrder(order);
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

  const faqItems = [
    {
      q: 'Como funciona o pedido online para retirada no balcão?',
      a: 'Você escolhe seus espetinhos e bebidas favoritos aqui no cardápio, adiciona à sacola e informa seu nome e WhatsApp. O pedido vai direto para a nossa churrasqueira e cozinha em tempo real. Quando estiver tudo quentinho e pronto, avisamos pelo WhatsApp para você só passar no balcão, pagar e retirar!',
    },
    {
      q: 'Quais são as formas de pagamento aceitas na CT Conveniência?',
      a: 'Aceitamos Pix instantâneo, Cartões de Débito e Crédito de todas as bandeiras (inclusive por aproximação), além de Dinheiro em espécie.',
    },
    {
      q: 'Vocês têm cervejas e chopp gelados para viagem?',
      a: 'Com certeza! Nossas cervejeiras são calibradas rigorosamente a -4°C para entregar cerveja trincando de gelada. Temos latas, long necks, garrafas de 600ml, gelo e carvão para o seu churrasco.',
    },
    {
      q: 'Qual o horário de funcionamento da loja?',
      a: 'Atendemos de terça a domingo, das 16h até as 02h da madrugada. Perfeito para o happy hour ou para abastecer sua resenha até tarde.',
    },
    {
      q: 'Posso consumir os espetinhos no local?',
      a: 'Sim! Temos mesas confortáveis, ambiente descontraído, música agradável e atendimento na mesa com comanda digital por QR Code.',
    },
    {
      q: 'Onde a CT Conveniência fica localizada?',
      a: 'Estamos localizados na Av. Paraná, 1250 - Centro. Fácil acesso com estacionamento em frente.',
    },
  ];

  return (
    <div className="min-h-screen bg-[#0c0a17] text-gray-100 flex flex-col font-sans selection:bg-purple-600 selection:text-white">
      {/* 1. TOP ANNOUNCEMENT BAR */}
      <div className="bg-gradient-to-r from-purple-950 via-purple-900 to-purple-950 border-b border-purple-800/40 text-purple-200 text-xs py-2 px-4 text-center font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span>🔥 Espetinhos Grelhados na Brasa • ❄️ Cerveja Trincando a -4°C • 🛍️ Retirada Rápida sem Espera</span>
        </div>
      </div>

      {/* 2. PUBLIC NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#0c0a17]/95 backdrop-blur-md border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-18 flex items-center justify-between">
          {/* Logo & Brand with secret 5-tap gesture */}
          <div onClick={handleLogoTap} className="flex items-center gap-3 group cursor-pointer select-none">
            <div className="relative">
              <img
                src="/ct-logo.png"
                alt="CT Conveniência"
                className="w-11 h-11 rounded-xl object-contain shadow-lg shadow-purple-600/50 border border-purple-500/40 bg-charcoal-950 p-0.5 transition-transform group-hover:scale-105"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-charcoal-900" />
            </div>
            <div>
              <span className="font-black text-lg tracking-tight bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent block">
                CT Conveniência
              </span>
              <span className="text-[11px] text-gray-400 block -mt-0.5 font-medium">
                Cervejas, Espetos & Conveniência
              </span>
            </div>
          </div>

          {/* Nav Anchors (Desktop) */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-gray-300">
            <a href="#cardapio" className="hover:text-purple-400 transition">Cardápio & Pedidos</a>
            <a href="#diferenciais" className="hover:text-purple-400 transition">Diferenciais</a>
            <a href="#sobre" className="hover:text-purple-400 transition">Sobre Nós</a>
            <a href="#depoimentos" className="hover:text-purple-400 transition">Avaliações</a>
            <a href="#localizacao" className="hover:text-purple-400 transition">Localização</a>
            <a href="#faq" className="hover:text-purple-400 transition">Dúvidas</a>
          </nav>

          {/* Quick CTAs */}
          <div className="flex items-center gap-3">
            <a
              href="https://wa.me/5544998765432?text=Ol%C3%A1%2C%20gostaria%20de%20fazer%20um%20pedido%20na%20CT%20Conveni%C3%AAncia!"
              target="_blank"
              rel="noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 text-xs font-bold transition shadow-sm"
            >
              <MessageCircle className="w-4 h-4 text-emerald-400" />
              <span>WhatsApp</span>
            </a>

            <a
              href="#cardapio"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30 transition transform hover:-translate-y-0.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pedir Online</span>
            </a>
          </div>
        </div>
      </header>

      {/* 3. HERO SECTION (H1 & Conversion Headline) */}
      <section className="relative overflow-hidden pt-12 pb-20 border-b border-gray-800/80">
        {/* Ambient glow backgrounds */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Headline, Proof & CTAs */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-950/70 border border-purple-700/60 text-purple-300 text-xs font-bold shadow-inner">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>O Ponto de Encontro Oficial da Cidade</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-tight">
                A Cerveja Mais Gelada & Os{' '}
                <span className="bg-gradient-to-r from-purple-400 via-purple-300 to-amber-300 bg-clip-text text-transparent">
                  Melhores Espetos na Brasa
                </span>
              </h1>

              <p className="text-gray-300 text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Carnes nobres selecionadas, acompanhamentos da casa, cervejas e destilados trincando. Peça online pelo nosso cardápio e retire no balcão sem fila ou venha curtir nas nossas mesas!
              </p>

              {/* Status and Opening Hours Banner */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-1 text-xs text-gray-300">
                <div className="flex items-center gap-2 bg-charcoal-850 px-3 py-1.5 rounded-xl border border-gray-800">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Aberto de Terça a Domingo • 16h às 02h</span>
                </div>
                <div className="flex items-center gap-2 bg-charcoal-850 px-3 py-1.5 rounded-xl border border-gray-800">
                  <MapPin className="w-4 h-4 text-purple-400" />
                  <span>Av. Paraná, 1250 - Centro</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-4">
                <a
                  href="#cardapio"
                  className="w-full sm:w-auto px-7 py-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm shadow-xl shadow-purple-600/40 flex items-center justify-center gap-2 transition"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Ver Cardápio & Pedir no Balcão</span>
                  <ArrowRight className="w-4 h-4" />
                </a>

                <a
                  href="https://wa.me/5544998765432"
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-gray-200 font-bold text-sm border border-gray-700 flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>Chamar no WhatsApp</span>
                </a>
              </div>

              {/* Trust metric */}
              <div className="pt-4 flex items-center justify-center lg:justify-start gap-3 text-xs text-gray-400">
                <div className="flex text-amber-400">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <span><strong>4.9 de 5 estrelas</strong> no Google (+380 avaliações de clientes satisfeitos)</span>
              </div>
            </div>

            {/* Right Column: Visual Hero Banner with Logo & Image */}
            <div className="lg:col-span-5 relative">
              <div className="relative mx-auto max-w-md rounded-3xl overflow-hidden border-2 border-purple-500/40 shadow-2xl shadow-purple-900/40 bg-charcoal-900 group">
                <img
                  src="https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=800&q=80"
                  alt="Espetinhos nobres na brasa CT Conveniência"
                  className="w-full h-80 sm:h-96 object-cover transition-transform duration-700 group-hover:scale-105 opacity-90"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a17] via-transparent to-black/30" />

                {/* Floating badge top */}
                <div className="absolute top-4 left-4 p-2.5 rounded-2xl bg-[#0c0a17]/90 backdrop-blur-md border border-purple-500/40 flex items-center gap-2.5 shadow-xl">
                  <div className="w-8 h-8 rounded-xl bg-purple-600/30 flex items-center justify-center text-purple-400">
                    <Flame className="w-5 h-5 text-amber-400 animate-pulse" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Padrão Ouro</p>
                    <p className="text-xs font-black text-white">Carvão em Brasa Viva</p>
                  </div>
                </div>

                {/* Floating badge bottom */}
                <div className="absolute bottom-4 right-4 p-3 rounded-2xl bg-[#0c0a17]/90 backdrop-blur-md border border-emerald-500/40 flex items-center gap-2.5 shadow-xl">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600/30 flex items-center justify-center text-emerald-400">
                    <Zap className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Retirada Rápida</p>
                    <p className="text-xs font-black text-white">Pronto em 15 minutos</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. BENEFÍCIOS & DIFERENCIAIS */}
      <section id="diferenciais" className="py-16 bg-charcoal-900 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-xs font-extrabold text-purple-400 uppercase tracking-widest mb-1">
              Por que a CT Conveniência é Diferente?
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black text-white">
              Cuidado em Cada Detalhe para a Sua Resenha
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-charcoal-850 border border-gray-800 hover:border-purple-500/50 transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-xl font-bold">
                ❄️
              </div>
              <h4 className="font-bold text-base text-white">Cervejas a -4°C</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Geladeiras calibradas rigorosamente para servir a cerveja mais estupidamente gelada da cidade, sem congelar.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-charcoal-850 border border-gray-800 hover:border-purple-500/50 transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-xl font-bold">
                🥩
              </div>
              <h4 className="font-bold text-base text-white">Picanha & Carnes Nobres</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Espetinhos preparados artesanalmente com cortes nobres selecionados, sal de parrilla e chimichurri fresco.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-charcoal-850 border border-gray-800 hover:border-purple-500/50 transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-xl font-bold">
                ⚡
              </div>
              <h4 className="font-bold text-base text-white">Retirada Ágil sem Fila</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Monte seu pedido no cardápio online com poucos cliques. Chegue, pague e retire tudo quentinho no balcão.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-charcoal-850 border border-gray-800 hover:border-purple-500/50 transition space-y-3">
              <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400 text-xl font-bold">
                🛒
              </div>
              <h4 className="font-bold text-base text-white">Conveniência Completa</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Gelo, carvão, refrigerantes, energéticos, destilados, vinhos e petiscos prontos para salvar a sua festa.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. CARDÁPIO DIGITAL INTEGRADO (ONLINE TAKEOUT MENU) */}
      <section id="cardapio" className="py-16 bg-[#0c0a17] border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-950/60 border border-purple-700/60 text-purple-300 text-xs font-bold mb-2">
              <ShoppingBag className="w-3.5 h-3.5 text-purple-400" />
              <span>Cardápio Oficial para Retirada no Balcão</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-black text-white">
              Monte seu Pedido Online
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-2">
              Escolha os itens desejados, personalize o ponto da carne ou adicionais e retire direto na CT Conveniência.
            </p>
          </div>

          {/* Categories Tab Selector */}
          <div className="sticky top-18 z-30 bg-[#0c0a17]/95 backdrop-blur-md border-y border-gray-800 py-3 mb-8">
            <div className="max-w-5xl mx-auto flex items-center gap-2 overflow-x-auto no-scrollbar px-2">
              {categories.map((cat: Category) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                    selectedCategory === cat.id
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400'
                      : 'bg-charcoal-800 text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid */}
          <div className="max-w-5xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {products
              .filter((p) => p.category_id === selectedCategory)
              .map((product) => (
                <div
                  key={product.id}
                  onClick={() => openProductModal(product)}
                  className="rounded-2xl bg-charcoal-850 border border-gray-800 hover:border-purple-500/50 transition cursor-pointer overflow-hidden flex flex-col justify-between group shadow-lg"
                >
                  {product.image_url && (
                    <div className="relative h-44 overflow-hidden bg-charcoal-900">
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-3 right-3">
                        <SectorBadge sector={product.sector} />
                      </div>
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-bold text-white text-base group-hover:text-purple-300 transition">
                        {product.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-gray-800/80">
                      <span className="font-mono text-base font-extrabold text-amber-400">
                        {formatBRL(product.price_cents)}
                      </span>

                      <button
                        type="button"
                        className="p-2 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 transition flex items-center gap-1 text-xs font-bold"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Adicionar</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </section>

      {/* 6. SOBRE A CT CONVENIÊNCIA */}
      <section id="sobre" className="py-16 bg-charcoal-900 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            <div className="lg:col-span-6 relative">
              <div className="rounded-3xl overflow-hidden border border-purple-500/30 shadow-2xl">
                <img
                  src="https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80"
                  alt="Ambiente e cortes nobres CT Conveniência"
                  className="w-full h-80 object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Tradição & Resenha</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Mais que uma conveniência, o ponto alto do seu dia.
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                A <strong>CT Conveniência</strong> nasceu com um propósito simples: servir a melhor experiência em bebidas geladas e espetinhos de primeira linha.
              </p>
              <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
                Nossos clientes não precisam escolher entre qualidade de restaurante e a praticidade de uma conveniência. Aqui você encontra cortes de picanha macios, acompanhamentos frescos e cervejas trincando de geladas com atendimento rápido e caloroso.
              </p>

              <div className="pt-2 grid grid-cols-2 gap-4">
                <div className="p-3.5 rounded-xl bg-charcoal-850 border border-gray-800">
                  <p className="text-xl font-black text-amber-400">+2.500</p>
                  <p className="text-xs text-gray-400">Espetos servidos por mês</p>
                </div>
                <div className="p-3.5 rounded-xl bg-charcoal-850 border border-gray-800">
                  <p className="text-xl font-black text-purple-400">100%</p>
                  <p className="text-xs text-gray-400">Cerveja no ponto certo</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. DEPOIMENTOS / PROVA SOCIAL */}
      <section id="depoimentos" className="py-16 bg-[#0c0a17] border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Prova Social</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
              O que Nossos Clientes Dizem
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            <div className="p-6 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-3 shadow-lg">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-gray-300 italic leading-relaxed">
                "Melhor espetinho de picanha da região! Carne macia, suculenta e a cerveja é a mais gelada sem dúvidas. Peço sempre pelo site para retirar e nunca atrasa."
              </p>
              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs font-bold text-white">Rodrigo Mendes</p>
                <p className="text-[11px] text-gray-500">Cliente Frequente • Avaliação Google</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-3 shadow-lg">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-gray-300 italic leading-relaxed">
                "O atendimento da equipe é nota 10. O queijo coalho com melaço e o pão de alho recheado são imperdíveis. Lugar nota mil para reunir os amigos!"
              </p>
              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs font-bold text-white">Camila Ferreira</p>
                <p className="text-[11px] text-gray-500">Cliente Frequente • Avaliação Google</p>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-3 shadow-lg">
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-xs text-gray-300 italic leading-relaxed">
                "Praticidade incrível poder fazer o pedido no celular e só passar para pegar no balcão quentinho. Salvou o churrasco de domingo com gelo e carvão."
              </p>
              <div className="pt-2 border-t border-gray-800">
                <p className="text-xs font-bold text-white">Lucas Alencar</p>
                <p className="text-[11px] text-gray-500">Cliente Frequente • Avaliação Google</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8. LOCALIZAÇÃO & HORÁRIOS */}
      <section id="localizacao" className="py-16 bg-charcoal-900 border-b border-gray-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center max-w-5xl mx-auto">
            <div className="lg:col-span-6 space-y-4">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Onde Estamos</span>
              <h3 className="text-2xl sm:text-3xl font-black text-white">
                Fácil Acesso no Centro da Cidade
              </h3>
              <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
                Venha nos visitar ou faça o seu pedido pelo site para retirar com agilidade. Estacionamento fácil na porta.
              </p>

              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-850 border border-gray-800">
                  <MapPin className="w-5 h-5 text-purple-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">{establishment.address}</p>
                    <p className="text-[11px] text-gray-400">Centro • Estacionamento na frente</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-850 border border-gray-800">
                  <Clock className="w-5 h-5 text-amber-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">{establishment.opening_hours}</p>
                    <p className="text-[11px] text-gray-400">Atendimento presencial e retirada</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl bg-charcoal-850 border border-gray-800">
                  <Phone className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-white">{establishment.phone}</p>
                    <p className="text-[11px] text-gray-400">WhatsApp para dúvidas e encomendas</p>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('Av. Paraná, 1250 - Centro')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md shadow-purple-600/30 transition"
                >
                  <MapPin className="w-4 h-4" />
                  <span>Como Chegar (Google Maps)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div className="lg:col-span-6">
              <div className="p-6 rounded-3xl bg-charcoal-850 border border-gray-800 space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <img src="/ct-logo.png" alt="CT Conveniência" className="w-12 h-12 object-contain" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white">{establishment.name}</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    Pronto para te receber com a melhor brasa e o chopp mais trincando da cidade.
                  </p>
                </div>
                <div className="pt-2">
                  <a
                    href="https://wa.me/5544998765432"
                    target="_blank"
                    rel="noreferrer"
                    className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-lg shadow-emerald-600/30"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Falar Conosco no WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 9. FAQ ACCORDION (SEO E-E-A-T) */}
      <section id="faq" className="py-16 bg-[#0c0a17] border-b border-gray-800/80">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <span className="text-xs font-bold text-purple-400 uppercase tracking-widest">Tire suas Dúvidas</span>
            <h3 className="text-2xl sm:text-3xl font-black text-white mt-1">
              Perguntas Frequentes (FAQ)
            </h3>
          </div>

          <div className="space-y-3">
            {faqItems.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div
                  key={idx}
                  className="rounded-2xl bg-charcoal-850 border border-gray-800 overflow-hidden transition"
                >
                  <button
                    type="button"
                    onClick={() => setOpenFaqIndex(isOpen ? null : idx)}
                    className="w-full p-4 sm:p-5 flex items-center justify-between text-left font-bold text-sm text-white hover:text-purple-300 transition"
                  >
                    <span>{item.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-purple-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    )}
                  </button>

                  {isOpen && (
                    <div className="px-5 pb-5 text-xs text-gray-300 leading-relaxed border-t border-gray-800/60 pt-3">
                      {item.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 10. FOOTER INSTITUCIONAL COM ACESSO RESTRITO PROTEGIDO */}
      <footer className="bg-charcoal-950 py-10 px-4 sm:px-6 text-gray-400 text-xs border-t border-gray-800/80">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          <div className="flex items-center gap-3">
            <img src="/ct-logo.png" alt="CT Conveniência" className="w-9 h-9 object-contain" />
            <div>
              <p className="font-bold text-white text-sm">CT Conveniência</p>
              <p className="text-[11px] text-gray-500">Cervejas Geladas, Espetinhos Nobres & Conveniência</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-gray-400">
            <a href="#cardapio" className="hover:text-purple-300 transition">Cardápio Online</a>
            <a href="#diferenciais" className="hover:text-purple-300 transition">Diferenciais</a>
            <a href="#localizacao" className="hover:text-purple-300 transition">Como Chegar</a>
            <a href="#faq" className="hover:text-purple-300 transition">Perguntas Frequentes</a>
          </div>

          {/* Direct WhatsApp Contact */}
          <div>
            <a
              href="https://wa.me/5544998765432?text=Ol%C3%A1%2C%20gostaria%20de%20tirar%20uma%20d%C3%BAvida%20na%20CT%20Conveni%C3%AAncia!"
              target="_blank"
              rel="noreferrer"
              className="px-4 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-700/60 text-xs font-bold transition flex items-center gap-2"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Fale Conosco</span>
            </a>
          </div>
        </div>

        <div className="max-w-7xl mx-auto mt-6 pt-6 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-gray-600">
          <p>CT Conveniência © {new Date().getFullYear()} • Todos os direitos reservados.</p>
          <p>CNPJ: 00.000.000/0001-00 • Av. Paraná, 1250 - Centro</p>
        </div>
      </footer>

      {/* FLOATING CART BUTTON (BOTTOM RIGHT) */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-6 right-6 z-40">
          <button
            type="button"
            onClick={() => setIsBagOpen(true)}
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-sm shadow-2xl shadow-purple-600/50 border border-purple-400/40 transition transform hover:scale-105"
          >
            <div className="relative">
              <ShoppingBag className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-amber-400 text-black text-xs font-black flex items-center justify-center">
                {cartItemsCount}
              </span>
            </div>
            <span>Ver Sacola • {formatBRL(cartTotalCents)}</span>
          </button>
        </div>
      )}

      {/* PRODUCT CUSTOMIZATION MODAL (ADDONS & NOTES) */}
      {activeModalProduct && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-lg bg-charcoal-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden my-auto">
            {activeModalProduct.image_url && (
              <div className="h-44 w-full relative">
                <img
                  src={activeModalProduct.image_url}
                  alt={activeModalProduct.name}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setActiveModalProduct(null)}
                  className="absolute top-3 right-3 p-1.5 rounded-xl bg-black/60 text-white hover:bg-black"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            <div className="p-5 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-extrabold text-lg text-white">{activeModalProduct.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{activeModalProduct.description}</p>
                </div>
                <span className="font-mono text-base font-bold text-amber-400 flex-shrink-0">
                  {formatBRL(activeModalProduct.price_cents)}
                </span>
              </div>

              {/* Addons selection */}
              {activeModalProduct.addons && activeModalProduct.addons.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-gray-800">
                  <label className="text-xs font-bold text-gray-300 block">
                    Opções e Ponto da Carne:
                  </label>
                  <div className="space-y-1.5 max-h-44 overflow-y-auto">
                    {activeModalProduct.addons.map((addon) => {
                      const isSelected = modalSelectedAddons.some((a) => a.name === addon.name);
                      return (
                        <div
                          key={addon.id}
                          onClick={() => handleToggleAddon(addon)}
                          className={`p-2.5 rounded-xl border text-xs flex items-center justify-between cursor-pointer transition ${
                            isSelected
                              ? 'bg-purple-950/60 border-purple-500 text-white'
                              : 'bg-charcoal-800 border-gray-700 text-gray-300 hover:border-gray-600'
                          }`}
                        >
                          <span>{addon.name}</span>
                          <span className="font-mono text-xs text-amber-400">
                            {addon.price_cents > 0 ? `+${formatBRL(addon.price_cents)}` : 'Grátis'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Special notes */}
              <div className="space-y-1 pt-2 border-t border-gray-800">
                <label className="text-xs font-semibold text-gray-400 block">
                  Observações para a Cozinha (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Caprichar no limão, bem passado, etc."
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-charcoal-800 border border-gray-700 text-xs text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              {/* Quantity selector & Add Button */}
              <div className="pt-3 border-t border-gray-800 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 bg-charcoal-800 border border-gray-700 rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-mono font-bold text-sm text-white px-2">
                    {modalQuantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalQuantity((q) => q + 1)}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-white"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  className="flex-1 py-3 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs shadow-lg shadow-purple-600/30 transition flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    Adicionar •{' '}
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
        </div>,
        document.body
      )}

      {/* TAKEOUT BAG & CHECKOUT DRAWER */}
      {isBagOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-md bg-charcoal-900 border border-gray-700 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden my-auto">
            {/* Header */}
            <div className="p-4 bg-charcoal-850 border-b border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-white text-base">Sua Sacola de Retirada</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsBagOpen(false)}
                className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="p-4 flex-1 overflow-y-auto space-y-3">
              {cart.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-xl bg-charcoal-800 border border-gray-700/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-bold text-white">{item.product.name}</p>
                    {item.selectedAddons.length > 0 && (
                      <p className="text-[11px] text-gray-400">
                        {item.selectedAddons.map((a) => a.name).join(', ')}
                      </p>
                    )}
                    {item.notes && (
                      <p className="text-[10px] text-amber-300 italic">Obs: {item.notes}</p>
                    )}
                    <p className="font-mono text-xs font-bold text-amber-400">
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
                    <span className="font-mono text-xs font-bold text-white px-2">
                      {item.quantity}
                    </span>
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

              {/* Checkout identification */}
              <div className="space-y-3 pt-3 border-t border-gray-800">
                <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-800/60 flex items-start gap-2.5 text-xs text-purple-200">
                  <ShoppingBag className="w-4 h-4 text-purple-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-white">Modalidade: Retirada no Balcão</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">
                      Retire na <strong className="text-gray-300">{establishment.name}</strong> • {establishment.address}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-gray-400 block mb-1">Seu Nome:</label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
                    <input
                      type="text"
                      required
                      placeholder="Ex: Roberto Carlos"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
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
                      className="w-full pl-9 pr-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  <p className="text-[10px] text-gray-500 mt-1">Avisaremos por WhatsApp assim que seus espetinhos estiverem prontos no balcão.</p>
                </div>

                {errorMessage && (
                  <p className="text-xs text-red-400 bg-red-950/50 p-2.5 rounded-lg border border-red-800">
                    {errorMessage}
                  </p>
                )}
              </div>
            </div>

            {/* Total & Submit */}
            <div className="p-4 bg-charcoal-850 border-t border-gray-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-400 font-medium">Total a Pagar no Balcão:</span>
                <span className="font-mono text-lg font-black text-amber-400">
                  {formatBRL(cartTotalCents)}
                </span>
              </div>

              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white font-extrabold text-sm shadow-xl shadow-purple-600/40 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <span>Enviando para a Churrasqueira...</span>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirmar Pedido de Retirada</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ANTI-TROTE WHATSAPP CONFIRMATION MODAL */}
      {submittedOrder && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-md bg-charcoal-900 border border-amber-500/80 rounded-3xl p-5 sm:p-6 text-center space-y-4 shadow-2xl my-auto">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <MessageCircle className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40 inline-block mb-1">
                Aguardando Confirmação no WhatsApp
              </span>
              <h3 className="text-xl font-black text-white">Pedido #{submittedOrder.order_number} Registrado!</h3>
              <p className="text-xs text-gray-300 mt-1.5 leading-relaxed">
                Para garantirmos que ninguém passe trote e que seus espetinhos saiam quentinhos no ponto perfeito na brasa, <strong className="text-white">confirme seu pedido no nosso WhatsApp com 1 clique abaixo</strong>.
              </p>
            </div>

            {/* Direct WhatsApp Button */}
            <a
              href={`https://wa.me/5544998765432?text=${encodeURIComponent(
                `Olá CT Conveniência! Acabei de fazer o Pedido #${submittedOrder.order_number} para retirada no balcão no nome de ${submittedOrder.customer_name}.\nTotal: ${formatBRL(submittedOrder.total_cents)}.\nGostaria de confirmar para vocês começarem a assar na churrasqueira!`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm transition shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 group transform active:scale-95"
            >
              <MessageCircle className="w-5 h-5 text-white group-hover:scale-110 transition-transform" />
              <span>Confirmar no WhatsApp (1 Clique)</span>
            </a>

            {/* Pix Advance Payment (Optional) */}
            <div className="p-3.5 bg-charcoal-850 rounded-2xl border border-gray-800 text-left text-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-gray-300 font-bold">Chave Pix (Telefone Oficial):</span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText('44998765432');
                    setCopiedPix(true);
                    setTimeout(() => setCopiedPix(false), 3000);
                  }}
                  className="text-purple-400 hover:text-purple-300 font-bold text-[11px] flex items-center gap-1 transition"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>{copiedPix ? 'Copiado!' : 'Copiar Chave'}</span>
                </button>
              </div>
              <code className="block bg-charcoal-900 p-2 rounded-xl text-cyan-300 font-mono text-xs select-all border border-gray-800">
                (44) 99876-5432
              </code>
              <p className="text-[11px] text-gray-500">
                Você pode adiantar o pagamento via Pix e enviar o comprovante no WhatsApp, ou pagar no balcão ao retirar.
              </p>
            </div>

            <div className="pt-1">
              <button
                type="button"
                onClick={() => setSubmittedOrder(null)}
                className="w-full py-2.5 px-4 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition"
              >
                Fechar e Acompanhar pelo WhatsApp
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
