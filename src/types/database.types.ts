export type UserRole = 'admin' | 'garcom' | 'cozinha' | 'caixa';
export type ProductionSector = 'churrasqueira' | 'cozinha' | 'bar';
export type TableStatus = 'livre' | 'ocupada' | 'reservada';
export type TabStatus = 'open' | 'closing' | 'paid' | 'cancelled';
export type OrderOrigin = 'waiter' | 'table_qr' | 'external_catalog';
export type OrderType = 'dine_in' | 'takeout' | 'delivery';
export type OrderStatus = 'pending_confirmation' | 'received' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
export type SplitMode = 'equal' | 'custom';
export type SplitStatus = 'in_progress' | 'completed' | 'cancelled';
export type ParticipantPaymentStatus = 'pending' | 'partial' | 'paid';
export type PaymentMethod = 'cash' | 'pix' | 'credit_card' | 'debit_card';

export interface Establishment {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  address: string | null;
  opening_hours: string | null;
  logo_url: string | null;
  banner_url: string | null;
  is_active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  establishment_id: string;
  full_name: string;
  role: UserRole;
  phone: string | null;
  pin_code: string;
  is_active: boolean;
  created_at: string;
}

export interface Category {
  id: string;
  establishment_id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  default_sector: ProductionSector;
  is_active: boolean;
  created_at: string;
}

export interface ProductAddon {
  id: string;
  product_id: string;
  name: string;
  price_cents: number;
  is_available: boolean;
  sort_order: number;
}

export interface Product {
  id: string;
  establishment_id: string;
  category_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price_cents: number;
  cost_price_cents: number;
  sector: ProductionSector;
  is_available: boolean;
  allow_notes: boolean;
  created_at: string;
  addons?: ProductAddon[];
  stock_quantity?: number;
  track_stock?: boolean;
  min_stock_alert?: number;
}

export interface RestaurantTable {
  id: string;
  establishment_id: string;
  table_number: number;
  label: string;
  capacity: number;
  qr_token: string;
  status: TableStatus;
  is_active: boolean;
  created_at: string;
  active_tab?: Tab;
}

export interface Tab {
  id: string;
  establishment_id: string;
  table_id: string | null;
  opened_by: string | null;
  closed_by: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  notes: string | null;
  status: TabStatus;
  total_cents: number;
  discount_cents: number;
  paid_cents: number;
  opened_at: string;
  closed_at: string | null;
  created_at: string;
  table?: RestaurantTable;
  orders?: Order[];
  payments?: Payment[];
  splits?: BillSplit[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  unit_price_cents: number;
  quantity: number;
  addons_snapshot: { name: string; price_cents: number }[];
  addons_total_cents: number;
  total_cents: number;
  notes: string | null;
  sector: ProductionSector;
  status: OrderStatus;
  prepared_at: string | null;
  delivered_at: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  establishment_id: string;
  order_number: number;
  origin: OrderOrigin;
  order_type: OrderType;
  status: OrderStatus;
  created_by: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  delivery_address: string | null;
  general_notes: string | null;
  total_cents: number;
  created_at: string;
  items: OrderItem[];
  table_number?: number;
}

export interface BillSplit {
  id: string;
  tab_id: string;
  created_by: string | null;
  mode: SplitMode;
  num_people: number;
  total_cents: number;
  status: SplitStatus;
  created_at: string;
  participants: BillSplitParticipant[];
}

export interface BillSplitParticipant {
  id: string;
  split_id: string;
  participant_index: number;
  name: string;
  assigned_cents: number;
  paid_cents: number;
  status: ParticipantPaymentStatus;
  created_at: string;
}

export interface Payment {
  id: string;
  tab_id: string;
  split_participant_id: string | null;
  recorded_by: string | null;
  amount_cents: number;
  method: PaymentMethod;
  notes: string | null;
  created_at: string;
  recorded_by_name?: string;
  participant_name?: string;
}

export interface CustomerLead {
  phone: string;
  name: string;
  orders_count: number;
  total_spent_cents: number;
  first_order_at: string;
  last_order_at: string;
  primary_channel: 'balcao' | 'mesa' | 'ambos';
  order_history: { order_number: number; date: string; total_cents: number; type: string }[];
}
