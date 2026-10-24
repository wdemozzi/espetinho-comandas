import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types/database.types';
import {
  Flame,
  UtensilsCrossed,
  ChefHat,
  Receipt,
  ShieldCheck,
  Smartphone,
  ExternalLink,
  Volume2,
} from 'lucide-react';
import { soundService } from '../../lib/sound';

interface HeaderProps {
  currentView: string;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onNavigate }) => {
  const { currentUser, setCurrentUserRole, availableProfiles } = useAuth();
  const [time, setTime] = useState<string>('');

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
    { id: 'garcom', label: 'Garçom / Mesas', icon: UtensilsCrossed, role: 'garcom' },
    { id: 'cozinha', label: 'Cozinha / KDS', icon: ChefHat, role: 'cozinha' },
    { id: 'caixa', label: 'Caixa & Fechamento', icon: Receipt, role: 'caixa' },
    { id: 'admin', label: 'Administração', icon: ShieldCheck, role: 'admin' },
  ];

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
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-ember-600 text-white shadow-md shadow-ember-700/30'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Quick Links & Role Switcher */}
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

            {/* Profile / Role Selector */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-800">
              <div className="hidden lg:block text-right">
                <p className="text-xs font-bold text-gray-200 leading-tight">{currentUser.full_name}</p>
                <p className="text-[10px] uppercase tracking-wider text-ember-400 font-semibold">{currentUser.role}</p>
              </div>

              <select
                value={currentUser.role}
                onChange={(e) => setCurrentUserRole(e.target.value as UserRole)}
                className="bg-charcoal-800 text-xs font-medium text-gray-200 border border-gray-700 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-ember-500 cursor-pointer"
                title="Alternar Perfil Operacional para Testes"
              >
                {availableProfiles.map((p) => (
                  <option key={p.id} value={p.role}>
                    {p.role.toUpperCase()}: {p.full_name.split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="flex md:hidden items-center justify-around bg-charcoal-850 border-t border-gray-800 px-2 py-1.5 overflow-x-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                isActive ? 'text-ember-400' : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
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
    </header>
  );
};
