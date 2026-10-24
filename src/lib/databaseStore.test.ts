import { describe, it, expect, beforeEach } from 'vitest';
import { db } from './databaseStore';

describe('DatabaseStore & Persistence', () => {
  it('should find table flexibly by qr_token, table number, or id', () => {
    // Mesa 02 has table_number 2 and qr_token 'mesa-02-token'
    const byToken = db.getTableByQrToken('mesa-02-token');
    expect(byToken).toBeDefined();
    expect(byToken?.table_number).toBe(2);

    // Should also find by string number
    const byNumber = db.getTableByQrToken('2');
    expect(byNumber).toBeDefined();
    expect(byNumber?.table_number).toBe(2);

    // Should also find with leading zero
    const byLeadingZero = db.getTableByQrToken('02');
    expect(byLeadingZero).toBeDefined();
    expect(byLeadingZero?.table_number).toBe(2);

    // Should also find by ID
    const byId = db.getTableByQrToken('t2');
    expect(byId).toBeDefined();
    expect(byId?.table_number).toBe(2);
  });

  it('should update profile PIN and persist', () => {
    const profiles = db.getProfiles();
    const admin = profiles.find((p) => p.role === 'admin');
    expect(admin).toBeDefined();

    db.saveProfile({
      id: admin!.id,
      pin_code: '4321',
    });

    const updated = db.getProfiles().find((p) => p.id === admin!.id);
    expect(updated?.pin_code).toBe('4321');
  });

  it('should create online orders in pending_confirmation and allow staff confirmation or cancellation', () => {
    const products = db.getProducts();
    const product = products[0];

    const onlineOrder = db.createOrder({
      origin: 'external_catalog',
      order_type: 'takeout',
      customer_name: 'Cliente Teste',
      customer_phone: '(44) 99999-8888',
      items: [
        {
          product_id: product.id,
          quantity: 2,
          addons: [],
        },
      ],
    });

    expect(onlineOrder.status).toBe('pending_confirmation');
    expect(onlineOrder.items[0].status).toBe('pending_confirmation');

    // Confirm order
    const confirmed = db.confirmPendingOrder(onlineOrder.id);
    expect(confirmed.status).toBe('received');
    expect(confirmed.items[0].status).toBe('received');

    // Test cancellation of another order
    const trollOrder = db.createOrder({
      origin: 'external_catalog',
      order_type: 'takeout',
      customer_name: 'Trote',
      customer_phone: '(44) 90000-0000',
      items: [
        {
          product_id: product.id,
          quantity: 1,
          addons: [],
        },
      ],
    });

    const cancelled = db.cancelPendingOrder(trollOrder.id, 'Número falso');
    expect(cancelled.status).toBe('cancelled');
    expect(cancelled.items[0].status).toBe('cancelled');
  });

  it('should automatically deduct stock on order and refund upon cancellation', () => {
    const products = db.getProducts();
    const product = products[0];
    const initialStock = product.stock_quantity ?? 40;

    const order = db.createOrder({
      origin: 'table_qr',
      order_type: 'dine_in',
      customer_name: 'Marcos Teste Estoque',
      customer_phone: '(44) 99888-1122',
      items: [
        {
          product_id: product.id,
          quantity: 3,
          addons: [],
        },
      ],
    });

    const updatedProduct = db.getProducts().find((p) => p.id === product.id);
    expect(updatedProduct?.stock_quantity).toBe(initialStock - 3);

    // Cancel order and check refund
    db.cancelPendingOrder(order.id, 'Cliente desistiu');
    const refundedProduct = db.getProducts().find((p) => p.id === product.id);
    expect(refundedProduct?.stock_quantity).toBe(initialStock);
  });

  it('should generate consolidated customer marketing leads', () => {
    const leads = db.getCustomerLeads();
    expect(Array.isArray(leads)).toBe(true);
    expect(leads.length).toBeGreaterThan(0);

    const lead = leads[0];
    expect(lead).toHaveProperty('phone');
    expect(lead).toHaveProperty('name');
    expect(lead).toHaveProperty('orders_count');
    expect(lead).toHaveProperty('total_spent_cents');
    expect(lead).toHaveProperty('primary_channel');
    expect(lead).toHaveProperty('order_history');
  });
});
