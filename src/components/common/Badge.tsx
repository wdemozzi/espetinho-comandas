import React from 'react';
import { OrderStatus, TableStatus, ProductionSector, TabStatus } from '../../types/database.types';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'ember' | 'outline';
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', className = '' }) => {
  const styles = {
    default: 'bg-gray-800 text-gray-300 border-gray-700',
    success: 'bg-emerald-950/80 text-emerald-400 border-emerald-800/60',
    warning: 'bg-amber-950/80 text-amber-400 border-amber-800/60',
    danger: 'bg-red-950/80 text-red-400 border-red-800/60',
    info: 'bg-blue-950/80 text-blue-400 border-blue-800/60',
    ember: 'bg-orange-950/80 text-orange-400 border-orange-800/60',
    outline: 'border-gray-700 text-gray-400 bg-transparent',
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

export const TableStatusBadge: React.FC<{ status: TableStatus }> = ({ status }) => {
  if (status === 'livre') {
    return <Badge variant="success">Livre</Badge>;
  }
  if (status === 'ocupada') {
    return <Badge variant="ember">Ocupada</Badge>;
  }
  return <Badge variant="warning">Reservada</Badge>;
};

export const OrderStatusBadge: React.FC<{ status: OrderStatus }> = ({ status }) => {
  const map: Record<OrderStatus, { label: string; variant: 'warning' | 'info' | 'success' | 'default' | 'danger' }> = {
    pending_confirmation: { label: 'Aguardando WhatsApp', variant: 'warning' },
    received: { label: 'Recebido', variant: 'warning' },
    preparing: { label: 'Em Preparo', variant: 'info' },
    ready: { label: 'Pronto p/ Entrega', variant: 'success' },
    delivered: { label: 'Entregue', variant: 'default' },
    cancelled: { label: 'Cancelado', variant: 'danger' },
  };

  const config = map[status] || { label: status, variant: 'default' };
  return <Badge variant={config.variant}>{config.label}</Badge>;
};

export const SectorBadge: React.FC<{ sector: ProductionSector }> = ({ sector }) => {
  const map: Record<ProductionSector, { label: string; icon: string; className: string }> = {
    churrasqueira: { label: 'Churrasqueira', icon: '🔥', className: 'text-orange-400 border-orange-800/70 bg-orange-950/60' },
    cozinha: { label: 'Cozinha', icon: '🍳', className: 'text-amber-400 border-amber-800/70 bg-amber-950/60' },
    bar: { label: 'Bar', icon: '🍺', className: 'text-cyan-400 border-cyan-800/70 bg-cyan-950/60' },
  };
  const config = map[sector];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium border ${config.className}`}>
      <span>{config.icon}</span>
      <span>{config.label}</span>
    </span>
  );
};

export const TabStatusBadge: React.FC<{ status: TabStatus }> = ({ status }) => {
  if (status === 'open') return <Badge variant="info">Aberta</Badge>;
  if (status === 'closing') return <Badge variant="warning">Aguardando Pagamento</Badge>;
  if (status === 'paid') return <Badge variant="success">Paga / Encerrada</Badge>;
  return <Badge variant="danger">Cancelada</Badge>;
};
