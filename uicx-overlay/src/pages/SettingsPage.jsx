import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Palette,
  Keyboard,
  Cloud,
  Info,
  Moon,
  Sun,
  Sparkles,
  Check,
  X,
  Loader2,
  ChevronLeft,
  Minus,
  Pin,
  PinOff,
  Settings,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';
import { useAuthStore } from '../stores/authStore';

function SettingsPage({ onBack }) {
  const { theme, setTheme, preferences, updatePreferences, isPinned, setIsPinned } = useAppStore();
  const [activeSection, setActiveSection] = useState('appearance');

  // Window controls
  const handleMinimize = () => window.electron?.minimize();
  const handleClose = () => window.electron?.close();
  const handleRefresh = () => {
    if (typeof window.electron?.refresh === 'function') {
      window.electron.refresh();
    } else {
      window.location.reload();
    }
  };
  const handleTogglePin = () => {
    window.electron?.togglePin();
  };

  // Sync pin state on mount
  useEffect(() => {
    const syncPinState = async () => {
      if (window.electron?.getPinState) {
        const pinState = await window.electron.getPinState();
        setIsPinned(pinState);
      }
    };
    syncPinState();

    const cleanup = window.electron?.onPinStateChanged?.((pinned) => {
      setIsPinned(pinned);
    });
    return () => cleanup?.();
  }, [setIsPinned]);

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'hotkeys', label: 'Hotkeys', icon: Keyboard },
    { id: 'sync', label: 'Cloud Sync', icon: Cloud },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="h-screen flex flex-col bg-surface-dark rounded-2xl overflow-hidden border border-glass-border">
      {/* Title Bar */}
      <div className="drag-region flex items-center justify-between h-10 px-3 border-b border-glass-border bg-surface-dark flex-shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-2">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="no-drag p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
            title="Back to Home"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-gray-600 to-gray-700 flex items-center justify-center">
            <Settings size={12} className="text-white" />
          </div>
          <h1 className="text-sm font-semibold text-white">Settings</h1>
        </div>

        <div className="no-drag flex items-center gap-1">
          <button
            onClick={handleTogglePin}
            className={`p-1.5 rounded-lg transition-colors ${
              isPinned
                ? 'text-accent-teal hover:text-accent-teal/80'
                : 'text-gray-400 hover:text-white hover:bg-glass-hover'
            }`}
            title={isPinned ? 'Unpin overlay' : 'Pin overlay'}
          >
            {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>
          <button
            onClick={handleMinimize}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Section Navigation */}
      <div className="p-4 border-b border-glass-border">
        <div className="flex gap-1 overflow-x-auto hide-scrollbar">
          {sections.map((section) => {
            const Icon = section.icon;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                  activeSection === section.id
                    ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/30'
                    : 'text-gray-400 hover:text-white hover:bg-glass-hover'
                }`}
              >
                <Icon size={14} />
                {section.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4">
        {activeSection === 'appearance' && (
          <AppearanceSettings theme={theme} setTheme={setTheme} />
        )}
        {activeSection === 'hotkeys' && (
          <HotkeySettings
            hotkeys={preferences.hotkeys}
            updateHotkeys={(hotkeys) =>
              updatePreferences({ hotkeys: { ...preferences.hotkeys, ...hotkeys } })
            }
          />
        )}
        {activeSection === 'sync' && <CloudSyncSettings />}
        {activeSection === 'about' && <AboutSection />}
      </div>
    </div>
  );
}

function AppearanceSettings({ theme, setTheme }) {
  const themes = [
    { id: 'dark', label: 'Dark', icon: Moon, description: 'Dark theme with glass effects' },
    { id: 'glass', label: 'Glass', icon: Sparkles, description: 'Maximum glassmorphism' },
    { id: 'light', label: 'Light', icon: Sun, description: 'Light theme (coming soon)', disabled: true },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Theme</h3>
        <div className="space-y-2">
          {themes.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => !t.disabled && setTheme(t.id)}
                disabled={t.disabled}
                className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                  theme === t.id
                    ? 'bg-accent-teal/10 border-accent-teal/30 text-white'
                    : t.disabled
                    ? 'bg-glass-hover/50 border-glass-border text-gray-500 cursor-not-allowed'
                    : 'bg-glass-hover border-glass-border text-gray-300 hover:border-gray-500'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    theme === t.id ? 'bg-accent-teal/20' : 'bg-surface-dark'
                  }`}>
                    <Icon size={16} className={theme === t.id ? 'text-accent-teal' : ''} />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.description}</p>
                  </div>
                </div>
                {theme === t.id && (
                  <Check size={16} className="text-accent-teal" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function HotkeySettings({ hotkeys, updateHotkeys }) {
  const defaultHotkeys = {
    copyPrompt: 'Ctrl+Enter',
    toggleOverlay: 'Ctrl+Shift+U',
    clearAll: 'Ctrl+Shift+C',
  };

  const current = { ...defaultHotkeys, ...hotkeys };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-200 mb-4">Keyboard Shortcuts</h3>
        <div className="space-y-3">
          {Object.entries(current).map(([key, value]) => (
            <div
              key={key}
              className="flex items-center justify-between p-3 bg-glass-hover rounded-xl border border-glass-border"
            >
              <span className="text-sm text-gray-300 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              <kbd className="px-3 py-1.5 bg-surface-dark rounded-lg text-xs text-gray-400 font-mono">
                {value}
              </kbd>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          Custom hotkey configuration coming soon
        </p>
      </div>
    </div>
  );
}

function CloudSyncSettings() {
  const { user, profile, isAdmin, refreshProfile } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState(null);

  const handleRefreshProfile = async () => {
    setRefreshing(true);
    setRefreshStatus(null);
    
    const result = await refreshProfile();
    
    setRefreshing(false);
    if (result.success) {
      setRefreshStatus({ type: 'success', message: 'Profile updated!' });
    } else {
      setRefreshStatus({ type: 'error', message: result.error || 'Failed to refresh' });
    }
    
    // Clear status after 3 seconds
    setTimeout(() => setRefreshStatus(null), 3000);
  };

  return (
    <div className="space-y-6">
      {user ? (
        <>
          <div>
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Account</h3>
            <div className="space-y-3">
              <div className="p-3 bg-glass-hover rounded-xl border border-glass-border">
                <p className="text-xs text-gray-500 mb-1">Email</p>
                <p className="text-sm text-gray-300">{user.email}</p>
              </div>
              <div className="p-3 bg-glass-hover rounded-xl border border-glass-border">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Role</p>
                    <p className="text-sm text-gray-300">
                      {isAdmin ? '👑 Admin' : '👤 User'}
                    </p>
                  </div>
                  <button
                    onClick={handleRefreshProfile}
                    disabled={refreshing}
                    className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-surface-dark transition-colors disabled:opacity-50"
                    title="Refresh profile"
                  >
                    <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
                  </button>
                </div>
                {refreshStatus && (
                  <p className={`text-xs mt-2 ${refreshStatus.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                    {refreshStatus.message}
                  </p>
                )}
              </div>
              {profile?.display_name && (
                <div className="p-3 bg-glass-hover rounded-xl border border-glass-border">
                  <p className="text-xs text-gray-500 mb-1">Display Name</p>
                  <p className="text-sm text-gray-300">{profile.display_name}</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-200 mb-4">Permissions</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-glass-hover rounded-xl border border-glass-border">
                <span className="text-sm text-gray-300">Can add snippets</span>
                <span className="text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                  Yes
                </span>
              </div>
              <div className="flex items-center justify-between p-3 bg-glass-hover rounded-xl border border-glass-border">
                <span className="text-sm text-gray-300">Admin access</span>
                <span className={`text-xs px-2 py-1 rounded-full ${isAdmin ? 'bg-purple-500/20 text-purple-400' : 'bg-gray-500/20 text-gray-400'}`}>
                  {isAdmin ? 'Yes' : 'No'}
                </span>
              </div>
              {isAdmin && (
                <p className="text-xs text-gray-500 mt-2">
                  ✨ Your snippets appear first in the library
                </p>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-8">
          <div className="w-16 h-16 rounded-2xl bg-glass-hover flex items-center justify-center mx-auto mb-4">
            <Cloud size={24} className="text-gray-500" />
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">Cloud Sync</h3>
          <p className="text-sm text-gray-400 max-w-sm mx-auto">
            Sign in to sync your snippets, templates, and settings across devices.
          </p>
        </div>
      )}
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-6">
      <div className="text-center py-4">
        <img src="./icon-rounded.png" alt="Code Eternal" className="w-20 h-20 mx-auto mb-4 object-cover" />
        <h3 className="text-xl font-bold text-white mb-1">Code Eternal</h3>
        <p className="text-sm text-gray-400">Version 1.0.0</p>
        <p className="text-xs text-gray-500 mt-2">Context-Aware Prompt Builder</p>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-glass-hover rounded-xl border border-glass-border">
          <p className="text-xs text-gray-500 mb-1">Description</p>
          <p className="text-sm text-gray-300">The ultimate context-aware prompt builder that enhances any AI code editor with smart templates, code snippets and composite prompts.</p>
        </div>
        <div className="p-3 bg-glass-hover rounded-xl border border-glass-border">
          <p className="text-xs text-gray-500 mb-1">Built with</p>
          <p className="text-sm text-gray-300">React + Electron + Tailwind</p>
        </div>
        <div className="p-3 bg-glass-hover rounded-xl border border-glass-border">
          <p className="text-xs text-gray-500 mb-1">AI Powered by</p>
          <p className="text-sm text-gray-300">Google Gemini</p>
        </div>
        <div className="p-3 bg-glass-hover rounded-xl border border-glass-border">
          <p className="text-xs text-gray-500 mb-1">Backend</p>
          <p className="text-sm text-gray-300">Supabase</p>
        </div>
      </div>

      <p className="text-xs text-gray-500 text-center">
        © 2024 Code Eternal. All rights reserved.
      </p>
    </div>
  );
}

export default SettingsPage;
