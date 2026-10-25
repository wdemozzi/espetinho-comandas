import React, { useState } from 'react';
import { Tab, Establishment } from '../../types/database.types';
import { formatBRL } from '../../lib/currency';
import {
  Printer,
  Share2,
  X,
  Receipt,
  CheckCircle2,
  Phone,
  Clock,
  UtensilsCrossed,
} from 'lucide-react';

interface PreBillModalProps {
  tab: Tab;
  establishment: Establishment;
  onClose: () => void;
}

export const PreBillModal: React.FC<PreBillModalProps> = ({ tab, establishment, onClose }) => {
  const [includeServiceFee, setIncludeServiceFee] = useState<boolean>(establishment.service_fee_enabled === true);
  const [copiedText, setCopiedText] = useState(false);

  // Group items across all tab orders
  const itemsMap = new Map<
    string,
    { name: string; quantity: number; unit_price_cents: number; total_cents: number; notes: string[] }
  >();

  const orders = tab.orders || [];
  for (const order of orders) {
    for (const item of order.items) {
      if (item.status === 'cancelled') continue;
      const key = `${item.product_name}-${item.unit_price_cents}`;
      const existing = itemsMap.get(key);
      if (existing) {
        existing.quantity += item.quantity;
        existing.total_cents += item.total_cents;
        if (item.notes) existing.notes.push(item.notes);
      } else {
        itemsMap.set(key, {
          name: item.product_name,
          quantity: item.quantity,
          unit_price_cents: item.unit_price_cents,
          total_cents: item.total_cents,
          notes: item.notes ? [item.notes] : [],
        });
      }
    }
  }

  const groupedItems = Array.from(itemsMap.values());
  const subtotalCents = tab.total_cents;
  const servicePercent = establishment.service_fee_percent || 10;
  const serviceFeeCents = includeServiceFee ? Math.round((subtotalCents * servicePercent) / 100) : 0;
  const finalTotalCents = Math.max(0, subtotalCents + serviceFeeCents - tab.discount_cents);
  const remainingDueCents = Math.max(0, finalTotalCents - tab.paid_cents);

  // Format pre-bill message for WhatsApp
  const generateReceiptText = () => {
    let msg = `*CONFERÊNCIA DE CONTA - ${establishment.name.toUpperCase()}*\n`;
    if (tab.table) msg += `📍 *Mesa:* ${tab.table.label}\n`;
    if (tab.customer_name) msg += `👤 *Cliente:* ${tab.customer_name}\n`;
    msg += `🕒 *Abertura:* ${new Date(tab.opened_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}\n`;
    msg += `--------------------------------\n`;
    msg += `*ITENS CONSUMIDOS:*\n`;

    groupedItems.forEach((it) => {
      msg += `${it.quantity}x ${it.name} - ${formatBRL(it.total_cents)}\n`;
    });

    msg += `--------------------------------\n`;
    msg += `*Subtotal:* ${formatBRL(subtotalCents)}\n`;
    if (includeServiceFee && serviceFeeCents > 0) {
      msg += `*Taxa de Serviço (${servicePercent}% opcional):* ${formatBRL(serviceFeeCents)}\n`;
    }
    if (tab.discount_cents > 0) {
      msg += `*Desconto:* -${formatBRL(tab.discount_cents)}\n`;
    }
    msg += `*TOTAL:* ${formatBRL(finalTotalCents)}\n`;
    if (tab.paid_cents > 0) {
      msg += `*Já Pago:* ${formatBRL(tab.paid_cents)}\n`;
      msg += `*Saldo Restante:* ${formatBRL(remainingDueCents)}\n`;
    }
    msg += `--------------------------------\n`;
    msg += `Agradecemos a preferência! 🍻`;
    return msg;
  };

  const handleSendWhatsApp = () => {
    const text = encodeURIComponent(generateReceiptText());
    const phone = tab.customer_phone?.replace(/\D/g, '') || '';
    const url = phone ? `https://wa.me/55${phone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(url, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-charcoal-900 border border-gray-700 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden my-auto flex flex-col">
        {/* Header */}
        <div className="p-4 bg-charcoal-850 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-ember-600/20 border border-ember-500/40 flex items-center justify-center text-ember-400">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black text-white">Conferência de Conta</h3>
              <p className="text-[11px] text-gray-400">
                {tab.table ? tab.table.label : 'Comanda Balcão'} • #{tab.id.slice(-6)}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-charcoal-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Thermal Receipt Card */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[60vh] bg-charcoal-950/60">
          <div className="bg-white text-gray-900 p-5 rounded-xl shadow-lg font-mono text-xs space-y-3 border-2 border-dashed border-gray-300">
            {/* Establishment Info */}
            <div className="text-center pb-3 border-b border-gray-300">
              <h2 className="font-black text-sm uppercase tracking-wider">{establishment.name}</h2>
              <p className="text-[11px] text-gray-600">{establishment.description}</p>
              <p className="text-[11px] text-gray-600">{establishment.phone}</p>
              <div className="mt-1 pt-1 border-t border-dotted border-gray-300 text-[10px] text-gray-500 flex items-center justify-center gap-2">
                <span>{new Date().toLocaleDateString('pt-BR')}</span>
                <span>{new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Comanda Metadata */}
            <div className="flex justify-between text-[11px] pb-2 border-b border-dotted border-gray-300">
              <span className="font-bold">{tab.table ? tab.table.label : 'Balcão'}</span>
              <span>{tab.customer_name ? `Cliente: ${tab.customer_name}` : 'Sem cliente'}</span>
            </div>

            {/* Items Table */}
            <div className="space-y-1.5 py-1">
              <div className="flex justify-between font-bold text-[10px] uppercase text-gray-500 border-b border-gray-200 pb-1">
                <span>Item</span>
                <span>Total</span>
              </div>
              {groupedItems.map((it, idx) => (
                <div key={idx} className="flex justify-between text-xs">
                  <span className="truncate pr-2">
                    {it.quantity}x {it.name}
                  </span>
                  <span className="font-bold flex-shrink-0">{formatBRL(it.total_cents)}</span>
                </div>
              ))}
            </div>

            {/* Subtotal, Service Fee, Total */}
            <div className="pt-2 border-t border-gray-300 space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Subtotal Consumo:</span>
                <span className="font-bold">{formatBRL(subtotalCents)}</span>
              </div>

              {includeServiceFee && serviceFeeCents > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Taxa de Serviço ({servicePercent}%):</span>
                  <span className="font-bold">+{formatBRL(serviceFeeCents)}</span>
                </div>
              )}

              {tab.discount_cents > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Desconto:</span>
                  <span className="font-bold">-{formatBRL(tab.discount_cents)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-black pt-1 border-t-2 border-gray-900">
                <span>TOTAL A PAGAR:</span>
                <span>{formatBRL(finalTotalCents)}</span>
              </div>

              {tab.paid_cents > 0 && (
                <>
                  <div className="flex justify-between text-gray-600 pt-1">
                    <span>Valor Já Pago:</span>
                    <span className="font-bold">{formatBRL(tab.paid_cents)}</span>
                  </div>
                  <div className="flex justify-between text-ember-700 font-black">
                    <span>Saldo Restante:</span>
                    <span>{formatBRL(remainingDueCents)}</span>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="text-center pt-3 border-t border-dotted border-gray-300 text-[10px] text-gray-500 uppercase">
              *** DOCUMENTO DE CONFERÊNCIA ***
              <br />
              NÃO É DOCUMENTO FISCAL
            </div>
          </div>
        </div>

        {/* Controls & Action Buttons */}
        <div className="p-4 bg-charcoal-850 border-t border-gray-800 space-y-3">
          {/* Service Fee Toggle */}
          <div className="flex items-center justify-between p-2.5 rounded-xl bg-charcoal-900 border border-gray-800 text-xs">
            <label className="flex items-center gap-2 cursor-pointer select-none text-gray-300">
              <input
                type="checkbox"
                checked={includeServiceFee}
                onChange={(e) => setIncludeServiceFee(e.target.checked)}
                className="rounded bg-charcoal-800 border-gray-700 text-ember-600 focus:ring-0"
              />
              <span>Incluir Taxa de Serviço ({servicePercent}%)</span>
            </label>
            <span className="font-mono font-bold text-gray-400">
              {includeServiceFee ? formatBRL(serviceFeeCents) : 'R$ 0,00'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-charcoal-800 hover:bg-gray-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition border border-gray-700"
            >
              <Printer className="w-4 h-4 text-gray-300" />
              <span>Imprimir / PDF</span>
            </button>

            <button
              type="button"
              onClick={handleSendWhatsApp}
              className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-600/30 transition transform active:scale-95"
            >
              <Share2 className="w-4 h-4" />
              <span>Mandar no WhatsApp</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
