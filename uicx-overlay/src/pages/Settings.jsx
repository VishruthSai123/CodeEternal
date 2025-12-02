import { useState } from 'react';
import {
  Palette,
  Keyboard,
  Cloud,
  Info,
  Moon,
  Sun,
  Sparkles,
} from 'lucide-react';
import { useAppStore } from '../stores/appStore';

function Settings() {
  const { theme, setTheme, preferences, updatePreferences } = useAppStore();
  const [activeSection, setActiveSection] = useState('appearance');

  const sections = [
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'hotkeys', label: 'Hotkeys', icon: Keyboard },
    { id: 'sync', label: 'Cloud Sync', icon: Cloud },
    { id: 'about', label: 'About', icon: Info },
  ];

  return (
    <div className="h-full flex flex-col">
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
                    ? 'bg-accent-teal/10 border-accent-teal/30'
                    : t.disabled
                    ? 'bg-glass-hover/50 border-glass-border opacity-50 cursor-not-allowed'
                    : 'bg-glass-hover border-glass-border hover:border-accent-teal/20'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      theme === t.id ? 'bg-accent-teal/20' : 'bg-surface-dark'
                    }`}
                  >
                    <Icon
                      size={16}
                      className={theme === t.id ? 'text-accent-teal' : 'text-gray-400'}
                    />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-200">{t.label}</p>
                    <p className="text-xs text-gray-500">{t.description}</p>
                  </div>
                </div>
                {theme === t.id && (
                  <div className="w-2 h-2 rounded-full bg-accent-teal" />
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
  const hotkeyOptions = [
    { id: 'toggleOverlay', label: 'Toggle Overlay', current: hotkeys.toggleOverlay },
    { id: 'copyPrompt', label: 'Quick Copy Prompt', current: hotkeys.copyPrompt },
    { id: 'pastePrompt', label: 'Paste to Editor', current: hotkeys.pastePrompt },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-sm font-semibold text-gray-200 mb-4">
          Keyboard Shortcuts
        </h3>
        <div className="space-y-2">
          {hotkeyOptions.map((hotkey) => (
            <div
              key={hotkey.id}
              className="flex items-center justify-between p-3 bg-glass-hover border border-glass-border rounded-xl"
            >
              <span className="text-sm text-gray-300">{hotkey.label}</span>
              <div className="flex items-center gap-2">
                <kbd className="px-2 py-1 text-xs bg-surface-dark border border-glass-border rounded-md text-gray-400 font-mono">
                  {hotkey.current}
                </kbd>
                {/* Future: Add edit button */}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-3">
          💡 Hotkey customization coming in v1.0
        </p>
      </div>
    </div>
  );
}

function CloudSyncSettings() {
  return (
    <div className="space-y-6">
      <div className="p-6 bg-glass-hover border border-glass-border rounded-xl text-center">
        <Cloud size={32} className="mx-auto text-gray-500 mb-3" />
        <h3 className="text-sm font-semibold text-gray-200 mb-2">
          Cloud Sync
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Sync your snippets and settings across devices
        </p>
        <button className="px-4 py-2 text-sm bg-glass-active border border-glass-border rounded-lg text-gray-400 cursor-not-allowed">
          Coming in v2.0
        </button>
      </div>
    </div>
  );
}

function AboutSection() {
  return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <img src="./icon-rounded.png" alt="Code Eternal" className="w-16 h-16 mx-auto object-cover mb-4" />
        <h2 className="text-xl font-bold text-gradient mb-1">Code Eternal</h2>
        <p className="text-sm text-gray-500">Version 1.0.0</p>
        <p className="text-xs text-accent-teal mt-1">Context-Aware Prompt Builder</p>
      </div>

      <div className="space-y-3">
        <div className="p-3 bg-glass-hover border border-glass-border rounded-xl">
          <p className="text-sm text-gray-300">
            The ultimate context-aware prompt builder that enhances any AI code editor with
            smart templates, code snippets and composite prompts.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2 text-center">
          <div className="p-3 bg-glass-hover border border-glass-border rounded-xl">
            <p className="text-lg font-bold text-accent-teal">17+</p>
            <p className="text-xs text-gray-500">Built-in Snippets</p>
          </div>
          <div className="p-3 bg-glass-hover border border-glass-border rounded-xl">
            <p className="text-lg font-bold text-accent-purple">4</p>
            <p className="text-xs text-gray-500">Templates</p>
          </div>
        </div>

        <div className="pt-4 border-t border-glass-border">
          <p className="text-xs text-gray-500 text-center">
            Made with 💜 for Vibe Coders everywhere
          </p>
        </div>
      </div>
    </div>
  );
}

export default Settings;
