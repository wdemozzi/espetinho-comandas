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

  it('should transfer an active tab to a free table, updating table statuses and orders', () => {
    // Open a tab on Mesa 08 (t8)
    const table8 = db.getTableById('t8')!;
    const table9 = db.getTableById('t9')!; // free table
    expect(table8.status).toBe('livre');
    expect(table9.status).toBe('livre');

    const tab = db.openTab({
      table_id: table8.id,
      opened_by_user_id: 'u-1',
      customer_name: 'Cliente Transferencia',
    });

    const products = db.getProducts();
    const order = db.createOrder({
      tab_id: tab.id,
      origin: 'waiter',
      order_type: 'dine_in',
      items: [{ product_id: products[0].id, quantity: 1, addons: [] }],
    });
    expect(order.table_number).toBe(8);

    // Transfer tab to Mesa 09
    const res = db.transferTabToTable(tab.id, table9.id);
    expect(res.success).toBe(true);

    const updatedTable8 = db.getTableById('t8')!;
    const updatedTable9 = db.getTableById('t9')!;
    expect(updatedTable8.status).toBe('livre');
    expect(updatedTable9.status).toBe('ocupada');
    expect(updatedTable9.active_tab?.id).toBe(tab.id);

    // Check order table_number updated
    const updatedOrder = db.getOrderById(order.id);
    expect(updatedOrder?.table_number).toBe(9);
  });

  it('should link and unlink a free table to an active tab', () => {
    // Open a tab on Mesa 07 (t7)
    const table7 = db.getTableById('t7')!;
    const table6 = db.getTableById('t6')!; // free table

    const tab = db.openTab({
      table_id: table7.id,
      opened_by_user_id: 'u-1',
      customer_name: 'Grupo Grande',
    });

    // Link Mesa 06 to Mesa 07's tab
    const linkRes = db.linkTableToTab(tab.id, table6.id);
    expect(linkRes.success).toBe(true);

    const updatedTable6 = db.getTableById('t6')!;
    expect(updatedTable6.status).toBe('ocupada');
    expect(updatedTable6.linked_table_id).toBe(table7.id);

    // Unlink Mesa 06
    const unlinkRes = db.unlinkTableFromTab(tab.id, table6.id);
    expect(unlinkRes.success).toBe(true);

    const freedTable6 = db.getTableById('t6')!;
    expect(freedTable6.status).toBe('livre');
    expect(freedTable6.linked_table_id).toBeFalsy();
  });

  it('should merge two active tabs into one, combining orders and totals', () => {
    const table4 = db.getTableById('t4')!;
    const table5 = db.getTableById('t5')!;

    const tabA = db.openTab({
      table_id: table4.id,
      opened_by_user_id: 'u-1',
      customer_name: 'Mesa 4 Grupo A',
    });

    const tabB = db.openTab({
      table_id: table5.id,
      opened_by_user_id: 'u-1',
      customer_name: 'Mesa 5 Grupo B',
    });

    const product = db.getProducts()[0];
    db.createOrder({
      tab_id: tabA.id,
      origin: 'waiter',
      order_type: 'dine_in',
      items: [{ product_id: product.id, quantity: 2, addons: [] }],
    });
    db.createOrder({
      tab_id: tabB.id,
      origin: 'waiter',
      order_type: 'dine_in',
      items: [{ product_id: product.id, quantity: 3, addons: [] }],
    });

    const totalA = db.getTabById(tabA.id)!.total_cents;
    const totalB = db.getTabById(tabB.id)!.total_cents;

    // Merge Tab B into Tab A
    const mergeRes = db.mergeTabs(tabB.id, tabA.id, true);
    expect(mergeRes.success).toBe(true);

    const mergedTabA = db.getTabById(tabA.id)!;
    expect(mergedTabA.total_cents).toBe(totalA + totalB);

    const closedTabB = db.getTabById(tabB.id)!;
    expect(closedTabB.status).toBe('cancelled');

    // Table 5 is joined to Table 4
    const updatedTable5 = db.getTableById('t5')!;
    expect(updatedTable5.linked_table_id).toBe(table4.id);
  });

  it('should manage cash shift lifecycle, movements, and closure reconciliation', () => {
    // Open a cash shift with R$ 100,00 (10000 cents)
    const shift = db.openCashShift({
      initial_cash_cents: 10000,
      opened_by_user_id: 'u-admin',
      opened_by_name: 'Carlos Admin',
      notes: 'Turno de Teste',
    });

    expect(shift.status).toBe('open');
    expect(shift.initial_cash_cents).toBe(10000);
    expect(db.getCurrentCashShift()?.id).toBe(shift.id);

    // Register a Sangria (R$ 30,00 for ice/charcoal)
    const sangria = db.addCashMovement({
      shift_id: shift.id,
      type: 'sangria',
      amount_cents: 3000,
      reason: 'Compra de gelo',
      created_by_name: 'Carlos Admin',
    });
    expect(sangria.type).toBe('sangria');

    // Register a Suprimento (R$ 20,00 change)
    const suprimento = db.addCashMovement({
      shift_id: shift.id,
      type: 'suprimento',
      amount_cents: 2000,
      reason: 'Moedas de troco',
      created_by_name: 'Carlos Admin',
    });
    expect(suprimento.type).toBe('suprimento');

    // Check summary before sales:
    // Initial (100) + Suprimento (20) - Sangria (30) = 90 (9000 cents)
    const summary = db.getCashShiftSummary(shift.id);
    expect(summary.total_sangrias_cents).toBe(3000);
    expect(summary.total_suprimentos_cents).toBe(2000);
    expect(summary.expected_cash_cents).toBe(9000);

    // Close cash shift with exact counted R$ 90,00
    const closedShift = db.closeCashShift({
      shift_id: shift.id,
      closed_by_user_id: 'u-admin',
      closed_by_name: 'Carlos Admin',
      actual_cash_cents: 9000,
      notes: 'Fechamento perfeito',
    });

    expect(closedShift.status).toBe('closed');
    expect(closedShift.difference_cents).toBe(0);
    expect(db.getCurrentCashShift()).toBeUndefined();
  });

  it('should toggle and configure optional service fee settings', () => {
    expect(db.getEstablishment().service_fee_enabled).toBe(false);

    db.updateServiceFeeSettings({ enabled: true, percent: 10 });
    expect(db.getEstablishment().service_fee_enabled).toBe(true);
    expect(db.getEstablishment().service_fee_percent).toBe(10);

    db.updateServiceFeeSettings({ enabled: false });
    expect(db.getEstablishment().service_fee_enabled).toBe(false);
  });
});

