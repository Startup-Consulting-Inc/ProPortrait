/**
 * PaymentCommunicator - Cross-tab communication for payment status
 * 
 * This service enables the Export Portrait page (original tab) to detect
 * when payment completes in the Stripe checkout tab, without requiring
 * the user to manually switch tabs.
 * 
 * Flow:
 * 1. Original tab (Export Portrait) opens Stripe → broadcasts PAYMENT_STARTED
 * 2. Payment tab completes checkout → broadcasts PAYMENT_COMPLETED → auto-closes
 * 3. Original tab receives PAYMENT_COMPLETED → refreshes credits → enables download
 */

const CHANNEL_NAME = 'proportrait_payment_channel';
const STORAGE_KEY = 'pp_payment_status';

export type PaymentMessage = 
  | { type: 'PAYMENT_STARTED'; sessionId: string; plan: string; timestamp: number }
  | { type: 'PAYMENT_COMPLETED'; sessionId: string; plan: string; timestamp: number }
  | { type: 'PAYMENT_FAILED'; sessionId: string; reason: string; timestamp: number };

type PaymentStatus = {
  status: 'pending' | 'completed' | 'failed';
  sessionId: string;
  plan: string;
  timestamp: number;
};

class PaymentCommunicator {
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(message: PaymentMessage) => void> = new Set();
  private storageListener: ((e: StorageEvent) => void) | null = null;

  constructor() {
    this.init();
  }

  private init() {
    // Primary: BroadcastChannel (works in most modern browsers)
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        this.channel = new BroadcastChannel(CHANNEL_NAME);
        this.channel.onmessage = (e) => {
          this.handleMessage(e.data as PaymentMessage);
        };
      } catch (err) {
        console.warn('[PaymentComm] BroadcastChannel not available:', err);
      }
    }

    // Fallback: localStorage events (for Safari, older browsers)
    this.storageListener = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue) {
        try {
          const status: PaymentStatus = JSON.parse(e.newValue);
          if (status.status === 'completed') {
            this.handleMessage({
              type: 'PAYMENT_COMPLETED',
              sessionId: status.sessionId,
              plan: status.plan,
              timestamp: status.timestamp,
            });
          } else if (status.status === 'failed') {
            this.handleMessage({
              type: 'PAYMENT_FAILED',
              sessionId: status.sessionId,
              reason: 'Payment failed or cancelled',
              timestamp: status.timestamp,
            });
          }
        } catch {
          // ignore parse errors
        }
      }
    };
    window.addEventListener('storage', this.storageListener);
  }

  private handleMessage(message: PaymentMessage) {
    this.listeners.forEach(listener => {
      try {
        listener(message);
      } catch (err) {
        console.error('[PaymentComm] Listener error:', err);
      }
    });
  }

  /**
   * Send a payment message to all tabs
   */
  send(message: PaymentMessage) {
    // Send via BroadcastChannel
    if (this.channel) {
      try {
        this.channel.postMessage(message);
      } catch (err) {
        console.warn('[PaymentComm] BroadcastChannel send failed:', err);
      }
    }

    // Also persist to localStorage for fallback and persistence
    if (message.type === 'PAYMENT_COMPLETED' || message.type === 'PAYMENT_FAILED') {
      const status: PaymentStatus = {
        status: message.type === 'PAYMENT_COMPLETED' ? 'completed' : 'failed',
        sessionId: message.sessionId,
        plan: 'plan' in message ? message.plan : '',
        timestamp: message.timestamp,
      };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(status));
      } catch {
        // ignore storage errors
      }
    }
  }

  /**
   * Subscribe to payment messages
   * Returns unsubscribe function
   */
  onMessage(listener: (message: PaymentMessage) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * Check if there's a pending payment status in localStorage
   * Call this on app load to check for completed payments from other tabs
   */
  checkPendingStatus(): PaymentStatus | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return null;
      
      const status: PaymentStatus = JSON.parse(stored);
      
      // Only consider statuses from last 5 minutes
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      if (status.timestamp < fiveMinutesAgo) {
        localStorage.removeItem(STORAGE_KEY);
        return null;
      }
      
      return status;
    } catch {
      return null;
    }
  }

  /**
   * Clear any pending payment status
   */
  clearStatus() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }

  /**
   * Broadcast that payment has started
   */
  notifyPaymentStarted(sessionId: string, plan: string) {
    this.send({
      type: 'PAYMENT_STARTED',
      sessionId,
      plan,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast that payment has completed
   * Call this from the payment success page
   */
  notifyPaymentCompleted(sessionId: string, plan: string) {
    this.send({
      type: 'PAYMENT_COMPLETED',
      sessionId,
      plan,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast that payment has failed
   */
  notifyPaymentFailed(sessionId: string, reason: string) {
    this.send({
      type: 'PAYMENT_FAILED',
      sessionId,
      reason,
      timestamp: Date.now(),
    });
  }

  /**
   * Auto-close the current tab after payment completion
   * Call this from the payment success page after broadcasting
   */
  autoCloseAfterBroadcast(delayMs: number = 1500) {
    setTimeout(() => {
      // Try to close the window
      window.close();
      
      // If window.close() doesn't work (most modern browsers block it),
      // show a message and redirect to main page
      setTimeout(() => {
        if (!window.closed) {
          // Replace the current page with a "you can close this tab" message
          document.body.innerHTML = `
            <div style="
              display: flex; 
              flex-direction: column; 
              align-items: center; 
              justify-content: center; 
              min-height: 100vh; 
              font-family: system-ui, sans-serif;
              background: #f8fafc;
              padding: 20px;
              text-align: center;
            ">
              <div style="
                width: 64px; 
                height: 64px; 
                background: #10b981; 
                border-radius: 50%; 
                display: flex; 
                align-items: center; 
                justify-content: center;
                margin-bottom: 24px;
              ">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
              <h1 style="font-size: 24px; font-weight: bold; color: #111827; margin-bottom: 12px;">
                Payment Successful!
              </h1>
              <p style="color: #6b7280; margin-bottom: 24px; max-width: 400px;">
                Your credits have been added. You can close this tab and return to your portrait.
              </p>
              <button onclick="window.close()" style="
                background: #4f46e5; 
                color: white; 
                border: none; 
                padding: 12px 24px; 
                border-radius: 8px; 
                font-weight: 600;
                cursor: pointer;
              ">
                Close This Tab
              </button>
            </div>
          `;
        }
      }, 500);
    }, delayMs);
  }

  destroy() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    if (this.storageListener) {
      window.removeEventListener('storage', this.storageListener);
      this.storageListener = null;
    }
    this.listeners.clear();
  }
}

// Singleton instance
let communicator: PaymentCommunicator | null = null;

export function getPaymentCommunicator(): PaymentCommunicator {
  if (!communicator) {
    communicator = new PaymentCommunicator();
  }
  return communicator;
}

// For testing - reset singleton
export function resetPaymentCommunicator() {
  if (communicator) {
    communicator.destroy();
    communicator = null;
  }
}
