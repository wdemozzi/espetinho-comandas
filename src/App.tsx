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

import { StaffLoginTerminal } from './components/common/StaffLoginTerminal';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';
import { getSubdomainConfig, SubdomainConfig, getPublicCustomerUrl } from './lib/subdomain';

function AppContent() {
  const { currentUser } = useAuth();
  const [subdomainConfig] = useState<SubdomainConfig>(() => getSubdomainConfig());
  const [isStaffAuthenticated, setIsStaffAuthenticated] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('ct_staff_auth') === 'true';
    }
    return false;
  });
  const [isStaffLoginModalOpen, setIsStaffLoginModalOpen] = useState<boolean>(false);
  const [currentView, setCurrentView] = useState<string>(() => {
    const config = getSubdomainConfig();
    return config.isStaffSubdomain ? config.targetView : 'landing';
  });
  const [tableToken, setTableToken] = useState<string | null>(null);
  const [cashierInitialTabId, setCashierInitialTabId] = useState<string | undefined>(undefined);

  // Check query params for table QR code scan, customer bio menu or staff subdomain
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mesa = params.get('mesa');
      const view = params.get('view');
      const pathname = window.location.pathname;

      if (mesa) {
        setTableToken(mesa);
        setCurrentView('cardapio_mesa');
        return;
      }

      // Check if user requested the direct digital menu / bio link (exact same menu as QR code)
      const isCardapioBio =
        view === 'cardapio' ||
        view === 'menu' ||
        params.has('cardapio') ||
        pathname === '/cardapio' ||
        pathname === '/menu';

      if (isCardapioBio) {
        setTableToken(null);
        setCurrentView('cardapio_bio');
        return;
      }

      // Operational subdomain / dedicated staff path
      if (subdomainConfig.isStaffSubdomain) {
        const isAlreadyAuth = sessionStorage.getItem('ct_staff_auth') === 'true';
        if (isAlreadyAuth) {
          setIsStaffAuthenticated(true);
          setCurrentView(subdomainConfig.targetView);
        } else {
          setIsStaffAuthenticated(false);
        }
        return;
      }

      // Public Customer Root Domain
      setCurrentView('landing');

      // Listen for hash or popstate navigation
      const handleNavState = () => {
        const updatedConfig = getSubdomainConfig();
        if (updatedConfig.isStaffSubdomain) {
          const isAuth = sessionStorage.getItem('ct_staff_auth') === 'true';
          if (isAuth) {
            setIsStaffAuthenticated(true);
            setCurrentView(updatedConfig.targetView);
          } else {
            setIsStaffLoginModalOpen(true);
          }
        }
      };

      // Keyboard shortcut Ctrl + Shift + A to open staff PIN terminal anywhere
      const handleShortcut = (e: KeyboardEvent) => {
        if (e.ctrlKey && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'S' || e.key === 's')) {
          e.preventDefault();
          setIsStaffLoginModalOpen(true);
        }
      };

      window.addEventListener('hashchange', handleNavState);
      window.addEventListener('popstate', handleNavState);
      window.addEventListener('keydown', handleShortcut);

      return () => {
        window.removeEventListener('hashchange', handleNavState);
        window.removeEventListener('popstate', handleNavState);
        window.removeEventListener('keydown', handleShortcut);
      };
    }
  }, [subdomainConfig]);

  const handleNavigateToCashier = (tabId: string) => {
    setCashierInitialTabId(tabId);
    setCurrentView('caixa');
  };

  const handleLockAndExitToLanding = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('ct_staff_auth');
    }
    setIsStaffAuthenticated(false);
    if (!subdomainConfig.isStaffSubdomain) {
      if (typeof window !== 'undefined' && window.location.pathname !== '/') {
        window.history.replaceState({}, '', '/');
      }
      setCurrentView('landing');
    }
  };

  // 1. Digital Menu Customer Session (Either Table QR or Instagram Bio / Shared link)
  if ((currentView === 'cardapio_mesa' && tableToken) || currentView === 'cardapio_bio') {
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

  // 2. Dedicated Staff Subdomain / Path (admin.*, app.*, /admin, /garcom, etc.)
  if (subdomainConfig.isStaffSubdomain && !isStaffAuthenticated) {
    return (
      <StaffLoginTerminal
        subdomainConfig={subdomainConfig}
        onSuccess={() => {
          setIsStaffAuthenticated(true);
          setCurrentView(subdomainConfig.targetView);
        }}
        onCancel={() => {
          window.location.href = getPublicCustomerUrl();
        }}
      />
    );
  }

  // 3. Public Customer Landing Page
  if (!subdomainConfig.isStaffSubdomain && !isStaffAuthenticated) {
    return (
      <>
        <LandingPage
          onStaffLoginClick={() => setIsStaffLoginModalOpen(true)}
          onOrderCompleted={() => {
            // Takeout order completed
          }}
        />

        {/* Staff Authentication Terminal Modal if requested */}
        {isStaffLoginModalOpen && (
          <StaffLoginTerminal
            onSuccess={() => {
              setIsStaffAuthenticated(true);
              setCurrentView('admin');
              setIsStaffLoginModalOpen(false);
            }}
            onCancel={() => {
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

      {/* PWA Mobile Install Prompt */}
      <PwaInstallPrompt />
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
