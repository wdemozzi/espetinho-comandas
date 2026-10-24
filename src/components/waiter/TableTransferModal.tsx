import React, { useState } from 'react';
import { RestaurantTable, Tab } from '../../types/database.types';
import { db } from '../../lib/databaseStore';
import { formatBRL } from '../../lib/currency';
import {
  X,
  ArrowRightLeft,
  Link2,
  GitMerge,
  AlertCircle,
  CheckCircle2,
  Users,
  Unlink,
} from 'lucide-react';

interface TableTransferModalProps {
  currentTable: RestaurantTable;
  currentTab: Tab;
  allTables: RestaurantTable[];
  onClose: () => void;
  onSuccess?: (msg: string) => void;
}

export const TableTransferModal: React.FC<TableTransferModalProps> = ({
  currentTable,
  currentTab,
  allTables,
  onClose,
  onSuccess,
}) => {
  const [activeTabMode, setActiveTabMode] = useState<'transfer' | 'link' | 'merge'>('transfer');
  
  // State for Transfer
  const [selectedTargetTableId, setSelectedTargetTableId] = useState<string>('');
  
  // State for Link (Puxar mesa livre)
  const [selectedLinkTableId, setSelectedLinkTableId] = useState<string>('');

  // State for Merge (Fundir contas ocupadas)
  const [selectedMergeTabId, setSelectedMergeTabId] = useState<string>('');
  const [keepTableJoined, setKeepTableJoined] = useState<boolean>(true);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Available free tables for transfer or link
  const freeTables = allTables.filter((t) => t.status === 'livre' && t.id !== currentTable.id && !t.linked_table_id);

  // Other occupied tables for merge
  const otherOccupiedTables = allTables.filter(
    (t) => t.status === 'ocupada' && t.id !== currentTable.id && t.active_tab && t.active_tab.id !== currentTab.id
  );

  // Mesas atualmente juntadas a esta comanda
  const joinedTables = allTables.filter(
    (t) => t.linked_table_id === currentTable.id || currentTab.joined_table_ids?.includes(t.id)
  );

  // 1. Executar Transferência
  const handleExecuteTransfer = () => {
    try {
      setErrorMessage(null);
      if (!selectedTargetTableId) {
        setErrorMessage('Selecione para qual mesa deseja transferir a comanda.');
        return;
      }
      const res = db.transferTabToTable(currentTab.id, selectedTargetTableId);
      setSuccessMessage(res.message);
      if (onSuccess) onSuccess(res.message);
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao transferir mesa');
    }
  };

  // 2. Executar Junção de Mesa Livre (Puxar Mesa)
  const handleExecuteLink = () => {
    try {
      setErrorMessage(null);
      if (!selectedLinkTableId) {
        setErrorMessage('Selecione a mesa livre que deseja puxar/juntar.');
        return;
      }
      const res = db.linkTableToTab(currentTab.id, selectedLinkTableId);
      setSuccessMessage(res.message);
      setSelectedLinkTableId('');
      if (onSuccess) onSuccess(res.message);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao juntar mesa');
    }
  };

  // Desvincular mesa puxada
  const handleUnlink = (tableId: string) => {
    try {
      setErrorMessage(null);
      const res = db.unlinkTableFromTab(currentTab.id, tableId);
      setSuccessMessage(res.message);
      if (onSuccess) onSuccess(res.message);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao desvincular mesa');
    }
  };

  // 3. Executar Fusão de Contas (Merge)
  const handleExecuteMerge = () => {
    try {
      setErrorMessage(null);
      if (!selectedMergeTabId) {
        setErrorMessage('Selecione a outra mesa que será unificada com esta comanda.');
        return;
      }
      const targetMergeTable = otherOccupiedTables.find((t) => t.id === selectedMergeTabId);
      if (!targetMergeTable?.active_tab) {
        setErrorMessage('A mesa selecionada não possui comanda ativa.');
        return;
      }

      // Funde a comanda selecionada nesta comanda atual (currentTab)
      const res = db.mergeTabs(targetMergeTable.active_tab.id, currentTab.id, keepTableJoined);
      setSuccessMessage(res.message);
      if (onSuccess) onSuccess(res.message);
      setTimeout(() => {
        onClose();
      }, 1400);
    } catch (err: unknown) {
      setErrorMessage((err as Error).message || 'Erro ao fundir comandas');
    }
  };

  // Target preview for transfer
  const targetTransferTable = allTables.find((t) => t.id === selectedTargetTableId);
  // Target preview for merge
  const targetMergeTable = otherOccupiedTables.find((t) => t.id === selectedMergeTabId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto animate-fade-in">
      <div className="bg-charcoal-900 border border-gray-700 w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden my-auto">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-gray-800 flex items-center justify-between bg-charcoal-850">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ember-600/20 border border-ember-500/40 flex items-center justify-center text-ember-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                <span>Gerenciar Mesa: {currentTable.label}</span>
                <span className="px-2 py-0.5 rounded-md bg-ember-600 text-[11px] font-bold text-white">
                  {formatBRL(currentTab.total_cents)}
                </span>
              </h3>
              <p className="text-xs text-gray-400">
                {currentTab.customer_name ? `Cliente: ${currentTab.customer_name} • ` : ''}
                {currentTab.orders?.length || 0} rodadas lançadas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-charcoal-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 p-2 bg-charcoal-950 border-b border-gray-800 text-xs font-bold gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTabMode('transfer');
              setErrorMessage(null);
            }}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTabMode === 'transfer'
                ? 'bg-ember-600 text-white shadow-md shadow-ember-600/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-charcoal-850'
            }`}
          >
            <ArrowRightLeft className="w-4 h-4 flex-shrink-0" />
            <span>Trocar Mesa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabMode('link');
              setErrorMessage(null);
            }}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTabMode === 'link'
                ? 'bg-ember-600 text-white shadow-md shadow-ember-600/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-charcoal-850'
            }`}
          >
            <Link2 className="w-4 h-4 flex-shrink-0" />
            <span>Puxar Mesa</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTabMode('merge');
              setErrorMessage(null);
            }}
            className={`py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 transition ${
              activeTabMode === 'merge'
                ? 'bg-ember-600 text-white shadow-md shadow-ember-600/30'
                : 'text-gray-400 hover:text-gray-200 hover:bg-charcoal-850'
            }`}
          >
            <GitMerge className="w-4 h-4 flex-shrink-0" />
            <span>Fundir Contas</span>
          </button>
        </div>

        {/* Feedback Messages */}
        <div className="p-4 sm:p-6 space-y-4">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-red-950/70 border border-red-500/80 text-red-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3.5 rounded-xl bg-emerald-950/70 border border-emerald-500/80 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: TROCAR DE MESA */}
          {activeTabMode === 'transfer' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-charcoal-850 border border-gray-800 text-xs text-gray-300 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <ArrowRightLeft className="w-4 h-4 text-ember-400" />
                  Mudar cliente para outra mesa:
                </span>
                <p className="text-gray-400">
                  Transfere todo o histórico de consumo, pedidos ativos e pendências para a nova mesa escolhida. A mesa atual ({currentTable.label}) será liberada imediatamente.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">
                  Selecione a Mesa de Destino (Livre):
                </label>
                {freeTables.length === 0 ? (
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-gray-800 text-center text-xs text-gray-400">
                    Nenhuma outra mesa livre no momento para transferência.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {freeTables.map((tbl) => (
                      <button
                        key={tbl.id}
                        type="button"
                        onClick={() => setSelectedTargetTableId(tbl.id)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          selectedTargetTableId === tbl.id
                            ? 'bg-ember-600/20 border-ember-500 ring-2 ring-ember-500/30'
                            : 'bg-charcoal-850 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <span className="font-black text-white text-sm">{tbl.label}</span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" />
                          Até {tbl.capacity} pessoas
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Transfer Preview */}
              {targetTransferTable && (
                <div className="p-3.5 rounded-xl bg-charcoal-950 border border-ember-500/40 text-xs space-y-2">
                  <div className="font-bold text-ember-400 text-xs uppercase tracking-wider">
                    Resumo da Transferência:
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Mesa de Origem ({currentTable.label}):</span>
                    <span className="font-bold text-emerald-400">Ficará Livre</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Mesa de Destino ({targetTransferTable.label}):</span>
                    <span className="font-bold text-orange-400">Ficará Ocupada com {formatBRL(currentTab.total_cents)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>Cozinha & KDS:</span>
                    <span className="text-gray-300">Pedidos atualizados para Mesa {String(targetTransferTable.table_number).padStart(2, '0')}</span>
                  </div>
                </div>
              )}

              <button
                type="button"
                disabled={!selectedTargetTableId}
                onClick={handleExecuteTransfer}
                className="w-full py-3 px-4 rounded-xl bg-ember-600 hover:bg-ember-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-ember-600/30 transition transform active:scale-98"
              >
                <ArrowRightLeft className="w-4 h-4" />
                <span>Confirmar Troca para {targetTransferTable?.label || 'Nova Mesa'}</span>
              </button>
            </div>
          )}

          {/* TAB 2: PUXAR MESA LIVRE */}
          {activeTabMode === 'link' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-charcoal-850 border border-gray-800 text-xs text-gray-300 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <Link2 className="w-4 h-4 text-ember-400" />
                  Juntar Mesa Livre (Puxar mais lugares):
                </span>
                <p className="text-gray-400">
                  O cliente juntou amigos e ocupou mais mesas? Anexe uma mesa livre à comanda da {currentTable.label}. A mesa puxada ficará marcada como ocupada e será liberada automaticamente quando esta conta for paga no caixa.
                </p>
              </div>

              {/* Mesas já juntadas */}
              {joinedTables.length > 0 && (
                <div className="p-3.5 rounded-xl bg-charcoal-950 border border-gray-800 space-y-2">
                  <div className="text-xs font-bold text-gray-300">
                    Mesas atualmente anexadas a esta conta:
                  </div>
                  <div className="space-y-2">
                    {joinedTables.map((jt) => (
                      <div
                        key={jt.id}
                        className="flex items-center justify-between p-2.5 rounded-lg bg-charcoal-850 border border-gray-700 text-xs"
                      >
                        <span className="font-black text-white">{jt.label}</span>
                        <button
                          type="button"
                          onClick={() => handleUnlink(jt.id)}
                          className="px-2.5 py-1 rounded-lg bg-red-950/80 hover:bg-red-900 border border-red-700 text-red-300 font-bold text-[11px] flex items-center gap-1 transition"
                        >
                          <Unlink className="w-3.5 h-3.5" />
                          <span>Desmembrar / Liberar</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">
                  Selecione a Mesa Livre para Puxar/Anexar:
                </label>
                {freeTables.length === 0 ? (
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-gray-800 text-center text-xs text-gray-400">
                    Não há mesas livres no momento para anexar.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {freeTables.map((tbl) => (
                      <button
                        key={tbl.id}
                        type="button"
                        onClick={() => setSelectedLinkTableId(tbl.id)}
                        className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                          selectedLinkTableId === tbl.id
                            ? 'bg-ember-600/20 border-ember-500 ring-2 ring-ember-500/30'
                            : 'bg-charcoal-850 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <span className="font-black text-white text-sm">{tbl.label}</span>
                        <span className="text-[11px] text-gray-400 flex items-center gap-1 mt-1">
                          <Users className="w-3 h-3" />
                          +{tbl.capacity} lugares
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                disabled={!selectedLinkTableId}
                onClick={handleExecuteLink}
                className="w-full py-3 px-4 rounded-xl bg-ember-600 hover:bg-ember-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-ember-600/30 transition transform active:scale-98"
              >
                <Link2 className="w-4 h-4" />
                <span>Puxar e Anexar à {currentTable.label}</span>
              </button>
            </div>
          )}

          {/* TAB 3: FUNDIR CONTAS */}
          {activeTabMode === 'merge' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-charcoal-850 border border-gray-800 text-xs text-gray-300 space-y-1">
                <span className="font-bold text-white flex items-center gap-1.5">
                  <GitMerge className="w-4 h-4 text-ember-400" />
                  Unificar Contas de Mesas Diferentes:
                </span>
                <p className="text-gray-400">
                  Dois clientes de mesas separadas decidiram juntar tudo em uma única conta? Selecione a outra mesa para migrar todos os pedidos dela para a comanda da {currentTable.label}.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-300 mb-2">
                  Selecione a Outra Mesa para Fundir nesta Conta:
                </label>
                {otherOccupiedTables.length === 0 ? (
                  <div className="p-4 rounded-xl bg-charcoal-850 border border-gray-800 text-center text-xs text-gray-400">
                    Não há outras mesas ocupadas disponíveis para fusão.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto pr-1">
                    {otherOccupiedTables.map((tbl) => {
                      const tab = tbl.active_tab;
                      return (
                        <button
                          key={tbl.id}
                          type="button"
                          onClick={() => setSelectedMergeTabId(tbl.id)}
                          className={`p-3 rounded-xl border text-left transition flex items-center justify-between ${
                            selectedMergeTabId === tbl.id
                              ? 'bg-ember-600/20 border-ember-500 ring-2 ring-ember-500/30'
                              : 'bg-charcoal-850 border-gray-800 hover:border-gray-700'
                          }`}
                        >
                          <div>
                            <span className="font-black text-white text-sm block">{tbl.label}</span>
                            <span className="text-[11px] text-gray-400 truncate max-w-[140px] block">
                              {tab?.customer_name || 'Sem nome'}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-ember-400 text-xs">
                            {formatBRL(tab?.total_cents || 0)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Merge Summary Preview */}
              {targetMergeTable && targetMergeTable.active_tab && (
                <div className="p-3.5 rounded-xl bg-charcoal-950 border border-ember-500/40 text-xs space-y-2">
                  <div className="font-bold text-ember-400 text-xs uppercase tracking-wider">
                    Simulação do Novo Saldo Unificado:
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>{currentTable.label} (Esta conta):</span>
                    <span className="font-mono font-bold text-white">{formatBRL(currentTab.total_cents)}</span>
                  </div>
                  <div className="flex items-center justify-between text-gray-300">
                    <span>{targetMergeTable.label} (Será incorporada):</span>
                    <span className="font-mono font-bold text-white">{formatBRL(targetMergeTable.active_tab.total_cents)}</span>
                  </div>
                  <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                    <span className="font-bold text-white text-sm">Total Unificado:</span>
                    <span className="font-mono font-black text-ember-400 text-base">
                      {formatBRL(currentTab.total_cents + targetMergeTable.active_tab.total_cents)}
                    </span>
                  </div>

                  <label className="flex items-center gap-2 pt-2 text-gray-300 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={keepTableJoined}
                      onChange={(e) => setKeepTableJoined(e.target.checked)}
                      className="rounded bg-charcoal-800 border-gray-700 text-ember-600 focus:ring-0"
                    />
                    <span className="text-xs">Manter a {targetMergeTable.label} ocupada e junta a esta mesa</span>
                  </label>
                </div>
              )}

              <button
                type="button"
                disabled={!selectedMergeTabId}
                onClick={handleExecuteMerge}
                className="w-full py-3 px-4 rounded-xl bg-ember-600 hover:bg-ember-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-ember-600/30 transition transform active:scale-98"
              >
                <GitMerge className="w-4 h-4" />
                <span>Confirmar Fusão de Contas</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
