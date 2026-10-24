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

  // Check query params for table QR code scan or direct cardapio preview on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mesa = params.get('mesa');
      const view = params.get('view');
      if (mesa) {
        setTableToken(mesa);
        setCurrentView('cardapio');
      } else if (view === 'cardapio' || window.location.pathname.startsWith('/cardapio')) {
        setCurrentView('cardapio');
      }
    }
  }, []);

  const handleNavigateToCashier = (tabId: string) => {
    setCashierInitialTabId(tabId);
    setCurrentView('caixa');
  };

  return (
    <div className="min-h-screen bg-[#0c0a17] text-gray-100 flex flex-col font-sans">
      {/* Show header on internal operational views only */}
      {currentView !== 'cardapio' && (
        <Header currentView={currentView} onNavigate={(view) => setCurrentView(view)} />
      )}

      {/* Main Content Area */}
      <main className={`flex-1 w-full mx-auto ${currentView === 'cardapio' ? 'p-0 max-w-full' : 'max-w-7xl p-3 sm:p-6'}`}>
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
