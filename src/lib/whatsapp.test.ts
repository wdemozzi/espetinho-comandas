import { describe, it, expect } from 'vitest';
import { formatOrderWhatsAppMessage, getOrderWhatsAppUrl, OFFICIAL_WHATSAPP_NUMBER } from './whatsapp';
import { Order } from '../types/database.types';
import { formatBRL } from './currency';

describe('formatOrderWhatsAppMessage', () => {
  it('formats order with items, addons, notes and total correctly', () => {
    const mockOrder: Order = {
      id: 'order-123',
      establishment_id: 'est-1',
      order_number: 1042,
      origin: 'external_catalog',
      order_type: 'takeout',
      status: 'pending_confirmation',
      created_by: null,
      customer_name: 'Carlos Oliveira',
      customer_phone: '(44) 99999-8888',
      delivery_address: null,
      general_notes: 'Caprichar na farofa especial por favor',
      total_cents: 5800,
      created_at: new Date().toISOString(),
      items: [
        {
          id: 'oi-1',
          order_id: 'order-123',
          product_id: 'p-1',
          product_name: 'Espeto de Picanha Nobre',
          unit_price_cents: 1800,
          quantity: 2,
          addons_snapshot: [
            { name: 'Farofa Especial da Casa', price_cents: 0 },
            { name: 'Molho de Alho Defumado', price_cents: 200 },
          ],
          addons_total_cents: 200,
          total_cents: 4000,
          notes: 'Bem passado na brasa',
          sector: 'churrasqueira',
          status: 'pending_confirmation',
          prepared_at: null,
          delivered_at: null,
          created_at: new Date().toISOString(),
        },
        {
          id: 'oi-2',
          order_id: 'order-123',
          product_id: 'p-2',
          product_name: 'Caipirinha Artesanal 500ml',
          unit_price_cents: 1800,
          quantity: 1,
          addons_snapshot: [
            { name: 'Limão com Cachaça Nobre', price_cents: 0 },
          ],
          addons_total_cents: 0,
          total_cents: 1800,
          notes: null,
          sector: 'cozinha',
          status: 'pending_confirmation',
          prepared_at: null,
          delivered_at: null,
          created_at: new Date().toISOString(),
        },
      ],
    };

    const message = formatOrderWhatsAppMessage(mockOrder);

    expect(message).toContain('*Pedido:* #1042');
    expect(message).toContain('*Cliente:* Carlos Oliveira');
    expect(message).toContain('*WhatsApp:* (44) 99999-8888');
    expect(message).toContain('*Tipo:* Retirada no Balcão');
    expect(message).toContain('🛒 *ITENS DA SACOLA:*');
    expect(message).toContain(`1. *2x Espeto de Picanha Nobre* - ${formatBRL(4000)}`);
    expect(message).toContain('└ Sabor/Opção: Farofa Especial da Casa (Incluso)');
    expect(message).toContain(`└ Sabor/Opção: Molho de Alho Defumado (+${formatBRL(200)})`);
    expect(message).toContain('└ Obs: Bem passado na brasa');
    expect(message).toContain(`2. *1x Caipirinha Artesanal 500ml* - ${formatBRL(1800)}`);
    expect(message).toContain('└ Sabor/Opção: Limão com Cachaça Nobre (Incluso)');
    expect(message).toContain('📝 *Observações:* Caprichar na farofa especial por favor');
    expect(message).toContain(`💰 *VALOR TOTAL:* *${formatBRL(5800)}*`);

    const url = getOrderWhatsAppUrl(mockOrder);
    expect(url).toContain(`https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=`);
    expect(url).toContain(encodeURIComponent('2x Espeto de Picanha Nobre'));
  });
});
