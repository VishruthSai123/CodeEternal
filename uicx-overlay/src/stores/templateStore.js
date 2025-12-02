import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

// Template categories - DESIGN STYLES (not UI component types!)
// Categories = Design styles, Templates = Full pages, Components = UI elements
export const TEMPLATE_CATEGORIES = [
  { value: 'all', label: 'All Styles', icon: 'layout-grid' },
  { value: 'glassmorphism', label: 'Glassmorphism', icon: 'glasses', color: 'teal' },
  { value: 'neumorphism', label: 'Neumorphism', icon: 'circle', color: 'purple' },
  { value: 'modern-minimal', label: 'Modern Minimal', icon: 'minus', color: 'blue' },
  { value: 'dark-mode', label: 'Dark Mode', icon: 'moon', color: 'gray' },
  { value: 'gradient', label: 'Gradient', icon: 'palette', color: 'pink' },
  { value: 'brutalist', label: 'Brutalist', icon: 'square', color: 'yellow' },
  { value: 'neo-brutalism', label: 'Neo-Brutalism', icon: 'zap', color: 'red' },
  { value: 'retro-vintage', label: 'Retro/Vintage', icon: 'radio', color: 'orange' },
  { value: 'flat-design', label: 'Flat Design', icon: 'layers', color: 'green' },
  { value: 'material-design', label: 'Material Design', icon: 'box', color: 'blue' },
  { value: 'cyberpunk', label: 'Cyberpunk', icon: 'cpu', color: 'cyan' },
  { value: 'pastel', label: 'Pastel', icon: 'cloud', color: 'pink' },
  { value: 'corporate', label: 'Corporate', icon: 'briefcase', color: 'slate' },
  { value: 'playful', label: 'Playful', icon: 'smile', color: 'yellow' },
];

// Code language options (ONE per template)
export const CODE_LANGUAGES = [
  { value: 'jsx', label: 'JSX' },
  { value: 'tsx', label: 'TSX' },
  { value: 'html', label: 'HTML' },
  { value: 'vue', label: 'Vue' },
  { value: 'svelte', label: 'Svelte' },
  { value: 'css', label: 'CSS' },
];

// Component types - UI ELEMENT categories within templates
// These are the individual pieces that make up full page templates
export const COMPONENT_TYPES = [
  { value: 'button', label: 'Button' },
  { value: 'header', label: 'Header' },
  { value: 'navigation', label: 'Navigation' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'card', label: 'Card' },
  { value: 'form', label: 'Form' },
  { value: 'input', label: 'Input' },
  { value: 'modal', label: 'Modal' },
  { value: 'table', label: 'Table' },
  { value: 'footer', label: 'Footer' },
  { value: 'hero', label: 'Hero Section' },
  { value: 'alert', label: 'Alert/Toast' },
  { value: 'badge', label: 'Badge' },
  { value: 'avatar', label: 'Avatar' },
  { value: 'dropdown', label: 'Dropdown' },
  { value: 'tabs', label: 'Tabs' },
  { value: 'accordion', label: 'Accordion' },
  { value: 'tooltip', label: 'Tooltip' },
  { value: 'progress', label: 'Progress' },
  { value: 'skeleton', label: 'Skeleton' },
  { value: 'other', label: 'Other' },
];

export const useTemplateStore = create(
  persist(
    (set, get) => ({
      // All templates from database
      templates: [],
      categories: [],
      
      // User interactions
      likedTemplateIds: [],
      savedTemplateIds: [],
      
      // Loading states
      isLoading: false,
      isCategoriesLoading: false,
      
      // Filters
      searchQuery: '',
      selectedCategory: 'all',
      showSavedOnly: false,
      
      // View mode
      viewMode: 'grid', // 'grid' | 'list'

      // =============================================
      // FETCH CATEGORIES
      // =============================================
      fetchCategories: async () => {
        try {
          set({ isCategoriesLoading: true });

          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          const response = await fetch(
            `${supabaseUrl}/rest/v1/template_categories?select=*&order=sort_order.asc`,
            {
              method: 'GET',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) throw new Error('Failed to fetch categories');

          const data = await response.json();

          const formattedCategories = [
            { value: 'all', label: 'All Templates', icon: 'layout-grid' },
            ...(data || []).map((cat) => ({
              id: cat.id,
              value: cat.slug,
              label: cat.name,
              description: cat.description,
              icon: cat.icon,
              color: cat.color,
            })),
          ];

          set({ categories: formattedCategories, isCategoriesLoading: false });
        } catch (error) {
          console.error('Error fetching template categories:', error);
          set({ isCategoriesLoading: false });
        }
      },

      // =============================================
      // FETCH ALL TEMPLATES
      // =============================================
      fetchTemplates: async () => {
        try {
          set({ isLoading: true });

          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const user = useAuthStore.getState().user;

          // Fetch templates with category info
          const response = await fetch(
            `${supabaseUrl}/rest/v1/templates?select=*,template_categories(name,slug,icon,color)&order=created_at.desc`,
            {
              method: 'GET',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          if (!response.ok) throw new Error('Failed to fetch templates');

          const data = await response.json();

          // Fetch all template components
          const componentsRes = await fetch(
            `${supabaseUrl}/rest/v1/template_components?select=*&order=sort_order.asc`,
            {
              method: 'GET',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
              },
            }
          );

          let allComponents = [];
          if (componentsRes.ok) {
            allComponents = await componentsRes.json();
          }

          // Fetch user's likes and saves if logged in
          let userLikes = [];
          let userSaves = [];

          if (user) {
            const [likesRes, savesRes] = await Promise.all([
              fetch(
                `${supabaseUrl}/rest/v1/template_likes?user_id=eq.${user.id}&select=template_id`,
                {
                  headers: {
                    'apikey': supabaseKey,
                    'Authorization': `Bearer ${supabaseKey}`,
                  },
                }
              ),
              fetch(
                `${supabaseUrl}/rest/v1/template_saves?user_id=eq.${user.id}&select=template_id`,
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
              userLikes = likesData.map((l) => l.template_id);
            }
            if (savesRes.ok) {
              const savesData = await savesRes.json();
              userSaves = savesData.map((s) => s.template_id);
            }
          }

          // Format templates with their components
          const formattedTemplates = (data || []).map((t) => ({
            id: t.id,
            name: t.name,
            description: t.description,
            categoryId: t.category_id,
            categorySlug: t.template_categories?.slug,
            categoryName: t.template_categories?.name,
            categoryIcon: t.template_categories?.icon,
            categoryColor: t.template_categories?.color,
            code: t.code,
            language: t.language,
            // Components (variants) for this template
            components: allComponents
              .filter((c) => c.template_id === t.id)
              .map((c) => ({
                id: c.id,
                name: c.name,
                description: c.description,
                componentType: c.component_type,
                imageUrl: c.image_url,
                code: c.code,
                sortOrder: c.sort_order,
              })),
            previewUrl: t.preview_url,
            thumbnailUrl: t.thumbnail_url,
            tags: t.tags || [],
            framework: t.framework,
            styleLibrary: t.style_library,
            colorPalette: t.color_palette,
            usageNotes: t.usage_notes,
            defaultConstraints: t.default_constraints || {},
            userId: t.user_id,
            isPublic: t.is_public,
            likesCount: t.likes_count || 0,
            savesCount: t.saves_count || 0,
            viewsCount: t.views_count || 0,
            createdAt: t.created_at,
            updatedAt: t.updated_at,
          }));

          set({
            templates: formattedTemplates,
            likedTemplateIds: userLikes,
            savedTemplateIds: userSaves,
            isLoading: false,
          });
        } catch (error) {
          console.error('Error fetching templates:', error);
          set({ isLoading: false });
        }
      },

      // =============================================
      // FETCH TEMPLATE COMPONENTS
      // =============================================
      fetchTemplateComponents: async (templateId) => {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

          const response = await fetch(
            `${supabaseUrl}/rest/v1/template_components?template_id=eq.${templateId}&order=sort_order.asc`,
            {
              method: 'GET',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
              },
            }
          );

          if (!response.ok) throw new Error('Failed to fetch template components');

          const data = await response.json();
          return data.map((c) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            componentType: c.component_type,
            imageUrl: c.image_url,
            code: c.code,
            sortOrder: c.sort_order,
          }));
        } catch (error) {
          console.error('Error fetching template components:', error);
          return [];
        }
      },

      // =============================================
      // ADD TEMPLATE
      // =============================================
      addTemplate: async (templateData) => {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const user = useAuthStore.getState().user;

          // Get category ID from slug
          const categories = get().categories;
          const category = categories.find((c) => c.value === templateData.categorySlug);

          // Upload main image if provided
          let previewUrl = null;
          let thumbnailUrl = null;

          if (templateData.mainImage?.dataUrl) {
            const response = await fetch(templateData.mainImage.dataUrl);
            const blob = await response.blob();
            const fileName = `main-${Date.now()}.${blob.type.split('/')[1] || 'png'}`;

            const uploadRes = await fetch(
              `${supabaseUrl}/storage/v1/object/templates/${fileName}`,
              {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': blob.type,
                },
                body: blob,
              }
            );

            if (uploadRes.ok) {
              previewUrl = `${supabaseUrl}/storage/v1/object/public/templates/${fileName}`;
              thumbnailUrl = previewUrl;
            }
          }

          // Insert template
          const insertData = {
            name: templateData.name,
            description: templateData.description,
            category_id: category?.id || null,
            code: templateData.code,
            language: templateData.language || 'jsx',
            preview_url: previewUrl,
            thumbnail_url: thumbnailUrl,
            tags: templateData.tags || [],
            framework: templateData.framework || 'react',
            style_library: templateData.styleLibrary || 'tailwind',
            color_palette: templateData.colorPalette || null,
            usage_notes: templateData.usageNotes,
            default_constraints: templateData.defaultConstraints || {},
            user_id: user?.id,
            is_public: true,
          };

          const response = await fetch(`${supabaseUrl}/rest/v1/templates`, {
            method: 'POST',
            headers: {
              'apikey': supabaseKey,
              'Authorization': `Bearer ${supabaseKey}`,
              'Content-Type': 'application/json',
              'Prefer': 'return=representation',
            },
            body: JSON.stringify(insertData),
          });

          if (!response.ok) throw new Error('Failed to add template');

          const [newTemplate] = await response.json();

          // Insert components (variants) if provided
          if (templateData.components && templateData.components.length > 0 && newTemplate) {
            const componentInserts = [];

            for (let i = 0; i < templateData.components.length; i++) {
              const comp = templateData.components[i];
              let componentImageUrl = null;

              // Upload component image if provided
              if (comp.imageDataUrl) {
                const imgResponse = await fetch(comp.imageDataUrl);
                const blob = await imgResponse.blob();
                const fileName = `comp-${Date.now()}-${i}.${blob.type.split('/')[1] || 'png'}`;

                const uploadRes = await fetch(
                  `${supabaseUrl}/storage/v1/object/templates/${fileName}`,
                  {
                    method: 'POST',
                    headers: {
                      'apikey': supabaseKey,
                      'Authorization': `Bearer ${supabaseKey}`,
                      'Content-Type': blob.type,
                    },
                    body: blob,
                  }
                );

                if (uploadRes.ok) {
                  componentImageUrl = `${supabaseUrl}/storage/v1/object/public/templates/${fileName}`;
                }
              }

              componentInserts.push({
                template_id: newTemplate.id,
                name: comp.name || `Component ${i + 1}`,
                description: comp.description || '',
                component_type: comp.componentType || 'other',
                image_url: componentImageUrl,
                code: comp.code || '',
                sort_order: i,
              });
            }

            if (componentInserts.length > 0) {
              await fetch(`${supabaseUrl}/rest/v1/template_components`, {
                method: 'POST',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify(componentInserts),
              });
            }
          }

          // Refresh templates
          await get().fetchTemplates();

          return newTemplate;
        } catch (error) {
          console.error('Error adding template:', error);
          throw error;
        }
      },

      // =============================================
      // LIKE / UNLIKE TEMPLATE (one per user per template)
      // =============================================
      toggleLike: async (templateId) => {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const user = useAuthStore.getState().user;

          if (!user) {
            console.log('Must be logged in to like');
            return;
          }

          // First, check if user already liked this template (source of truth from DB)
          const checkRes = await fetch(
            `${supabaseUrl}/rest/v1/template_likes?template_id=eq.${templateId}&user_id=eq.${user.id}&select=id`,
            {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
              },
            }
          );
          const existingLike = await checkRes.json();
          const isLiked = existingLike && existingLike.length > 0;

          const { templates } = get();

          if (isLiked) {
            // Unlike - delete the existing like
            const deleteRes = await fetch(
              `${supabaseUrl}/rest/v1/template_likes?template_id=eq.${templateId}&user_id=eq.${user.id}`,
              {
                method: 'DELETE',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                },
              }
            );

            if (deleteRes.ok) {
              set({
                likedTemplateIds: get().likedTemplateIds.filter((id) => id !== templateId),
                templates: templates.map((t) =>
                  t.id === templateId ? { ...t, likesCount: Math.max(0, t.likesCount - 1) } : t
                ),
              });
            }
          } else {
            // Like - insert new like (DB has unique constraint)
            const insertRes = await fetch(`${supabaseUrl}/rest/v1/template_likes`, {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=ignore-duplicates', // Ignore if already exists
              },
              body: JSON.stringify({
                template_id: templateId,
                user_id: user.id,
              }),
            });

            if (insertRes.ok || insertRes.status === 409) {
              set({
                likedTemplateIds: get().likedTemplateIds.includes(templateId)
                  ? get().likedTemplateIds
                  : [...get().likedTemplateIds, templateId],
                templates: templates.map((t) =>
                  t.id === templateId ? { ...t, likesCount: t.likesCount + 1 } : t
                ),
              });
            }
          }
        } catch (error) {
          console.error('Error toggling like:', error);
        }
      },

      // =============================================
      // SAVE / UNSAVE TEMPLATE (one per user per template)
      // =============================================
      toggleSave: async (templateId) => {
        try {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
          const user = useAuthStore.getState().user;

          if (!user) {
            console.log('Must be logged in to save');
            return;
          }

          // First, check if user already saved this template (source of truth from DB)
          const checkRes = await fetch(
            `${supabaseUrl}/rest/v1/template_saves?template_id=eq.${templateId}&user_id=eq.${user.id}&select=id`,
            {
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
              },
            }
          );
          const existingSave = await checkRes.json();
          const isSaved = existingSave && existingSave.length > 0;

          const { templates } = get();

          if (isSaved) {
            // Unsave - delete the existing save
            const deleteRes = await fetch(
              `${supabaseUrl}/rest/v1/template_saves?template_id=eq.${templateId}&user_id=eq.${user.id}`,
              {
                method: 'DELETE',
                headers: {
                  'apikey': supabaseKey,
                  'Authorization': `Bearer ${supabaseKey}`,
                },
              }
            );

            if (deleteRes.ok) {
              set({
                savedTemplateIds: get().savedTemplateIds.filter((id) => id !== templateId),
                templates: templates.map((t) =>
                  t.id === templateId ? { ...t, savesCount: Math.max(0, t.savesCount - 1) } : t
                ),
              });
            }
          } else {
            // Save - insert new save (DB has unique constraint)
            const insertRes = await fetch(`${supabaseUrl}/rest/v1/template_saves`, {
              method: 'POST',
              headers: {
                'apikey': supabaseKey,
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
                'Prefer': 'resolution=ignore-duplicates', // Ignore if already exists
              },
              body: JSON.stringify({
                template_id: templateId,
                user_id: user.id,
              }),
            });

            if (insertRes.ok || insertRes.status === 409) {
              set({
                savedTemplateIds: get().savedTemplateIds.includes(templateId)
                  ? get().savedTemplateIds
                  : [...get().savedTemplateIds, templateId],
                templates: templates.map((t) =>
                  t.id === templateId ? { ...t, savesCount: t.savesCount + 1 } : t
                ),
              });
            }
          }
        } catch (error) {
          console.error('Error toggling save:', error);
        }
      },

      // =============================================
      // FILTERS
      // =============================================
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setShowSavedOnly: (show) => set({ showSavedOnly: show }),
      setViewMode: (mode) => set({ viewMode: mode }),

      clearFilters: () =>
        set({
          searchQuery: '',
          selectedCategory: 'all',
          showSavedOnly: false,
        }),

      // =============================================
      // GET FILTERED TEMPLATES
      // =============================================
      getFilteredTemplates: () => {
        const { templates, searchQuery, selectedCategory, showSavedOnly, savedTemplateIds } = get();

        let filtered = [...templates];

        // Filter by saved
        if (showSavedOnly) {
          filtered = filtered.filter((t) => savedTemplateIds.includes(t.id));
        }

        // Filter by category
        if (selectedCategory && selectedCategory !== 'all') {
          filtered = filtered.filter((t) => t.categorySlug === selectedCategory);
        }

        // Filter by search
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          filtered = filtered.filter(
            (t) =>
              t.name.toLowerCase().includes(query) ||
              t.description?.toLowerCase().includes(query) ||
              t.tags?.some((tag) => tag.toLowerCase().includes(query))
          );
        }

        // Sort by likes count
        filtered.sort((a, b) => b.likesCount - a.likesCount);

        return filtered;
      },

      // =============================================
      // GET TEMPLATES BY CATEGORY
      // =============================================
      getTemplatesByCategory: (categorySlug) => {
        const { templates } = get();
        if (!categorySlug || categorySlug === 'all') return templates;
        return templates.filter((t) => t.categorySlug === categorySlug);
      },
    }),
    {
      name: 'code-eternal-template-store',
      partialize: (state) => ({
        viewMode: state.viewMode,
        likedTemplateIds: state.likedTemplateIds,
        savedTemplateIds: state.savedTemplateIds,
      }),
    }
  )
);
