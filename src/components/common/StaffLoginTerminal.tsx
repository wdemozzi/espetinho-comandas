import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Profile } from '../../types/database.types';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  X,
  AlertCircle,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';

interface StaffLoginTerminalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export const StaffLoginTerminal: React.FC<StaffLoginTerminalProps> = ({
  onSuccess,
  onCancel,
}) => {
  const { availableProfiles, loginWithPin } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [failedAttempts, setFailedAttempts] = useState<number>(0);
  const [lockoutRemaining, setLockoutRemaining] = useState<number>(0);

  // Check brute force lockout
  useEffect(() => {
    if (lockoutRemaining <= 0) return;
    const interval = setInterval(() => {
      setLockoutRemaining((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [lockoutRemaining]);

  // Support hardware keyboard typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lockoutRemaining > 0) return;

      if (e.key >= '0' && e.key <= '9') {
        handleAppendDigit(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter') {
        handleSubmitPin();
      } else if (e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedProfile, pinInput, lockoutRemaining]);

  const handleSelectProfile = (profile: Profile) => {
    if (lockoutRemaining > 0) return;
    setSelectedProfile(profile);
    setPinInput('');
    setErrorMessage(null);
  };

  const handleAppendDigit = (digit: string) => {
    if (lockoutRemaining > 0) return;
    if (pinInput.length < 4) {
      setPinInput((prev) => prev + digit);
      setErrorMessage(null);
    }
  };

  const handleBackspace = () => {
    if (lockoutRemaining > 0) return;
    setPinInput((prev) => prev.slice(0, -1));
    setErrorMessage(null);
  };

  const handleClear = () => {
    setPinInput('');
    setErrorMessage(null);
  };

  const handleSubmitPin = () => {
    if (lockoutRemaining > 0) return;
    if (!selectedProfile) {
      setErrorMessage('Selecione seu perfil antes de digitar o PIN.');
      return;
    }
    if (pinInput.length !== 4) {
      setErrorMessage('O PIN deve conter exatamente 4 dígitos.');
      return;
    }

    const result = loginWithPin(selectedProfile.id, pinInput);
    if (!result.success) {
      const newAttempts = failedAttempts + 1;
      setFailedAttempts(newAttempts);
      setPinInput('');

      if (newAttempts >= 5) {
        setLockoutRemaining(30);
        setErrorMessage('Terminal bloqueado temporariamente por 30s após 5 tentativas incorretas.');
      } else {
        setErrorMessage(`${result.message || 'PIN incorreto'}. Tentativa ${newAttempts} de 5.`);
      }
      return;
    }

    // Success
    setFailedAttempts(0);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ct_staff_auth', 'true');
    }
    onSuccess();
  };

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0c0a17] text-white flex flex-col justify-between overflow-y-auto font-sans p-4 sm:p-8">
      {/* Top Bar */}
      <div className="max-w-4xl w-full mx-auto flex items-center justify-between pb-4 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <img src="/ct-logo.png" alt="CT Conveniência" className="w-10 h-10 object-contain drop-shadow" />
          <div>
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
              <span>Terminal Operacional Restrito</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-600/30 text-purple-300 border border-purple-500/40">
                Seguro
              </span>
            </h1>
            <p className="text-xs text-gray-400">Acesso exclusivo para Garçons, Cozinha, Caixa e Gerência</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCancel}
          className="px-3.5 py-1.5 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold border border-gray-700 flex items-center gap-1.5 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Cardápio</span>
        </button>
      </div>

      {/* Main Terminal Box */}
      <div className="max-w-xl w-full mx-auto my-auto py-6 space-y-6">
        {/* Step 1: Select Profile */}
        <div>
          <label className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2 text-center">
            1. Selecione seu Perfil de Trabalho
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {availableProfiles.map((p) => {
              const isSelected = selectedProfile?.id === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={lockoutRemaining > 0}
                  onClick={() => handleSelectProfile(p)}
                  className={`p-3 rounded-2xl border text-center transition flex flex-col items-center justify-center gap-1 disabled:opacity-40 ${
                    isSelected
                      ? 'bg-purple-600 border-purple-400 text-white shadow-lg shadow-purple-600/30 ring-2 ring-purple-400 scale-[1.02]'
                      : 'bg-charcoal-850 hover:bg-charcoal-800 border-gray-800 text-gray-300'
                  }`}
                >
                  <span className="font-extrabold text-xs line-clamp-1">{p.full_name.split(' ')[0]}</span>
                  <span className={`text-[10px] uppercase font-bold px-1.5 py-0.2 rounded ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-charcoal-900 text-gray-400'
                  }`}>
                    {p.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 2: PIN Input & Display */}
        <div className="bg-charcoal-850 p-6 rounded-3xl border border-gray-800 space-y-5 shadow-2xl">
          <div className="text-center space-y-1">
            <h2 className="text-sm font-bold text-gray-300">
              {selectedProfile
                ? `Digite o PIN de 4 dígitos para: ${selectedProfile.full_name}`
                : 'Selecione seu perfil acima para digitar o PIN'}
            </h2>

            {/* PIN Dots Display */}
            <div className="flex items-center justify-center gap-4 py-3">
              {[0, 1, 2, 3].map((idx) => {
                const filled = pinInput.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-4 h-4 rounded-full transition-all duration-200 ${
                      filled
                        ? 'bg-amber-400 scale-125 shadow-lg shadow-amber-400/50'
                        : 'border-2 border-gray-700 bg-charcoal-900'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Lockout or Error Banner */}
          {lockoutRemaining > 0 ? (
            <div className="p-3.5 rounded-xl bg-red-950/80 border border-red-700 text-red-200 text-xs font-bold flex items-center justify-center gap-2 animate-pulse">
              <Clock className="w-4 h-4 text-red-400" />
              <span>Bloqueado por segurança. Aguarde {lockoutRemaining} segundos...</span>
            </div>
          ) : errorMessage ? (
            <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-300 text-xs flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : null}

          {/* Keypad */}
          <div className="grid grid-cols-3 gap-2.5 max-w-xs mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                disabled={lockoutRemaining > 0 || !selectedProfile}
                onClick={() => handleAppendDigit(digit)}
                className="h-14 rounded-2xl bg-charcoal-900 hover:bg-gray-800 active:bg-purple-600 disabled:opacity-40 border border-gray-800 text-xl font-bold text-white transition flex items-center justify-center shadow-md active:scale-95"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              disabled={lockoutRemaining > 0 || pinInput.length === 0}
              onClick={handleClear}
              className="h-14 rounded-2xl bg-charcoal-900 hover:bg-gray-800 disabled:opacity-40 border border-gray-800 text-xs font-bold text-gray-400 transition flex items-center justify-center active:scale-95"
            >
              LIMPAR
            </button>
            <button
              type="button"
              disabled={lockoutRemaining > 0 || !selectedProfile}
              onClick={() => handleAppendDigit('0')}
              className="h-14 rounded-2xl bg-charcoal-900 hover:bg-gray-800 active:bg-purple-600 disabled:opacity-40 border border-gray-800 text-xl font-bold text-white transition flex items-center justify-center shadow-md active:scale-95"
            >
              0
            </button>
            <button
              type="button"
              disabled={lockoutRemaining > 0 || pinInput.length === 0}
              onClick={handleBackspace}
              className="h-14 rounded-2xl bg-charcoal-900 hover:bg-gray-800 disabled:opacity-40 border border-gray-800 text-xs font-bold text-amber-400 transition flex items-center justify-center active:scale-95"
            >
              APAGAR
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="button"
            disabled={lockoutRemaining > 0 || !selectedProfile || pinInput.length !== 4}
            onClick={handleSubmitPin}
            className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-black text-sm shadow-xl shadow-purple-600/30 transition flex items-center justify-center gap-2 active:scale-[0.98]"
          >
            <KeyRound className="w-4 h-4" />
            <span>Confirmar PIN & Entrar no Sistema</span>
          </button>
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="max-w-4xl w-full mx-auto text-center text-xs text-gray-500 pt-4 border-t border-gray-900">
        <p>Terminal Protegido • Tentativas monitoradas contra força bruta.</p>
        <p className="mt-0.5 text-[11px] text-gray-600">Dica: Você também pode digitar os números direto no teclado físico.</p>
      </div>
    </div>
  );
};
