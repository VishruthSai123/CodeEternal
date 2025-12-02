import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../lib/supabase';
import { useAuthStore } from './authStore';

export const useProjectStore = create(
  persist(
    (set, get) => ({
      // State
      projects: [],
      currentProject: null,
      isLoading: false,        // For fetching projects list
      isCreating: false,       // For creating a project
      isUpdating: false,       // For updating a project
      isDeleting: false,       // For deleting a project
      isSyncing: false,        // For sync status
      lastSyncTime: null,      // Track last successful sync
      error: null,

      // Fetch all projects for current user - ALWAYS from DB
      fetchProjects: async (forceRefresh = false) => {
        const user = useAuthStore.getState().user;
        if (!user) {
          set({ isLoading: false, projects: [] });
          return;
        }

        set({ isLoading: true, isSyncing: true });

        try {
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('user_id', user.id)
            .order('updated_at', { ascending: false });

          if (error) throw error;

          set({ 
            projects: data || [], 
            isLoading: false, 
            isSyncing: false,
            lastSyncTime: Date.now(),
            error: null 
          });
        } catch (error) {
          console.error('Error fetching projects:', error);
          set({ error: error.message, isLoading: false, isSyncing: false });
        }
      },

      // Fetch single project fresh from DB
      fetchProject: async (projectId) => {
        if (!projectId) return null;

        try {
          set({ isSyncing: true });
          
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', projectId)
            .single();

          if (error) throw error;

          // Update in projects list and currentProject
          set((state) => ({
            projects: state.projects.map((p) => (p.id === projectId ? data : p)),
            currentProject: state.currentProject?.id === projectId ? data : state.currentProject,
            isSyncing: false,
            lastSyncTime: Date.now(),
          }));

          return data;
        } catch (error) {
          console.error('Error fetching project:', error);
          set({ isSyncing: false });
          return null;
        }
      },

      // Create new project
      createProject: async (projectData) => {
        const user = useAuthStore.getState().user;
        if (!user) return { success: false, error: 'Not authenticated' };

        try {
          set({ isCreating: true, error: null });

          const { data, error } = await supabase
            .from('projects')
            .insert({
              user_id: user.id,
              name: projectData.name,
              description: projectData.description || '',
              framework: projectData.framework || 'react',
              style_preset: projectData.stylePreset || 'modern',
              settings: projectData.settings || {},
            })
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            projects: [data, ...state.projects],
            isCreating: false,
          }));

          return { success: true, project: data };
        } catch (error) {
          console.error('Error creating project:', error);
          set({ error: error.message, isCreating: false });
          return { success: false, error: error.message };
        }
      },

      // Update project
      updateProject: async (projectId, updates) => {
        try {
          set({ isUpdating: true, error: null });

          const { data, error } = await supabase
            .from('projects')
            .update({
              ...updates,
              updated_at: new Date().toISOString(),
            })
            .eq('id', projectId)
            .select()
            .single();

          if (error) throw error;

          set((state) => ({
            projects: state.projects.map((p) => (p.id === projectId ? data : p)),
            currentProject: state.currentProject?.id === projectId ? data : state.currentProject,
            isUpdating: false,
          }));

          return { success: true };
        } catch (error) {
          console.error('Error updating project:', error);
          set({ error: error.message, isUpdating: false });
          return { success: false, error: error.message };
        }
      },

      // Delete project
      deleteProject: async (projectId) => {
        try {
          set({ isDeleting: true, error: null });

          const { error } = await supabase
            .from('projects')
            .delete()
            .eq('id', projectId);

          if (error) throw error;

          set((state) => ({
            projects: state.projects.filter((p) => p.id !== projectId),
            currentProject: state.currentProject?.id === projectId ? null : state.currentProject,
            isDeleting: false,
          }));

          return { success: true };
        } catch (error) {
          console.error('Error deleting project:', error);
          set({ error: error.message, isDeleting: false });
          return { success: false, error: error.message };
        }
      },

      // Reset loading state (for stuck loading situations)
      resetLoading: () => {
        set({ isLoading: false, error: null });
      },

      // Set current project
      setCurrentProject: (project) => {
        set({ currentProject: project });
      },

      // Clear current project (go back to home)
      clearCurrentProject: () => {
        set({ currentProject: null });
      },

      // Clear all projects (on logout)
      clearProjects: () => {
        set({ projects: [], currentProject: null });
      },

      // Save project context (prompts, summaries, snippets, etc.)
      // Note: Requires running supabase-add-project-context.sql first
      saveProjectContext: async (projectId, contextData) => {
        if (!projectId) {
          console.warn('No project ID to save context');
          return { success: false, error: 'No project ID' };
        }

        try {
          // Build update object - only include fields that exist in DB
          const updateData = {
            updated_at: new Date().toISOString(),
          };

          // Try to include context fields (may not exist if SQL not run)
          try {
            updateData.context_summary = contextData.contextSummary || {};
            updateData.session_summary = contextData.sessionSummary || '';
            updateData.user_intent = contextData.userIntent || '';
            updateData.selected_snippets = contextData.selectedSnippets || [];
            updateData.selected_images = contextData.selectedImages || [];
            updateData.code_attachments = contextData.codeAttachments || [];
            updateData.constraints = contextData.constraints || {};
            updateData.conversation_history = contextData.conversationHistory || [];
            updateData.last_generated_prompt = contextData.lastGeneratedPrompt || '';
            updateData.template = contextData.template || null;
          } catch (e) {
            console.warn('Some context fields may not exist in DB:', e);
          }

          // Always update these core fields
          if (contextData.framework) updateData.framework = contextData.framework;
          if (contextData.stylePreset) updateData.style_preset = contextData.stylePreset;

          const { data, error } = await supabase
            .from('projects')
            .update(updateData)
            .eq('id', projectId)
            .select()
            .single();

          if (error) {
            // If column doesn't exist, just log and continue
            if (error.message?.includes('column') || error.code === '42703') {
              console.warn('Some project context columns not found - run supabase-add-project-context.sql');
              return { success: false, error: 'DB schema needs update' };
            }
            throw error;
          }

          // Update local state
          set((state) => ({
            projects: state.projects.map((p) => (p.id === projectId ? data : p)),
            currentProject: state.currentProject?.id === projectId ? data : state.currentProject,
          }));

          console.log('Project context saved successfully');
          return { success: true, project: data };
        } catch (error) {
          console.error('Error saving project context:', error);
          // Don't block the app - just log the error
          return { success: false, error: error.message };
        }
      },

      // Load project context into prompt store
      loadProjectContext: (project) => {
        if (!project) return null;

        // Return the context data from the project
        return {
          contextSummary: project.context_summary || {},
          sessionSummary: project.session_summary || '',
          userIntent: project.user_intent || '',
          selectedSnippets: project.selected_snippets || [],
          selectedImages: project.selected_images || [],
          codeAttachments: project.code_attachments || [],
          constraints: project.constraints || {
            noInlineStyles: true,
            useTailwind: true,
            maxLines: 200,
            ariaRequired: false,
            mobileFirst: true,
          },
          conversationHistory: project.conversation_history || [],
          lastGeneratedPrompt: project.last_generated_prompt || '',
          framework: project.framework || 'react',
          stylePreset: project.style_preset || 'modern',
          template: project.template || null,
        };
      },
    }),
    {
      name: 'code-eternal-projects',
      partialize: (state) => ({
        // Cache projects for instant load on refresh
        projects: state.projects,
        currentProject: state.currentProject,
      }),
    }
  )
);

export default useProjectStore;
