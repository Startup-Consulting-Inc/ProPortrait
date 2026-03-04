import { Star } from 'lucide-react';

const TESTIMONIALS = [
  {
    initials: 'SM',
    name: 'Sarah M.',
    role: 'Career Pivotter',
    gradient: 'from-indigo-500 to-purple-500',
    quote: 'Finally a headshot that looks like me, not an AI composite. The identity locks are a game-changer.',
  },
  {
    initials: 'DL',
    name: 'David L.',
    role: 'Fractional CMO',
    gradient: 'from-sky-500 to-blue-600',
    quote: 'Updated all 6 of my client profiles in under 30 minutes. My LinkedIn connection rate jumped 40%.',
  },
  {
    initials: 'JK',
    name: 'Jamie K.',
    role: 'Remote Engineering Lead',
    gradient: 'from-emerald-500 to-teal-600',
    quote: 'My Zoom thumbnail finally matches my seniority. Worth every penny.',
  },
];

export default function TestimonialsSection() {
  return (
    <section className="max-w-6xl mx-auto px-4 py-16">
      <div className="text-center mb-10">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Trusted by Professionals
        </h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Join thousands of professionals who upgraded their online presence
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t) => (
          <div
            key={t.initials}
            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}>
                {t.initials}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-slate-100 text-sm">{t.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.role}</p>
              </div>
            </div>
            <div className="flex gap-0.5 mb-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 italic">"{t.quote}"</p>
          </div>
        ))}
      </div>
    </section>
  );
}
