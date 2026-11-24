import { Order } from '../types/database.types';
import { formatBRL } from './currency';

export const OFFICIAL_WHATSAPP_NUMBER = '5544999923965';
export const OFFICIAL_WHATSAPP_DISPLAY = '(44) 99992-3965';
export const OFFICIAL_PIX_KEY = '44999923965';

/**
 * Formata um pedido finalizado para envio via WhatsApp contendo todos os
 * itens da sacola, opções/sabores escolhidos, observações individuais,
 * observações gerais e valor total.
 */
export function formatOrderWhatsAppMessage(order: Order): string {
  const lines: string[] = [];

  lines.push('🍢 *NOVO PEDIDO - CT CONVENIÊNCIA* 🍢');
  lines.push(`*Pedido:* #${order.order_number}`);
  if (order.customer_name) {
    lines.push(`*Cliente:* ${order.customer_name}`);
  }
  if (order.customer_phone) {
    lines.push(`*WhatsApp:* ${order.customer_phone}`);
  }
  lines.push('*Tipo:* Retirada no Balcão');
  lines.push('');
  lines.push('🛒 *ITENS DA SACOLA:*');

  if (order.items && order.items.length > 0) {
    order.items.forEach((item, index) => {
      lines.push(`${index + 1}. *${item.quantity}x ${item.product_name}* - ${formatBRL(item.total_cents)}`);

      if (item.addons_snapshot && item.addons_snapshot.length > 0) {
        item.addons_snapshot.forEach((addon) => {
          const addonPrice = addon.price_cents > 0 ? ` (+${formatBRL(addon.price_cents)})` : ' (Incluso)';
          lines.push(`   └ Sabor/Opção: ${addon.name}${addonPrice}`);
        });
      }

      if (item.notes && item.notes.trim()) {
        lines.push(`   └ Obs: ${item.notes.trim()}`);
      }
    });
  } else {
    lines.push('(Nenhum item)');
  }

  if (order.general_notes && order.general_notes.trim()) {
    lines.push('');
    lines.push(`📝 *Observações:* ${order.general_notes.trim()}`);
  }

  lines.push('');
  lines.push(`💰 *VALOR TOTAL:* *${formatBRL(order.total_cents)}*`);
  lines.push('');
  lines.push('Gostaria de confirmar o pedido para vocês iniciarem o preparo na brasa! 🔥');

  return lines.join('\n');
}

/**
 * Retorna o link direto do WhatsApp (wa.me) devidamente codificado
 */
export function getOrderWhatsAppUrl(order: Order, phone: string = OFFICIAL_WHATSAPP_NUMBER): string {
  const text = formatOrderWhatsAppMessage(order);
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}
