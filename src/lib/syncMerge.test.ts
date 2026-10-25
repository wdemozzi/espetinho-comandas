import { describe, it, expect } from 'vitest';
import { mergeOrders, mergeTabs, mergeOrderItems } from './syncMerge';
import { Order, OrderItem, Tab } from '../types/database.types';

describe('syncMerge - Resolução de Conflitos e Anti-Regressão', () => {
  const baseItem: OrderItem = {
    id: 'item-1',
    order_id: 'order-1',
    product_id: 'p1',
    product_name: 'Espetinho Picanha',
    unit_price_cents: 2000,
    quantity: 1,
    addons_snapshot: [],
    addons_total_cents: 0,
    total_cents: 2000,
    notes: null,
    sector: 'churrasqueira',
    status: 'delivered',
    prepared_at: '2026-10-25T10:00:00Z',
    delivered_at: '2026-10-25T10:15:00Z',
    created_at: '2026-10-25T09:50:00Z',
  };

  const baseOrder: Order = {
    id: 'order-1',
    establishment_id: 'est-1',
    order_number: 101,
    origin: 'waiter',
    order_type: 'dine_in',
    status: 'delivered',
    created_by: 'user-1',
    customer_name: 'Cliente Teste',
    customer_phone: null,
    delivery_address: null,
    general_notes: null,
    total_cents: 2000,
    created_at: '2026-10-25T09:50:00Z',
    updated_at: '2026-10-25T10:15:00Z',
    items: [baseItem],
  };

  it('NÃO deve permitir que um item entregue (delivered) regrida para preparando (preparing)', () => {
    const outdatedItem: OrderItem = {
      ...baseItem,
      status: 'preparing',
      delivered_at: null,
    };

    const merged = mergeOrderItems([baseItem], [outdatedItem]);
    expect(merged[0].status).toBe('delivered');
    expect(merged[0].delivered_at).toBe('2026-10-25T10:15:00Z');
  });

  it('NÃO deve permitir que um pedido entregue (delivered) volte para a cozinha como preparing', () => {
    const outdatedOrder: Order = {
      ...baseOrder,
      status: 'preparing',
      items: [{ ...baseItem, status: 'preparing' }],
      updated_at: '2026-10-25T09:55:00Z',
    };

    const result = mergeOrders([baseOrder], [outdatedOrder]);
    expect(result.length).toBe(1);
    expect(result[0].status).toBe('delivered');
    expect(result[0].items[0].status).toBe('delivered');
  });

  it('deve permitir o avanço normal de status (preparing -> ready -> delivered)', () => {
    const preparingOrder: Order = {
      ...baseOrder,
      status: 'preparing',
      items: [{ ...baseItem, status: 'preparing', delivered_at: null }],
    };

    const readyIncoming: Order = {
      ...baseOrder,
      status: 'ready',
      items: [{ ...baseItem, status: 'ready', delivered_at: null, prepared_at: '2026-10-25T10:05:00Z' }],
      updated_at: '2026-10-25T10:05:00Z',
    };

    const result = mergeOrders([preparingOrder], [readyIncoming]);
    expect(result[0].status).toBe('ready');
    expect(result[0].items[0].status).toBe('ready');
  });

  it('NÃO deve permitir que uma comanda paga (paid) regrida para aberta (open)', () => {
    const paidTab: Tab = {
      id: 'tab-1',
      establishment_id: 'est-1',
      table_id: 't1',
      opened_by: 'user-1',
      closed_by: 'user-2',
      customer_name: 'Mesa 1',
      customer_phone: null,
      notes: null,
      status: 'paid',
      total_cents: 5000,
      discount_cents: 0,
      paid_cents: 5000,
      opened_at: '2026-10-25T09:00:00Z',
      closed_at: '2026-10-25T10:00:00Z',
      created_at: '2026-10-25T09:00:00Z',
      updated_at: '2026-10-25T10:00:00Z',
    };

    const staleTab: Tab = {
      ...paidTab,
      status: 'open',
      closed_at: null,
      closed_by: null,
      paid_cents: 0,
    };

    const merged = mergeTabs([paidTab], [staleTab]);
    expect(merged[0].status).toBe('paid');
    expect(merged[0].paid_cents).toBe(5000);
    expect(merged[0].closed_at).toBe('2026-10-25T10:00:00Z');
  });
});
