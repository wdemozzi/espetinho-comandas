import React, { useState, useEffect } from 'react';
import { db } from '../../lib/databaseStore';
import { Product, RestaurantTable, ProductionSector } from '../../types/database.types';
import { formatBRL, parseBRLToCents } from '../../lib/currency';
import { SectorBadge, TableStatusBadge } from '../../components/common/Badge';
import { QrCodeModal } from '../../components/common/QrCodeModal';
import { ImageUploadWebP } from '../../components/common/ImageUploadWebP';
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
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'tables' | 'users'>('overview');
  const [products, setProducts] = useState<Product[]>(db.getProducts());
  const [tables, setTables] = useState<RestaurantTable[]>(db.getTables());
  const categories = db.getCategories();
  const profiles = db.getProfiles();
  const tabs = db.getTabs();
  const orders = db.getOrders();

  // Modals state
  const [selectedTableForQr, setSelectedTableForQr] = useState<RestaurantTable | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [priceInput, setPriceInput] = useState<string>('');

  const [isTableModalOpen, setIsTableModalOpen] = useState<boolean>(false);
  const [newTableLabel, setNewTableLabel] = useState<string>('');
  const [newTableCapacity, setNewTableCapacity] = useState<number>(4);

  const [isUserModalOpen, setIsUserModalOpen] = useState<boolean>(false);
  const [newUserName, setNewUserName] = useState<string>('');
  const [newUserRole, setNewUserRole] = useState<'garcom' | 'cozinha' | 'caixa' | 'admin'>('garcom');
  const [newUserPhone, setNewUserPhone] = useState<string>('');
  const [newUserPin, setNewUserPin] = useState<string>('1234');

  useEffect(() => {
    return db.subscribe(() => {
      setProducts(db.getProducts());
      setTables(db.getTables());
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

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim()) return;
    db.saveProfile({
      full_name: newUserName,
      role: newUserRole,
      phone: newUserPhone || null,
      pin_code: newUserPin || '1234',
    });
    setIsUserModalOpen(false);
    setNewUserName('');
    setNewUserPhone('');
    setNewUserPin('1234');
  };

  return (
    <div className="space-y-6">
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
              onClick={() => setIsUserModalOpen(true)}
              className="py-2 px-3.5 rounded-xl bg-ember-600 hover:bg-ember-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-ember-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Funcionário / Garçom</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {profiles.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-charcoal-850 border border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{p.full_name}</span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold uppercase bg-charcoal-800 text-ember-400 border border-gray-700">
                    {p.role}
                  </span>
                </div>
                <p className="text-xs text-gray-400">Tel: {p.phone || 'Não informado'}</p>
                <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-800">
                  <span className="text-gray-400">PIN de Acesso:</span>
                  <span className="font-mono font-bold text-amber-400 bg-charcoal-900 px-2 py-0.5 rounded border border-gray-700">
                    {p.pin_code}
                  </span>
                </div>
              </div>
            ))}
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

      {/* Staff / User Create Modal */}
      {isUserModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-charcoal-900 border border-gray-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white">Cadastrar Funcionário / Garçom</h3>
              <button
                onClick={() => setIsUserModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-3">
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
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-ember-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">Função / Cargo:</label>
                  <select
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as 'garcom' | 'cozinha' | 'caixa' | 'admin')}
                    className="w-full px-2 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-xs text-white focus:outline-none focus:border-ember-500"
                  >
                    <option value="garcom">Garçom</option>
                    <option value="cozinha">Cozinha</option>
                    <option value="caixa">Caixa</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-300 block mb-1">PIN (4 dígitos):</label>
                  <input
                    type="text"
                    required
                    maxLength={4}
                    placeholder="1234"
                    value={newUserPin}
                    onChange={(e) => setNewUserPin(e.target.value)}
                    className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white font-mono font-bold focus:outline-none focus:border-ember-500 text-center"
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
                  className="w-full px-3 py-2 bg-charcoal-800 border border-gray-700 rounded-lg text-sm text-white focus:outline-none focus:border-ember-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-ember-600 hover:bg-ember-500 text-white text-xs font-bold shadow-md shadow-ember-600/30"
                >
                  Salvar Funcionário
                </button>
              </div>
            </form>
          </div>
        </div>
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
