import { useState, useEffect } from 'react';
import { X, Download, Package, Layers, Loader2, Star } from 'lucide-react';
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

export default function BuyCreditsModal({ open, onClose, reason }: BuyCreditsModalProps) {
  const [loading, setLoading] = useState<AddOnPlan | null>(null);
  const [stripeUnavailable, setStripeUnavailable] = useState(false);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setLoading(null);
      setStripeUnavailable(false);
    }
  }, [open]);

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

      // Open Stripe in a new tab, then close this modal
      window.open(data.url, '_blank');
      setLoading(null);
      onClose();
    } catch {
      setStripeUnavailable(true);
      setLoading(null);
    }
  };

  const reasonLabel = reason === 'hd' ? 'HD download' : 'platform export';

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">

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

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 px-6 pb-6">
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
            One-time payment · No subscription · Credits saved to your account
          </p>
        </div>
      </div>
    </div>
  );
}
