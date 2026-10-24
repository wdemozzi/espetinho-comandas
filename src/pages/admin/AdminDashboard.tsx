import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../lib/databaseStore';
import { Product, RestaurantTable, ProductionSector, Profile, CustomerLead, Order, Tab } from '../../types/database.types';
import { formatBRL, parseBRLToCents } from '../../lib/currency';
import { SectorBadge, TableStatusBadge } from '../../components/common/Badge';
import { QrCodeModal } from '../../components/common/QrCodeModal';
import { ImageUploadWebP } from '../../components/common/ImageUploadWebP';
import {
  getSupabaseUrl,
  getSupabaseAnonKey,
  setSupabaseAnonKey,
  isSupabaseConfigured,
  getSupabaseDiagnostics,
} from '../../lib/supabaseClient';
import { supabaseSync } from '../../lib/supabaseSync';
import {
  ShieldCheck,
  TrendingUp,
  Package,
  Layers,
  Users,
  Plus,
  Edit2,
  ToggleLeft,
  ToggleRight,
  QrCode,
  DollarSign,
  Utensils,
  CheckCircle2,
  X,
  KeyRound,
  Lock,
  Cloud,
  Radio,
  Copy,
  ExternalLink,
  Check,
  Wifi,
  WifiOff,
  RefreshCw,
  Database,
  Boxes,
  AlertTriangle,
  Calendar,
  Filter,
  Download,
  Phone,
  MessageSquare,
  Search,
  Award,
  Flame,
  ArrowUpRight,
  Sparkles,
  Send,
  ShoppingBag,
} from 'lucide-react';

type PeriodFilter = 'today' | 'yesterday' | 'month' | 'year' | 'all' | 'custom';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'stock' | 'clients' | 'products' | 'tables' | 'users' | 'cloud'>('overview');
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [tables, setTables] = useState<RestaurantTable[]>(db.getTables());
  const categories = db.getCategories();
  const [profiles, setProfiles] = useState<Profile[]>(db.getProfiles());
  const [tabsState, setTabsState] = useState<Tab[]>(db.getTabs());
  const [ordersState, setOrdersState] = useState<Order[]>(db.getOrders());
  const [leadsState, setLeadsState] = useState<CustomerLead[]>(db.getCustomerLeads());
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Period filter for Sales Report
  const [filterPeriod, setFilterPeriod] = useState<PeriodFilter>('today');
  const [customDate, setCustomDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [reportSearch, setReportSearch] = useState<string>('');

  // Stock management state
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [stockSearch, setStockSearch] = useState<string>('');

  // CRM & Marketing state
  const [clientSearch, setClientSearch] = useState<string>('');

  // Supabase cloud sync state
  const [anonKeyInput, setAnonKeyInput] = useState<string>(getSupabaseAnonKey());
  const [syncStatus, setSyncStatus] = useState(supabaseSync.getStatus());
  const [copiedSql, setCopiedSql] = useState<boolean>(false);

  // Modals state
  const [selectedTableForQr, setSelectedTableForQr] = useState<RestaurantTable | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');

  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [newTableLabel, setNewTableLabel] = useState<string>('');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);

  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'garcom' | 'cozinha' | 'caixa' | 'admin'>('garcom');
  const [newUserPhone, setNewUserPhone] = useState<string>('');
  const [newUserPin, setNewUserPin] = useState<string>('1234');

  useEffect(() => {
    return db.subscribe(() => {
      setProducts(db.getProducts());
      setTables(db.getTables());
      setProfiles(db.getProfiles());
      setTabsState(db.getTabs());
      setOrdersState(db.getOrders());
      setLeadsState(db.getCustomerLeads());
    });
  }, []);

  // Overview lifetime metrics
  const totalRevenueCents = tabsState
    .flatMap((t) => t.payments || [])
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const activeTabsCount = tabsState.filter((t) => t.status === 'open' || t.status === 'closing').length;
  const closedTabsCount = tabsState.filter((t) => t.status === 'paid').length;
  const averageTicketCents = closedTabsCount > 0
    ? Math.round(tabsState.filter((t) => t.status === 'paid').reduce((s, t) => s + t.paid_cents, 0) / closedTabsCount)
    : 0;

  // Filtered orders by period
  const filteredOrders = useMemo(() => {
    const now = new Date();
    return ordersState.filter((ord) => {
      if (ord.status === 'cancelled') return false;
      const ordDate = new Date(ord.created_at);

      if (filterPeriod === 'today') {
        return ordDate.toDateString() === now.toDateString();
      }
      if (filterPeriod === 'yesterday') {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        return ordDate.toDateString() === yest.toDateString();
      }
      if (filterPeriod === 'month') {
        return ordDate.getFullYear() === now.getFullYear() && ordDate.getMonth() === now.getMonth();
      }
      if (filterPeriod === 'year') {
        return ordDate.getFullYear() === now.getFullYear();
      }
      if (filterPeriod === 'custom') {
        const localDateStr = ordDate.toLocaleDateString('en-CA');
        return localDateStr === customDate;
      }
      return true;
    });
  }, [ordersState, filterPeriod, customDate]);

  // Aggregated items sold in the filtered period
  const { periodItemsSoldList, periodRevenueCents, periodItemsQuantity, topSellingProducts } = useMemo(() => {
    const itemsMap = new Map<string, {
      product_id: string;
      product_name: string;
      sector: ProductionSector;
      unit_price_cents: number;
      quantity: number;
      total_cents: number;
      current_stock: number;
      min_stock_alert: number;
    }>();

    let revenueCents = 0;
    let itemsQty = 0;

    for (const ord of filteredOrders) {
      revenueCents += ord.total_cents;
      for (const it of ord.items) {
        if (it.status === 'cancelled') continue;
        itemsQty += it.quantity;
        const key = it.product_id || it.product_name;
        const prod = products.find((p) => p.id === it.product_id);
        const currentStock = prod ? (prod.stock_quantity ?? 0) : 0;
        const minAlert = prod ? (prod.min_stock_alert ?? 10) : 10;

        const existing = itemsMap.get(key);
        if (existing) {
          existing.quantity += it.quantity;
          existing.total_cents += it.total_cents;
        } else {
          itemsMap.set(key, {
            product_id: it.product_id || '',
            product_name: it.product_name,
            sector: it.sector,
            unit_price_cents: it.unit_price_cents,
            quantity: it.quantity,
            total_cents: it.total_cents,
            current_stock: currentStock,
            min_stock_alert: minAlert,
          });
        }
      }
    }

    const list = Array.from(itemsMap.values()).sort((a, b) => b.quantity - a.quantity);
    const top = list.slice(0, 5);
    return {
      periodItemsSoldList: list,
      periodRevenueCents: revenueCents,
      periodItemsQuantity: itemsQty,
      topSellingProducts: top,
    };
  }, [filteredOrders, products]);

  // Stock summary counts
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.track_stock !== false && (p.stock_quantity ?? 0) <= (p.min_stock_alert ?? 10) && (p.stock_quantity ?? 0) > 0).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.track_stock !== false && (p.stock_quantity ?? 0) === 0).length;
  }, [products]);

  const totalStockValuationCents = useMemo(() => {
    return products.reduce((acc, p) => acc + (p.price_cents * (p.stock_quantity ?? 0)), 0);
  }, [products]);

  // Export CSV
  const handleExportClientsCSV = () => {
    const headers = ['Nome', 'Telefone', 'Qtd_Pedidos', 'Total_Gasto_R$', 'Primeiro_Pedido', 'Ultimo_Pedido', 'Canal_Preferido'];
    const rows = leadsState.map((l) => [
      `"${l.name.replace(/"/g, '""')}"`,
      `"${l.phone}"`,
      l.orders_count,
      (l.total_spent_cents / 100).toFixed(2),
      l.first_order_at ? new Date(l.first_order_at).toLocaleDateString('pt-BR') : '',
      l.last_order_at ? new Date(l.last_order_at).toLocaleDateString('pt-BR') : '',
      l.primary_channel === 'mesa' ? 'Mesa' : l.primary_channel === 'balcao' ? 'Balcão' : 'Ambos',
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `clientes_marketing_ct_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToastMessage('Planilha de clientes exportada com sucesso!');
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Copy all phone numbers for WhatsApp Broadcast
  const handleCopyAllPhones = () => {
    const validPhones = leadsState
      .map((l) => l.phone.replace(/\D/g, ''))
      .filter((p) => p.length >= 10);
    const text = validPhones.join(', ');
    navigator.clipboard.writeText(text);
    setToastMessage(`${validPhones.length} telefones copiados para a área de transferência!`);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleToggleProduct = (id: string) => {
    db.toggleProductAvailability(id);
  };

  const handleOpenEditProduct = (prod?: Product) => {
    if (prod) {
      setEditingProduct(prod);
      setPriceInput((prod.price_cents / 100).toFixed(2));
    } else {
      setEditingProduct({
        name: '',
        description: '',
        category_id: categories[0]?.id || '',
        sector: 'churrasqueira',
        is_available: true,
        allow_notes: true,
        stock_quantity: 40,
        track_stock: true,
        min_stock_alert: 10,
      });
      setPriceInput('');
    }
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingProduct.name) return;

    db.saveProduct({
      ...editingProduct,
      price_cents: parseBRLToCents(priceInput),
      stock_quantity: typeof editingProduct.stock_quantity === 'number' ? editingProduct.stock_quantity : 40,
      track_stock: editingProduct.track_stock ?? true,
      min_stock_alert: typeof editingProduct.min_stock_alert === 'number' ? editingProduct.min_stock_alert : 10,
    });

    setIsProductModalOpen(false);
    setEditingProduct(null);
  };

  const handleSaveTable = (e: React.FormEvent) => {
    e.preventDefault();
    db.saveTable({
      label: newTableLabel || undefined,
      capacity: newTableCapacity,
    });
    setIsTableModalOpen(false);
    setNewTableLabel('');
    setNewTableCapacity(4);
  };

  const handleOpenNewUser = () => {
    setEditingUserId(null);
    setNewUserName('');
    setNewUserRole('garcom');
    setNewUserPhone('');
    setNewUserPin('1234');
    setIsUserModalOpen(true);
  };

  const handleOpenEditUser = (profile: Profile) => {
    setEditingUserId(profile.id);
    setNewUserName(profile.full_name);
    setNewUserRole(profile.role);
    setNewUserPhone(profile.phone || '');
    setNewUserPin(profile.pin_code);
    setIsUserModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    db.saveProfile({
      id: editingUserId || undefined,
      full_name: newUserName,
      role: newUserRole,
      phone: newUserPhone || null,
      pin_code: newUserPin || '1234',
    });
    setIsUserModalOpen(false);
    setEditingUserId(null);
    setNewUserName('');
    setNewUserPhone('');
    setNewUserPin('1234');
    setToastMessage('PIN atualizado com sucesso e salvo permanentemente!');
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleSaveAnonKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!anonKeyInput.trim()) return;
    setSupabaseAnonKey(anonKeyInput.trim());
    supabaseSync.reconnect();
    setSyncStatus(supabaseSync.getStatus());
    setToastMessage('Chave Supabase salva com sucesso! Sincronização em tempo real ativada.');
    setTimeout(() => setToastMessage(null), 5000);
  };

  const handleCopySql = () => {
    const sqlContent = `-- Execute no SQL Editor do Supabase:
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.ct_cloud_sync (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.ct_cloud_sync ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Leitura publica ct_cloud_sync" ON public.ct_cloud_sync;
CREATE POLICY "Leitura publica ct_cloud_sync" ON public.ct_cloud_sync
    FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Insercao publica ct_cloud_sync" ON public.ct_cloud_sync;
CREATE POLICY "Insercao publica ct_cloud_sync" ON public.ct_cloud_sync
    FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Atualizacao publica ct_cloud_sync" ON public.ct_cloud_sync;
CREATE POLICY "Atualizacao publica ct_cloud_sync" ON public.ct_cloud_sync
    FOR UPDATE TO anon, authenticated USING (true);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'public' 
        AND tablename = 'ct_cloud_sync'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.ct_cloud_sync;
    END IF;
END $$;`;
    navigator.clipboard.writeText(sqlContent);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Toast Feedback */}
      {toastMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg shadow-emerald-950/40">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-charcoal-850 p-4 sm:p-6 rounded-2xl border border-gray-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Painel Administrativo & Gestão
            </h1>
            <p className="text-xs text-gray-400">
              Controle completo de produtos, mesas, faturamento e equipe
            </p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-charcoal-900 p-1 rounded-xl border border-gray-700 overflow-x-auto w-full md:w-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'overview'
                ? 'bg-charcoal-800 text-purple-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Relatórios & Vendas</span>
          </button>
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'stock'
                ? 'bg-charcoal-800 text-amber-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Controle de Estoque</span>
            {lowStockCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold border border-amber-500/40">
                {lowStockCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('clients')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'clients'
                ? 'bg-charcoal-800 text-pink-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Clientes & Marketing</span>
            <span className="px-1.5 py-0.2 rounded-full bg-pink-500/20 text-pink-300 text-[10px] font-mono font-bold border border-pink-500/40">
              {leadsState.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'products'
                ? 'bg-charcoal-800 text-ember-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Cardápio & Produtos</span>
          </button>
          <button
            onClick={() => setActiveTab('tables')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'tables'
                ? 'bg-charcoal-800 text-emerald-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Mesas & QR Codes</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-charcoal-800 text-blue-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Equipe & Perfis</span>
          </button>
          <button
            onClick={() => {
              setActiveTab('cloud');
              setSyncStatus(supabaseSync.getStatus());
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'cloud'
                ? 'bg-charcoal-800 text-cyan-400 shadow'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Cloud className="w-3.5 h-3.5" />
            <span>Nuvem & Supabase</span>
            {syncStatus.isConfigured ? (
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            ) : (
              <span className="w-2 h-2 rounded-full bg-amber-400" />
            )}
          </button>
        </div>
      </div>

      {/* TAB 1: RELATÓRIOS & VENDAS COM FILTRO TEMPORAL */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Top Global KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Faturamento Recebido</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-mono font-black text-emerald-400">
                {formatBRL(totalRevenueCents)}
              </p>
              <p className="text-[11px] text-gray-500">Valores liquidados no caixa</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Comandas Ativas</span>
                <Utensils className="w-4 h-4 text-ember-400" />
              </div>
              <p className="text-2xl font-mono font-black text-ember-400">
                {activeTabsCount} mesas
              </p>
              <p className="text-[11px] text-gray-500">Em consumo no salão</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Ticket Médio Geral</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-mono font-black text-cyan-400">
                {formatBRL(averageTicketCents)}
              </p>
              <p className="text-[11px] text-gray-500">Por comanda encerrada</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Total de Rodadas</span>
                <Package className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-mono font-black text-purple-400">
                {ordersState.length} pedidos
              </p>
              <p className="text-[11px] text-gray-500">Enviados à cozinha/bar</p>
            </div>
          </div>

          {/* Section: Relatório de Itens Vendidos com Filtro Temporal */}
          <div className="p-5 sm:p-6 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-purple-400" />
                  <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                    Relatório de Vendas & Itens Vendidos
                  </h2>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  Filtre as vendas por dia, mês e ano para auditar saídas e receitas em tempo real.
                </p>
              </div>

              {/* Temporal Filters */}
              <div className="flex flex-wrap items-center gap-1.5 bg-charcoal-900 p-1.5 rounded-xl border border-gray-700">
                <button
                  type="button"
                  onClick={() => setFilterPeriod('today')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterPeriod === 'today'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Hoje
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPeriod('yesterday')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterPeriod === 'yesterday'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Ontem
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPeriod('month')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterPeriod === 'month'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Mês Atual
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPeriod('year')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterPeriod === 'year'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Ano Atual
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPeriod('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterPeriod === 'all'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  Todos
                </button>
                <button
                  type="button"
                  onClick={() => setFilterPeriod('custom')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                    filterPeriod === 'custom'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Filter className="w-3 h-3" />
                  <span>Data Específica</span>
                </button>

                {filterPeriod === 'custom' && (
                  <input
                    type="date"
                    value={customDate}
                    onChange={(e) => setCustomDate(e.target.value)}
                    className="px-2.5 py-1 bg-charcoal-800 border border-purple-500 rounded-lg text-xs text-white focus:outline-none"
                  />
                )}
              </div>
            </div>

            {/* Period Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
              <div className="p-3.5 rounded-xl bg-charcoal-900 border border-gray-800">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Receita no Período</span>
                <p className="text-xl font-mono font-black text-emerald-400 mt-1">
                  {formatBRL(periodRevenueCents)}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Soma dos pedidos concluídos</p>
              </div>

              <div className="p-3.5 rounded-xl bg-charcoal-900 border border-gray-800">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Pedidos no Período</span>
                <p className="text-xl font-mono font-black text-purple-400 mt-1">
                  {filteredOrders.length} pedidos
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Filtrados na data selecionada</p>
              </div>

              <div className="p-3.5 rounded-xl bg-charcoal-900 border border-gray-800">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Itens Vendidos</span>
                <p className="text-xl font-mono font-black text-ember-400 mt-1">
                  {periodItemsQuantity} un.
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Baixa automática realizada</p>
              </div>

              <div className="p-3.5 rounded-xl bg-charcoal-900 border border-gray-800">
                <span className="text-[11px] font-semibold text-gray-400 uppercase">Ticket Médio Período</span>
                <p className="text-xl font-mono font-black text-cyan-400 mt-1">
                  {formatBRL(filteredOrders.length > 0 ? Math.round(periodRevenueCents / filteredOrders.length) : 0)}
                </p>
                <p className="text-[10px] text-gray-500 mt-0.5">Por pedido no período</p>
              </div>
            </div>

            {/* TOP SELLING PRODUCTS PODIUM / RANKING */}
            <div className="pt-4 border-t border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Produtos Mais Vendidos no Período
                  </h3>
                </div>
                <span className="text-xs text-gray-400 font-medium">
                  {topSellingProducts.length > 0 ? `Top ${topSellingProducts.length} itens líderes` : 'Nenhuma venda no período'}
                </span>
              </div>

              {topSellingProducts.length === 0 ? (
                <div className="p-6 text-center rounded-xl bg-charcoal-900 border border-gray-800/80 text-gray-400 text-xs">
                  Nenhum produto vendido com os filtros selecionados.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {topSellingProducts.map((item, idx) => {
                    const percentage = periodItemsQuantity > 0 ? Math.round((item.quantity / periodItemsQuantity) * 100) : 0;
                    const medals = ['🥇 1º Lugar', '🥈 2º Lugar', '🥉 3º Lugar', '4º Lugar', '5º Lugar'];
                    const medalColors = [
                      'border-amber-500/50 bg-amber-500/10 text-amber-300',
                      'border-slate-400/50 bg-slate-400/10 text-slate-200',
                      'border-amber-700/50 bg-amber-700/10 text-amber-500',
                      'border-gray-700 bg-charcoal-900 text-gray-300',
                      'border-gray-700 bg-charcoal-900 text-gray-300',
                    ];

                    return (
                      <div
                        key={item.product_id || item.product_name}
                        className={`p-3.5 rounded-xl border ${medalColors[idx]} space-y-2 relative overflow-hidden`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-black uppercase tracking-wider">
                            {medals[idx]}
                          </span>
                          <span className="text-xs font-mono font-bold text-gray-300">
                            {percentage}% do volume
                          </span>
                        </div>

                        <div>
                          <p className="font-bold text-white text-sm line-clamp-1">{item.product_name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <SectorBadge sector={item.sector} />
                            <span className="text-[11px] text-gray-400 font-mono">
                              Estoque Atual: <strong className={item.current_stock <= item.min_stock_alert ? 'text-amber-400' : 'text-emerald-400'}>{item.current_stock} un</strong>
                            </span>
                          </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full bg-charcoal-800 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-gradient-to-r from-ember-500 to-amber-400 h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(10, percentage))}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between pt-1 text-xs">
                          <span className="font-mono font-bold text-white">
                            {item.quantity} unidades vendidas
                          </span>
                          <span className="font-mono font-bold text-emerald-400">
                            {formatBRL(item.total_cents)}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* DETAILED ITEMS SOLD TABLE */}
            <div className="pt-4 border-t border-gray-800 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-purple-400" />
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                    Detalhamento de Saída de Itens ({periodItemsSoldList.length})
                  </h3>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar produto vendido..."
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-charcoal-900 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 placeholder-gray-500"
                  />
                </div>
              </div>

              <div className="bg-charcoal-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-charcoal-950/70 border-b border-gray-800 text-[11px] uppercase font-bold text-gray-400">
                      <tr>
                        <th className="p-3">Item Vendido</th>
                        <th className="p-3">Setor</th>
                        <th className="p-3 text-center">Qtd. Vendida</th>
                        <th className="p-3">Preço Unit.</th>
                        <th className="p-3">Faturamento Total</th>
                        <th className="p-3 text-center">Estoque Restante</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/80">
                      {periodItemsSoldList
                        .filter((it) => it.product_name.toLowerCase().includes(reportSearch.toLowerCase()))
                        .map((it) => (
                          <tr key={it.product_id || it.product_name} className="hover:bg-charcoal-800/40 transition">
                            <td className="p-3">
                              <p className="font-bold text-white">{it.product_name}</p>
                            </td>
                            <td className="p-3">
                              <SectorBadge sector={it.sector} />
                            </td>
                            <td className="p-3 text-center font-mono font-bold text-purple-300">
                              {it.quantity} un
                            </td>
                            <td className="p-3 font-mono text-gray-300">
                              {formatBRL(it.unit_price_cents)}
                            </td>
                            <td className="p-3 font-mono font-bold text-emerald-400">
                              {formatBRL(it.total_cents)}
                            </td>
                            <td className="p-3 text-center">
                              <span
                                className={`inline-block px-2.5 py-0.5 rounded-full font-mono font-bold text-[11px] ${
                                  it.current_stock === 0
                                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                                    : it.current_stock <= it.min_stock_alert
                                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                }`}
                              >
                                {it.current_stock} un
                              </span>
                            </td>
                          </tr>
                        ))}
                      {periodItemsSoldList.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-gray-500">
                            Nenhuma saída de item registrada no período selecionado.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: CONTROLE DE ESTOQUE & BAIXA AUTOMÁTICA */}
      {activeTab === 'stock' && (
        <div className="space-y-6">
          {/* Stock KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Total de Produtos</span>
                <Boxes className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-mono font-black text-white">
                {products.length} itens
              </p>
              <p className="text-[11px] text-gray-500">Cadastrados no sistema</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-amber-500/30 space-y-1">
              <div className="flex items-center justify-between text-amber-400">
                <span className="text-xs font-semibold uppercase">Estoque Baixo</span>
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              </div>
              <p className="text-2xl font-mono font-black text-amber-400">
                {lowStockCount} itens
              </p>
              <p className="text-[11px] text-amber-500/80">Abaixo do alerta mínimo</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-rose-500/30 space-y-1">
              <div className="flex items-center justify-between text-rose-400">
                <span className="text-xs font-semibold uppercase">Esgotados</span>
                <X className="w-4 h-4 text-rose-400" />
              </div>
              <p className="text-2xl font-mono font-black text-rose-400">
                {outOfStockCount} itens
              </p>
              <p className="text-[11px] text-rose-500/80">Estoque zerado no momento</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Valor em Mercadoria</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-mono font-black text-emerald-400">
                {formatBRL(totalStockValuationCents)}
              </p>
              <p className="text-[11px] text-gray-500">A preço de venda em catálogo</p>
            </div>
          </div>

          {/* Stock Table & Replenish Controls */}
          <div className="p-5 sm:p-6 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Boxes className="w-5 h-5 text-amber-400" />
                  <span>Painel de Reposição e Controle de Estoque</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  A baixa de estoque é feita automaticamente a cada pedido recebido e estornada caso o pedido seja cancelado.
                </p>
              </div>

              {/* Stock Filter & Search */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome..."
                    value={stockSearch}
                    onChange={(e) => setStockSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-charcoal-900 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div className="flex items-center gap-1 bg-charcoal-900 p-1 rounded-lg border border-gray-700">
                  <button
                    type="button"
                    onClick={() => setStockFilter('all')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                      stockFilter === 'all' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter('low')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                      stockFilter === 'low' ? 'bg-amber-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Baixo ({lowStockCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStockFilter('out')}
                    className={`px-2.5 py-1 rounded text-xs font-bold transition ${
                      stockFilter === 'out' ? 'bg-rose-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    Zerados ({outOfStockCount})
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-charcoal-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-charcoal-950/70 border-b border-gray-800 text-[11px] uppercase font-bold text-gray-400">
                    <tr>
                      <th className="p-3.5">Produto</th>
                      <th className="p-3.5">Setor</th>
                      <th className="p-3.5">Preço Unit.</th>
                      <th className="p-3.5 text-center">Status</th>
                      <th className="p-3.5 text-center">Qtd. em Estoque</th>
                      <th className="p-3.5 text-right">Reposição Rápida</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {products
                      .filter((p) => {
                        if (stockSearch && !p.name.toLowerCase().includes(stockSearch.toLowerCase())) {
                          return false;
                        }
                        const qty = p.stock_quantity ?? 0;
                        const minAlert = p.min_stock_alert ?? 10;
                        if (stockFilter === 'low') return p.track_stock !== false && qty <= minAlert && qty > 0;
                        if (stockFilter === 'out') return p.track_stock !== false && qty === 0;
                        return true;
                      })
                      .map((p) => {
                        const stock = p.stock_quantity ?? 0;
                        const minAlert = p.min_stock_alert ?? 10;
                        const isOut = stock === 0;
                        const isLow = stock <= minAlert && !isOut;

                        return (
                          <tr key={p.id} className="hover:bg-charcoal-800/40 transition">
                            <td className="p-3.5">
                              <p className="font-bold text-white text-sm">{p.name}</p>
                              <p className="text-gray-500 text-[11px] line-clamp-1">{p.description}</p>
                            </td>
                            <td className="p-3.5">
                              <SectorBadge sector={p.sector} />
                            </td>
                            <td className="p-3.5 font-mono font-bold text-ember-400">
                              {formatBRL(p.price_cents)}
                            </td>
                            <td className="p-3.5 text-center">
                              {isOut ? (
                                <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[11px] font-bold border border-rose-500/40">
                                  🚫 Esgotado
                                </span>
                              ) : isLow ? (
                                <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/40">
                                  ⚠️ Baixo Estoque
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold border border-emerald-500/40">
                                  ✅ Normal
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 text-center">
                              <span className="font-mono text-base font-black text-white">
                                {stock}
                              </span>
                              <span className="text-[11px] text-gray-500 block">unidades</span>
                            </td>
                            <td className="p-3.5 text-right">
                              <div className="inline-flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => db.adjustProductStock(p.id, -1)}
                                  className="w-7 h-7 rounded-lg bg-charcoal-800 hover:bg-gray-700 text-gray-300 font-bold text-xs flex items-center justify-center transition"
                                  title="Subtrair 1 unidade"
                                >
                                  -1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => db.adjustProductStock(p.id, 1)}
                                  className="w-7 h-7 rounded-lg bg-charcoal-800 hover:bg-gray-700 text-gray-300 font-bold text-xs flex items-center justify-center transition"
                                  title="Adicionar 1 unidade"
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  onClick={() => db.adjustProductStock(p.id, 10)}
                                  className="px-2 h-7 rounded-lg bg-amber-600/30 hover:bg-amber-600/50 text-amber-300 border border-amber-500/40 font-bold text-xs flex items-center justify-center transition"
                                  title="Adicionar 10 unidades"
                                >
                                  +10
                                </button>
                                <button
                                  type="button"
                                  onClick={() => db.adjustProductStock(p.id, 50)}
                                  className="px-2 h-7 rounded-lg bg-purple-600/30 hover:bg-purple-600/50 text-purple-300 border border-purple-500/40 font-bold text-xs flex items-center justify-center transition"
                                  title="Adicionar 50 unidades (Fardo/Caixa)"
                                >
                                  +50
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BASE DE CLIENTES & MARKETING CRM */}
      {activeTab === 'clients' && (
        <div className="space-y-6">
          {/* CRM KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Total de Clientes</span>
                <Users className="w-4 h-4 text-pink-400" />
              </div>
              <p className="text-2xl font-mono font-black text-white">
                {leadsState.length} clientes
              </p>
              <p className="text-[11px] text-gray-500">Capturados nas mesas e balcão</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Clientes Recorrentes</span>
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <p className="text-2xl font-mono font-black text-purple-400">
                {leadsState.filter((l) => l.orders_count > 1).length} clientes
              </p>
              <p className="text-[11px] text-gray-500">Com 2 ou mais visitas/pedidos</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">Faturamento Base</span>
                <DollarSign className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-2xl font-mono font-black text-emerald-400">
                {formatBRL(leadsState.reduce((acc, l) => acc + l.total_spent_cents, 0))}
              </p>
              <p className="text-[11px] text-gray-500">Volume gerado pelos clientes</p>
            </div>

            <div className="p-4 sm:p-5 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-1">
              <div className="flex items-center justify-between text-gray-400">
                <span className="text-xs font-semibold uppercase">LTV Médio por Cliente</span>
                <TrendingUp className="w-4 h-4 text-cyan-400" />
              </div>
              <p className="text-2xl font-mono font-black text-cyan-400">
                {formatBRL(leadsState.length > 0 ? Math.round(leadsState.reduce((acc, l) => acc + l.total_spent_cents, 0) / leadsState.length) : 0)}
              </p>
              <p className="text-[11px] text-gray-500">Gasto médio acumulado</p>
            </div>
          </div>

          {/* CRM Action Bar & Table */}
          <div className="p-5 sm:p-6 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-pink-400" />
                  <span>Base de Clientes para Campanhas de Marketing</span>
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Exportação de listas, cópia de telefones para lista de transmissão e contato direto via WhatsApp.
                </p>
              </div>

              {/* CRM Actions */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    placeholder="Buscar por nome ou fone..."
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    className="pl-8 pr-3 py-1.5 bg-charcoal-900 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleCopyAllPhones}
                  className="px-3 py-1.5 rounded-lg bg-charcoal-900 hover:bg-charcoal-800 border border-gray-700 text-gray-200 text-xs font-bold flex items-center gap-1.5 transition"
                  title="Copiar todos os números para colar em lista de transmissão"
                >
                  <Copy className="w-3.5 h-3.5 text-purple-400" />
                  <span>Copiar Telefones</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportClientsCSV}
                  className="px-3 py-1.5 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar CSV</span>
                </button>
              </div>
            </div>

            <div className="bg-charcoal-900 rounded-xl border border-gray-800 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-charcoal-950/70 border-b border-gray-800 text-[11px] uppercase font-bold text-gray-400">
                    <tr>
                      <th className="p-3.5">Cliente</th>
                      <th className="p-3.5">WhatsApp</th>
                      <th className="p-3.5">Canal</th>
                      <th className="p-3.5 text-center">Pedidos</th>
                      <th className="p-3.5">Total Gasto (LTV)</th>
                      <th className="p-3.5">Último Pedido</th>
                      <th className="p-3.5 text-right">Ação de Marketing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {leadsState
                      .filter((lead) => {
                        if (!clientSearch) return true;
                        const q = clientSearch.toLowerCase();
                        const digits = clientSearch.replace(/\D/g, '');
                        return (
                          lead.name.toLowerCase().includes(q) ||
                          lead.phone.replace(/\D/g, '').includes(digits)
                        );
                      })
                      .map((lead) => {
                        const cleanDigits = lead.phone.replace(/\D/g, '');
                        const promoMessage = `Olá ${lead.name}! Tudo bem? Passando para te convidar para o CT Conveniência hoje! Temos espetinho na brasa e bebidas trincando esperando por você. 🍢🍻`;
                        const waUrl = cleanDigits
                          ? `https://wa.me/55${cleanDigits}?text=${encodeURIComponent(promoMessage)}`
                          : null;

                        return (
                          <tr key={lead.phone || lead.name} className="hover:bg-charcoal-800/40 transition">
                            <td className="p-3.5">
                              <p className="font-bold text-white text-sm">{lead.name}</p>
                              {lead.orders_count > 1 && (
                                <span className="inline-flex items-center gap-1 text-[10px] text-pink-400 font-semibold">
                                  <Sparkles className="w-2.5 h-2.5" /> Cliente Fiel ({lead.orders_count} visitas)
                                </span>
                              )}
                            </td>
                            <td className="p-3.5 font-mono text-gray-300">
                              {lead.phone || <span className="text-gray-500 italic">Não informado</span>}
                            </td>
                            <td className="p-3.5">
                              <span
                                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  lead.primary_channel === 'mesa'
                                    ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                                    : lead.primary_channel === 'balcao'
                                    ? 'bg-ember-500/20 text-ember-300 border border-ember-500/40'
                                    : 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                                }`}
                              >
                                {lead.primary_channel === 'mesa' ? 'Mesa Salão' : lead.primary_channel === 'balcao' ? 'Balcão / Retirada' : 'Ambos'}
                              </span>
                            </td>
                            <td className="p-3.5 text-center font-mono font-bold text-white">
                              {lead.orders_count}
                            </td>
                            <td className="p-3.5 font-mono font-bold text-emerald-400">
                              {formatBRL(lead.total_spent_cents)}
                            </td>
                            <td className="p-3.5 text-gray-400 text-[11px]">
                              {lead.last_order_at ? new Date(lead.last_order_at).toLocaleString('pt-BR') : '-'}
                            </td>
                            <td className="p-3.5 text-right">
                              {waUrl ? (
                                <a
                                  href={waUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/40 text-xs font-bold transition shadow-sm"
                                >
                                  <Send className="w-3 h-3" />
                                  <span>WhatsApp</span>
                                </a>
                              ) : (
                                <span className="text-gray-600 text-[11px] italic">Sem telefone</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    {leadsState.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-gray-500">
                          Nenhum cliente cadastrado ainda. A base será preenchida automaticamente conforme novos pedidos forem realizados!
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRODUCTS & MENU */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-200">
              Produtos Cadastrados ({products.length})
            </h3>
            <button
              type="button"
              onClick={() => handleOpenEditProduct()}
              className="py-2 px-3.5 rounded-xl bg-ember-600 hover:bg-ember-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-ember-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Produto</span>
            </button>
          </div>

          <div className="bg-charcoal-850 rounded-2xl border border-gray-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-gray-300">
                <thead className="bg-charcoal-900 border-b border-gray-800 text-[11px] uppercase font-bold text-gray-400">
                  <tr>
                    <th className="p-3.5">Produto</th>
                    <th className="p-3.5">Categoria</th>
                    <th className="p-3.5">Setor de Produção</th>
                    <th className="p-3.5">Preço (R$)</th>
                    <th className="p-3.5 text-center">Disponível?</th>
                    <th className="p-3.5 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800">
                  {products.map((p) => {
                    const cat = categories.find((c) => c.id === p.category_id);
                    return (
                      <tr key={p.id} className="hover:bg-charcoal-800/40 transition">
                        <td className="p-3.5">
                          <p className="font-bold text-white text-sm">{p.name}</p>
                          <p className="text-gray-500 text-[11px] line-clamp-1">{p.description}</p>
                        </td>
                        <td className="p-3.5">{cat?.name || 'Geral'}</td>
                        <td className="p-3.5">
                          <SectorBadge sector={p.sector} />
                        </td>
                        <td className="p-3.5 font-mono font-bold text-ember-400 text-sm">
                          {formatBRL(p.price_cents)}
                        </td>
                        <td className="p-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleProduct(p.id)}
                            className="inline-flex items-center gap-1 text-xs"
                          >
                            {p.is_available ? (
                              <ToggleRight className="w-6 h-6 text-emerald-400" />
                            ) : (
                              <ToggleLeft className="w-6 h-6 text-gray-500" />
                            )}
                          </button>
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => handleOpenEditProduct(p)}
                            className="p-1.5 rounded-lg bg-charcoal-800 hover:bg-gray-700 text-gray-300 hover:text-white"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TABLES & QR CODES */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-200">
              Mesas do Estabelecimento ({tables.length})
            </h3>
            <button
              type="button"
              onClick={() => setIsTableModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Mesa</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {tables.map((t) => (
              <div
                key={t.id}
                className="p-4 rounded-2xl bg-charcoal-850 border border-gray-800 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-white text-base">{t.label}</h4>
                  <p className="text-xs text-gray-400">Capacidade: {t.capacity} lugares</p>
                  <div className="mt-2">
                    <TableStatusBadge status={t.status} />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedTableForQr(t)}
                  title="Ver QR Code"
                  className="p-2.5 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-ember-400 border border-gray-700 transition"
                >
                  <QrCode className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: USERS & ROLES */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-gray-200">
              Equipe & Perfis de Atendimento ({profiles.length})
            </h3>
            <button
              type="button"
              onClick={handleOpenNewUser}
              className="py-2 px-3.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-purple-600/30 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Funcionário / Garçom</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {profiles.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-sm">{p.full_name}</span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-charcoal-800 text-purple-400 border border-gray-700">
                      {p.role}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">Tel: {p.phone || 'Não informado'}</p>
                </div>

                <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs text-gray-400">PIN:</span>
                    <span className="font-mono font-bold text-amber-400 bg-charcoal-900 px-2 py-0.5 rounded border border-gray-700 text-xs">
                      {p.pin_code}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenEditUser(p)}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-charcoal-800 hover:bg-gray-700 text-purple-300 font-bold text-xs border border-gray-700 transition"
                  >
                    <Edit2 className="w-3 h-3 text-purple-400" />
                    <span>Editar PIN</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: NUVEM & SUPABASE REALTIME */}
      {activeTab === 'cloud' && (
        <div className="space-y-6">
          {/* Status Card */}
          <div className="p-6 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${
                    syncStatus.isConfigured
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                  }`}
                >
                  <Cloud className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <span>Sincronização em Nuvem Supabase</span>
                    {syncStatus.isConfigured ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
                        Ativo em Tempo Real
                      </span>
                    ) : (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/40">
                        Chave Pendente
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Permite que pedidos feitos no celular (via QR Code ou Cardápio Online) cheguem instantaneamente na Cozinha e no Caixa do computador em tempo real.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    supabaseSync.reconnect();
                    setSyncStatus(supabaseSync.getStatus());
                    setToastMessage('Tentativa de reconexão executada!');
                    setTimeout(() => setToastMessage(null), 3000);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-gray-200 text-xs font-bold border border-gray-700 flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Testar Conexão</span>
                </button>
              </div>
            </div>

            {/* Connection Information */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-charcoal-900 border border-gray-800">
                <span className="text-[11px] font-semibold text-gray-400 block mb-0.5">URL do Projeto Supabase:</span>
                <code className="text-xs font-mono text-cyan-300 font-bold break-all select-all">
                  {getSupabaseUrl()}
                </code>
              </div>

              <div className="p-3 rounded-xl bg-charcoal-900 border border-gray-800">
                <span className="text-[11px] font-semibold text-gray-400 block mb-0.5">Origem da Chave Anon:</span>
                <div className="flex items-center gap-1.5 text-xs font-bold">
                  <span className={getSupabaseDiagnostics().isConfigured ? 'text-emerald-400' : 'text-amber-400'}>
                    {getSupabaseDiagnostics().source}
                  </span>
                  <span className="text-[11px] text-gray-500 font-mono">
                    ({getSupabaseDiagnostics().keyMasked})
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-charcoal-900 border border-gray-800">
                <span className="text-[11px] font-semibold text-gray-400 block mb-0.5">Canal Realtime & Nuvem:</span>
                <div className="flex items-center gap-2 text-xs font-bold">
                  {syncStatus.isConfigured ? (
                    <>
                      <Wifi className="w-4 h-4 text-emerald-400 animate-pulse flex-shrink-0" />
                      <span className="text-emerald-400">Ativo</span>
                      {syncStatus.lastSyncedAt && (
                        <span className="text-[10px] text-gray-500 font-normal">({syncStatus.lastSyncedAt})</span>
                      )}
                    </>
                  ) : (
                    <>
                      <WifiOff className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <span className="text-amber-400">Pendente de Chave</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Phone Pairing Link */}
            {getSupabaseDiagnostics().rawKey && (
              <div className="p-3.5 rounded-xl bg-cyan-950/40 border border-cyan-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div>
                  <span className="font-bold text-cyan-300 block">Sincronizar Celular com 1 Clique:</span>
                  <p className="text-gray-400 text-[11px]">
                    Envie este link para abrir no celular da equipe. O celular conecta ao Supabase instantaneamente sem precisar digitar nada!
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const pairingUrl = `${window.location.origin}/?anonKey=${encodeURIComponent(getSupabaseDiagnostics().rawKey)}`;
                    navigator.clipboard.writeText(pairingUrl);
                    setToastMessage('Link de sincronização copiado! Abra no celular para conectar.');
                    setTimeout(() => setToastMessage(null), 3500);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-md shadow-cyan-600/30 flex-shrink-0"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar Link de Sincronização</span>
                </button>
              </div>
            )}
          </div>

          {/* Form to insert/update Anon Key */}
          <div className="p-6 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-4">
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <span>Configurar Chave Pública (Anon Key) do Supabase</span>
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                Cole aqui a chave pública anônima (<code className="text-amber-300 font-mono">anon public</code>) gerada pelo seu Supabase. Ela é salva neste navegador e conecta instantaneamente celulares e computadores!
              </p>
            </div>

            <form onSubmit={handleSaveAnonKey} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Chave Anon do Supabase (anon public):
                </label>
                <input
                  type="text"
                  required
                  placeholder="Cole sua anon key aqui (ex: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...)"
                  value={anonKeyInput}
                  onChange={(e) => setAnonKeyInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-charcoal-900 border border-gray-700 focus:border-cyan-500 rounded-xl text-xs font-mono text-cyan-200 placeholder-gray-600 focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
                <a
                  href="https://supabase.com/dashboard/project/ogldhoxfbjhgvwpjocoj/settings/api"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 underline font-semibold"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Obter Anon Key no Supabase (Project Settings &rarr; API)</span>
                </a>

                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/30 transition flex items-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Salvar Chave & Ativar Realtime</span>
                </button>
              </div>
            </form>
          </div>

          {/* SQL Editor Instructions */}
          <div className="p-6 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                  <Database className="w-4 h-4 text-purple-400" />
                  <span>Configuração de Tabelas no Supabase (Opcional para Backup)</span>
                </h3>
                <p className="text-xs text-gray-400 mt-1">
                  O canal em tempo real já sincroniza instantaneamente. Se desejar persistência no banco de dados do Supabase, execute este script no SQL Editor.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopySql}
                  className="px-3.5 py-1.5 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-purple-300 text-xs font-bold border border-purple-500/30 flex items-center gap-1.5 transition"
                >
                  {copiedSql ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-purple-400" />
                      <span>Copiar Script SQL</span>
                    </>
                  )}
                </button>
                <a
                  href="https://supabase.com/dashboard/project/ogldhoxfbjhgvwpjocoj/sql/new"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 text-xs font-bold border border-purple-500/40 flex items-center gap-1.5 transition"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Abrir SQL Editor</span>
                </a>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-charcoal-900 border border-gray-800 text-[11px] font-mono text-gray-300 overflow-x-auto max-h-48">
              <pre>{`-- 1. Tabela de Sincronização em Nuvem (Document Sync)
CREATE TABLE IF NOT EXISTS public.ct_cloud_sync (
    id TEXT PRIMARY KEY,
    data JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.ct_cloud_sync ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public Read/Write" ON public.ct_cloud_sync FOR ALL TO anon, authenticated USING (true);
ALTER PUBLICATION supabase_realtime ADD TABLE public.ct_cloud_sync;`}</pre>
            </div>
          </div>
        </div>
      )}

      {/* Product Edit/Create Modal */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-charcoal-900 border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">
                {editingProduct.id ? 'Editar Produto' : 'Novo Produto'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Nome do Produto:</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-ember-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Descrição:</label>
                <textarea
                  rows={2}
                  value={editingProduct.description || ''}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-ember-500 resize-none"
                />
              </div>

              {/* Foto do Produto com Conversão Automática para WebP */}
              <ImageUploadWebP
                currentImageUrl={editingProduct.image_url}
                onImageConverted={(webpDataUrl) => {
                  setEditingProduct((prev) => prev ? { ...prev, image_url: webpDataUrl } : null);
                }}
                onImageRemoved={() => {
                  setEditingProduct((prev) => prev ? { ...prev, image_url: null } : null);
                }}
              />

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Preço de Venda (R$):</label>
                  <input
                    type="text"
                    required
                    placeholder="0,00"
                    value={priceInput}
                    onChange={(e) => setPriceInput(e.target.value)}
                    className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white font-mono font-bold focus:outline-none focus:border-ember-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Setor de Produção:</label>
                  <select
                    value={editingProduct.sector || 'churrasqueira'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, sector: e.target.value as ProductionSector })
                    }
                    className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-ember-500"
                  >
                    <option value="churrasqueira">Churrasqueira</option>
                    <option value="cozinha">Cozinha</option>
                    <option value="bar">Bar</option>
                  </select>
                </div>
              </div>

              {/* Controle de Estoque */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-800">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Qtd. em Estoque:</label>
                  <input
                    type="number"
                    min={0}
                    value={editingProduct.stock_quantity ?? 40}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        stock_quantity: parseInt(e.target.value, 10) || 0,
                      })
                    }
                    className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white font-mono font-bold focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Alerta Mínimo:</label>
                  <input
                    type="number"
                    min={1}
                    value={editingProduct.min_stock_alert ?? 10}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        min_stock_alert: parseInt(e.target.value, 10) || 10,
                      })
                    }
                    className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-xl bg-charcoal-800/80 border border-gray-700">
                <div>
                  <p className="text-xs font-bold text-white">Baixa Automática no Estoque</p>
                  <p className="text-[11px] text-gray-400">Descontar automaticamente a cada item vendido</p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setEditingProduct({
                      ...editingProduct,
                      track_stock: editingProduct.track_stock === false ? true : false,
                    })
                  }
                  className="text-xs"
                >
                  {editingProduct.track_stock !== false ? (
                    <ToggleRight className="w-7 h-7 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="w-7 h-7 text-gray-500" />
                  )}
                </button>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-ember-600 hover:bg-ember-500 text-white text-xs font-bold shadow-md shadow-ember-600/30"
                >
                  Salvar Produto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Table Create Modal */}
      {isTableModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-charcoal-900 border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Cadastrar Nova Mesa</h3>
              <button
                onClick={() => setIsTableModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveTable} className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Identificador da Mesa (opcional):
                </label>
                <input
                  type="text"
                  placeholder="Ex: Mesa 11, Banqueta 05"
                  value={newTableLabel}
                  onChange={(e) => setNewTableLabel(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Capacidade (Lugares):</label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  value={newTableCapacity}
                  onChange={(e) => setNewTableCapacity(parseInt(e.target.value) || 4)}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTableModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-md shadow-emerald-600/30"
                >
                  Criar Mesa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Staff / User Create & PIN Edit Modal */}
      {isUserModalOpen && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-sm bg-charcoal-900 border border-purple-500/50 rounded-2xl p-6 shadow-2xl space-y-4 my-auto">
            <div className="flex items-center justify-between pb-2 border-b border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-400">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {editingUserId ? 'Alterar PIN / Editar Perfil' : 'Cadastrar Funcionário'}
                  </h3>
                  <p className="text-[11px] text-gray-400">
                    {editingUserId ? 'Defina a nova senha numérica' : 'Preencha os dados de acesso'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsUserModalOpen(false);
                  setEditingUserId(null);
                }}
                className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3.5">
              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">
                  Nome Completo:
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Roberto Silva"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Função / Cargo:</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'garcom' | 'cozinha' | 'caixa' | 'admin')}
                    className="w-full px-2 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="garcom">Garçom</option>
                    <option value="cozinha">Cozinha</option>
                    <option value="caixa">Caixa</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">
                    PIN (4 dígitos):
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="1234"
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-charcoal-800 border border-amber-500/60 rounded-lg text-sm text-amber-300 font-mono font-black focus:outline-none focus:border-amber-400 text-center tracking-widest"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-300 block mb-1">Telefone / WhatsApp (opcional):</label>
                <input
                  type="text"
                  placeholder="(44) 99999-9999"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-purple-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-purple-950/30 border border-purple-800/40 text-[11px] text-gray-400 flex items-start gap-2">
                <Lock className="w-3.5 h-3.5 text-purple-400 mt-0.5 flex-shrink-0" />
                <span>Esse PIN é utilizado para o funcionário se identificar e lançar comandas ou operar o sistema.</span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsUserModalOpen(false);
                    setEditingUserId(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-md shadow-purple-600/30"
                >
                  {editingUserId ? 'Salvar Novo PIN' : 'Cadastrar Funcionário'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* QR Code Modal */}
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
