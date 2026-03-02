import React, { useState, useEffect } from 'react';
import { Key, Loader2 } from 'lucide-react';

// Declare the window.aistudio interface
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface ApiKeyGuardProps {
  children: React.ReactNode;
}

export default function ApiKeyGuard({ children }: ApiKeyGuardProps) {
  const [hasKey, setHasKey] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const checkKey = async () => {
    if (window.aistudio?.hasSelectedApiKey) {
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasKey(selected);
    } else {
      // Fallback for environments where aistudio is not available (e.g. local dev outside of the platform)
      // We assume true if GEMINI_API_KEY is present, but for the specific model we might need the paid key.
      // However, to not block local dev entirely:
      setHasKey(!!process.env.GEMINI_API_KEY);
    }
  };

  useEffect(() => {
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    if (window.aistudio?.openSelectKey) {
      setIsLoading(true);
      try {
        await window.aistudio.openSelectKey();
        // Assume success after the dialog closes/returns
        setHasKey(true);
        // Reload to ensure env vars are picked up if necessary, 
        // though the system prompt says we just need to re-instantiate the client.
        // We'll just update state to render children.
      } catch (error) {
        console.error("Failed to select key:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  if (hasKey === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
      </div>
    );
  }

  if (!hasKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-200">
          <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Key className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-3">API Key Required</h2>
          <p className="text-slate-600 mb-8">
            To use the high-quality <b>Gemini 3.1 Flash Image</b> model for professional portraits, you need to select a paid API key from a Google Cloud project.
          </p>
          
          <button
            onClick={handleSelectKey}
            disabled={isLoading}
            className="w-full py-3 px-6 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Waiting for selection...
              </>
            ) : (
              "Select API Key"
            )}
          </button>
          
          <p className="mt-6 text-xs text-slate-400">
            <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="underline hover:text-indigo-600">
              Learn more about billing
            </a>
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
