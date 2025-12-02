import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { initialSnippets } from '../data/snippets';
import { supabase, uploadFile } from '../lib/supabase';
import { useAuthStore } from './authStore';
import { useProjectStore } from './projectStore';

// Available code variants for snippets
export const SNIPPET_VARIANTS = [
  { value: 'jsx', label: 'JSX', icon: '⚛️' },
  { value: 'tsx', label: 'TSX', icon: '📘' },
  { value: 'html', label: 'HTML', icon: '🌐' },
  { value: 'react', label: 'React', icon: '⚛️' },
  { value: 'tailwind', label: 'Tailwind', icon: '🎨' },
  { value: 'css', label: 'CSS', icon: '🎨' },
  { value: 'vue', label: 'Vue', icon: '💚' },
  { value: 'svelte', label: 'Svelte', icon: '🔥' },
  { value: 'angular', label: 'Angular', icon: '🅰️' },
];

// Snippet library store
export const useSnippetStore = create(
  persist(
    (set, get) => ({
      // All snippets (built-in + user's custom from Supabase)
      snippets: initialSnippets,
      userSnippets: [], // User's cloud snippets
      savedSnippetIds: [], // IDs of snippets saved by current user
      likedSnippetIds: [], // IDs of snippets liked by current user
      isLoading: false,

      // Filters
      searchQuery: '',
      selectedSource: 'all',
      selectedCategory: 'all',
      selectedTags: [],
      showSavedOnly: false, // Filter to show only saved snippets

      // View mode
      viewMode: 'grid', // 'grid' | 'list'

      // Fetch all public snippets from Supabase (global library)
      fetchSnippets: async () => {
        try {
          set({ isLoading: true });

          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const user = useAuthStore.getState().user;
          
          // Fetch snippets
          const response = await fetch(
            `${supabaseUrl}/rest/v1/snippets?select=*&order=created_at.desc`,
            {
              method: 'GET',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) throw new Error('Failed to fetch snippets');

          const data = await response.json();

          // Fetch user's likes and saves if logged in
          let userLikes = [];
          let userSaves = [];
          
          if (user) {
            const [likesRes, savesRes] = await Promise.all([
              fetch(
                `${supabaseUrl}/rest/v1/snippet_likes?user_id=eq.${user.id}&select=snippet_id`,
                {
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                  },
                }
              ),
              fetch(
                `${supabaseUrl}/rest/v1/snippet_saves?user_id=eq.${user.id}&select=snippet_id`,
                {
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                  },
                }
              ),
            ]);
            
            if (likesRes.ok) {
              const likesData = await likesRes.json();
              userLikes = likesData.map((l) => l.snippet_id);
            }
            if (savesRes.ok) {
              const savesData = await savesRes.json();
              userSaves = savesData.map((s) => s.snippet_id);
            }
          }

          // Convert Supabase format to local format
          const cloudSnippets = (data || []).map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            category: s.category,
            tags: s.tags || [],
            code: s.code,
            language: s.language,
            variants: s.variants || [],
            imageDataUrl: s.image_url,
            imageUrl: s.image_url, // Also set imageUrl for compatibility
            usage: s.usage_notes,
            source: 'cloud',
            isFavorite: s.is_favorite,
            isPublic: s.is_public,
            isAdminSnippet: s.is_admin_snippet || false,
            likesCount: s.likes_count || 0,
            createdBy: s.user_id,
            createdAt: s.created_at,
          }));

          set({
            userSnippets: cloudSnippets,
            snippets: [...initialSnippets, ...cloudSnippets],
            likedSnippetIds: userLikes,
            savedSnippetIds: userSaves,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching snippets:', error);
          set({ isLoading: false });
        }
      },

      // Legacy: Fetch user's custom snippets (now fetches all)
      fetchUserSnippets: async () => {
        return get().fetchSnippets();
      },

      // Actions
      setSearchQuery: (query) => set({ searchQuery: query }),

      setSelectedSource: (source) => set({ selectedSource: source }),

      setSelectedCategory: (category) => set({ selectedCategory: category }),

      toggleTag: (tag) => {
        set((state) => {
          const tags = state.selectedTags.includes(tag)
            ? state.selectedTags.filter((t) => t !== tag)
            : [...state.selectedTags, tag];
          return { selectedTags: tags };
        });
      },

      clearFilters: () => {
        set({
          searchQuery: '',
          selectedSource: 'all',
          selectedCategory: 'all',
          selectedTags: [],
          showSavedOnly: false,
        });
      },

      setViewMode: (mode) => set({ viewMode: mode }),

      setShowSavedOnly: (value) => set({ showSavedOnly: value }),

      // Toggle like on a snippet (one per user per snippet)
      toggleLike: async (snippetId) => {
        const user = useAuthStore.getState().user;
        const session = useAuthStore.getState().session;
        if (!user) return { success: false, error: 'Please login to like snippets' };

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const authToken = session?.access_token || supabaseKey;
        
        // First, check if user already liked this snippet (source of truth from DB)
        try {
          const checkRes = await fetch(
            `${supabaseUrl}/rest/v1/snippet_likes?snippet_id=eq.${snippetId}&user_id=eq.${user.id}&select=id`,
            {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${authToken}`,
              },
            }
          );
          const existingLike = await checkRes.json();
          const isLiked = existingLike && existingLike.length > 0;

          if (isLiked) {
            // Unlike - delete the existing like
            const deleteRes = await fetch(
              `${supabaseUrl}/rest/v1/snippet_likes?snippet_id=eq.${snippetId}&user_id=eq.${user.id}`,
              {
                method: 'DELETE',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${authToken}`,
                },
              }
            );
            
            if (deleteRes.ok) {
              // Update local state
              set((state) => ({
                likedSnippetIds: state.likedSnippetIds.filter((id) => id !== snippetId),
                snippets: state.snippets.map((s) =>
                  s.id === snippetId ? { ...s, likesCount: Math.max(0, (s.likesCount || 0) - 1) } : s
                ),
              }));
            }
          } else {
            // Like - insert new like (DB has unique constraint)
            const insertRes = await fetch(
              `${supabaseUrl}/rest/v1/snippet_likes`,
              {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'resolution=ignore-duplicates', // Ignore if already exists
                },
                body: JSON.stringify({ snippet_id: snippetId, user_id: user.id }),
              }
            );

            if (insertRes.ok || insertRes.status === 409) {
              // 409 = conflict (already liked) - just update local state
              set((state) => ({
                likedSnippetIds: state.likedSnippetIds.includes(snippetId) 
                  ? state.likedSnippetIds 
                  : [...state.likedSnippetIds, snippetId],
                snippets: state.snippets.map((s) =>
                  s.id === snippetId ? { ...s, likesCount: (s.likesCount || 0) + 1 } : s
                ),
              }));
            }
          }
          return { success: true };
        } catch (error) {
          console.error('Error toggling like:', error);
          return { success: false, error: error.message };
        }
      },

      // Toggle save on a snippet (one per user per snippet)
      toggleSave: async (snippetId) => {
        const user = useAuthStore.getState().user;
        const session = useAuthStore.getState().session;
        if (!user) return { success: false, error: 'Please login to save snippets' };

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
        const authToken = session?.access_token || supabaseKey;

        try {
          // First, check if user already saved this snippet (source of truth from DB)
          const checkRes = await fetch(
            `${supabaseUrl}/rest/v1/snippet_saves?snippet_id=eq.${snippetId}&user_id=eq.${user.id}&select=id`,
            {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${authToken}`,
              },
            }
          );
          const existingSave = await checkRes.json();
          const isSaved = existingSave && existingSave.length > 0;

          if (isSaved) {
            // Unsave - delete the existing save
            const deleteRes = await fetch(
              `${supabaseUrl}/rest/v1/snippet_saves?snippet_id=eq.${snippetId}&user_id=eq.${user.id}`,
              {
                method: 'DELETE',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${authToken}`,
                },
              }
            );

            if (deleteRes.ok) {
              set((state) => ({
                savedSnippetIds: state.savedSnippetIds.filter((id) => id !== snippetId),
              }));
            }
          } else {
            // Save - insert new save (DB has unique constraint)
            const insertRes = await fetch(
              `${supabaseUrl}/rest/v1/snippet_saves`,
              {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                  'Prefer': 'resolution=ignore-duplicates', // Ignore if already exists
                },
                body: JSON.stringify({ snippet_id: snippetId, user_id: user.id }),
              }
            );

            if (insertRes.ok || insertRes.status === 409) {
              set((state) => ({
                savedSnippetIds: state.savedSnippetIds.includes(snippetId)
                  ? state.savedSnippetIds
                  : [...state.savedSnippetIds, snippetId],
              }));
            }
          }
          return { success: true };
        } catch (error) {
          console.error('Error toggling save:', error);
          return { success: false, error: error.message };
        }
      },

      // Add custom snippet (saves to Supabase - global library)
      addSnippet: async (snippet) => {
        const user = useAuthStore.getState().user;
        const session = useAuthStore.getState().session;
        const isAdmin = useAuthStore.getState().isAdmin;

        // Must be logged in to add snippets
        if (!user) {
          return { success: false, error: 'Please login to add snippets' };
        }

        try {
          // Upload image to Supabase Storage if exists
          let imageUrl = null;
          if (snippet.imageDataUrl && snippet.imageDataUrl.startsWith('data:')) {
            const base64Data = snippet.imageDataUrl.split(',')[1];
            const mimeType = snippet.imageDataUrl.split(';')[0].split(':')[1];
            const extension = mimeType.split('/')[1];
            const fileName = `${user.id}/${Date.now()}.${extension}`;
            
            // Convert base64 to blob
            const byteCharacters = atob(base64Data);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
              byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });

            imageUrl = await uploadFile('snippet-images', fileName, blob);
          }

          // Use direct REST API to save snippet
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          
          // Use session access token for RLS, fallback to anon key
          const authToken = session?.access_token || supabaseKey;
          
          const response = await fetch(
            `${supabaseUrl}/rest/v1/snippets`,
            {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation',
              },
              body: JSON.stringify({
                user_id: user.id,
                name: snippet.name,
                description: snippet.description,
                category: snippet.category,
                tags: snippet.tags,
                code: snippet.code,
                language: snippet.language,
                variants: snippet.variants || [],
                image_url: imageUrl || snippet.imageDataUrl,
                usage_notes: snippet.usage,
                is_public: true,
                is_favorite: false,
                is_admin_snippet: isAdmin, // Mark as admin snippet if added by admin
                likes_count: 0,
              }),
            }
          );

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to add snippet');
          }

          const [data] = await response.json();

          const newSnippet = {
            id: data.id,
            name: data.name,
            description: data.description,
            category: data.category,
            tags: data.tags || [],
            code: data.code,
            language: data.language,
            variants: data.variants || [],
            imageDataUrl: data.image_url,
            imageUrl: data.image_url, // Also set imageUrl for compatibility
            usage: data.usage_notes,
            source: 'cloud',
            isAdminSnippet: data.is_admin_snippet || false,
            likesCount: data.likes_count || 0,
            createdBy: data.user_id,
            createdAt: data.created_at,
          };

          set((state) => ({
            snippets: [newSnippet, ...state.snippets],
            userSnippets: [newSnippet, ...state.userSnippets],
          }));

          return { success: true, snippet: newSnippet };
        } catch (error) {
          console.error('Error adding snippet:', error);
          return { success: false, error: error.message };
        }
      },

      // Update snippet
      updateSnippet: async (snippetId, updates) => {
        const session = useAuthStore.getState().session;
        
        // Update locally
        set((state) => ({
          snippets: state.snippets.map((s) =>
            s.id === snippetId ? { ...s, ...updates } : s
          ),
          userSnippets: state.userSnippets.map((s) =>
            s.id === snippetId ? { ...s, ...updates } : s
          ),
        }));

        // Update in Supabase if it's a cloud snippet
        if (!String(snippetId).startsWith('custom-') && !String(snippetId).startsWith('built-')) {
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const authToken = session?.access_token || supabaseKey;
            
            await fetch(
              `${supabaseUrl}/rest/v1/snippets?id=eq.${snippetId}`,
              {
                method: 'PATCH',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${authToken}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  name: updates.name,
                  description: updates.description,
                  category: updates.category,
                  tags: updates.tags,
                  code: updates.code,
                  language: updates.language,
                  image_url: updates.imageDataUrl,
                  usage_notes: updates.usage,
                }),
              }
            );
          } catch (error) {
            console.error('Error updating snippet:', error);
          }
        }
      },

      // Add image to snippet
      addImageToSnippet: (snippetId, imageDataUrl) => {
        set((state) => ({
          snippets: state.snippets.map((s) =>
            s.id === snippetId ? { ...s, imageDataUrl } : s
          ),
        }));
      },

      // Remove snippet
      removeSnippet: async (snippetId) => {
        const session = useAuthStore.getState().session;
        
        // Remove locally
        set((state) => ({
          snippets: state.snippets.filter((s) => s.id !== snippetId),
          userSnippets: state.userSnippets.filter((s) => s.id !== snippetId),
        }));

        // Delete from Supabase if it's a cloud snippet
        if (!String(snippetId).startsWith('custom-') && !String(snippetId).startsWith('built-')) {
          try {
            const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
            const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
            const authToken = session?.access_token || supabaseKey;
            
            await fetch(
              `${supabaseUrl}/rest/v1/snippets?id=eq.${snippetId}`,
              {
                method: 'DELETE',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${authToken}`,
                },
              }
            );
          } catch (error) {
            console.error('Error deleting snippet:', error);
          }
        }
      },

      // Get filtered snippets (sorted: admin snippets first, then by likes)
      getFilteredSnippets: () => {
        const state = get();
        let filtered = [...state.snippets];

        // Saved only filter
        if (state.showSavedOnly) {
          filtered = filtered.filter((s) => state.savedSnippetIds.includes(s.id));
        }

        // Search filter
        if (state.searchQuery) {
          const query = state.searchQuery.toLowerCase();
          filtered = filtered.filter(
            (s) =>
              s.name.toLowerCase().includes(query) ||
              s.description?.toLowerCase().includes(query) ||
              s.tags?.some((t) => t.toLowerCase().includes(query))
          );
        }

        // Source filter
        if (state.selectedSource !== 'all') {
          filtered = filtered.filter((s) => s.source === state.selectedSource);
        }

        // Category filter
        if (state.selectedCategory !== 'all') {
          filtered = filtered.filter(
            (s) => s.category === state.selectedCategory
          );
        }

        // Tags filter
        if (state.selectedTags.length > 0) {
          filtered = filtered.filter((s) =>
            state.selectedTags.some((tag) => s.tags?.includes(tag))
          );
        }

        // Sort: Admin snippets first, then cloud by likes, then built-in last
        filtered.sort((a, b) => {
          // Priority 1: Admin cloud snippets first
          const aAdmin = a.isAdminSnippet ? 1 : 0;
          const bAdmin = b.isAdminSnippet ? 1 : 0;
          if (bAdmin !== aAdmin) return bAdmin - aAdmin;
          
          // Priority 2: Cloud snippets before built-in
          const aCloud = a.source === 'cloud' ? 1 : 0;
          const bCloud = b.source === 'cloud' ? 1 : 0;
          if (bCloud !== aCloud) return bCloud - aCloud;
          
          // Priority 3: Sort by likes count (higher first)
          return (b.likesCount || 0) - (a.likesCount || 0);
        });

        return filtered;
      },

      // Check if snippet is liked
      isSnippetLiked: (snippetId) => get().likedSnippetIds.includes(snippetId),
      
      // Check if snippet is saved
      isSnippetSaved: (snippetId) => get().savedSnippetIds.includes(snippetId),
    }),
    {
      name: 'code-eternal-snippets-storage',
      partialize: (state) => ({
        // Persist custom snippets and user preferences
        snippets: state.snippets.filter((s) => s.source === 'custom'),
        viewMode: state.viewMode,
        savedSnippetIds: state.savedSnippetIds,
        likedSnippetIds: state.likedSnippetIds,
      }),
    }
  )
);

// Available filter options
export const SNIPPET_SOURCES = [
  { value: 'all', label: 'All Sources' },
  { value: 'shadcn', label: 'shadcn/ui' },
  { value: 'uiverse', label: 'Uiverse.io' },
  { value: 'lucide', label: 'Lucide Icons' },
  { value: 'heroicons', label: 'Heroicons' },
  { value: 'custom', label: 'Custom' },
];

export const SNIPPET_CATEGORIES = [
  { value: 'all', label: 'All Categories' },
  { value: 'buttons', label: 'Buttons' },
  { value: 'cards', label: 'Cards' },
  { value: 'forms', label: 'Forms' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'modals', label: 'Modals' },
  { value: 'layouts', label: 'Layouts' },
  { value: 'icons', label: 'Icons' },
  { value: 'animations', label: 'Animations' },
];

export const SNIPPET_TAGS = [
  'modern',
  'glass',
  'neumorphism',
  'minimal',
  'gradient',
  'animated',
  'dark',
  'light',
  'ecommerce',
  'dashboard',
  'auth',
  'social',
];
