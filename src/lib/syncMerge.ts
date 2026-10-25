import { Order, OrderItem, OrderStatus, Tab, TabStatus } from '../types/database.types';

export const ORDER_STATUS_RANK: Record<OrderStatus, number> = {
  pending_confirmation: 0,
  received: 1,
  preparing: 2,
  ready: 3,
  delivered: 4,
  cancelled: 5,
};

export const TAB_STATUS_RANK: Record<TabStatus, number> = {
  open: 0,
  closing: 1,
  paid: 2,
  cancelled: 3,
};

/**
 * Retorna true se o novo status representa um avanço ou igualdade no ciclo de vida
 */
export function isStatusProgressionOrEqual(current: OrderStatus, next: OrderStatus): boolean {
  // Cancelado é terminal
  if (current === 'cancelled') return next === 'cancelled';
  // Entregue só pode ir para cancelado se houver estorno
  if (current === 'delivered') return next === 'delivered' || next === 'cancelled';
  return (ORDER_STATUS_RANK[next] ?? 0) >= (ORDER_STATUS_RANK[current] ?? 0);
}

/**
 * Mescla listas de itens de pedidos garantindo que itens prontos ou entregues
 * NUNCA voltem para status inferiores por sincronizações atrasadas.
 */
export function mergeOrderItems(baseItems: OrderItem[], incomingItems: OrderItem[]): OrderItem[] {
  const map = new Map<string, OrderItem>();

  for (const item of baseItems) {
    map.set(item.id, { ...item });
  }

  for (const inc of incomingItems) {
    const existing = map.get(inc.id);
    if (!existing) {
      map.set(inc.id, { ...inc });
      continue;
    }

    const exRank = ORDER_STATUS_RANK[existing.status] ?? 0;
    const incRank = ORDER_STATUS_RANK[inc.status] ?? 0;

    let finalStatus: OrderStatus = existing.status;
    let preparedAt = existing.prepared_at || inc.prepared_at;
    let deliveredAt = existing.delivered_at || inc.delivered_at;

    if (incRank > exRank) {
      finalStatus = inc.status;
      if (inc.prepared_at) preparedAt = inc.prepared_at;
      if (inc.delivered_at) deliveredAt = inc.delivered_at;
    } else if (incRank === exRank) {
      finalStatus = existing.status;
      if (!preparedAt && inc.prepared_at) preparedAt = inc.prepared_at;
      if (!deliveredAt && inc.delivered_at) deliveredAt = inc.delivered_at;
    }
    // Se incRank < exRank: IGNORA o status inc.status para impedir regressão!

    map.set(inc.id, {
      ...existing,
      ...inc,
      status: finalStatus,
      prepared_at: preparedAt,
      delivered_at: deliveredAt,
      updated_at: new Date(
        Math.max(
          new Date(existing.updated_at || existing.created_at).getTime(),
          new Date(inc.updated_at || inc.created_at).getTime()
        )
      ).toISOString(),
    });
  }

  return Array.from(map.values());
}

/**
 * Mesclagem inteligente e unidirecional de pedidos.
 * Garante que pedidos finalizados (delivered / cancelled) NUNCA voltem para a cozinha ou garçom.
 */
export function mergeOrders(baseOrders: Order[], incomingOrders: Order[]): Order[] {
  const map = new Map<string, Order>();

  for (const o of baseOrders) {
    map.set(o.id, { ...o });
  }

  for (const inc of incomingOrders) {
    const existing = map.get(inc.id);
    if (!existing) {
      map.set(inc.id, { ...inc });
      continue;
    }

    const mergedItems = mergeOrderItems(existing.items || [], inc.items || []);

    const exRank = ORDER_STATUS_RANK[existing.status] ?? 0;
    const incRank = ORDER_STATUS_RANK[inc.status] ?? 0;

    const allDelivered = mergedItems.length > 0 && mergedItems.every((i) => i.status === 'delivered');
    const allCancelled = mergedItems.length > 0 && mergedItems.every((i) => i.status === 'cancelled');

    let finalStatus: OrderStatus = existing.status;

    if (allDelivered) {
      finalStatus = 'delivered';
    } else if (allCancelled) {
      finalStatus = 'cancelled';
    } else if (incRank > exRank) {
      finalStatus = inc.status;
    } else if (incRank === exRank) {
      const exTime = new Date(existing.updated_at || existing.created_at).getTime();
      const incTime = new Date(inc.updated_at || inc.created_at).getTime();
      if (incTime > exTime) {
        finalStatus = inc.status;
      }
    }
    // Se incRank < exRank, o status mais avançado de existing é mantido!

    map.set(inc.id, {
      ...existing,
      ...inc,
      status: finalStatus,
      items: mergedItems,
      updated_at: new Date(
        Math.max(
          new Date(existing.updated_at || existing.created_at).getTime(),
          new Date(inc.updated_at || inc.created_at).getTime()
        )
      ).toISOString(),
    });
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Mesclagem inteligente de comandas (Tabs).
 * Comandas pagas ou canceladas nunca voltam para abertas.
 */
export function mergeTabs(baseTabs: Tab[], incomingTabs: Tab[]): Tab[] {
  const map = new Map<string, Tab>();

  for (const t of baseTabs) {
    map.set(t.id, { ...t });
  }

  for (const inc of incomingTabs) {
    const existing = map.get(inc.id);
    if (!existing) {
      map.set(inc.id, { ...inc });
      continue;
    }

    const exRank = TAB_STATUS_RANK[existing.status] ?? 0;
    const incRank = TAB_STATUS_RANK[inc.status] ?? 0;

    let finalStatus: TabStatus = existing.status;
    let closedAt = existing.closed_at || inc.closed_at;
    let closedBy = existing.closed_by || inc.closed_by;

    if (incRank > exRank) {
      finalStatus = inc.status;
      if (inc.closed_at) closedAt = inc.closed_at;
      if (inc.closed_by) closedBy = inc.closed_by;
    } else if (incRank === exRank) {
      finalStatus = existing.status;
    }

    // Se a comanda está paga, garante que paid_cents cubra total
    const paidCents = Math.max(existing.paid_cents || 0, inc.paid_cents || 0);

    map.set(inc.id, {
      ...existing,
      ...inc,
      status: finalStatus,
      paid_cents: paidCents,
      closed_at: closedAt,
      closed_by: closedBy,
      updated_at: new Date(
        Math.max(
          new Date(existing.updated_at || existing.created_at).getTime(),
          new Date(inc.updated_at || inc.created_at).getTime()
        )
      ).toISOString(),
    });
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}
