import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { Profile } from '../../types/database.types';
import {
  X,
  Lock,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  User,
} from 'lucide-react';

interface OperatorSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredRoleForAccess?: string;
  onSuccess?: () => void;
}

export const OperatorSwitchModal: React.FC<OperatorSwitchModalProps> = ({
  isOpen,
  onClose,
  requiredRoleForAccess,
  onSuccess,
}) => {
  const { availableProfiles, currentUser, loginWithPin } = useAuth();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [pinInput, setPinInput] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showPinHelp, setShowPinHelp] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSelectProfile = (profile: Profile) => {
    setSelectedProfile(profile);
    setPinInput('');
    setErrorMsg(null);
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProfile) return;

    const result = loginWithPin(selectedProfile.id, pinInput);
    if (!result.success) {
      setErrorMsg(result.message || 'PIN incorreto');
      setPinInput('');
      return;
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  const handleAppendPin = (digit: string) => {
    if (pinInput.length < 6) {
      setPinInput((prev) => prev + digit);
    }
  };

  const handleBackspace = () => {
    setPinInput((prev) => prev.slice(0, -1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-md bg-charcoal-900 border border-gray-700 rounded-2xl shadow-2xl p-5 sm:p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-ember-600/20 border border-ember-500/40 flex items-center justify-center text-ember-400">
              <Lock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white tracking-tight">
                {requiredRoleForAccess
                  ? `Acesso Restrito: ${requiredRoleForAccess.toUpperCase()}`
                  : 'Trocar Operador / Identificação'}
              </h3>
              <p className="text-xs text-gray-400">
                Selecione seu perfil e digite seu PIN de 4 dígitos
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-950/70 border border-red-800 text-red-200 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Step 1: Select Operator */}
        {!selectedProfile ? (
          <div className="space-y-3">
            <label className="text-xs font-semibold text-gray-300 block">
              Quem está operando agora?
            </label>
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {availableProfiles.map((p) => {
                const isCurrent = currentUser.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => handleSelectProfile(p)}
                    className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                      isCurrent
                        ? 'bg-ember-950/40 border-ember-500/80 text-white'
                        : 'bg-charcoal-800 border-gray-700/80 text-gray-300 hover:border-gray-600 hover:bg-charcoal-700/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-charcoal-900 border border-gray-700 flex items-center justify-center text-xs font-bold text-ember-400">
                        {p.full_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-white">{p.full_name}</p>
                        <p className="text-[10px] uppercase font-bold text-gray-400">{p.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                          ATUAL
                        </span>
                      )}
                      <KeyRound className="w-4 h-4 text-gray-500" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Step 2: PIN Pad */
          <form onSubmit={handlePinSubmit} className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-xl bg-charcoal-800 border border-gray-700">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-ember-400" />
                <div>
                  <p className="text-xs font-bold text-white">{selectedProfile.full_name}</p>
                  <p className="text-[10px] uppercase text-gray-400">{selectedProfile.role}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedProfile(null)}
                className="text-xs text-ember-400 hover:text-ember-300 font-semibold"
              >
                Trocar
              </button>
            </div>

            {/* PIN Display */}
            <div className="text-center space-y-1">
              <label className="text-xs font-semibold text-gray-400">Digite seu PIN (4 dígitos):</label>
              <div className="flex items-center justify-center gap-3 py-2">
                {[0, 1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className={`w-11 h-12 rounded-xl border flex items-center justify-center text-xl font-mono font-bold transition ${
                      pinInput.length > idx
                        ? 'bg-charcoal-800 border-ember-500 text-white'
                        : 'bg-charcoal-900 border-gray-700 text-gray-600'
                    }`}
                  >
                    {pinInput.length > idx ? '•' : ''}
                  </div>
                ))}
              </div>
            </div>

            {/* Virtual PIN Pad (Touch friendly for mobile) */}
            <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((btn) => (
                <button
                  key={btn}
                  type="button"
                  onClick={() => {
                    if (btn === 'C') setPinInput('');
                    else if (btn === '⌫') handleBackspace();
                    else handleAppendPin(btn);
                  }}
                  className="py-3 rounded-xl bg-charcoal-800 hover:bg-gray-700 active:bg-ember-600 text-white font-bold text-base border border-gray-700 transition"
                >
                  {btn}
                </button>
              ))}
            </div>

            <button
              type="submit"
              disabled={pinInput.length < 4}
              className="w-full py-3 rounded-xl bg-ember-600 hover:bg-ember-500 disabled:opacity-50 text-white font-bold text-sm shadow-lg shadow-ember-600/30 flex items-center justify-center gap-2 transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirmar e Entrar</span>
            </button>
          </form>
        )}

        {/* PINs Help info toggle */}
        <div className="pt-2 border-t border-gray-800 text-center">
          <button
            type="button"
            onClick={() => setShowPinHelp(!showPinHelp)}
            className="text-[11px] text-gray-500 hover:text-gray-300 flex items-center justify-center gap-1 mx-auto"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Ver PINs padrão cadastrados para teste</span>
          </button>

          {showPinHelp && (
            <div className="mt-2 p-2.5 rounded-lg bg-charcoal-800/80 border border-gray-700 text-left text-[11px] text-gray-300 space-y-1">
              <p>• <strong>Carlos Gerente (Admin)</strong>: PIN <code>9999</code></p>
              <p>• <strong>Marcos (Garçom 1)</strong>: PIN <code>1111</code></p>
              <p>• <strong>Lucas (Garçom 2)</strong>: PIN <code>2222</code></p>
              <p>• <strong>Gabriel (Garçom 3)</strong>: PIN <code>3333</code></p>
              <p>• <strong>Juliana (Garçom 4)</strong>: PIN <code>4444</code></p>
              <p>• <strong>Zé da Brasa (Cozinha)</strong>: PIN <code>5555</code></p>
              <p>• <strong>Ana (Caixa)</strong>: PIN <code>6666</code></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
