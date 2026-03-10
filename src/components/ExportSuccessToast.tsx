import { useEffect, useState } from 'react';
import { Check, Download, Save, Share2, X, Linkedin, Twitter, Copy } from 'lucide-react';
import { cn } from '../lib/utils';

interface ExportSuccessToastProps {
  show: boolean;
  onClose: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  canSave?: boolean;
  fileName?: string;
}

export function ExportSuccessToast({
  show,
  onClose,
  onSave,
  isSaved = false,
  canSave = true,
  fileName = 'portrait',
}: ExportSuccessToastProps) {
  const [progress, setProgress] = useState(100);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setProgress(100);
      
      // Auto-dismiss after 5 seconds
      const duration = 5000;
      const interval = 50;
      const step = 100 / (duration / interval);
      
      const timer = setInterval(() => {
        setProgress((p) => {
          if (p <= step) {
            clearInterval(timer);
            handleClose();
            return 0;
          }
          return p - step;
        });
      }, interval);

      return () => clearInterval(timer);
    }
  }, [show]);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleShare = (platform: 'linkedin' | 'twitter' | 'copy') => {
    const url = (import.meta.env.VITE_APP_URL as string) || 'https://portrait.ai-biz.app';
    const text = 'Just created my professional portrait with ProPortrait AI';
    
    switch (platform) {
      case 'linkedin':
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        navigator.clipboard.writeText(url);
        break;
    }
  };

  if (!show && !isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 z-50 w-80 transform transition-all duration-300',
        isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
      )}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Progress bar */}
        <div className="h-1 bg-slate-100">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="p-4">
          {/* Header */}
          <div className="flex items-start gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
              <Check className="w-5 h-5 text-green-600" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 text-sm">Portrait Ready!</h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {fileName} downloaded successfully
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            {/* Save button (if not saved and can save) */}
            {canSave && !isSaved && onSave && (
              <button
                onClick={() => {
                  onSave();
                  handleClose();
                }}
                className="w-full py-2 px-3 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl text-indigo-700 font-medium text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Save className="w-3.5 h-3.5" />
                Save to Library
              </button>
            )}

            {/* Share buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => handleShare('linkedin')}
                className="flex-1 py-2 px-2 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-slate-600 hover:text-blue-600 font-medium text-[10px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Linkedin className="w-3.5 h-3.5" />
                LinkedIn
              </button>
              <button
                onClick={() => handleShare('twitter')}
                className="flex-1 py-2 px-2 bg-slate-50 hover:bg-sky-50 border border-slate-200 hover:border-sky-200 rounded-lg text-slate-600 hover:text-sky-600 font-medium text-[10px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Twitter className="w-3.5 h-3.5" />
                Twitter
              </button>
              <button
                onClick={() => handleShare('copy')}
                className="flex-1 py-2 px-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-slate-600 font-medium text-[10px] flex items-center justify-center gap-1.5 transition-colors"
              >
                <Copy className="w-3.5 h-3.5" />
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ExportSuccessToast;
