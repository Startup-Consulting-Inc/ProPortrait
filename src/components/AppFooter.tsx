export default function AppFooter() {
  const styles = [
    { id: 'editorial',    name: 'Editorial Professional' },
    { id: 'environmental', name: 'Environmental Portrait' },
    { id: 'candid',       name: 'Candid & Real' },
    { id: 'vintage',      name: 'Vintage 35mm' },
    { id: 'black-white',  name: 'Black & White' },
    { id: 'cyberpunk',    name: 'Cyberpunk Neon' },
    { id: 'watercolor',   name: 'Watercolor' },
  ];

  const posts = [
    { slug: 'free-ai-headshot-no-subscription',  title: 'Free AI Headshot: No Subscription' },
    { slug: 'ai-headshot-vs-photographer',        title: 'AI Headshot vs Traditional Photography' },
    { slug: 'linkedin-profile-photo-tips-2026',  title: 'LinkedIn Profile Photo Tips 2026' },
    { slug: 'github-profile-photo-guide',         title: 'GitHub Profile Photo Guide' },
    { slug: 'ai-headshot-privacy',                title: 'AI Headshot Privacy' },
    { slug: 'corporate-headshots-remote-teams',   title: 'Corporate Headshots for Remote Teams' },
    { slug: 'ai-portrait-styles-explained',       title: 'AI Portrait Styles Explained' },
  ];

  return (
    <footer className="border-t border-slate-200 bg-slate-50 py-12 px-6 text-xs text-slate-500">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <a href="/" className="inline-flex items-center gap-2 mb-3">
              <img src="/logo.png" alt="ProPortrait AI" className="h-6 w-6 rounded-md" />
              <span className="font-bold text-sm text-slate-800 tracking-tight">
                ProPortrait<span className="text-indigo-600"> AI</span>
              </span>
            </a>
            <p className="text-slate-400 leading-relaxed mb-4">
              Studio-quality AI headshots. Generate free, pay only to download.
            </p>
            <a
              href="/create"
              className="inline-block bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 py-1.5 rounded-lg transition-colors text-xs"
            >
              Try Free →
            </a>
          </div>

          {/* Styles */}
          <div>
            <p className="font-semibold text-slate-700 uppercase tracking-wider mb-3">Portrait Styles</p>
            <ul className="space-y-2">
              {styles.map((s) => (
                <li key={s.id}>
                  <a href={`/styles/${s.id}`} className="hover:text-indigo-600 transition-colors">
                    {s.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Blog */}
          <div>
            <p className="font-semibold text-slate-700 uppercase tracking-wider mb-3">Blog</p>
            <ul className="space-y-2">
              {posts.map((p) => (
                <li key={p.slug}>
                  <a href={`/blog/${p.slug}`} className="hover:text-indigo-600 transition-colors">
                    {p.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div>
            <p className="font-semibold text-slate-700 uppercase tracking-wider mb-3">Company</p>
            <ul className="space-y-2">
              <li><a href="/blog" className="hover:text-indigo-600 transition-colors">All Blog Posts</a></li>
              <li><a href="/contact" className="hover:text-indigo-600 transition-colors">Contact</a></li>
              <li><a href="/privacy" className="hover:text-indigo-600 transition-colors">Privacy Policy</a></li>
              <li><a href="/terms" className="hover:text-indigo-600 transition-colors">Terms of Service</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-200 pt-6 text-center text-slate-400">
          © 2026 ProPortrait AI — AI headshots for professionals
        </div>
      </div>
    </footer>
  );
}
