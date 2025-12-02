import { useState, useCallback } from 'react';
import { copyToClipboard, readFromClipboard } from '../lib/utils';

/**
 * Hook for clipboard operations
 */
export function useClipboard() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState(null);

  const copy = useCallback(async (text) => {
    setError(null);
    try {
      const success = await copyToClipboard(text);
      if (success) {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return true;
      }
      throw new Error('Copy failed');
    } catch (err) {
      setError(err.message);
      return false;
    }
  }, []);

  const paste = useCallback(async () => {
    setError(null);
    try {
      const text = await readFromClipboard();
      return text;
    } catch (err) {
      setError(err.message);
      return '';
    }
  }, []);

  const reset = useCallback(() => {
    setCopied(false);
    setError(null);
  }, []);

  return { copied, error, copy, paste, reset };
}

export default useClipboard;
