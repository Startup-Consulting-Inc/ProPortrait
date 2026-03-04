import React, { useState } from 'react';
import { X, Check, Star, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface PricingModalProps {
  open: boolean;
  onClose: () => void;
  onProActivated?: () => void;
}

type Plan = 'session' | 'pro' | 'teams';

const TIERS = [
  {
    id: 'session' as Plan,
    name: 'Session Pass',
    price: '$14.99',
    period: 'one-time',
    description: '30-day access',
    features: ['20 portrait generations', 'All 16 styles', 'Platform exports', 'Identity locks'],
    cta: 'Get Started',
    highlighted: false,
  },
  {
    id: 'pro' as Plan,
    name: 'Pro Studio',
    price: '$19.99',
    period: '/month',
    description: 'Most popular',
    features: ['60 generations/mo', '2K output resolution', 'Priority queue', 'PNG lossless export', 'All platform exports', 'Identity locks'],
    cta: 'Start Pro',
    highlighted: true,
  },
  {
    id: 'teams' as Plan,
    name: 'Teams',
    price: '$99',
    period: '/month',
    description: '5 seats included',
    features: ['300 generations/mo', 'All Pro features', '5 team seats', 'SSO / SAML', 'Priority support'],
    cta: 'Get Teams',
    highlighted: false,
  },
] as const;

export default function PricingModal({ open, onClose, onProActivated }: PricingModalProps) {
  const [loading, setLoading] = useState<Plan | null>(null);
  const [stripeUnavailable, setStripeUnavailable] = useState(false);

  if (!open) return null;

  const handleSelect = async (plan: Plan) => {
    setLoading(plan);
    try {
      const res = await fetch('/api/payments/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
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
      <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-8 pt-8 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Upgrade to Pro</h2>
            <p className="text-slate-500 text-sm mt-1">Get 2K portraits, more generations, and platform exports.</p>
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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 px-8 pb-8">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className={cn(
                'relative flex flex-col rounded-2xl border p-6 transition-shadow',
                tier.highlighted
                  ? 'border-indigo-600 bg-indigo-50 shadow-xl shadow-indigo-100'
                  : 'border-slate-200 bg-white',
              )}
            >
              {tier.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full">
                  <Star className="w-3 h-3 fill-yellow-300 text-yellow-300" />
                  Most Popular
                </div>
              )}

              <div className="mb-4">
                <p className="font-bold text-slate-900">{tier.name}</p>
                <p className="text-xs text-slate-500">{tier.description}</p>
                <div className="mt-2 flex items-baseline gap-0.5">
                  <span className="text-3xl font-extrabold text-slate-900">{tier.price}</span>
                  <span className="text-sm text-slate-500">{tier.period}</span>
                </div>
              </div>

              <ul className="space-y-2 flex-1 mb-6">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check className={cn('w-4 h-4 shrink-0', tier.highlighted ? 'text-indigo-600' : 'text-slate-400')} />
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
                    : 'bg-slate-900 text-white hover:bg-slate-800',
                  loading !== null && 'opacity-60 cursor-not-allowed',
                )}
              >
                {loading === tier.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Redirecting...</>
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
