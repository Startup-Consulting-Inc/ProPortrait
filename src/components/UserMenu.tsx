import { useState, useEffect, useRef } from 'react';
import { useAuthContext } from '../contexts/AuthContext';

interface UserMenuProps {
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenLibrary?: () => void;
}

export default function UserMenu({ onOpenProfile, onOpenAdmin, onOpenLibrary }: UserMenuProps) {
  const { user, profile, isAdmin, hdCredits, signOut } = useAuthContext();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  if (!user) return null;

  const initials = (() => {
    const name = profile?.displayName || user.displayName || user.email || '';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  })();

  const photoURL = profile?.photoURL || user.photoURL;
  const displayName = profile?.displayName || user.displayName || user.email?.split('@')[0] || 'User';

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        aria-label="User menu"
      >
        {photoURL ? (
          <img
            src={photoURL}
            alt={displayName}
            className="w-9 h-9 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold border-2 border-white shadow-sm">
            {initials}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-11 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50">
          {/* Header */}
          <div className="px-4 py-3 border-b border-slate-100">
            <div className="font-semibold text-slate-800 text-sm truncate">{displayName}</div>
            <div className="text-xs text-slate-400 truncate">{user.email}</div>
            {hdCredits > 0 && (
              <span className="inline-block mt-1 text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                {hdCredits} HD credit{hdCredits !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {/* Items */}
          <div className="py-1">
            <button
              onClick={() => { setOpen(false); onOpenProfile(); }}
              className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
            >
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Profile & Preferences
            </button>

            {onOpenLibrary && (
              <button
                onClick={() => { setOpen(false); onOpenLibrary(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Saved Portraits
                {profile?.saveCount ? (
                  <span className="ml-auto text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full">
                    {profile.saveCount}
                  </span>
                ) : null}
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => { setOpen(false); onOpenAdmin(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                Admin Dashboard
              </button>
            )}

            <div className="border-t border-slate-100 mt-1 pt-1">
              <button
                onClick={() => { setOpen(false); signOut(); }}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
