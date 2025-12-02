import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// History store
export const useHistoryStore = create(
  persist(
    (set, get) => ({
      // Prompt history
      promptHistory: [],

      // Summary history
      summaryHistory: [],

      // Actions
      addPromptToHistory: (prompt) => {
        set((state) => ({
          promptHistory: [
            {
              id: `prompt-${Date.now()}`,
              content: prompt,
              timestamp: Date.now(),
              snippetCount: prompt.match(/###.*?\(/g)?.length || 0,
            },
            ...state.promptHistory.slice(0, 99), // Keep last 100
          ],
        }));
      },

      removePromptFromHistory: (id) => {
        set((state) => ({
          promptHistory: state.promptHistory.filter((p) => p.id !== id),
        }));
      },

      clearPromptHistory: () => set({ promptHistory: [] }),

      addSummaryToHistory: (summary) => {
        set((state) => ({
          summaryHistory: [
            {
              id: `summary-${Date.now()}`,
              ...summary,
              timestamp: Date.now(),
            },
            ...state.summaryHistory.slice(0, 49), // Keep last 50
          ],
        }));
      },

      removeSummaryFromHistory: (id) => {
        set((state) => ({
          summaryHistory: state.summaryHistory.filter((s) => s.id !== id),
        }));
      },

      clearSummaryHistory: () => set({ summaryHistory: [] }),

      // Get recent prompts
      getRecentPrompts: (count = 10) => {
        return get().promptHistory.slice(0, count);
      },

      // Get recent summaries
      getRecentSummaries: (count = 10) => {
        return get().summaryHistory.slice(0, count);
      },
    }),
    {
      name: 'build-eternal-history-storage',
    }
  )
);
