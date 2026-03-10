import { useState } from 'react';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
import { X, Check, Star, Loader2, Zap } from 'lucide-react';
import { cn } from '../lib/utils';
import { getIdToken } from '../services/auth';

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  onProActivated?: () => void;
}

type Plan = 'creator' | 'pro' | 'max';

const FREE_FEATURES = [
  '3 portraits total',
  '1K resolution',
  'Core styles only',
  'No saves (24h expiry)',
];

const TIERS: Array<{
  id: Plan;
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  accent?: boolean;
}> = [
  {
    id: 'creator',
    name: 'Creator Pass',
    price: '$24.99',
    period: 'one-time',
    tagline: 'Perfect for a one-time refresh',
    features: [
      '30 portrait generations',
      '30 permanent saves',
      '2K resolution',
      'All 7 styles',
      'PNG lossless export',
      'All platform exports',
    ],
    cta: 'Buy Creator Pass',
    highlighted: false,
  },
  {
    id: 'pro',
    name: 'Pro',
    price: '$29.99',
    period: '/month',
    tagline: 'Most popular',
    features: [
      '100 portraits/month',
      'Unlimited saves',
      '2K resolution',
      'All styles & expressions',
      'PNG lossless export',
      'All platform exports',
    ],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    id: 'max',
    name: 'Max',
    price: '$49.99',
    period: '/month',
    tagline: 'For high-volume creators',
    features: [
      '500 portraits/month',
      'Unlimited saves',
      '2K resolution',
      'All styles & expressions',
      'PNG lossless export',
      'Highest priority queue',
    ],
    cta: 'Start Max',
    highlighted: false,
    accent: true,
  },
];

export default function PricingModal({ open, onClose, onProActivated }: PricingModalProps) {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [stripeUnavailable, setStripeUnavailable] = useState(false);

  if (!open) return null;

  const handleSelect = async (plan: Plan) => {
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

      window.location.href = data.url;
    } catch {
      setStripeUnavailable(true);
      setLoading(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Choose your plan</h2>
            <p className="text-slate-500 text-sm mt-1">Save portraits, unlock 2K resolution, and get more generations.</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close pricing"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stripe unavailable banner */}
        {stripeUnavailable && (
          <div className="mx-8 mb-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-sm text-center">
            Payments are not configured yet — check back soon!
          </div>
        )}

        {/* Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 px-6 pb-8">
          {/* Free column — comparison only, no CTA */}
          <div className="relative flex flex-col rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="mb-4">
              <p className="font-bold text-slate-700">Free</p>
              <p className="text-xs text-slate-400">Always free</p>
              <div className="mt-2 flex items-baseline gap-0.5">
                <span className="text-3xl font-extrabold text-slate-700">$0</span>
              </div>
            </div>
            <ul className="space-y-2 flex-1 mb-6">
              {FREE_FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-500">
                  <Check className="w-4 h-4 shrink-0 text-slate-300" />
                  {f}
                </li>
              ))}
            </ul>
            <div className="py-2.5 rounded-xl text-center text-sm font-semibold text-slate-400 bg-slate-100 border border-slate-200">
              Current plan
            </div>
          </div>

          {/* Paid tiers */}
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-5 transition-shadow',
                tier.highlighted
                  ? 'border-indigo-600 bg-indigo-50 shadow-xl shadow-indigo-100'
                  : tier.accent
                    ? 'border-purple-300 bg-gradient-to-b from-purple-50 to-white'
                    : 'border-slate-200 bg-white',
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                  <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                  Most Popular
                </div>
              )}
              {tier.accent && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-purple-600 text-white text-xs font-bold rounded-full">
                  <Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                  High Volume
                </div>
              )}

              <div className="mb-4">
                <p className="font-bold text-slate-900">{tier.name}</p>
                <p className="text-xs text-slate-500">{tier.tagline}</p>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-3xl font-extrabold text-slate-900">{tier.price}</span>
                  <span className="text-sm text-slate-500">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className={cn(
                      'w-4 h-4 shrink-0',
                      tier.highlighted ? 'text-indigo-600' : tier.accent ? 'text-purple-500' : 'text-slate-400',
                    )} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelect(tier.id)}
                disabled={loading !== null}
                className={cn(
                  'w-full py-2.5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all',
                  tier.highlighted
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-md'
                    : tier.accent
                      ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                      : 'bg-slate-900 text-white hover:bg-slate-800',
                  loading !== null && 'opacity-60 cursor-not-allowed',
                )}
              >
                {loading === tier.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting…</>
                ) : (
                  tier.cta
                )}
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
