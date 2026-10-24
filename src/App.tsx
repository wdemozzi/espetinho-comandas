import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Header } from './components/common/Header';
import { WaiterTablesPage } from './pages/waiter/WaiterTablesPage';
import { KitchenKdsPage } from './pages/kitchen/KitchenKdsPage';
import { CashierTabsPage } from './pages/cashier/CashierTabsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PublicMenuPage } from './pages/public/PublicMenuPage';

function AppContent() {
  const { currentUser } = useAuth();
  const [currentView, setCurrentView] = useState<string>('garcom');
  const [tableToken, setTableToken] = useState<string | null>(null);
  const [cashierInitialTabId, setCashierInitialTabId] = useState<string | undefined>(undefined);

  // Check query params for table QR code scan on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mesa = params.get('mesa');
      if (mesa) {
        setTableToken(mesa);
        setCurrentView('cardapio');
      }
    }
  }, []);

  const handleNavigateToCashier = (tabId: string) => {
    setCashierInitialTabId(tabId);
    setCurrentView('caixa');
  };

  return (
    <div className="min-h-screen bg-[#0d0e12] text-gray-100 flex flex-col font-sans">
      {/* Show header on internal views */}
      {currentView !== 'cardapio' ? (
        <Header currentView={currentView} onNavigate={(view) => setCurrentView(view)} />
      ) : (
        <div className="bg-charcoal-900 border-b border-gray-800 px-4 py-2 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-gray-300 font-semibold">Visualização do Cliente / Cardápio Digital</span>
          </div>
          <button
            onClick={() => setCurrentView('garcom')}
            className="px-3 py-1 rounded-lg bg-charcoal-800 hover:bg-gray-700 text-ember-400 font-bold border border-gray-700 transition"
          >
            Voltar ao Sistema de Operação
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {currentView === 'garcom' && (
          <WaiterTablesPage onNavigateToCashier={handleNavigateToCashier} />
        )}
        {currentView === 'cozinha' && <KitchenKdsPage />}
        {currentView === 'caixa' && <CashierTabsPage initialTabId={cashierInitialTabId} />}
        {currentView === 'admin' && <AdminDashboard />}
        {currentView === 'cardapio' && (
          <PublicMenuPage
            tableToken={tableToken}
            onOrderCompleted={() => {
              // Order completed successfully
            }}
          />
        )}
      </main>

      {/* Footer Info */}
      {currentView !== 'cardapio' && (
        <footer className="bg-charcoal-900 border-t border-gray-800/80 py-4 px-6 text-center text-xs text-gray-500">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              CT Conveniência © {new Date().getFullYear()} • Sistema de Comandas & Atendimento
            </p>
            <p className="text-[11px] text-gray-600">
              Piloto Comercial Full-Stack • React + Vite + Tailwind + Supabase PostgreSQL
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
}
