import { useState } from 'react';
import { X, Star, Gift, Send, MessageSquare, ThumbsUp } from 'lucide-react';
import { cn } from '../lib/utils';
import { getIdToken } from '../services/auth';

const API_BASE = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

interface BetaFeedbackModalProps {
  show: boolean;
  onClose: () => void;
  generationCount: number;
  onSubmitted?: (eligibleForDiscount: boolean) => void;
}

export function BetaFeedbackModal({
  show,
  onClose,
  generationCount,
  onSubmitted,
}: BetaFeedbackModalProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [npsScore, setNpsScore] = useState<number | null>(null);
  const [feedback, setFeedback] = useState('');
  const [featureRequests, setFeatureRequests] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [result, setResult] = useState<{ eligibleForDiscount: boolean; message: string } | null>(null);
  const [error, setError] = useState('');

  if (!show) return null;

  const handleSubmit = async () => {
    if (rating === 0) {
      setError('Please rate your experience');
      return;
    }
    if (feedback.trim().length < 10) {
      setError('Please provide at least 10 characters of feedback');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const token = await getIdToken();
      const response = await fetch(`${API_BASE}/api/users/me/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        credentials: 'include',
        body: JSON.stringify({
          rating,
          feedback: feedback.trim(),
          npsScore: npsScore ?? undefined,
          featureRequests: featureRequests.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to submit feedback');
      }

      const data = await response.json();
      setResult(data);
      setIsSubmitted(true);
      onSubmitted?.(data.eligibleForDiscount);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit feedback');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset state when closing
    setRating(0);
    setHoverRating(0);
    setNpsScore(null);
    setFeedback('');
    setFeatureRequests('');
    setIsSubmitted(false);
    setResult(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-amber-50 to-orange-50 p-6 border-b border-amber-100">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
              <Gift className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">
                {isSubmitted ? 'Thank You!' : 'Help Us Improve'}
              </h2>
              <p className="text-sm text-amber-700">
                {isSubmitted 
                  ? 'Your feedback makes ProPortrait better' 
                  : `You've created ${generationCount} portraits`}
              </p>
            </div>
          </div>

          {!isSubmitted && (
            <div className="mt-4 p-3 bg-amber-100/50 rounded-xl border border-amber-200">
              <p className="text-sm text-amber-800 flex items-center gap-2">
                <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                <strong>Get 50% off Pro or Max for 1 year</strong> when you share feedback!
              </p>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          {isSubmitted ? (
            // Success state
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                <ThumbsUp className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-slate-700 mb-4">{result?.message}</p>
              
              {result?.eligibleForDiscount && (
                <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 mb-4">
                  <p className="text-sm text-amber-800 font-medium mb-2">
                    🎉 You're eligible for 50% off!
                  </p>
                  <p className="text-xs text-amber-700">
                    The discount will be automatically applied when you upgrade to Pro or Max.
                  </p>
                </div>
              )}

              <button
                onClick={handleClose}
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl transition-colors"
              >
                Continue
              </button>
            </div>
          ) : (
            // Form
            <div className="space-y-5">
              {/* Star Rating */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  How would you rate your portraits? <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star
                        className={cn(
                          'w-8 h-8 transition-colors',
                          (hoverRating ? star <= hoverRating : star <= rating)
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-slate-300'
                        )}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {rating > 0 && ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'][rating - 1]}
                </p>
              </div>

              {/* NPS Score */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  How likely are you to recommend ProPortrait? (0-10)
                </label>
                <div className="flex gap-1 flex-wrap">
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
                    <button
                      key={score}
                      onClick={() => setNpsScore(score)}
                      className={cn(
                        'w-8 h-8 rounded-lg text-xs font-semibold transition-colors',
                        npsScore === score
                          ? 'bg-indigo-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      )}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 px-1">
                  <span>Not likely</span>
                  <span>Very likely</span>
                </div>
              </div>

              {/* Feedback Text */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  What did you like? What should we improve? <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Your portraits... The quality... The styles... Anything you'd change?"
                  className="w-full h-24 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Minimum 10 characters ({feedback.length} chars)
                </p>
              </div>

              {/* Feature Requests */}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Any features you'd like to see?
                </label>
                <textarea
                  value={featureRequests}
                  onChange={(e) => setFeatureRequests(e.target.value)}
                  placeholder="More styles, better exports, video portraits..."
                  className="w-full h-20 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              </div>

              {/* Error */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Submit */}
              <button
                onClick={handleSubmit}
                disabled={isSubmitting || rating === 0 || feedback.length < 10}
                className={cn(
                  'w-full py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors',
                  isSubmitting || rating === 0 || feedback.length < 10
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg'
                )}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Feedback — Get 50% Off
                  </>
                )}
              </button>

              <p className="text-xs text-slate-400 text-center">
                Your feedback helps us improve ProPortrait for everyone.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BetaFeedbackModal;
