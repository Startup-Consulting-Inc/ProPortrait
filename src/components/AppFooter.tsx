export default function AppFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-700 py-6 px-6 text-center text-xs text-slate-400">
      <div className="max-w-6xl mx-auto flex flex-wrap justify-center gap-4">
        <span>© 2026 ProPortrait AI</span>
        <a href="/contact" className="hover:text-slate-600 transition-colors">Contact</a>
        <a href="/privacy" className="hover:text-slate-600 transition-colors">Privacy</a>
        <a href="/terms" className="hover:text-slate-600 transition-colors">Terms</a>
      </div>
    </footer>
  );
}
