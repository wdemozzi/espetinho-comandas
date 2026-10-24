import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';
import { Order, Tab, Profile, OrderStatus } from '../types/database.types';
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
  }) => void;
};

class SupabaseSyncService {
  private channel: ReturnType<NonNullable<ReturnType<typeof getSupabaseClient>>['channel']> | null = null;
  private callbacks: SyncCallback | null = null;
  private isConnecting: boolean = false;
  private isConnected: boolean = false;

  public init(callbacks: SyncCallback) {
    this.callbacks = callbacks;
    this.reconnect();
  }

  public reconnect() {
    if (!isSupabaseConfigured()) {
      this.isConnected = false;
      return;
    }

    const client = getSupabaseClient();
    if (!client) {
      this.isConnected = false;
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
      // Works even without creating tables in Supabase!
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
          }
        })
        .on('broadcast', { event: 'item_status_updated' }, (payload) => {
          if (payload?.payload?.itemId && payload?.payload?.newStatus) {
            this.callbacks?.onRemoteItemStatusUpdated(
              payload.payload.itemId,
              payload.payload.newStatus
            );
          }
        })
        .on('broadcast', { event: 'profiles_updated' }, (payload) => {
          if (payload?.payload?.profiles) {
            this.callbacks?.onRemoteProfilesUpdated(payload.payload.profiles);
          }
        })
        .on('broadcast', { event: 'tab_updated' }, (payload) => {
          if (payload?.payload?.tab) {
            this.callbacks?.onRemoteTabUpdated(payload.payload.tab);
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
            }
          }
        )
        .subscribe((status) => {
          this.isConnecting = false;
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            // Pull initial state from Cloud if table exists
            this.pullInitialStateFromCloud();
          } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
            this.isConnected = false;
          }
        });
    } catch {
      this.isConnecting = false;
      this.isConnected = false;
    }
  }

  public getStatus(): { isConfigured: boolean; isConnected: boolean } {
    return {
      isConfigured: isSupabaseConfigured(),
      isConnected: this.isConnected,
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
  public async saveToCloud(id: 'orders' | 'tabs' | 'profiles', data: unknown) {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      await client.from('ct_cloud_sync').upsert(
        {
          id,
          data,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'id' }
      );
    } catch {
      // ct_cloud_sync table might not exist yet; Realtime Broadcast handles it
    }
  }

  public async pullInitialStateFromCloud() {
    const client = getSupabaseClient();
    if (!client) return;

    try {
      const { data, error } = await client
        .from('ct_cloud_sync')
        .select('id, data');

      if (error || !data) return;

      const fullData: {
        orders?: Order[];
        tabs?: Tab[];
        profiles?: Profile[];
      } = {};

      for (const row of data) {
        if (row.id === 'orders' && Array.isArray(row.data)) {
          fullData.orders = row.data as Order[];
        } else if (row.id === 'tabs' && Array.isArray(row.data)) {
          fullData.tabs = row.data as Tab[];
        } else if (row.id === 'profiles' && Array.isArray(row.data)) {
          fullData.profiles = row.data as Profile[];
        }
      }

      if (Object.keys(fullData).length > 0) {
        this.callbacks?.onFullSyncReceived(fullData);
      }
    } catch {
      // Table may not exist yet
    }
  }
}

export const supabaseSync = new SupabaseSyncService();
