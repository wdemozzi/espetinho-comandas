import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { CartProvider } from './contexts/CartContext';
import { Header } from './components/common/Header';
import { WaiterTablesPage } from './pages/waiter/WaiterTablesPage';
import { KitchenKdsPage } from './pages/kitchen/KitchenKdsPage';
import { CashierTabsPage } from './pages/cashier/CashierTabsPage';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { PublicMenuPage } from './pages/public/PublicMenuPage';
import { LandingPage } from './pages/public/LandingPage';
import { OperatorSwitchModal } from './components/common/OperatorSwitchModal';

function AppContent() {
  const { currentUser } = useAuth();
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(false);
  const [isStaffLoginModalOpen, setIsStaffLoginModalOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<string>('landing');
  const [tableToken, setTableToken] = useState<string | null>(null);
  const [cashierInitialTabId, setCashierInitialTabId] = useState<string | undefined>(undefined);

  // Check query params for table QR code scan or direct staff navigation
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mesa = params.get('mesa');
      const view = params.get('view');
      const pathname = window.location.pathname;

      if (mesa) {
        setTableToken(mesa);
        setCurrentView('cardapio_mesa');
      } else if (view === 'sistema' || view === 'app' || pathname === '/sistema' || pathname === '/app') {
        // Staff wants to enter system -> prompt for PIN authentication
        setIsStaffLoginModalOpen(true);
      } else {
        // Default entry is the public SEO Landing Page
        setCurrentView('landing');
      }
    }
  }, []);

  const handleNavigateToCashier = (tabId: string) => {
    setCashierInitialTabId(tabId);
    setCurrentView('caixa');
  };

  const handleLockAndExitToLanding = () => {
    setIsStaffAuthenticated(false);
    setCurrentView('landing');
  };

  // 1. Table QR Code Customer Session (Pure table ordering, zero operational access)
  if (currentView === 'cardapio_mesa' && tableToken) {
    return (
      <div className="min-h-screen bg-[#0c0a17] text-gray-100 flex flex-col font-sans">
        <main className="flex-1 w-full mx-auto p-0 max-w-full">
          <PublicMenuPage
            tableToken={tableToken}
            onOrderCompleted={() => {
              // Order completed successfully at table
            }}
          />
        </main>
      </div>
    );
  }

  // 2. Public Landing Page with SEO & Takeout Menu (Default for website visitors)
  if (!isStaffAuthenticated) {
    return (
      <>
        <LandingPage
          onStaffLoginClick={() => setIsStaffLoginModalOpen(true)}
          onOrderCompleted={() => {
            // Takeout order completed
          }}
        />

        {/* PIN Authentication Modal for Staff Access */}
        {isStaffLoginModalOpen && (
          <OperatorSwitchModal
            isOpen={true}
            onClose={() => setIsStaffLoginModalOpen(false)}
            onSuccess={() => {
              setIsStaffAuthenticated(true);
              setCurrentView('garcom');
              setIsStaffLoginModalOpen(false);
            }}
          />
        )}
      </>
    );
  }

  // 3. Authenticated Staff Operating System (Waiter Tables, KDS Kitchen, Cashier, Admin)
  return (
    <div className="min-h-screen bg-[#0c0a17] text-gray-100 flex flex-col font-sans">
      {/* Internal Operational Header with PIN Switcher and Lock/Exit button */}
      <Header
        currentView={currentView}
        onNavigate={(view) => setCurrentView(view)}
        onLockOrExit={handleLockAndExitToLanding}
      />

      {/* Operational Pages */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6">
        {currentView === 'garcom' && (
          <WaiterTablesPage onNavigateToCashier={handleNavigateToCashier} />
        )}
        {currentView === 'cozinha' && <KitchenKdsPage />}
        {currentView === 'caixa' && <CashierTabsPage initialTabId={cashierInitialTabId} />}
        {currentView === 'admin' && <AdminDashboard />}
      </main>

      {/* Operational Footer */}
      <footer className="bg-charcoal-900 border-t border-gray-800/80 py-4 px-6 text-center text-xs text-gray-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            CT Conveniência © {new Date().getFullYear()} • Sistema Operacional de Comandas & KDS
          </p>
          <div className="flex items-center gap-3 text-[11px] text-gray-600">
            <span>Operador Logado: <strong className="text-purple-400">{currentUser.full_name} ({currentUser.role})</strong></span>
            <span>•</span>
            <button
              onClick={handleLockAndExitToLanding}
              className="text-gray-400 hover:text-red-400 underline transition"
            >
              Bloquear e Sair
            </button>
          </div>
        </div>
      </footer>

      {/* Operator Switch Modal if triggered internally */}
      {isStaffLoginModalOpen && (
        <OperatorSwitchModal
          isOpen={true}
          onClose={() => setIsStaffLoginModalOpen(false)}
          onSuccess={() => setIsStaffLoginModalOpen(false)}
        />
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
