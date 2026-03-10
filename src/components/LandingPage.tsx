/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import { useAuthContext } from '../contexts/AuthContext';
import UserMenu from './UserMenu';
import AppFooter from './AppFooter';

function HeroSlider() {
  const [position, setPosition] = useState(42);
  const [isDragging, setIsDragging] = useState(false);
  const [hinted, setHinted] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
    setHinted(false);
  }, []);

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => updatePosition(e.clientX);
    const onUp = () => setIsDragging(false);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, updatePosition]);

  // Animated hint sweep on first load
  useEffect(() => {
    if (!hinted) return;
    let frame: number;
    let startTime: number | null = null;
    const duration = 1600;
    const delay = 900;

    const animate = (ts: number) => {
      if (!startTime) startTime = ts;
      const elapsed = ts - startTime - delay;
      if (elapsed < 0) { frame = requestAnimationFrame(animate); return; }
      const t = Math.min(elapsed / duration, 1);
      const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setPosition(42 + Math.sin(eased * Math.PI) * 30);
      if (t < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [hinted]);

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-2xl shadow-2xl cursor-col-resize select-none"
      style={{ aspectRatio: '1 / 1' }}
      onMouseDown={(e) => { setIsDragging(true); updatePosition(e.clientX); }}
      onTouchStart={(e) => updatePosition(e.touches[0].clientX)}
      onTouchMove={(e) => { e.preventDefault(); updatePosition(e.touches[0].clientX); }}
    >
      <img
        src="/sample-before.jpg"
        alt="Original casual photo"
        className="absolute inset-0 w-full h-full object-cover object-[center_20%]"
        draggable={false}
      />
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
      >
        <img
          src="/sample-after.jpg"
          alt="ProPortrait AI professional portrait"
          className="absolute inset-0 w-full h-full object-cover object-center"
          draggable={false}
        />
      </div>
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-[0_0_12px_rgba(0,0,0,0.6)] z-10 pointer-events-none"
        style={{ left: `${position}%`, transform: 'translateX(-50%)' }}
      />
      <div
        className="absolute top-1/2 z-20 -translate-y-1/2 w-11 h-11 bg-white rounded-full shadow-2xl flex items-center justify-center pointer-events-none"
        style={{ left: `${position}%`, transform: `translateX(-50%) translateY(-50%)` }}
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="M7 10H4M4 10L7 7M4 10L7 13M13 10H16M16 10L13 7M16 10L13 13" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="absolute bottom-4 left-4 bg-black/60 text-white text-sm font-medium px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
        Before
      </div>
      <div className="absolute bottom-4 right-4 bg-indigo-600/90 text-white text-sm font-semibold px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none">
        ProPortrait AI
      </div>
      {hinted && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/55 text-white text-xs font-medium px-3 py-1.5 rounded-full backdrop-blur-sm pointer-events-none whitespace-nowrap animate-pulse">
          ← Drag to compare →
        </div>
      )}
    </div>
  );
}

const CHECK_ICON = (
  <svg className="w-4 h-4 text-indigo-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

const CHECK_ICON_MUTED = (
  <svg className="w-4 h-4 text-slate-300 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
  </svg>
);

interface LandingPageProps {
  onSignIn?: () => void;
}

export default function LandingPage({ onSignIn }: LandingPageProps) {
  const { user, loading } = useAuthContext();
  const goToApp = () => {
    if (onSignIn) {
      onSignIn();
    } else {
      window.location.href = '/app';
    }
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900 flex flex-col">
      {/* Navbar */}
      <header className="flex items-center justify-between px-6 py-4 max-w-6xl mx-auto w-full">
        <a href={user ? '/app' : '/'} className="flex items-center gap-2">
          <img src="/logo.png" alt="ProPortrait AI" className="h-7 w-7 rounded-lg" />
          <span className="font-bold text-lg tracking-tight">ProPortrait<span className="text-indigo-600"> AI</span></span>
        </a>
        <nav className="hidden sm:flex items-center gap-6 text-sm text-slate-500">
          <a href="#features" className="hover:text-slate-800 transition-colors">Features</a>
          <a href="#pricing" className="hover:text-slate-800 transition-colors">Pricing</a>
          <a href="/contact" className="hover:text-slate-800 transition-colors">Contact</a>
        </nav>
        {loading ? (
          <div className="w-8 h-8" />
        ) : user ? (
          <UserMenu
            onOpenProfile={() => window.location.href = '/app'}
            onOpenAdmin={() => window.location.href = '/admin'}
          />
        ) : (
          <button
            onClick={goToApp}
            className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            Sign In →
          </button>
        )}
      </header>

      <main className="flex-1 flex flex-col items-center px-6 max-w-6xl mx-auto w-full">

        {/* Hero */}
        <section className="py-10 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
          {/* Left — copy */}
          <div className="flex flex-col items-start gap-6 order-2 lg:order-1">
            <div className="inline-flex items-center gap-2 bg-amber-50 text-amber-700 text-sm font-semibold px-3 py-1.5 rounded-full border border-amber-200">
              <span className="text-base">🎁</span>
              Free Beta: Get Creator Access ($24.99 value)
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-5xl font-extrabold leading-tight tracking-tight">
              Your best<br />
              professional photo,<br />
              <span className="text-indigo-600">without the photoshoot.</span>
            </h1>

            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 w-full">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🧪</span>
                <div>
                  <p className="font-semibold text-amber-900">Limited Beta Access</p>
                  <p className="text-sm text-amber-800">
                    Sign up during beta and get <strong>Creator tier free</strong> — 30 professional portraits, 
                    all styles, 2K resolution. Share feedback, unlock <strong>50% off Pro or Max for a year</strong>.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-lg text-slate-500 leading-relaxed max-w-md">
              Upload any photo. ProPortrait AI generates studio-quality headshots
              for LinkedIn, resumes, and beyond — preserving your identity,
              instantly.
            </p>

            <button
              onClick={goToApp}
              className="mt-2 inline-flex items-center gap-3 bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200 group"
            >
              <svg className="w-5 h-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
              </svg>
              Get Free Beta Access
              <span className="text-indigo-300 font-normal text-base group-hover:translate-x-0.5 transition-transform">— 30 portraits</span>
            </button>

            <div className="flex flex-wrap items-center gap-5 pt-2 text-sm text-slate-500">
              {[
                { icon: '✓', text: 'No credit card required' },
                { icon: '✓', text: 'Photos deleted after 24h' },
                { icon: '✓', text: '30 free portraits' },
                { icon: '✓', text: 'All 7 styles included' },
              ].map((t) => (
                <span key={t.text} className="flex items-center gap-1.5">
                  <span className="text-emerald-500 font-bold">{t.icon}</span>
                  {t.text}
                </span>
              ))}
            </div>
          </div>

          {/* Right — comparison slider */}
          <div className="order-1 lg:order-2 w-full max-w-sm mx-auto lg:max-w-none">
            <HeroSlider />
            <p className="text-center text-xs text-slate-400 mt-3">
              Real output. Drag to compare before &amp; after.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="py-12 w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">How it works</h2>
            <p className="mt-2 text-slate-500">From casual photo to professional portrait in 30 seconds</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                step: '1',
                title: 'Upload any photo',
                desc: 'Casual selfie, group photo, or existing picture. We handle the rest.',
              },
              {
                step: '2',
                title: 'AI generates options',
                desc: 'Choose from 7 professional styles. Identity preserved, quality enhanced.',
              },
              {
                step: '3',
                title: 'Download & use',
                desc: 'Platform-ready exports for LinkedIn, resumes, social media, and more.',
              },
            ].map((f) => (
              <div key={f.title} className="flex flex-col items-center text-center p-6">
                <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  {f.step}
                </div>
                <div className="font-semibold text-slate-800 mb-2">{f.title}</div>
                <div className="text-sm text-slate-500">{f.desc}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Feature strip */}
        <section id="features" className="py-10 w-full">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-slate-900">Why ProPortrait AI?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              {
                icon: <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
                title: 'Identity preserved',
                desc: 'Locks skin tone, eye color, and facial structure — you stay you.',
              },
              {
                icon: <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
                title: '7 studio styles',
                desc: 'Editorial, Environmental, Vintage, B&W, Cyberpunk, and more.',
              },
              {
                icon: <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                title: 'Platform-ready exports',
                desc: 'LinkedIn, GitHub, Twitter, and Resume sizes — one click.',
              },
            ].map((f) => (
              <div key={f.title} className="flex gap-4 p-6 rounded-2xl bg-slate-50 border border-slate-100">
                <div className="flex-shrink-0 w-11 h-11 bg-indigo-50 rounded-xl flex items-center justify-center">
                  {f.icon}
                </div>
                <div>
                  <div className="font-semibold text-slate-800 mb-1">{f.title}</div>
                  <div className="text-sm text-slate-500">{f.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-12 w-full">
          <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-8 sm:p-10 border border-slate-200">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-2xl shrink-0">
                👋
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Hi, I'm Jay — the founder</h3>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  I built ProPortrait AI because I needed professional headshots for my own LinkedIn and couldn't find an 
                  AI solution that actually preserved my identity. After 50+ iterations with Gemini, I finally got results 
                  that looked like me, just professionally photographed.
                </p>
                <p className="text-slate-600 text-sm leading-relaxed mb-4">
                  This beta launch is about getting ProPortrait into your hands. Every piece of feedback helps me make 
                  it better for everyone. In return, I'm giving early adopters the full Creator experience free, plus 
                  50% off if you help me improve the product.
                </p>
                <p className="text-slate-500 text-sm italic">
                  — Jay, founder @ ProPortrait AI
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Beta Reward Banner */}
        <section className="py-8 w-full">
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6 sm:p-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <div className="text-4xl">🎁</div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-amber-900">Beta Special Offer</h3>
                <p className="text-amber-800 mt-1">
                  Sign up during beta and get <strong>Creator tier free</strong> ($24.99 value) — 
                  30 portraits, all styles, 2K resolution. 
                  Share feedback to unlock <strong>50% off Pro or Max for 1 year</strong>.
                </p>
              </div>
              <button
                onClick={goToApp}
                className="shrink-0 bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl transition-colors"
              >
                Claim Free Access
              </button>
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 w-full">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Simple, transparent pricing</h2>
            <p className="mt-3 text-slate-500 text-lg">Beta users get Creator free. Active users earn 50% off.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">

            {/* Free */}
            <div className="flex flex-col p-6 rounded-2xl border border-slate-200 bg-white">
              <div className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-1">Free</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
              </div>
              <div className="text-xs text-slate-400 mb-5">No credit card required</div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {[
                  '3 portraits total',
                  '1K resolution',
                  'Core styles only',
                  'No saves (24h expiry)',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    {CHECK_ICON_MUTED}{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToApp}
                className="w-full border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Get started free
              </button>
            </div>

            {/* Creator — Free during beta */}
            <div className="flex flex-col p-6 rounded-2xl border-2 border-amber-400 bg-amber-50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                🧪 Free During Beta
              </div>
              <div className="text-sm font-semibold text-amber-600 uppercase tracking-wide mb-1">Creator</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">$0</span>
                <span className="text-slate-400 line-through text-lg">$24.99</span>
              </div>
              <div className="text-xs text-amber-600 font-semibold mb-5">Limited time only</div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {[
                  '30 portrait generations',
                  '30 permanent saves',
                  '2K resolution',
                  'All styles & expressions',
                  'PNG + transparent bg',
                  'All platform exports',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    {CHECK_ICON}{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToApp}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow"
              >
                Get Free Access
              </button>
              <p className="text-xs text-amber-700 mt-3 text-center">
                Beta users get 50% off Pro/Max with feedback
              </p>
            </div>

            {/* Pro — highlighted */}
            <div className="flex flex-col p-6 rounded-2xl border-2 border-indigo-600 bg-indigo-50 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                Most popular
              </div>
              <div className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">Pro</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">$29.99</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <div className="text-xs text-slate-400 mb-5">Cancel anytime</div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {[
                  '100 portraits/month',
                  'Unlimited saves',
                  '2K resolution',
                  'All styles & expressions',
                  'PNG + transparent bg',
                  'All platform exports',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    {CHECK_ICON}{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToApp}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 rounded-xl text-sm transition-colors shadow"
              >
                Start Pro
              </button>
            </div>

            {/* Max */}
            <div className="flex flex-col p-6 rounded-2xl border border-slate-200 bg-white">
              <div className="text-sm font-semibold text-violet-600 uppercase tracking-wide mb-1">Max</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-extrabold text-slate-900">$49.99</span>
                <span className="text-slate-500 text-sm">/month</span>
              </div>
              <div className="text-xs text-slate-400 mb-5">For high-volume creators</div>
              <ul className="space-y-2.5 flex-1 mb-6">
                {[
                  '500 portraits/month',
                  'Unlimited saves',
                  '2K resolution',
                  'All styles & expressions',
                  'PNG + transparent bg',
                  'Highest priority queue',
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-600">
                    {CHECK_ICON}{f}
                  </li>
                ))}
              </ul>
              <button
                onClick={goToApp}
                className="w-full border border-violet-200 hover:bg-violet-50 text-violet-700 font-semibold py-2.5 rounded-xl text-sm transition-colors"
              >
                Start Max
              </button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className="py-16 w-full">
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-center text-slate-900 mb-10">Frequently Asked Questions</h2>
          <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
            {[
              { q: 'What is the beta program?', a: 'During beta, all new signups get Creator tier (normally $24.99) completely free. This helps us gather feedback while you get professional portraits at no cost.' },
              { q: 'How do I get 50% off?', a: 'Generate 3+ portraits and submit feedback. Active beta users who help us improve unlock 50% off Pro or Max for 1 year.' },
              { q: 'Is this a subscription?', a: 'You can choose. The free plan and Creator Pass are one-time. Pro and Max are monthly or yearly subscriptions with significant savings.' },
              { q: 'What styles are available?', a: 'Corporate headshot, creative cinematic, casual lifestyle, athletic, classic formal, seasonal looks, and more. All tiers get access to every style.' },
              { q: 'What resolution do I get?', a: 'Free tier delivers 1K resolution; Creator and above provide 2K+ (super-resolution).' },
              { q: 'Can I use these commercially?', a: 'Yes—generated portraits are yours to use for personal branding, business profiles, marketing, and social media.' },
              { q: 'What happens when I hit my limit?', a: 'You\'ll get a simple prompt to upgrade. Your saved portraits are always accessible, and you can delete to free up saves.' },
              { q: 'Which platforms are supported?', a: 'LinkedIn, Instagram, X/Twitter, YouTube, TikTok, and general-purpose export sizes.' },
            ].map((item, idx) => (
              <div key={idx} className="rounded-xl border border-slate-200 bg-white p-5">
                <div className="font-semibold text-slate-900 mb-2">{item.q}</div>
                <p className="text-sm text-slate-600 leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Bottom CTA */}
        <section className="py-12 flex flex-col items-center gap-4 text-center w-full">
          <p className="text-slate-500 text-lg">Ready to look your best?</p>
          <p className="text-amber-600 font-medium">🧪 Join 100+ beta users — get Creator free today</p>
          <button
            onClick={goToApp}
            className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-700 text-white font-bold text-base px-7 py-3.5 rounded-xl transition-colors"
          >
            Get Free Beta Access
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </button>
        </section>
      </main>

      <AppFooter />
    </div>
  );
}
