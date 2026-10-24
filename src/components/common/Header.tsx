import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  Flame,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Volume2,
  Lock,
  UserCheck,
} from 'lucide-react';
import { soundService } from '../../lib/sound';
import { OperatorSwitchModal } from './OperatorSwitchModal';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { currentUser } = useAuth();
  const [time, setTime] = useState<string>('');
  const [isSwitchModalOpen, setIsSwitchModalOpen] = useState<boolean>(false);
  const [pendingRestrictedView, setPendingRestrictedView] = useState<string | null>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const navItems = [
    { id: 'garcom', label: 'Garçom / Mesas', icon: UtensilsCrossed, minRole: 'garcom' },
    { id: 'cozinha', label: 'Cozinha / KDS', icon: ChefHat, minRole: 'garcom' },
    { id: 'caixa', label: 'Caixa & Fechamento', icon: Receipt, minRole: 'caixa' },
    { id: 'admin', label: 'Administração', icon: ShieldCheck, minRole: 'admin' },
  ];

  const handleNavClick = (viewId: string) => {
    // Check permission
    if (viewId === 'admin' && currentUser.role !== 'admin') {
      setPendingRestrictedView(viewId);
      setIsSwitchModalOpen(true);
      return;
    }
    if (viewId === 'caixa' && currentUser.role !== 'admin' && currentUser.role !== 'caixa') {
      setPendingRestrictedView(viewId);
      setIsSwitchModalOpen(true);
      return;
    }
    onNavigate(viewId);
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-purple-950 text-purple-300 border-purple-700';
      case 'caixa': return 'bg-emerald-950 text-emerald-300 border-emerald-700';
      case 'cozinha': return 'bg-amber-950 text-amber-300 border-amber-700';
      default: return 'bg-ember-950 text-ember-300 border-ember-700';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-charcoal-900/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Brand */}
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('garcom')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-ember-700 via-ember-500 to-amber-400 flex items-center justify-center shadow-lg shadow-ember-600/20 text-white font-extrabold text-xl">
              <Flame className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-gray-200 to-ember-400 bg-clip-text text-transparent">
                Espetinho Comandas
              </span>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-gray-300 font-medium">Piloto Comercial</span>
                <span>•</span>
                <span className="font-mono text-gray-400">{time}</span>
              </div>
            </div>
          </div>

          {/* Nav links (Desktop) */}
          <nav className="hidden md:flex items-center gap-1 bg-charcoal-850 p-1.5 rounded-xl border border-gray-800">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              const isLocked =
                (item.id === 'admin' && currentUser.role !== 'admin') ||
                (item.id === 'caixa' && currentUser.role !== 'admin' && currentUser.role !== 'caixa');

              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-ember-600 text-white shadow-md shadow-ember-700/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                  {isLocked && <Lock className="w-3 h-3 text-gray-500" />}
                </button>
              );
            })}
          </nav>

          {/* Quick Links & Operator Switcher */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Audio test button */}
            <button
              onClick={() => soundService.playOrderReady()}
              title="Testar sinal sonoro da cozinha"
              className="p-2 rounded-lg bg-gray-800/80 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
            >
              <Volume2 className="w-4 h-4 text-ember-400" />
            </button>

            {/* Public Catalog Link */}
            <button
              onClick={() => onNavigate('cardapio')}
              title="Abrir Cardápio Digital Público"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/60 text-xs font-semibold transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Cardápio Bio</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>

            {/* PROTECTED OPERATOR BADGE (No open dropdown! Requires PIN to switch) */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
              <button
                type="button"
                onClick={() => setIsSwitchModalOpen(true)}
                className={`py-1.5 px-2.5 rounded-xl border flex items-center gap-2 transition hover:ring-2 hover:ring-ember-500/50 ${getRoleBadgeColor(
                  currentUser.role
                )}`}
                title="Clique para trocar operador ou desbloquear com PIN"
              >
                <UserCheck className="w-4 h-4 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-xs font-bold leading-tight">{currentUser.full_name}</p>
                  <p className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                    {currentUser.role} • Trocar
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center justify-around bg-charcoal-850 border-t border-gray-800 px-2 py-1.5 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          const isLocked =
            (item.id === 'admin' && currentUser.role !== 'admin') ||
            (item.id === 'caixa' && currentUser.role !== 'admin' && currentUser.role !== 'caixa');

          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                isActive ? 'text-ember-400 font-bold' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <div className="relative">
                <Icon className="w-4 h-4" />
                {isLocked && (
                  <Lock className="w-2.5 h-2.5 absolute -top-1 -right-1.5 text-amber-400" />
                )}
              </div>
              <span>{item.label.split('/')[0].trim()}</span>
            </button>
          );
        })}
        <button
          onClick={() => onNavigate('cardapio')}
          className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-medium transition ${
            currentView === 'cardapio' ? 'text-amber-400' : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Cardápio</span>
        </button>
      </div>

      {/* PIN Authentication & Operator Switcher Modal */}
      {isSwitchModalOpen && (
        <OperatorSwitchModal
          isOpen={true}
          requiredRoleForAccess={pendingRestrictedView || undefined}
          onClose={() => {
            setIsSwitchModalOpen(false);
            setPendingRestrictedView(null);
          }}
          onSuccess={() => {
            if (pendingRestrictedView) {
              onNavigate(pendingRestrictedView);
              setPendingRestrictedView(null);
            }
          }}
        />
      )}
    </header>
  );
};
