import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

interface SessionWarningModalProps {
  open: boolean;
  onStayLoggedIn: () => void;
  onLogout: () => void;
  remainingSeconds?: number;
}

export default function SessionWarningModal({
  open,
  onStayLoggedIn,
  onLogout,
  remainingSeconds = 60,
}: SessionWarningModalProps) {
  const [countdown, setCountdown] = useState(remainingSeconds);

  useEffect(() => {
    if (!open) {
      setCountdown(remainingSeconds);
      return;
    }

    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [open, remainingSeconds, onLogout]);

  if (!open) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="p-6 text-center">
          {/* Icon */}
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-amber-600" />
          </div>

          {/* Title */}
          <h3 className="text-xl font-bold text-slate-900 mb-2">
            Session Expiring Soon
          </h3>

          {/* Message */}
          <p className="text-slate-500 mb-6">
            You have been inactive for a while. Your session will expire in{' '}
            <span className="font-semibold text-amber-600">{formatTime(countdown)}</span>{' '}
            for security reasons.
          </p>

          {/* Countdown bar */}
          <div className="w-full h-2 bg-slate-100 rounded-full mb-6 overflow-hidden">
            <motion.div
              className="h-full bg-amber-500"
              initial={{ width: '100%' }}
              animate={{ width: `${(countdown / remainingSeconds) * 100}%` }}
              transition={{ duration: 1, ease: 'linear' }}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onLogout}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-slate-200 rounded-xl text-slate-600 font-medium hover:bg-slate-50 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout Now
            </button>
            <button
              onClick={onStayLoggedIn}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 rounded-xl text-white font-medium hover:bg-indigo-700 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Stay Logged In
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
