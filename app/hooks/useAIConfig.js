"use client";

import { useState, useEffect, useCallback } from 'react';

// Every store brings its own Google AI (Gemini) API key — set from the
// dashboard at Settings → AI Features. There is no shared/platform key, so
// every AI-powered tool (photo analysis, category/variant suggestions,
// voice-over, the AI theme builder's Gemini engine) is disabled until a key
// is configured. Components read `hasGeminiKey` to gate those actions and
// point sellers at Settings instead of failing silently.
export function useAIConfig() {
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res  = await fetch('/api/stores', { cache: 'no-store' });
      const data = await res.json();
      setGeminiApiKey(data?.store?.settings?.ai?.geminiApiKey || '');
    } catch {
      setGeminiApiKey('');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { geminiApiKey, hasGeminiKey: !!geminiApiKey, isLoading, refresh };
}
