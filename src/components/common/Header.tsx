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

  // Clean, short, single-line navigation labels that NEVER wrap
  const navItems = [
    { id: 'garcom', label: 'Mesas', icon: UtensilsCrossed, minRole: 'garcom' },
    { id: 'cozinha', label: 'Cozinha', icon: ChefHat, minRole: 'garcom' },
    { id: 'caixa', label: 'Caixa', icon: Receipt, minRole: 'caixa' },
    { id: 'admin', label: 'Gestão', icon: ShieldCheck, minRole: 'admin' },
  ];

  const handleNavClick = (viewId: string) => {
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
      case 'admin': return 'bg-purple-950/80 text-purple-300 border-purple-700 hover:border-purple-500';
      case 'caixa': return 'bg-emerald-950/80 text-emerald-300 border-emerald-700 hover:border-emerald-500';
      case 'cozinha': return 'bg-amber-950/80 text-amber-300 border-amber-700 hover:border-amber-500';
      default: return 'bg-ember-950/80 text-ember-300 border-ember-700 hover:border-ember-500';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-charcoal-900/95 backdrop-blur border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Brand with CT Conveniência Logo */}
          <div
            className="flex items-center gap-3 cursor-pointer flex-shrink-0 group"
            onClick={() => onNavigate('garcom')}
          >
            <div className="relative">
              <img
                src="/ct-logo.png"
                alt="CT Conveniência"
                className="w-10 h-10 rounded-xl object-contain shadow-lg shadow-purple-600/40 border border-purple-500/40 bg-charcoal-950 p-0.5 flex-shrink-0 transition-transform group-hover:scale-105"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-charcoal-900" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-purple-200 to-purple-400 bg-clip-text text-transparent whitespace-nowrap block">
                CT Conveniência
              </span>
              <div className="flex items-center gap-1.5 text-[11px] text-gray-400">
                <span className="text-gray-400 font-medium">Gestão & Comandas</span>
                <span>•</span>
                <span className="font-mono text-purple-300 font-semibold">{time}</span>
              </div>
            </div>
          </div>

          {/* Nav links (Desktop - Horizontal, single line, no wrapping) */}
          <nav className="hidden md:flex items-center gap-1 bg-charcoal-850 p-1.5 rounded-xl border border-gray-800 flex-shrink-0">
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
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                    isActive
                      ? 'bg-ember-600 text-white shadow-md shadow-ember-700/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span>{item.label}</span>
                  {isLocked && <Lock className="w-3 h-3 text-gray-500 ml-0.5 flex-shrink-0" />}
                </button>
              );
            })}
          </nav>

          {/* Quick Actions & Operator Badge */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Audio test button */}
            <button
              onClick={() => soundService.playOrderReady()}
              title="Testar sinal sonoro de pedido pronto"
              className="p-2 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-gray-300 border border-gray-700 transition"
            >
              <Volume2 className="w-4 h-4 text-ember-400" />
            </button>

            {/* Public Catalog Link */}
            <button
              onClick={() => onNavigate('cardapio')}
              title="Abrir Cardápio Digital Público"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-950/40 hover:bg-amber-900/50 text-amber-300 border border-amber-800/60 text-xs font-semibold whitespace-nowrap transition"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Cardápio Bio</span>
              <ExternalLink className="w-3 h-3 opacity-70" />
            </button>

            {/* PROTECTED OPERATOR BADGE (PIN locked, clean badge) */}
            <button
              type="button"
              onClick={() => setIsSwitchModalOpen(true)}
              className={`py-1.5 px-3 rounded-xl border flex items-center gap-2 transition shadow-sm ${getRoleBadgeColor(
                currentUser.role
              )}`}
              title="Clique para trocar operador ou desbloquear com PIN"
            >
              <div className="w-6 h-6 rounded-lg bg-black/40 flex items-center justify-center text-xs font-extrabold flex-shrink-0">
                {currentUser.full_name.charAt(0)}
              </div>
              <div className="text-left hidden sm:block">
                <p className="text-xs font-bold leading-tight truncate max-w-[110px]">
                  {currentUser.full_name.split(' ')[0]}
                </p>
                <p className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                  {currentUser.role}
                </p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center justify-around bg-charcoal-850 border-t border-gray-800 px-2 py-1.5">
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
              <span>{item.label}</span>
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
