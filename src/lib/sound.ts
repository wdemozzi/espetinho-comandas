/**
 * Serviço de Áudio, Vibração e Notificações para Garçons e Cozinha.
 * Desenvolvido para funcionar em dispositivos móveis sem bloqueio de autoplay.
 */

export interface OrderReadyAlertData {
  orderId?: string;
  orderNumber?: number;
  tableNumber?: number;
  customerName?: string | null;
  itemsSummary?: string;
}

class SoundService {
  private audioCtx: AudioContext | null = null;
  private isUnlocked: boolean = false;

  constructor() {
    this.setupAutoUnlock();
  }

  /**
   * Desbloqueia o AudioContext no primeiro toque/clique do usuário no celular.
   * Isso evita que o navegador móvel bloqueie alertas sonoros vindos do Realtime.
   */
  private setupAutoUnlock() {
    if (typeof window === 'undefined') return;

    const unlock = () => {
      this.unlockAudio();
      window.removeEventListener('touchstart', unlock);
      window.removeEventListener('touchend', unlock);
      window.removeEventListener('click', unlock);
      window.removeEventListener('pointerdown', unlock);
      window.removeEventListener('keydown', unlock);
    };

    window.addEventListener('touchstart', unlock, { passive: true });
    window.addEventListener('touchend', unlock, { passive: true });
    window.addEventListener('click', unlock, { passive: true });
    window.addEventListener('pointerdown', unlock, { passive: true });
    window.addEventListener('keydown', unlock, { passive: true });
  }

  public unlockAudio(): boolean {
    try {
      const ctx = this.getContext();
      if (!ctx) return false;

      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Toca um buffer silencioso de 1 milissegundo para o navegador registrar que o áudio foi ativado
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);

      this.isUnlocked = true;
      return true;
    } catch {
      return false;
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.audioCtx = new AudioCtx();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Alerta potente de PEDIDO PRONTO para garçons:
   * 1. Som de 3 notas ascendentes vibrantes (Chime de restaurante de alto volume)
   * 2. Vibração do celular (400ms vibra / 150ms pausa / 400ms vibra / 150ms pausa / 600ms vibra)
   * 3. Disparo de Notificação Nativa do Sistema se permitido
   */
  public playOrderReady(data?: OrderReadyAlertData) {
    // 1. Vibração do dispositivo móvel
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([400, 150, 400, 150, 600]);
      } catch {
        // Ignora se não suportado
      }
    }

    // 2. Notificação nativa do sistema
    if (typeof window !== 'undefined' && 'Notification' in window) {
      try {
        if (Notification.permission === 'granted') {
          const mesaStr = data?.tableNumber ? `Mesa ${String(data.tableNumber).padStart(2, '0')}` : 'Balcão';
          const numStr = data?.orderNumber ? `Pedido #${data.orderNumber}` : 'Pedido';
          new Notification(`🔔 ${mesaStr}: ${numStr} Pronto na Brasa!`, {
            body: data?.itemsSummary || 'Os espetinhos acabaram de sair quentinhos da brasa. Leve à mesa!',
            icon: '/ct-logo.png',
            badge: '/ct-logo.png',
            tag: `order-ready-${data?.orderId || Date.now()}`,
          });
        }
      } catch {
        // Ignora erro de notificação
      }
    }

    // 3. Som de alerta sintético potente (3 acordes harmoniosos em cascata)
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;

      // Nota 1: G4 (392.00 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(392.0, now);
      gain1.gain.setValueAtTime(0, now);
      gain1.gain.linearRampToValueAtTime(0.5, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.28);

      // Nota 2: C5 (523.25 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(523.25, now + 0.12);
      gain2.gain.setValueAtTime(0, now + 0.12);
      gain2.gain.linearRampToValueAtTime(0.6, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.42);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.42);

      // Nota 3: E5 (659.25 Hz)
      const osc3 = ctx.createOscillator();
      const gain3 = ctx.createGain();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(659.25, now + 0.24);
      gain3.gain.setValueAtTime(0, now + 0.24);
      gain3.gain.linearRampToValueAtTime(0.7, now + 0.28);
      gain3.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc3.connect(gain3);
      gain3.connect(ctx.destination);
      osc3.start(now + 0.24);
      osc3.stop(now + 0.7);

      // Nota 4: G5 aguda final (783.99 Hz) para destaque no ambiente
      const osc4 = ctx.createOscillator();
      const gain4 = ctx.createGain();
      osc4.type = 'sine';
      osc4.frequency.setValueAtTime(783.99, now + 0.36);
      gain4.gain.setValueAtTime(0, now + 0.36);
      gain4.gain.linearRampToValueAtTime(0.6, now + 0.4);
      gain4.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
      osc4.connect(gain4);
      gain4.connect(ctx.destination);
      osc4.start(now + 0.36);
      osc4.stop(now + 0.85);
    } catch {
      // Audio bloqueado
    }
  }

  /**
   * Bipe amigável de sucesso
   */
  public playSuccessDing() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }

  /**
   * Solicita permissão para notificações do sistema no navegador
   */
  public async requestNotificationPermission(): Promise<boolean> {
    this.unlockAudio();
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch {
      return false;
    }
  }
}

export const soundService = new SoundService();
