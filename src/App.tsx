import React, { useState, useEffect } from 'react';
import { CartProvider } from './contexts/CartContext';
import { PublicMenuPage } from './pages/public/PublicMenuPage';
import { LandingPage } from './pages/public/LandingPage';
import { PwaInstallPrompt } from './components/common/PwaInstallPrompt';

function CustomerAppContent() {
  const [currentView, setCurrentView] = useState<string>('landing');
  const [tableToken, setTableToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const mesa = params.get('mesa');
      const view = params.get('view');
      const pathname = window.location.pathname.toLowerCase();

      // 1. Mesa QR Code Scan (e.g. ?mesa=mesa-02-token)
      if (mesa) {
        setTableToken(mesa);
        setCurrentView('cardapio_mesa');
        return;
      }

      // 2. Direct Digital Menu / Instagram Bio link (e.g. /cardapio or ?view=cardapio)
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

      // 3. All other paths and visits default strictly to the public customer landing page
      setCurrentView('landing');
    }
  }, []);

  // 1. Digital Menu Customer Session (Either Table QR or Instagram Bio)
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

  // 2. Public Customer Landing Page with Online Ordering & Takeout
  return (
    <div className="min-h-screen bg-[#0c0a17] text-gray-100 flex flex-col font-sans">
      <LandingPage
        onOrderCompleted={() => {
          // Takeout order completed
        }}
      />
      <PwaInstallPrompt />
    </div>
  );
}

export default function App() {
  return (
    <CartProvider>
      <CustomerAppContent />
    </CartProvider>
  );
}
