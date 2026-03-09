import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Briefcase,
  Crown,
  Palette,
  HeartHandshake,
  Sparkles,
  ChevronRight,
  Check,
  Loader2,
  User,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { saveOnboarding } from '../services/onboarding';
import type { PortraitDefaults } from '../types/onboarding';
import {
  PURPOSE_OPTIONS,
  INDUSTRY_OPTIONS,
  VIBE_OPTIONS,
  USE_CASE_OPTIONS,
  type IcpSegment,
  type VibePreference,
  getOnboardingSummary,
  type OnboardingData,
} from '../types/onboarding';

interface OnboardingModalProps {
  open: boolean;
  onComplete: (defaults: PortraitDefaults) => void;
  onSkip?: () => void;
}

type Step = 1 | 2 | 3;

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  briefcase: Briefcase,
  crown: Crown,
  palette: Palette,
  'heart-handshake': HeartHandshake,
  sparkles: Sparkles,
};

export default function OnboardingModal({ open, onComplete, onSkip }: OnboardingModalProps) {
  const [step, setStep] = useState<Step>(1);
  const [purpose, setPurpose] = useState<IcpSegment | null>(null);
  const [industry, setIndustry] = useState<string>('');
  const [vibe, setVibe] = useState<VibePreference | null>(null);
  const [useCases, setUseCases] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const handlePurposeSelect = (id: IcpSegment) => {
    setPurpose(id);
    setIndustry(''); // Reset industry when purpose changes
  };

  const handleIndustrySelect = (id: string) => {
    setIndustry(id);
  };

  const handleVibeSelect = (id: VibePreference) => {
    setVibe(id);
  };

  const handleUseCaseToggle = (id: string) => {
    setUseCases((prev) =>
      prev.includes(id) ? prev.filter((u) => u !== id) : [...prev, id]
    );
  };

  const canProceedStep1 = purpose && industry;
  const canProceedStep2 = vibe;

  const handleNext = () => {
    if (step === 1 && canProceedStep1) {
      setStep(2);
    } else if (step === 2 && canProceedStep2) {
      setStep(3);
    }
  };

  const handleBack = () => {
    if (step === 2) setStep(1);
    else if (step === 3) setStep(2);
  };

  const handleSubmit = async () => {
    if (!purpose || !industry || !vibe) return;

    setIsSubmitting(true);
    setError('');

    try {
      const data: OnboardingData = {
        icpSegment: purpose,
        industry,
        vibePreference: vibe,
        primaryUseCases: useCases,
      };

      const defaults = await saveOnboarding(data);
      onComplete(defaults);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save preferences');
      setIsSubmitting(false);
    }
  };

  const getSummary = () => {
    if (!purpose || !vibe) return '';
    return getOnboardingSummary({
      icpSegment: purpose,
      industry,
      vibePreference: vibe,
      primaryUseCases: useCases,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="px-8 pt-8 pb-4 border-b border-slate-100">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                {step === 3 ? 'Your Portrait Settings' : 'Personalize Your Experience'}
              </h2>
              <p className="text-sm text-slate-500 mt-1">
                {step === 1 && 'Tell us about yourself for the best results'}
                {step === 2 && 'How do you want to come across?'}
                {step === 3 && "We've customized everything based on your answers"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={cn(
                    'w-2.5 h-2.5 rounded-full transition-colors',
                    s === step
                      ? 'bg-indigo-600'
                      : s < step
                        ? 'bg-green-500'
                        : 'bg-slate-200'
                  )}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Purpose & Industry */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Purpose Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    What will you primarily use your portrait for?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {PURPOSE_OPTIONS.map((option) => {
                      const Icon = iconMap[option.icon] || User;
                      return (
                        <button
                          key={option.id}
                          onClick={() => handlePurposeSelect(option.id)}
                          className={cn(
                            'flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all',
                            purpose === option.id
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                          )}
                        >
                          <div
                            className={cn(
                              'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                              purpose === option.id
                                ? 'bg-indigo-600 text-white'
                                : 'bg-slate-100 text-slate-500'
                            )}
                          >
                            <Icon className="w-5 h-5" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold text-slate-900 text-sm">
                              {option.label}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {option.description}
                            </div>
                          </div>
                          {purpose === option.id && (
                            <Check className="w-5 h-5 text-indigo-600 ml-auto shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Industry Selection */}
                {purpose && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <h3 className="text-sm font-semibold text-slate-900 mb-3">
                      What field are you in?
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {INDUSTRY_OPTIONS[purpose].map((option) => (
                        <button
                          key={option.id}
                          onClick={() => handleIndustrySelect(option.id)}
                          className={cn(
                            'flex items-center gap-3 px-4 py-3 rounded-xl border-2 text-left transition-all',
                            industry === option.id
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                          )}
                        >
                          <Building2
                            className={cn(
                              'w-4 h-4 shrink-0',
                              industry === option.id
                                ? 'text-indigo-600'
                                : 'text-slate-400'
                            )}
                          />
                          <span
                            className={cn(
                              'text-sm font-medium',
                              industry === option.id
                                ? 'text-indigo-900'
                                : 'text-slate-700'
                            )}
                          >
                            {option.label}
                          </span>
                          {industry === option.id && (
                            <Check className="w-4 h-4 text-indigo-600 ml-auto shrink-0" />
                          )}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {/* Step 2: Vibe & Use Cases */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Vibe Selection */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-3">
                    How do you want to come across?
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {VIBE_OPTIONS.map((option) => (
                      <button
                        key={option.id}
                        onClick={() => handleVibeSelect(option.id)}
                        className={cn(
                          'flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all',
                          vibe === option.id
                            ? 'border-indigo-600 bg-indigo-50'
                            : 'border-slate-200 hover:border-indigo-200 hover:bg-slate-50'
                        )}
                      >
                        <span className="text-3xl">{option.emoji}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-slate-900 text-sm">
                            {option.label}
                          </div>
                          <div className="text-xs text-slate-500 mt-0.5">
                            {option.description}
                          </div>
                        </div>
                        {vibe === option.id && (
                          <Check className="w-5 h-5 text-indigo-600 shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Use Cases (Optional) */}
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 mb-2">
                    Where will this photo most likely be seen?{' '}
                    <span className="text-slate-400 font-normal">(Optional)</span>
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {USE_CASE_OPTIONS.map((option) => {
                      const isSelected = useCases.includes(option.id);
                      return (
                        <button
                          key={option.id}
                          onClick={() => handleUseCaseToggle(option.id)}
                          className={cn(
                            'px-4 py-2 rounded-full text-sm font-medium border transition-all',
                            isSelected
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-200'
                          )}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Summary */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="text-center space-y-6"
              >
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <Check className="w-10 h-10 text-green-600" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Perfect! We've customized your settings
                  </h3>
                  <p className="text-slate-500 mt-1">{getSummary()}</p>
                </div>

                <div className="bg-slate-50 rounded-2xl p-6 text-left space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Selected Style</span>
                    <span className="text-sm font-semibold text-slate-900 capitalize">
                      {purpose === 'career'
                        ? 'Editorial'
                        : purpose === 'executive'
                          ? vibe === 'bold'
                            ? 'Environmental'
                            : 'Editorial'
                          : purpose === 'creative_tech'
                            ? vibe === 'creative'
                              ? 'Watercolor'
                              : vibe === 'bold'
                                ? 'Cyberpunk'
                                : 'Candid'
                            : purpose === 'service'
                              ? vibe === 'warm'
                                ? 'Environmental'
                                : 'Editorial'
                              : vibe === 'creative'
                                ? 'Watercolor'
                                : vibe === 'bold'
                                  ? 'Cyberpunk'
                                  : 'Vintage'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Expression</span>
                    <span className="text-sm font-semibold text-slate-900 capitalize">
                      {purpose === 'career' || purpose === 'executive'
                        ? 'Confident'
                        : purpose === 'creative_tech' || purpose === 'service'
                          ? 'Warm Smile'
                          : 'Natural'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Skin Smoothing</span>
                    <span className="text-sm font-semibold text-slate-900 capitalize">
                      {purpose === 'career' || purpose === 'executive'
                        ? 'Polished'
                        : purpose === 'creative_tech' || purpose === 'service'
                          ? 'Polished'
                          : 'Natural'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-500">Background</span>
                    <span className="text-sm font-semibold text-slate-900">
                      {purpose === 'career'
                        ? 'Professional Neutrals'
                        : purpose === 'executive'
                          ? 'Premium Darks'
                          : purpose === 'creative_tech'
                            ? 'Environmental'
                            : purpose === 'service'
                              ? 'Warm Neutrals'
                              : 'Creative'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-slate-400">
                  You can change these anytime in your Profile settings
                </p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                    {error}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-8 py-6 border-t border-slate-100 flex items-center justify-between">
          {step > 1 ? (
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="text-slate-500 hover:text-slate-700 font-medium text-sm px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Back
            </button>
          ) : (
            <button
              onClick={onSkip}
              className="text-slate-400 hover:text-slate-600 font-medium text-sm px-4 py-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              Skip for now
            </button>
          )}

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={step === 1 ? !canProceedStep1 : !canProceedStep2}
              className={cn(
                'flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all',
                (step === 1 ? !canProceedStep1 : !canProceedStep2)
                  ? 'opacity-50 cursor-not-allowed'
                  : 'hover:bg-indigo-700'
              )}
            >
              Continue
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className={cn(
                'flex items-center gap-2 bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-all',
                isSubmitting ? 'opacity-70' : 'hover:bg-indigo-700'
              )}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Create My Portrait
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
