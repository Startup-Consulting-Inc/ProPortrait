import { useState, useEffect, useRef } from 'react';
import { X, Download, Package, Layers, Loader2, Star, CheckCircle2, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { getIdToken } from '../services/auth';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

interface BuyCreditsModalProps {
  open: boolean;
  onClose: () => void;
  reason: 'hd' | 'platform';
  onPaymentDetected?: () => void;
}

type AddOnPlan = 'hd_addon' | 'platform_single' | 'platform_bundle';

const ADDONS: Array<{
  id: AddOnPlan;
  name: string;
  price: string;
  tagline: string;
  grants: string;
  icon: React.ReactNode;
  highlighted: boolean;
  relevantFor: Array<'hd' | 'platform'>;
}> = [
  {
    id: 'hd_addon',
    name: '1 HD Download',
    price: '$4.99',
    tagline: 'One more HD portrait',
    grants: '+1 HD credit',
    icon: <Download className="w-5 h-5" />,
    highlighted: false,
    relevantFor: ['hd'],
  },
  {
    id: 'platform_bundle',
    name: '5 Platforms + 1 HD',
    price: '$9.99',
    tagline: 'Best value',
    grants: '+1 HD credit + 5 platform credits',
    icon: <Package className="w-5 h-5" />,
    highlighted: true,
    relevantFor: ['hd', 'platform'],
  },
  {
    id: 'platform_single',
    name: '1 Platform Export',
    price: '$2.99',
    tagline: 'Single platform size',
    grants: '+1 platform credit',
    icon: <Layers className="w-5 h-5" />,
    highlighted: false,
    relevantFor: ['platform'],
  },
];

// Get fresh credits from server
async function fetchSessionCredits(): Promise<{ hd: number; platform: number }> {
  try {
    const token = await getIdToken();
    const res = await fetch(`${API_BASE}/api/auth/me`, {
      credentials: 'include',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (res.ok) {
      const data = await res.json() as { hdCredits?: number; platformCredits?: number };
      return { hd: data.hdCredits ?? 0, platform: data.platformCredits ?? 0 };
    }
  } catch { /* ignore */ }
  return { hd: 0, platform: 0 };
}

export default function BuyCreditsModal({ open, onClose, reason, onPaymentDetected }: BuyCreditsModalProps) {
  const [loading, setLoading] = useState<AddOnPlan | null>(null);
  const [stripeUnavailable, setStripeUnavailable] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [checkingManually, setCheckingManually] = useState(false);
  const [notDetectedYet, setNotDetectedYet] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCreditsRef = useRef<{ hd: number; platform: number } | null>(null);

  // Stop polling when modal closes
  useEffect(() => {
    if (!open) {
      stopPolling();
      setWaitingForPayment(false);
      setPaymentConfirmed(false);
      setLoading(null);
      setStripeUnavailable(false);
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => () => stopPolling(), []);

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  async function startPolling() {
    // Snapshot current credits so we can detect an increase
    const initial = await fetchSessionCredits();
    prevCreditsRef.current = initial;

    pollRef.current = setInterval(async () => {
      const current = await fetchSessionCredits();
      const prev = prevCreditsRef.current!;
      if (current.hd > prev.hd || current.platform > prev.platform) {
        handlePaymentSuccess();
      }
    }, 1500); // Poll every 1.5 seconds
  }

  function handlePaymentSuccess() {
    stopPolling();
    setPaymentConfirmed(true);
    setTimeout(() => {
      onPaymentDetected?.();
      onClose();
    }, 1500);
  }

  const handleSelect = async (plan: AddOnPlan) => {
    setLoading(plan);
    try {
      const token = await getIdToken();
      const res = await fetch(`${API_BASE}/api/payments/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ plan }),
        credentials: 'include',
      });
      const data = await res.json() as { url?: string; error?: string; mock?: boolean };

      if (data.mock || !data.url) {
        setStripeUnavailable(true);
        setLoading(null);
        return;
      }

      // Open Stripe in a new tab
      window.open(data.url, '_blank');
      setLoading(null);
      setWaitingForPayment(true);
      void startPolling();
    } catch {
      setStripeUnavailable(true);
      setLoading(null);
    }
  };

  const handleManualConfirm = async () => {
    setCheckingManually(true);
    setNotDetectedYet(false);
    stopPolling();
    const current = await fetchSessionCredits();
    const prev = prevCreditsRef.current ?? { hd: 0, platform: 0 };
    setCheckingManually(false);
    if (current.hd > prev.hd || current.platform > prev.platform) {
      handlePaymentSuccess();
    } else {
      // Credits not yet reflected — show message and keep polling
      setNotDetectedYet(true);
      void startPolling();
    }
  };

  const reasonLabel = reason === 'hd' ? 'HD download' : 'platform export';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

        {/* Waiting for payment state */}
        {waitingForPayment ? (
          <div className="px-8 py-12 flex flex-col items-center text-center gap-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>

            {paymentConfirmed ? (
              <>
                <CheckCircle2 className="w-14 h-14 text-green-500" />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Payment confirmed!</h3>
                  <p className="text-slate-500 text-sm mt-1">Your credit is ready. Returning to your portrait…</p>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-indigo-50 border-2 border-indigo-200 flex items-center justify-center">
                  <ExternalLink className="w-7 h-7 text-indigo-500" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">Complete payment in the new tab</h3>
                  <p className="text-slate-500 text-sm mt-1">
                    Your portrait is safe here. Once you pay, this will automatically close and your download will be ready.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Waiting for payment confirmation…
                </div>
                <button
                  onClick={handleManualConfirm}
                  disabled={checkingManually}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-semibold text-sm hover:bg-indigo-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {checkingManually
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Checking…</>
                    : "I've completed my payment →"
                  }
                </button>
                {notDetectedYet && (
                  <p className="text-xs text-amber-600 text-center max-w-xs">
                    Payment not detected yet — please wait a moment and try again. It may take up to 30 seconds.
                  </p>
                )}
              </>
            )}
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-8 pt-8 pb-4">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Get more credits</h2>
                <p className="text-slate-500 text-sm mt-1">
                  You need credits for this {reasonLabel}. Top up below.
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {stripeUnavailable && (
              <div className="mx-8 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm text-center">
                Payments are not configured yet — check back soon!
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 pb-8">
              {ADDONS.map((addon) => {
                const isRelevant = addon.relevantFor.includes(reason);
                return (
                  <div
                    key={addon.id}
                    className={cn(
                      'relative flex flex-col rounded-2xl border p-5 transition-shadow',
                      addon.highlighted
                        ? 'border-indigo-600 bg-indigo-50 shadow-xl shadow-indigo-100'
                        : isRelevant
                        ? 'border-slate-300 bg-white ring-2 ring-slate-200'
                        : 'border-slate-200 bg-white opacity-80',
                    )}
                  >
                    {addon.highlighted && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                        <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                        Best Value
                      </div>
                    )}

                    <div className="mb-4">
                      <div className={cn('mb-2', addon.highlighted ? 'text-indigo-600' : 'text-slate-600')}>
                        {addon.icon}
                      </div>
                      <p className="font-bold text-slate-900">{addon.name}</p>
                      <p className="text-xs text-slate-500">{addon.tagline}</p>
                      <div className="mt-2 flex items-baseline gap-0.5">
                        <span className="text-3xl font-extrabold text-slate-900">{addon.price}</span>
                        <span className="text-sm text-slate-500 ml-1">one-time</span>
                      </div>
                    </div>

                    <p className={cn('text-xs font-medium mb-6 flex-1', addon.highlighted ? 'text-indigo-700' : 'text-slate-500')}>
                      {addon.grants}
                    </p>

                    <button
                      onClick={() => handleSelect(addon.id)}
                      disabled={loading !== null}
                      className={cn(
                        'w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                        addon.highlighted
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                          : 'bg-slate-900 text-white hover:bg-slate-800',
                        loading !== null && 'opacity-60 cursor-not-allowed',
                      )}
                    >
                      {loading === addon.id ? (
                        <><Loader2 className="w-4 h-4 animate-spin" /> Opening…</>
                      ) : (
                        <>Buy {addon.price}</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="px-8 pb-6 text-center">
              <p className="text-xs text-slate-400">
                One-time payment. No subscription. Credits never expire.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
