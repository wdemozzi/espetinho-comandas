import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { db } from '../../lib/databaseStore';
import { Product, RestaurantTable, ProductionSector, Profile } from '../../types/database.types';
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
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'tables' | 'users' | 'cloud'>('overview');
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [tables, setTables] = useState<RestaurantTable[]>(db.getTables());
  const categories = db.getCategories();
  const [profiles, setProfiles] = useState<Profile[]>(db.getProfiles());
  const tabs = db.getTabs();
  const orders = db.getOrders();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

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
    });
  }, []);

  // Overview metrics
  const totalRevenueCents = tabs
    .flatMap((t) => t.payments || [])
    .reduce((sum, p) => sum + p.amount_cents, 0);

  const activeTabsCount = tabs.filter((t) => t.status === 'open' || t.status === 'closing').length;
  const closedTabsCount = tabs.filter((t) => t.status === 'paid').length;
  const averageTicketCents = closedTabsCount > 0
    ? Math.round(tabs.filter((t) => t.status === 'paid').reduce((s, t) => s + t.paid_cents, 0) / closedTabsCount)
    : 0;

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
            <span>Indicadores</span>
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
            <Users className="w-3.5 h-3.5" />
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

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
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
                <span className="text-xs font-semibold uppercase">Ticket Médio</span>
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
                {orders.length} pedidos
              </p>
              <p className="text-[11px] text-gray-500">Enviados à cozinha/bar</p>
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
