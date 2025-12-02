/**
 * Utility functions for Build Eternal
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with conflict resolution
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Generate unique ID
 */
export function generateId(prefix = 'id') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Debounce function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 */
export function throttle(func, limit) {
  let inThrottle;
  return function (...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Format relative time
 */
export function formatRelativeTime(timestamp) {
  const now = Date.now();
  const diff = now - timestamp;

  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text, maxLength) {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + '...';
}

/**
 * Copy text to clipboard
 */
export async function copyToClipboard(text) {
  if (window.electron) {
    return await window.electron.copyToClipboard(text);
  }
  
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy:', err);
    return false;
  }
}

/**
 * Read text from clipboard
 */
export async function readFromClipboard() {
  if (window.electron) {
    return await window.electron.readFromClipboard();
  }
  
  try {
    return await navigator.clipboard.readText();
  } catch (err) {
    console.error('Failed to read clipboard:', err);
    return '';
  }
}

/**
 * Storage helpers for persistence
 */
export const storage = {
  get: (key, defaultValue = null) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },

  clear: () => {
    try {
      localStorage.clear();
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Parse code from various formats
 */
export function parseCodeBlock(text) {
  // Match code blocks with language
  const codeBlockMatch = text.match(/```(\w+)?\n?([\s\S]*?)```/);
  if (codeBlockMatch) {
    return {
      language: codeBlockMatch[1] || 'plaintext',
      code: codeBlockMatch[2].trim(),
    };
  }

  // Inline code
  const inlineMatch = text.match(/`([^`]+)`/);
  if (inlineMatch) {
    return {
      language: 'plaintext',
      code: inlineMatch[1],
    };
  }

  return null;
}

/**
 * Validate URL
 */
export function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sleep/delay helper
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Platform detection
 */
export const platform = {
  isWindows: typeof window !== 'undefined' && window.platform?.isWindows,
  isMac: typeof window !== 'undefined' && window.platform?.isMac,
  isLinux: typeof window !== 'undefined' && window.platform?.isLinux,
  isElectron: typeof window !== 'undefined' && !!window.electron,
};

/**
 * Keyboard shortcut formatter
 */
export function formatShortcut(shortcut) {
  return shortcut
    .replace('CommandOrControl', platform.isMac ? '⌘' : 'Ctrl')
    .replace('Shift', platform.isMac ? '⇧' : 'Shift')
    .replace('Alt', platform.isMac ? '⌥' : 'Alt')
    .replace(/\+/g, ' + ');
}
