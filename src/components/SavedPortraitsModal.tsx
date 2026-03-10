import { useState, useEffect } from 'react';
import { X, Loader2, Trash2, FolderOpen, Image as ImageIcon, AlertTriangle } from 'lucide-react';
import { getSavedPortraits, deleteSavedPortrait } from '../services/portraits';
import type { SavedPortrait } from '../services/portraits';
import { cn } from '../lib/utils';

interface SavedPortraitsModalProps {
  open: boolean;
  onClose: () => void;
  onLoad: (imageUrl: string, style: string) => void;
}

function timeAgo(createdAt: SavedPortrait['createdAt']): string {
  if (!createdAt) return '';
  // Handle both Firestore Timestamp formats: { seconds, nanoseconds } or { _seconds, _nanoseconds }
  const seconds = (createdAt as { seconds?: number; _seconds?: number }).seconds 
    ?? (createdAt as { _seconds?: number })._seconds;
  if (typeof seconds !== 'number') return '';
  const date = new Date(seconds * 1000);
  if (isNaN(date.getTime())) return '';
  const diff = Date.now() - date.getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export default function SavedPortraitsModal({ open, onClose, onLoad }: SavedPortraitsModalProps) {
  const [portraits, setPortraits] = useState<SavedPortrait[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    setError(null);
    setDeleteConfirm(null);
    getSavedPortraits()
      .then(setPortraits)
      .catch(() => setError('Failed to load saved portraits.'))
      .finally(() => setLoading(false));
  }, [open]);

  const handleDelete = async (id: string) => {
    setDeleting(id);
    try {
      await deleteSavedPortrait(id);
      setPortraits((prev) => prev.filter((p) => p.id !== id));
      setDeleteConfirm(null);
    } catch {
      setError('Failed to delete portrait.');
    } finally {
      setDeleting(null);
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteConfirm(id);
  };

  const cancelDelete = () => {
    setDeleteConfirm(null);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-slate-900">Saved Portraits</h2>
            {portraits.length > 0 && (
              <span className="text-xs text-slate-400 font-medium">{portraits.length} saved</span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-sm">Loading your portraits…</p>
            </div>
          )}

          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-2 text-red-500">
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {!loading && !error && portraits.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-slate-400">
              <ImageIcon className="w-12 h-12 opacity-30" />
              <p className="text-sm font-medium">No saved portraits yet</p>
              <p className="text-xs text-center max-w-xs">
                Generate a portrait and click "Save to Library" to keep it here for future editing.
              </p>
            </div>
          )}

          {!loading && !error && portraits.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {portraits.map((portrait) => (
                <div
                  key={portrait.id}
                  className="group relative flex flex-col rounded-xl border border-slate-200 overflow-hidden bg-white hover:border-indigo-300 hover:shadow-md transition-all"
                >
                  {/* Thumbnail */}
                  <div className="aspect-[3/4] bg-slate-100 relative overflow-hidden">
                    {portrait.imageUrl ? (
                      <img
                        src={portrait.imageUrl}
                        alt={portrait.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-300" />
                      </div>
                    )}
                    
                    {/* Delete confirmation overlay */}
                    {deleteConfirm === portrait.id && (
                      <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-4 z-10">
                        <AlertTriangle className="w-8 h-8 text-amber-400 mb-2" />
                        <p className="text-white text-xs text-center mb-3">Delete this portrait?</p>
                        <div className="flex gap-2">
                          <button
                            onClick={cancelDelete}
                            className="px-3 py-1.5 bg-slate-600 text-white text-xs rounded-lg hover:bg-slate-500 transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleDelete(portrait.id)}
                            disabled={deleting === portrait.id}
                            className="px-3 py-1.5 bg-red-600 text-white text-xs rounded-lg hover:bg-red-500 transition-colors flex items-center gap-1"
                          >
                            {deleting === portrait.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Trash2 className="w-3 h-3" />
                            )}
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Info + Actions */}
                  <div className="p-3 flex flex-col gap-2">
                    <div>
                      <p className="text-xs font-semibold text-slate-800 truncate">{portrait.title}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[10px] font-medium text-indigo-600 bg-indigo-50 px-1.5 py-0.5 rounded-full capitalize">
                          {portrait.style}
                        </span>
                        <span className="text-[10px] text-slate-400">{timeAgo(portrait.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { onLoad(portrait.imageUrl, portrait.style); onClose(); }}
                        className="flex-1 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => confirmDelete(portrait.id)}
                        disabled={deleting === portrait.id}
                        className="px-2.5 py-1.5 border border-slate-200 text-slate-500 rounded-lg hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors"
                        aria-label="Delete portrait"
                        title="Delete portrait"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
