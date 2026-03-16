import { Shield, X, Check } from 'lucide-react';

interface PrivacyNoticeProps {
  onDismiss: () => void;
}

export default function PrivacyNotice({ onDismiss }: PrivacyNoticeProps) {
  return (
    <div className="w-full max-w-xl mx-auto mb-6 bg-emerald-50 border border-emerald-200 rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center shrink-0 mt-0.5">
          <Shield className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-emerald-900 text-sm mb-1.5">Privacy-First Processing</h4>
          <ul className="text-xs text-emerald-700 space-y-1">
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 shrink-0 text-emerald-500" />
              Your photos are sent directly to Google Gemini AI and never stored on our servers
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 shrink-0 text-emerald-500" />
              Images exist only in your browser session and are cleared when you close the tab
            </li>
            <li className="flex items-center gap-1.5">
              <Check className="w-3 h-3 shrink-0 text-emerald-500" />
              No face database, no data selling — your identity stays yours
            </li>
          </ul>
        </div>
        <button
          onClick={onDismiss}
          className="text-emerald-400 hover:text-emerald-600 transition-colors shrink-0 mt-0.5"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
