import { useEffect, useCallback } from 'react';

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcut(key, callback, options = {}) {
  const { ctrl = false, shift = false, alt = false, enabled = true } = options;

  const handleKeyDown = useCallback(
    (event) => {
      if (!enabled) return;

      const isCtrlMatch = ctrl ? event.ctrlKey || event.metaKey : true;
      const isShiftMatch = shift ? event.shiftKey : true;
      const isAltMatch = alt ? event.altKey : true;
      const isKeyMatch = event.key.toLowerCase() === key.toLowerCase();

      if (isCtrlMatch && isShiftMatch && isAltMatch && isKeyMatch) {
        event.preventDefault();
        callback(event);
      }
    },
    [key, callback, ctrl, shift, alt, enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

/**
 * Hook for handling multiple shortcuts
 */
export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      for (const shortcut of shortcuts) {
        const { key, ctrl = false, shift = false, alt = false, callback, enabled = true } = shortcut;

        if (!enabled) continue;

        const isCtrlMatch = ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const isShiftMatch = shift ? event.shiftKey : !event.shiftKey;
        const isAltMatch = alt ? event.altKey : !event.altKey;
        const isKeyMatch = event.key.toLowerCase() === key.toLowerCase();

        if (isCtrlMatch && isShiftMatch && isAltMatch && isKeyMatch) {
          event.preventDefault();
          callback(event);
          break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shortcuts]);
}

export default useKeyboardShortcut;
