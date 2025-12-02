import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Main application store
export const useAppStore = create(
  persist(
    (set, get) => ({
      // App state
      isInitialized: false,
      isPinned: true,
      theme: 'dark',
      activeTab: 'prompt', // Current active tab in project view

      // User preferences
      preferences: {
        defaultFramework: 'react',
        defaultStyleSystem: 'tailwind',
        autoSummarize: true,
        llmProvider: 'none',
        geminiApiKey: '',
        geminiModel: 'gemini-2.0-flash',
        hotkeys: {
          toggleOverlay: 'CommandOrControl+Shift+U',
          copyPrompt: 'CommandOrControl+Shift+C',
          pastePrompt: 'CommandOrControl+Shift+V',
        },
      },

      // Actions
      initializeApp: () => {
        set({ isInitialized: true });
      },

      setIsPinned: (isPinned) => set({ isPinned }),

      setTheme: (theme) => set({ theme }),

      setActiveTab: (tab) => set({ activeTab: tab }),

      updatePreferences: (updates) => {
        set((state) => ({
          preferences: { ...state.preferences, ...updates },
        }));
      },

      // Get API key (utility)
      getGeminiApiKey: () => get().preferences.geminiApiKey,
    }),
    {
      name: 'code-eternal-app-storage',
      partialize: (state) => ({
        theme: state.theme,
        preferences: state.preferences,
      }),
    }
  )
);
