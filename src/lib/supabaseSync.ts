import { getSupabaseClient, isSupabaseConfigured, getSupabaseDiagnostics } from './supabaseClient';
import { Order, Tab, Profile, Product, OrderStatus } from '../types/database.types';
import { soundService } from './sound';

type SyncCallback = {
  onRemoteOrderCreated: (order: Order, tab?: Tab) => void;
  onRemoteItemStatusUpdated: (itemId: string, newStatus: OrderStatus) => void;
  onRemoteProfilesUpdated: (profiles: Profile[]) => void;
  onRemoteTabUpdated: (tab: Tab) => void;
  onFullSyncReceived: (data: {
    orders?: Order[];
    tabs?: Tab[];
    profiles?: Profile[];
    products?: Product[];
  }) => void;
};

export interface SyncStatus {
  isConfigured: boolean;
  isConnected: boolean;
  tableExists: boolean | null;
  lastError: string | null;
  lastSyncedAt: string | null;
  keySource: string;
}

class SupabaseSyncService {
  private channel: ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null = null;
  private callbacks: SyncCallback | null = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;
  private tableExists: boolean | null = null;
  private lastError: string | null = null;
  private lastSyncedAt: string | null = null;
  private pullInterval: ReturnType<typeof setInterval> | null = null;

  public init(callbacks: SyncCallback) {
    this.callbacks = callbacks;
    this.reconnect();

    // Start background polling (every 6s) as reliable fallback
    if (typeof window !== 'undefined' && !this.pullInterval) {
      this.pullInterval = setInterval(() => {
        if (this.isConnected || isSupabaseConfigured()) {
          this.pullInitialStateFromCloud();
        }
      }, 6000);
    }
  }

  public reconnect() {
    if (!isSupabaseConfigured()) {
      this.isConnected = false;
      this.lastError = 'Chave Anon do Supabase não configurada no projeto.';
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      this.isConnected = false;
      this.lastError = 'Não foi possível inicializar cliente Supabase.';
      return;
    }

    if (this.isConnecting) return;
    this.isConnecting = true;

    try {
      if (this.channel) {
        client.removeChannel(this.channel);
        this.channel = null;
      }

      // 1. Establish Realtime Broadcast Channel
      this.channel = client.channel('ct_conveniencia_realtime', {
        config: {
          broadcast: { self: false },
        },
      });

      this.channel
        .on('broadcast', { event: 'order_created' }, (payload) => {
          if (payload?.payload?.order) {
            this.callbacks?.onRemoteOrderCreated(
              payload.payload.order,
              payload.payload.tab
            );
            soundService.playSuccessDing();
            this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
          }
        })
        .on('broadcast', { event: 'item_status_updated' }, (payload) => {
          if (payload?.payload?.itemId && payload?.payload?.newStatus) {
            this.callbacks?.onRemoteItemStatusUpdated(
              payload.payload.itemId,
              payload.payload.newStatus
            );
            if (payload.payload.newStatus === 'ready') {
              soundService.playOrderReady();
            }
            this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
          }
        })
        .on('broadcast', { event: 'profiles_updated' }, (payload) => {
          if (payload?.payload?.profiles) {
            this.callbacks?.onRemoteProfilesUpdated(payload.payload.profiles);
            this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
          }
        })
        .on('broadcast', { event: 'tab_updated' }, (payload) => {
          if (payload?.payload?.tab) {
            this.callbacks?.onRemoteTabUpdated(payload.payload.tab);
            this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
          }
        })
        // 2. Also listen for postgres_changes if ct_cloud_sync table exists
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'ct_cloud_sync' },
          (payload) => {
            const row = payload.new as { id?: string; data?: unknown };
            if (!row || !row.id || !row.data) return;

            if (row.id === 'orders' && Array.isArray(row.data)) {
              this.callbacks?.onFullSyncReceived({ orders: row.data as Order[] });
            } else if (row.id === 'tabs' && Array.isArray(row.data)) {
              this.callbacks?.onFullSyncReceived({ tabs: row.data as Tab[] });
            } else if (row.id === 'profiles' && Array.isArray(row.data)) {
              this.callbacks?.onRemoteProfilesUpdated(row.data as Profile[]);
            } else if (row.id === 'products' && Array.isArray(row.data)) {
              this.callbacks?.onFullSyncReceived({ products: row.data as Product[] });
            }
            this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
          }
        )
        .subscribe((status) => {
          this.isConnecting = false;
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.lastError = null;
            this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
            // Pull initial state from Cloud if table exists
            this.pullInitialStateFromCloud();
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.isConnected = false;
            this.lastError = `Status do canal: ${status}`;
          }
        });
    } catch (err: unknown) {
      this.isConnecting = false;
      this.isConnected = false;
      this.lastError = (err as Error).message || 'Erro ao conectar canal Realtime.';
    }
  }

  public getStatus(): SyncStatus {
    const diag = getSupabaseDiagnostics();
    return {
      isConfigured: isSupabaseConfigured(),
      isConnected: this.isConnected,
      tableExists: this.tableExists,
      lastError: this.lastError,
      lastSyncedAt: this.lastSyncedAt,
      keySource: diag.source,
    };
  }

  // --- BROADCAST EMITTERS ---
  public broadcastOrder(order: Order, tab?: Tab) {
    if (!this.channel) return;
    try {
      this.channel.send({
        type: 'broadcast',
        event: 'order_created',
        payload: { order, tab },
      });
      this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
    } catch {
      // Ignore network errors in broadcast
    }
  }

  public broadcastItemStatus(itemId: string, newStatus: OrderStatus) {
    if (!this.channel) return;
    try {
      this.channel.send({
        type: 'broadcast',
        event: 'item_status_updated',
        payload: { itemId, newStatus },
      });
      this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
    } catch {
      // Ignore network errors
    }
  }

  public broadcastProfiles(profiles: Profile[]) {
    if (!this.channel) return;
    try {
      this.channel.send({
        type: 'broadcast',
        event: 'profiles_updated',
        payload: { profiles },
      });
    } catch {
      // Ignore network errors
    }
  }

  public broadcastTab(tab: Tab) {
    if (!this.channel) return;
    try {
      this.channel.send({
        type: 'broadcast',
        event: 'tab_updated',
        payload: { tab },
      });
    } catch {
      // Ignore network errors
    }
  }

  // --- CLOUD PERSISTENCE VIA ct_cloud_sync TABLE ---
  public async saveToCloud(id: 'orders' | 'tabs' | 'profiles' | 'products', data: unknown) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      let finalData = data;

      // If saving array of orders or tabs, merge with existing cloud records to prevent a new mobile client from overwriting computer orders
      if (Array.isArray(data)) {
        try {
          const { data: remoteRow } = await client
            .from('ct_cloud_sync')
            .select('data')
            .eq('id', id)
            .maybeSingle();

          if (remoteRow && Array.isArray(remoteRow.data)) {
            const map = new Map<string, any>();
            for (const item of remoteRow.data) {
              if (item && item.id) map.set(item.id, item);
            }
            for (const item of data) {
              if (item && item.id) map.set(item.id, item);
            }
            finalData = Array.from(map.values());
          }
        } catch {
          // Fallback to sending data directly if read fails
        }
      }

      const { error } = await client.from('ct_cloud_sync').upsert(
        {
          id,
          data: finalData,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );

      if (error) {
        if (error.code === '42P01') {
          this.tableExists = false;
          this.lastError = 'Tabela public.ct_cloud_sync não encontrada no Supabase.';
        } else {
          this.lastError = error.message;
        }
      } else {
        this.tableExists = true;
        this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
      }
    } catch (err: unknown) {
      this.lastError = (err as Error).message;
    }
  }

  public async pullInitialStateFromCloud() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { data, error } = await client
        .from('ct_cloud_sync')
        .select('id, data');

      if (error) {
        if (error.code === '42P01') {
          this.tableExists = false;
        } else {
          this.lastError = error.message;
        }
        return;
      }

      this.tableExists = true;
      if (!data || data.length === 0) return;

      const fullData: {
        orders?: Order[];
        tabs?: Tab[];
        profiles?: Profile[];
        products?: Product[];
      } = {};

      for (const row of data) {
        if (row.id === 'orders' && Array.isArray(row.data)) {
          fullData.orders = row.data as Order[];
        } else if (row.id === 'tabs' && Array.isArray(row.data)) {
          fullData.tabs = row.data as Tab[];
        } else if (row.id === 'profiles' && Array.isArray(row.data)) {
          fullData.profiles = row.data as Profile[];
        } else if (row.id === 'products' && Array.isArray(row.data)) {
          fullData.products = row.data as Product[];
        }
      }

      if (Object.keys(fullData).length > 0) {
        this.callbacks?.onFullSyncReceived(fullData);
        this.lastSyncedAt = new Date().toLocaleTimeString('pt-BR');
      }
    } catch {
      // Table may not exist yet
    }
  }
}

export const supabaseSync = new SupabaseSyncService();
