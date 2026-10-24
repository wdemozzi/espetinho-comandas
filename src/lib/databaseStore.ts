import {
  Establishment,
  Category,
  Product,
  RestaurantTable,
  Tab,
  Order,
  OrderItem,
  Payment,
  BillSplit,
  BillSplitParticipant,
  Profile,
  OrderStatus,
  PaymentMethod,
  SplitMode,
  ProductionSector,
} from '../types/database.types';
import { splitBillEqual, validateCustomSplit } from './currency';
import { soundService } from './sound';

// Initial Seed Data for CT Conveniência
const INITIAL_ESTABLISHMENT: Establishment = {
  id: 'a0000000-0000-0000-0000-000000000001',
  name: 'CT Conveniência',
  slug: 'ct-conveniencia',
  description: 'Conveniência completa, cervejas trincando, drinks, espetinhos nobres na brasa e porções.',
  phone: '(44) 99876-5432',
  address: 'Av. Paraná, 1250 - Centro',
  opening_hours: 'Todos os dias das 16h às 02h',
  logo_url: '/ct-logo.png',
  banner_url: '/ct-logo.png',
  is_active: true,
  created_at: new Date().toISOString(),
};

const INITIAL_PROFILES: Profile[] = [
  { id: 'u1', establishment_id: INITIAL_ESTABLISHMENT.id, full_name: 'Carlos Gerente', role: 'admin', phone: '(44) 99999-0001', pin_code: '9999', is_active: true, created_at: new Date().toISOString() },
  { id: 'u2', establishment_id: INITIAL_ESTABLISHMENT.id, full_name: 'Marcos (Garçom 1)', role: 'garcom', phone: '(44) 99999-0002', pin_code: '1111', is_active: true, created_at: new Date().toISOString() },
  { id: 'u2b', establishment_id: INITIAL_ESTABLISHMENT.id, full_name: 'Lucas (Garçom 2)', role: 'garcom', phone: '(44) 99999-0005', pin_code: '2222', is_active: true, created_at: new Date().toISOString() },
  { id: 'u2c', establishment_id: INITIAL_ESTABLISHMENT.id, full_name: 'Gabriel (Garçom 3)', role: 'garcom', phone: '(44) 99999-0006', pin_code: '3333', is_active: true, created_at: new Date().toISOString() },
  { id: 'u2d', establishment_id: INITIAL_ESTABLISHMENT.id, full_name: 'Juliana (Garçom 4)', role: 'garcom', phone: '(44) 99999-0007', pin_code: '4444', is_active: true, created_at: new Date().toISOString() },
  { id: 'u3', establishment_id: INITIAL_ESTABLISHMENT.id, full_name: 'Zé da Brasa (Churrasqueiro)', role: 'cozinha', phone: '(44) 99999-0003', pin_code: '5555', is_active: true, created_at: new Date().toISOString() },
  { id: 'u4', establishment_id: INITIAL_ESTABLISHMENT.id, full_name: 'Ana Caixa', role: 'caixa', phone: '(44) 99999-0004', pin_code: '6666', is_active: true, created_at: new Date().toISOString() },
];

const INITIAL_CATEGORIES: Category[] = [
  { id: 'b1', establishment_id: INITIAL_ESTABLISHMENT.id, name: 'Espetinhos na Brasa', slug: 'espetinhos', icon: 'Flame', sort_order: 1, default_sector: 'churrasqueira', is_active: true, created_at: new Date().toISOString() },
  { id: 'b2', establishment_id: INITIAL_ESTABLISHMENT.id, name: 'Acompanhamentos', slug: 'acompanhamentos', icon: 'Utensils', sort_order: 2, default_sector: 'cozinha', is_active: true, created_at: new Date().toISOString() },
  { id: 'b3', establishment_id: INITIAL_ESTABLISHMENT.id, name: 'Porções & Petiscos', slug: 'porcoes', icon: 'Soup', sort_order: 3, default_sector: 'cozinha', is_active: true, created_at: new Date().toISOString() },
  { id: 'b4', establishment_id: INITIAL_ESTABLISHMENT.id, name: 'Bebidas & Chopp', slug: 'bebidas', icon: 'Beer', sort_order: 4, default_sector: 'bar', is_active: true, created_at: new Date().toISOString() },
];

const INITIAL_PRODUCTS: Product[] = [
  {
    id: 'p1',
    establishment_id: INITIAL_ESTABLISHMENT.id,
    category_id: 'b1',
    name: 'Espetinho de Picanha Nobre',
    description: 'Corte nobre com capa de gordura perfeita, sal grosso e toque de manteiga de garrafa.',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&w=600&q=80',
    price_cents: 2200,
    cost_price_cents: 1100,
    sector: 'churrasqueira',
    is_available: true,
    allow_notes: true,
    created_at: new Date().toISOString(),
    addons: [
      { id: 'a1', product_id: 'p1', name: 'Ponto: Mal passada', price_cents: 0, is_available: true, sort_order: 1 },
      { id: 'a2', product_id: 'p1', name: 'Ponto: Ao ponto', price_cents: 0, is_available: true, sort_order: 2 },
      { id: 'a3', product_id: 'p1', name: 'Ponto: Bem passada', price_cents: 0, is_available: true, sort_order: 3 },
      { id: 'a4', product_id: 'p1', name: 'Molho Alho Especial (+R$ 3,00)', price_cents: 300, is_available: true, sort_order: 4 },
    ],
  },
  {
    id: 'p2',
    establishment_id: INITIAL_ESTABLISHMENT.id,
    category_id: 'b1',
    name: 'Espetinho de Alcatra Macia',
    description: 'Cubos macios de alcatra temperados no sal de parrilla e chimichurri artesanal.',
    image_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    price_cents: 1800,
    cost_price_cents: 900,
    sector: 'churrasqueira',
    is_available: true,
    allow_notes: true,
    created_at: new Date().toISOString(),
    addons: [
      { id: 'a5', product_id: 'p2', name: 'Ponto: Ao ponto', price_cents: 0, is_available: true, sort_order: 1 },
      { id: 'a6', product_id: 'p2', name: 'Chimichurri Extra (+R$ 3,00)', price_cents: 300, is_available: true, sort_order: 2 },
    ],
  },
  {
    id: 'p3',
    establishment_id: INITIAL_ESTABLISHMENT.id,
    category_id: 'b1',
    name: 'Espetinho de Queijo Coalho',
    description: 'Queijo coalho tostadinho por fora e cremoso por dentro, acompanha melaço de cana.',
    image_url: 'https://images.unsplash.com/photo-1529692236671-f1f6cf9683ba?auto=format&fit=crop&w=600&q=80',
    price_cents: 1400,
    cost_price_cents: 600,
    sector: 'churrasqueira',
    is_available: true,
    allow_notes: true,
    created_at: new Date().toISOString(),
    addons: [
      { id: 'a7', product_id: 'p3', name: 'Melaço de Cana Extra (+R$ 2,50)', price_cents: 250, is_available: true, sort_order: 1 },
      { id: 'a8', product_id: 'p3', name: 'Orégano Salpicado', price_cents: 0, is_available: true, sort_order: 2 },
    ],
  },
  {
    id: 'p4',
    establishment_id: INITIAL_ESTABLISHMENT.id,
    category_id: 'b1',
    name: 'Medalhão de Frango com Bacon',
    description: 'Peito de frango suculento envolvido em fatias crocantes de bacon defumado.',
    image_url: 'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=600&q=80',
    price_cents: 1600,
    cost_price_cents: 750,
    sector: 'churrasqueira',
    is_available: true,
    allow_notes: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p5',
    establishment_id: INITIAL_ESTABLISHMENT.id,
    category_id: 'b1',
    name: 'Kafta Recheada com Queijo',
    description: 'Carne moída temperada com hortelã fresca e recheio generoso de queijo muçarela derretido.',
    image_url: 'https://images.unsplash.com/photo-1529042410759-befb1204b468?auto=format&fit=crop&w=600&q=80',
    price_cents: 1700,
    cost_price_cents: 800,
    sector: 'churrasqueira',
    is_available: true,
    allow_notes: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p6',
    establishment_id: INITIAL_ESTABLISHMENT.id,
    category_id: 'b1',
    name: 'Pão de Alho Especial Recheado',
    description: 'Pãozinho crocante recheado com pasta de alho suave e queijo gratinado na brasa.',
    image_url: 'https://images.unsplash.com/photo-1573140401552-3fab0b24306f?auto=format&fit=crop&w=600&q=80',
    price_cents: 1200,
    cost_price_cents: 450,
    sector: 'churrasqueira',
    is_available: true,
    allow_notes: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p7',
    establishment_id: INITIAL_ESTABLISHMENT.id,
    category_id: 'b4',
    name: 'Cerveja Heineken 600ml',
    description: 'Garrafa 600ml trincando de gelada no balde.',
    image_url: 'https://images.unsplash.com/photo-1608270546103-9c4c7cc35930?auto=format&fit=crop&w=600&q=80',
    price_cents: 1700,
    cost_price_cents: 950,
    sector: 'bar',
    is_available: true,
    allow_notes: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p8',
    establishment_id: INITIAL_ESTABLISHMENT.id,
    category_id: 'b4',
    name: 'Coca-Cola Original 350ml',
    description: 'Lata gelada acompanhada de copo com gelo e fatia de limão.',
    image_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=600&q=80',
    price_cents: 700,
    cost_price_cents: 350,
    sector: 'bar',
    is_available: true,
    allow_notes: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p9',
    establishment_id: INITIAL_ESTABLISHMENT.id,
    category_id: 'b2',
    name: 'Mandioca Cozida na Manteiga',
    description: 'Mandioca amarela derretendo, regada com manteiga de garrafa e cheiro verde.',
    image_url: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=600&q=80',
    price_cents: 1500,
    cost_price_cents: 500,
    sector: 'cozinha',
    is_available: true,
    allow_notes: true,
    created_at: new Date().toISOString(),
  },
  {
    id: 'p10',
    establishment_id: INITIAL_ESTABLISHMENT.id,
    category_id: 'b3',
    name: 'Batata Rústica com Cheddar e Bacon',
    description: 'Batata com páprica, molho cheddar cremoso e cubos crocantes de bacon frito.',
    image_url: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&w=600&q=80',
    price_cents: 3800,
    cost_price_cents: 1600,
    sector: 'cozinha',
    is_available: true,
    allow_notes: true,
    created_at: new Date().toISOString(),
  },
];

const INITIAL_TABLES: RestaurantTable[] = [
  { id: 't1', establishment_id: INITIAL_ESTABLISHMENT.id, table_number: 1, label: 'Mesa 01', capacity: 4, qr_token: 'mesa-01-token', status: 'livre', is_active: true, created_at: new Date().toISOString() },
  { id: 't2', establishment_id: INITIAL_ESTABLISHMENT.id, table_number: 2, label: 'Mesa 02', capacity: 4, qr_token: 'mesa-02-token', status: 'livre', is_active: true, created_at: new Date().toISOString() },
  { id: 't3', establishment_id: INITIAL_ESTABLISHMENT.id, table_number: 3, label: 'Mesa 03', capacity: 6, qr_token: 'mesa-03-token', status: 'livre', is_active: true, created_at: new Date().toISOString() },
  { id: 't4', establishment_id: INITIAL_ESTABLISHMENT.id, table_number: 4, label: 'Mesa 04', capacity: 6, qr_token: 'mesa-04-token', status: 'livre', is_active: true, created_at: new Date().toISOString() },
  { id: 't5', establishment_id: INITIAL_ESTABLISHMENT.id, table_number: 5, label: 'Mesa 05', capacity: 2, qr_token: 'mesa-05-token', status: 'livre', is_active: true, created_at: new Date().toISOString() },
  { id: 't6', establishment_id: INITIAL_ESTABLISHMENT.id, table_number: 6, label: 'Mesa 06', capacity: 2, qr_token: 'mesa-06-token', status: 'livre', is_active: true, created_at: new Date().toISOString() },
  { id: 't7', establishment_id: INITIAL_ESTABLISHMENT.id, table_number: 7, label: 'Mesa 07', capacity: 8, qr_token: 'mesa-07-token', status: 'livre', is_active: true, created_at: new Date().toISOString() },
  { id: 't8', establishment_id: INITIAL_ESTABLISHMENT.id, table_number: 8, label: 'Mesa 08', capacity: 8, qr_token: 'mesa-08-token', status: 'livre', is_active: true, created_at: new Date().toISOString() },
  { id: 't9', establishment_id: INITIAL_ESTABLISHMENT.id, table_number: 9, label: 'Mesa 09 (Varanda)', capacity: 4, qr_token: 'mesa-09-token', status: 'livre', is_active: true, created_at: new Date().toISOString() },
  { id: 't10', establishment_id: INITIAL_ESTABLISHMENT.id, table_number: 10, label: 'Mesa 10 (Varanda)', capacity: 4, qr_token: 'mesa-10-token', status: 'livre', is_active: true, created_at: new Date().toISOString() },
];

type Listener = () => void;

class DatabaseStore {
  private establishment: Establishment = INITIAL_ESTABLISHMENT;
  private profiles: Profile[] = INITIAL_PROFILES;
  private categories: Category[] = INITIAL_CATEGORIES;
  private products: Product[] = INITIAL_PRODUCTS;
  private tables: RestaurantTable[] = INITIAL_TABLES;
  private tabs: Tab[] = [];
  private orders: Order[] = [];
  private payments: Payment[] = [];
  private splits: BillSplit[] = [];
  private listeners: Set<Listener> = new Set();
  private nextOrderNumber: number = 101;

  constructor() {
    this.seedInitialActiveTab();
  }

  // Pre-seed an active tab for demonstration of Kitchen and Cashier right away
  private seedInitialActiveTab() {
    const table = this.tables[2]; // Mesa 03 (Table 3)
    table.status = 'ocupada';

    const tabId = 'tab-demo-03';
    const orderId = 'order-demo-01';

    const orderItems: OrderItem[] = [
      {
        id: 'oi-1',
        order_id: orderId,
        product_id: 'p1',
        product_name: 'Espetinho de Picanha Nobre',
        unit_price_cents: 2200,
        quantity: 3,
        addons_snapshot: [{ name: 'Ponto: Ao ponto', price_cents: 0 }],
        addons_total_cents: 0,
        total_cents: 6600,
        notes: 'Caprichar na manteiga de garrafa',
        sector: 'churrasqueira',
        status: 'preparing',
        prepared_at: null,
        delivered_at: null,
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: 'oi-2',
        order_id: orderId,
        product_id: 'p3',
        product_name: 'Espetinho de Queijo Coalho',
        unit_price_cents: 1400,
        quantity: 2,
        addons_snapshot: [{ name: 'Melaço de Cana Extra (+R$ 2,50)', price_cents: 250 }],
        addons_total_cents: 250,
        total_cents: 3300,
        notes: 'Bem tostadinho',
        sector: 'churrasqueira',
        status: 'ready',
        prepared_at: new Date(Date.now() - 5 * 60000).toISOString(),
        delivered_at: null,
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: 'oi-3',
        order_id: orderId,
        product_id: 'p7',
        product_name: 'Cerveja Heineken 600ml',
        unit_price_cents: 1700,
        quantity: 4,
        addons_snapshot: [],
        addons_total_cents: 0,
        total_cents: 6800,
        notes: 'Copos gelados',
        sector: 'bar',
        status: 'delivered',
        prepared_at: new Date(Date.now() - 12 * 60000).toISOString(),
        delivered_at: new Date(Date.now() - 10 * 60000).toISOString(),
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      },
      {
        id: 'oi-4',
        order_id: orderId,
        product_id: 'p10',
        product_name: 'Batata Rústica com Cheddar e Bacon',
        unit_price_cents: 3800,
        quantity: 1,
        addons_snapshot: [],
        addons_total_cents: 0,
        total_cents: 3800,
        notes: null,
        sector: 'cozinha',
        status: 'received',
        prepared_at: null,
        delivered_at: null,
        created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      },
    ];

    const totalCents = 6600 + 3300 + 6800 + 3800; // 20500 cents (R$ 205,00)

    const order: Order = {
      id: orderId,
      establishment_id: this.establishment.id,
      order_number: 100,
      origin: 'waiter',
      order_type: 'dine_in',
      status: 'preparing',
      created_by: 'u2', // Marcos Garçom
      customer_name: 'Família Souza',
      customer_phone: '(44) 98888-7777',
      delivery_address: null,
      general_notes: 'Primeira rodada da mesa',
      total_cents: totalCents,
      created_at: new Date(Date.now() - 15 * 60000).toISOString(),
      items: orderItems,
      table_number: 3,
    };

    const tab: Tab = {
      id: tabId,
      establishment_id: this.establishment.id,
      table_id: table.id,
      opened_by: 'u2',
      closed_by: null,
      customer_name: 'Família Souza (6 pessoas)',
      customer_phone: '(44) 98888-7777',
      notes: 'Comemorando aniversário',
      status: 'open',
      total_cents: totalCents,
      discount_cents: 0,
      paid_cents: 0,
      opened_at: new Date(Date.now() - 25 * 60000).toISOString(),
      closed_at: null,
      created_at: new Date(Date.now() - 25 * 60000).toISOString(),
      orders: [order],
      payments: [],
      splits: [],
    };

    this.orders.push(order);
    this.tabs.push(tab);
    table.active_tab = tab;
  }

  public subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  // --- GETTERS ---
  public getEstablishment(): Establishment {
    return this.establishment;
  }

  public getProfiles(): Profile[] {
    return [...this.profiles];
  }

  public getCategories(): Category[] {
    return [...this.categories].sort((a, b) => a.sort_order - b.sort_order);
  }

  public getProducts(): Product[] {
    return [...this.products];
  }

  public getTables(): RestaurantTable[] {
    return this.tables.map((table) => {
      const active_tab = this.tabs.find((t) => t.table_id === table.id && t.status === 'open');
      return {
        ...table,
        active_tab,
      };
    });
  }

  public getTableById(id: string): RestaurantTable | undefined {
    return this.getTables().find((t) => t.id === id);
  }

  public getTableByQrToken(token: string): RestaurantTable | undefined {
    return this.getTables().find((t) => t.qr_token === token);
  }

  public getTabs(): Tab[] {
    return this.tabs.map((tab) => {
      const table = this.tables.find((tbl) => tbl.id === tab.table_id);
      const tabOrders = this.orders.filter((ord) => ord.items.some((item) => {
        // Match orders associated with tab
        return this.orders.some(o => o.id === ord.id);
      }) && (tab.orders?.some(to => to.id === ord.id) ?? false));
      const tabPayments = this.payments.filter((p) => p.tab_id === tab.id);
      const tabSplits = this.splits.filter((s) => s.tab_id === tab.id);

      return {
        ...tab,
        table,
        orders: tabOrders.length > 0 ? tabOrders : tab.orders || [],
        payments: tabPayments,
        splits: tabSplits,
      };
    });
  }

  public getTabById(id: string): Tab | undefined {
    return this.getTabs().find((t) => t.id === id);
  }

  public getOrders(): Order[] {
    return [...this.orders].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  public getOrderById(id: string): Order | undefined {
    return this.orders.find((o) => o.id === id);
  }

  // --- ACTIONS: PRODUCTS & TABLES ---
  public toggleProductAvailability(productId: string) {
    const prod = this.products.find((p) => p.id === productId);
    if (prod) {
      prod.is_available = !prod.is_available;
      this.notify();
    }
  }

  public saveProduct(productData: Partial<Product>) {
    if (productData.id) {
      const idx = this.products.findIndex((p) => p.id === productData.id);
      if (idx !== -1) {
        this.products[idx] = { ...this.products[idx], ...productData };
      }
    } else {
      const newProduct: Product = {
        id: `p-${Date.now()}`,
        establishment_id: this.establishment.id,
        category_id: productData.category_id || this.categories[0].id,
        name: productData.name || 'Novo Produto',
        description: productData.description || null,
        image_url: productData.image_url || null,
        price_cents: productData.price_cents || 0,
        cost_price_cents: productData.cost_price_cents || 0,
        sector: productData.sector || 'churrasqueira',
        is_available: true,
        allow_notes: true,
        created_at: new Date().toISOString(),
        addons: productData.addons || [],
      };
      this.products.unshift(newProduct);
    }
    this.notify();
  }

  public saveTable(tableData: Partial<RestaurantTable>) {
    if (tableData.id) {
      const idx = this.tables.findIndex((t) => t.id === tableData.id);
      if (idx !== -1) {
        this.tables[idx] = { ...this.tables[idx], ...tableData };
      }
    } else {
      const nextNum = Math.max(...this.tables.map((t) => t.table_number), 0) + 1;
      const newTable: RestaurantTable = {
        id: `t-${Date.now()}`,
        establishment_id: this.establishment.id,
        table_number: nextNum,
        label: tableData.label || `Mesa ${String(nextNum).padStart(2, '0')}`,
        capacity: tableData.capacity || 4,
        qr_token: `mesa-${nextNum}-${Math.random().toString(36).substring(2, 8)}`,
        status: 'livre',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      this.tables.push(newTable);
    }
    this.notify();
  }

  public saveProfile(profileData: Partial<Profile>) {
    if (profileData.id) {
      const idx = this.profiles.findIndex((p) => p.id === profileData.id);
      if (idx !== -1) {
        this.profiles[idx] = { ...this.profiles[idx], ...profileData };
      }
    } else {
      const newProfile: Profile = {
        id: `u-${Date.now()}`,
        establishment_id: this.establishment.id,
        full_name: profileData.full_name || 'Novo Funcionário',
        role: profileData.role || 'garcom',
        phone: profileData.phone || null,
        pin_code: profileData.pin_code || '1234',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      this.profiles.push(newProfile);
    }
    this.notify();
  }

  // --- ACTIONS: TABS (COMANDAS) ---
  /**
   * Opens a new tab for a table.
   * Strictly enforces: Only one active open tab per table at any time.
   */
  public openTab(params: {
    table_id: string;
    opened_by_user_id: string;
    customer_name?: string;
    customer_phone?: string;
    notes?: string;
  }): Tab {
    const table = this.tables.find((t) => t.id === params.table_id);
    if (!table) throw new Error('Mesa não encontrada');

    // Rule 5: Impedir duas comandas ativas para a mesma mesa
    const existingOpenTab = this.tabs.find(
      (t) => t.table_id === params.table_id && t.status === 'open'
    );
    if (existingOpenTab) {
      throw new Error(`A ${table.label} já possui uma comanda aberta ativa.`);
    }

    const newTab: Tab = {
      id: `tab-${Date.now()}`,
      establishment_id: this.establishment.id,
      table_id: table.id,
      opened_by: params.opened_by_user_id,
      closed_by: null,
      customer_name: params.customer_name || null,
      customer_phone: params.customer_phone || null,
      notes: params.notes || null,
      status: 'open',
      total_cents: 0,
      discount_cents: 0,
      paid_cents: 0,
      opened_at: new Date().toISOString(),
      closed_at: null,
      created_at: new Date().toISOString(),
      orders: [],
      payments: [],
      splits: [],
    };

    this.tabs.unshift(newTab);
    table.status = 'ocupada';
    table.active_tab = newTab;

    this.notify();
    return newTab;
  }

  // --- ACTIONS: ORDERS ---
  /**
   * Places an order round.
   * If associated with an open tab, automatically links and recalculates tab total.
   */
  public createOrder(params: {
    tab_id?: string;
    origin: 'waiter' | 'table_qr' | 'external_catalog';
    order_type: 'dine_in' | 'takeout' | 'delivery';
    created_by?: string;
    customer_name?: string;
    customer_phone?: string;
    delivery_address?: string;
    general_notes?: string;
    items: {
      product_id: string;
      quantity: number;
      addons: { name: string; price_cents: number }[];
      notes?: string;
    }[];
  }): Order {
    if (!params.items || params.items.length === 0) {
      throw new Error('O pedido deve conter pelo menos 1 item');
    }

    const orderId = `order-${Date.now()}`;
    const orderNumber = this.nextOrderNumber++;
    let orderTotalCents = 0;

    const orderItems: OrderItem[] = params.items.map((it, idx) => {
      const product = this.products.find((p) => p.id === it.product_id);
      if (!product) throw new Error(`Produto não encontrado (ID: ${it.product_id})`);
      if (!product.is_available) throw new Error(`O item "${product.name}" não está disponível no momento`);

      const unitPriceCents = product.price_cents;
      const addonsTotalCents = it.addons.reduce((acc, a) => acc + a.price_cents, 0);
      const itemTotalCents = (unitPriceCents + addonsTotalCents) * it.quantity;

      orderTotalCents += itemTotalCents;

      return {
        id: `oi-${orderId}-${idx}`,
        order_id: orderId,
        product_id: product.id,
        // Immutable price snapshot
        product_name: product.name,
        unit_price_cents: unitPriceCents,
        quantity: it.quantity,
        addons_snapshot: it.addons,
        addons_total_cents: addonsTotalCents,
        total_cents: itemTotalCents,
        notes: it.notes || null,
        sector: product.sector,
        status: 'received',
        prepared_at: null,
        delivered_at: null,
        created_at: new Date().toISOString(),
      };
    });

    let tableNumber: number | undefined;
    if (params.tab_id) {
      const tab = this.tabs.find((t) => t.id === params.tab_id);
      if (tab?.table_id) {
        const table = this.tables.find((tbl) => tbl.id === tab.table_id);
        tableNumber = table?.table_number;
      }
    }

    const newOrder: Order = {
      id: orderId,
      establishment_id: this.establishment.id,
      order_number: orderNumber,
      origin: params.origin,
      order_type: params.order_type,
      status: 'received',
      created_by: params.created_by || null,
      customer_name: params.customer_name || null,
      customer_phone: params.customer_phone || null,
      delivery_address: params.delivery_address || null,
      general_notes: params.general_notes || null,
      total_cents: orderTotalCents,
      created_at: new Date().toISOString(),
      items: orderItems,
      table_number: tableNumber,
    };

    this.orders.unshift(newOrder);

    // If linked to tab, update Tab total atomically
    if (params.tab_id) {
      const tab = this.tabs.find((t) => t.id === params.tab_id);
      if (tab) {
        if (!tab.orders) tab.orders = [];
        tab.orders.push(newOrder);
        tab.total_cents += orderTotalCents;
      }
    }

    soundService.playSuccessDing();
    this.notify();
    return newOrder;
  }

  // --- ACTIONS: KITCHEN & KDS ITEM STATUS ---
  public updateOrderItemStatus(itemId: string, newStatus: OrderStatus) {
    for (const order of this.orders) {
      const item = order.items.find((i) => i.id === itemId);
      if (item) {
        item.status = newStatus;
        if (newStatus === 'ready') {
          item.prepared_at = new Date().toISOString();
          soundService.playOrderReady();
        } else if (newStatus === 'delivered') {
          item.delivered_at = new Date().toISOString();
        }

        // Update overall order status
        const allDelivered = order.items.every((i) => i.status === 'delivered');
        const anyReady = order.items.some((i) => i.status === 'ready');
        const anyPreparing = order.items.some((i) => i.status === 'preparing');

        if (allDelivered) {
          order.status = 'delivered';
        } else if (anyReady) {
          order.status = 'ready';
        } else if (anyPreparing) {
          order.status = 'preparing';
        }

        this.notify();
        return;
      }
    }
  }

  public updateEntireOrderStatus(orderId: string, newStatus: OrderStatus, sector?: ProductionSector | 'all') {
    const order = this.orders.find((o) => o.id === orderId);
    if (!order) return;

    for (const item of order.items) {
      if (!sector || sector === 'all' || item.sector === sector) {
        item.status = newStatus;
        if (newStatus === 'ready') item.prepared_at = new Date().toISOString();
        if (newStatus === 'delivered') item.delivered_at = new Date().toISOString();
      }
    }

    if (newStatus === 'ready') {
      soundService.playOrderReady();
    } else if (newStatus === 'preparing' || newStatus === 'delivered') {
      soundService.playSuccessDing();
    }

    const allDelivered = order.items.every((i) => i.status === 'delivered');
    const allReady = order.items.every((i) => i.status === 'ready' || i.status === 'delivered');
    const anyPreparing = order.items.some((i) => i.status === 'preparing');

    if (allDelivered) order.status = 'delivered';
    else if (allReady) order.status = 'ready';
    else if (anyPreparing) order.status = 'preparing';
    else order.status = newStatus;

    this.notify();
  }

  // --- ACTIONS: BILL SPLITS (DIVIDIR CONTA) ---
  public createBillSplit(params: {
    tab_id: string;
    created_by: string;
    mode: SplitMode;
    num_people: number;
    customParticipants?: { name: string; assigned_cents: number }[];
  }): BillSplit {
    const tab = this.tabs.find((t) => t.id === params.tab_id);
    if (!tab) throw new Error('Comanda não encontrada');

    const totalCents = Math.max(0, tab.total_cents - tab.discount_cents);

    let splitParticipants: BillSplitParticipant[] = [];

    if (params.mode === 'equal') {
      const equalParts = splitBillEqual(totalCents, params.num_people);
      splitParticipants = equalParts.map((p) => ({
        id: `part-${Date.now()}-${p.participantIndex}`,
        split_id: `split-${Date.now()}`,
        participant_index: p.participantIndex,
        name: p.name,
        assigned_cents: p.assignedCents,
        paid_cents: 0,
        status: 'pending',
        created_at: new Date().toISOString(),
      }));
    } else {
      // Mode B: Custom values
      if (!params.customParticipants || params.customParticipants.length !== params.num_people) {
        throw new Error('Configuração de participantes personalizada inválida');
      }
      const validation = validateCustomSplit(
        totalCents,
        params.customParticipants.map((cp, idx) => ({ participantIndex: idx + 1, assignedCents: cp.assigned_cents }))
      );
      if (!validation.isValid) {
        throw new Error(validation.message);
      }
      splitParticipants = params.customParticipants.map((cp, idx) => ({
        id: `part-${Date.now()}-${idx + 1}`,
        split_id: `split-${Date.now()}`,
        participant_index: idx + 1,
        name: cp.name || `Pessoa ${idx + 1}`,
        assigned_cents: cp.assigned_cents,
        paid_cents: 0,
        status: 'pending',
        created_at: new Date().toISOString(),
      }));
    }

    const splitId = `split-${Date.now()}`;
    splitParticipants.forEach((p) => (p.split_id = splitId));

    const newSplit: BillSplit = {
      id: splitId,
      tab_id: tab.id,
      created_by: params.created_by,
      mode: params.mode,
      num_people: params.num_people,
      total_cents: totalCents,
      status: 'in_progress',
      created_at: new Date().toISOString(),
      participants: splitParticipants,
    };

    // Replace or add
    this.splits = this.splits.filter((s) => s.tab_id !== tab.id);
    this.splits.push(newSplit);

    this.notify();
    return newSplit;
  }

  // --- ACTIONS: PAYMENTS & CLOSING ---
  /**
   * Processes a payment atomically with penny safety and anti-overpayment check.
   */
  public recordPayment(params: {
    tab_id: string;
    amount_cents: number;
    method: PaymentMethod;
    recorded_by: string;
    split_participant_id?: string;
    notes?: string;
  }): Payment {
    const tab = this.tabs.find((t) => t.id === params.tab_id);
    if (!tab) throw new Error('Comanda não encontrada');
    if (tab.status === 'paid' || tab.status === 'cancelled') {
      throw new Error('Esta comanda já está finalizada');
    }

    const remainingDue = (tab.total_cents - tab.discount_cents) - tab.paid_cents;
    if (params.amount_cents <= 0) {
      throw new Error('O valor do pagamento deve ser maior que R$ 0,00');
    }
    if (params.amount_cents > remainingDue) {
      throw new Error(
        `O pagamento de R$ ${(params.amount_cents / 100).toFixed(2)} excede o saldo pendente de R$ ${(remainingDue / 100).toFixed(2)}`
      );
    }

    let participantName: string | undefined;

    // If attached to a split participant
    if (params.split_participant_id) {
      for (const split of this.splits) {
        const part = split.participants.find((p) => p.id === params.split_participant_id);
        if (part) {
          const partRemaining = part.assigned_cents - part.paid_cents;
          if (params.amount_cents > partRemaining) {
            throw new Error(`O pagamento excede o saldo devido por ${part.name}`);
          }
          part.paid_cents += params.amount_cents;
          if (part.paid_cents >= part.assigned_cents) {
            part.status = 'paid';
          } else {
            part.status = 'partial';
          }
          participantName = part.name;
          break;
        }
      }
    }

    const recordedProfile = this.profiles.find((p) => p.id === params.recorded_by);

    const payment: Payment = {
      id: `pay-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      tab_id: tab.id,
      split_participant_id: params.split_participant_id || null,
      recorded_by: params.recorded_by,
      amount_cents: params.amount_cents,
      method: params.method,
      notes: params.notes || null,
      created_at: new Date().toISOString(),
      recorded_by_name: recordedProfile?.full_name || 'Operador',
      participant_name: participantName,
    };

    this.payments.push(payment);
    tab.paid_cents += params.amount_cents;

    if (tab.paid_cents >= (tab.total_cents - tab.discount_cents)) {
      tab.status = 'closing';
    }

    soundService.playSuccessDing();
    this.notify();
    return payment;
  }

  /**
   * Closes a tab, validates zero pending balance, and frees the table.
   */
  public closeTab(tabId: string, closedByUserId: string): Tab {
    const tab = this.tabs.find((t) => t.id === tabId);
    if (!tab) throw new Error('Comanda não encontrada');

    const pending = (tab.total_cents - tab.discount_cents) - tab.paid_cents;
    if (pending > 0) {
      throw new Error(`Não é possível encerrar: saldo pendente de R$ ${(pending / 100).toFixed(2)}`);
    }

    tab.status = 'paid';
    tab.closed_at = new Date().toISOString();
    tab.closed_by = closedByUserId;

    // Free table
    if (tab.table_id) {
      const table = this.tables.find((t) => t.id === tab.table_id);
      if (table) {
        table.status = 'livre';
        table.active_tab = undefined;
      }
    }

    soundService.playSuccessDing();
    this.notify();
    return tab;
  }
}

export const db = new DatabaseStore();
