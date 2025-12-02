import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Debounce timer for auto-save
let saveDebounceTimer = null;
const SAVE_DEBOUNCE_MS = 1500; // Save 1.5 seconds after last change (faster)
const CRITICAL_SAVE_DELAY_MS = 500; // Critical changes save faster

// Prompt builder store
export const usePromptStore = create(
  persist(
    (set, get) => ({
      // Current prompt state
      userIntent: '',
      selectedSnippets: [],   // { id, name, code, imageUrl?, imageDataUrl? }
      selectedImages: [],     // { id, name, dataUrl, description } - manual attachments
      codeAttachments: [],    // { id, name, code, language }
      template: null,
      constraints: {
        noInlineStyles: true,
        useTailwind: true,
        maxLines: 200,
        ariaRequired: false,
        mobileFirst: true,
      },
      framework: 'react',
      stylePreset: 'glass',

      // Context summary - linked to everything (auto-generated with full memory)
      contextSummary: {
        projectType: '',
        componentsUsed: [],
        lastChange: '',
        globalIntent: '',
        // Extended memory fields
        techStack: [],
        designStyle: '',
        sessionPhase: 'planning', // planning | designing | coding | debugging | refining
      },

      // Session summary - AI-generated comprehensive summary of the session work
      sessionSummary: '',

      // Auto-summary state
      isAutoSummarizing: false,
      lastAutoSummaryTime: null,

      // Conversation history for context
      conversationHistory: [],

      // Last generated prompt (for auto-copy)
      lastGeneratedPrompt: '',

      // Current project ID for auto-save
      currentProjectId: null,

      // Actions
      setUserIntent: (intent) => {
        set({ userIntent: intent });
        get().triggerAutoSave();
      },

      setAutoSummarizing: (isLoading) => set({ isAutoSummarizing: isLoading }),

      setSessionSummary: (summary) => {
        set({ sessionSummary: summary });
        get().triggerAutoSave();
      },

      addSnippet: (snippet) => {
        set((state) => ({
          selectedSnippets: [...state.selectedSnippets, snippet],
        }));
        get().triggerAutoSave();
      },

      removeSnippet: (snippetId) => {
        set((state) => ({
          selectedSnippets: state.selectedSnippets.filter(
            (s) => s.id !== snippetId
          ),
        }));
        get().triggerAutoSave();
      },

      clearSnippets: () => {
        set({ selectedSnippets: [] });
        get().triggerAutoSave();
      },

      // Image attachments
      addImage: (image) => {
        set((state) => ({
          selectedImages: [...state.selectedImages, { ...image, id: Date.now() }],
        }));
        get().triggerAutoSave();
      },

      removeImage: (imageId) => {
        set((state) => ({
          selectedImages: state.selectedImages.filter((i) => i.id !== imageId),
        }));
        get().triggerAutoSave();
      },

      clearImages: () => {
        set({ selectedImages: [] });
        get().triggerAutoSave();
      },

      // Code attachments
      addCodeAttachment: (code) => {
        set((state) => ({
          codeAttachments: [...state.codeAttachments, { ...code, id: Date.now() }],
        }));
        get().triggerAutoSave();
      },

      removeCodeAttachment: (codeId) => {
        set((state) => ({
          codeAttachments: state.codeAttachments.filter((c) => c.id !== codeId),
        }));
        get().triggerAutoSave();
      },

      clearCodeAttachments: () => {
        set({ codeAttachments: [] });
        get().triggerAutoSave();
      },

      setTemplate: (template) => set({ template }),

      setConstraints: (constraints) => {
        set((state) => ({
          constraints: { ...state.constraints, ...constraints },
        }));
        get().triggerAutoSave();
      },

      setFramework: (framework) => {
        set({ framework });
        get().triggerAutoSave();
      },

      setStylePreset: (stylePreset) => {
        set({ stylePreset });
        get().triggerAutoSave();
      },

      updateContextSummary: (summary) => {
        set((state) => ({
          contextSummary: { ...state.contextSummary, ...summary },
        }));
        get().triggerAutoSave();
      },

      addToHistory: (entry) => {
        set((state) => ({
          conversationHistory: [
            ...state.conversationHistory.slice(-49), // Keep last 50
            { ...entry, timestamp: Date.now() },
          ],
        }));
        get().triggerAutoSave();
      },

      clearHistory: () => {
        set({ conversationHistory: [] });
        get().triggerAutoSave();
      },

      // Get composite prompt (no state update - safe for render)
      getCompositePrompt: () => {
        const state = get();
        return buildPrompt(state);
      },

      // Generate and store composite prompt (use only in callbacks)
      generateCompositePrompt: () => {
        const state = get();
        const prompt = buildPrompt(state);
        set({ lastGeneratedPrompt: prompt });
        return prompt;
      },

      // Get all images for multimodal prompt (includes snippet images + manual attachments)
      getAllImagesForPrompt: () => {
        const state = get();
        const images = [];
        
        // Add snippet images first
        state.selectedSnippets.forEach(snippet => {
          if (snippet.imageDataUrl || snippet.imageUrl) {
            images.push({
              name: `${snippet.name} - Reference`,
              dataUrl: snippet.imageDataUrl || snippet.imageUrl,
              description: snippet.description || `UI reference for ${snippet.name}`,
              source: 'snippet'
            });
          }
        });
        
        // Add manual image attachments
        state.selectedImages.forEach(img => {
          images.push({
            name: img.name,
            dataUrl: img.dataUrl,
            description: img.description,
            source: 'attachment'
          });
        });
        
        return images;
      },

      // Get just manual image attachments (backwards compat)
      getImagesForPrompt: () => {
        return get().selectedImages.map(img => ({
          name: img.name,
          dataUrl: img.dataUrl,
          description: img.description,
        }));
      },

      // Reset prompt builder
      resetPromptBuilder: () => {
        set({
          userIntent: '',
          selectedSnippets: [],
          selectedImages: [],
          codeAttachments: [],
          template: null,
          lastGeneratedPrompt: '',
        });
        get().triggerAutoSave();
      },

      // Set current project ID for auto-save
      setCurrentProjectId: (projectId) => {
        set({ currentProjectId: projectId });
      },

      // Trigger debounced auto-save to database
      triggerAutoSave: () => {
        const { currentProjectId } = get();
        if (!currentProjectId) return;

        // Clear existing timer
        if (saveDebounceTimer) {
          clearTimeout(saveDebounceTimer);
        }

        // Set new timer
        saveDebounceTimer = setTimeout(async () => {
          try {
            const state = get();
            
            // Import projectStore dynamically to avoid circular deps
            const { useProjectStore } = await import('./projectStore');
            const projectStore = useProjectStore.getState();
            
            // Save context to project (non-blocking)
            await projectStore.saveProjectContext(state.currentProjectId, {
              contextSummary: state.contextSummary,
              sessionSummary: state.sessionSummary,
              userIntent: state.userIntent,
              selectedSnippets: state.selectedSnippets,
              selectedImages: state.selectedImages,
              codeAttachments: state.codeAttachments,
              constraints: state.constraints,
              conversationHistory: state.conversationHistory,
              lastGeneratedPrompt: state.lastGeneratedPrompt,
              framework: state.framework,
              stylePreset: state.stylePreset,
              template: state.template,
            });
          } catch (error) {
            // Don't block the app on save errors
            console.warn('Auto-save failed (non-critical):', error);
          }
        }, SAVE_DEBOUNCE_MS);
      },

      // Load context from a project
      loadFromProject: (projectContext) => {
        if (!projectContext) return;

        set({
          contextSummary: projectContext.contextSummary || {
            projectType: '',
            componentsUsed: [],
            lastChange: '',
            globalIntent: '',
          },
          sessionSummary: projectContext.sessionSummary || '',
          userIntent: projectContext.userIntent || '',
          selectedSnippets: projectContext.selectedSnippets || [],
          selectedImages: projectContext.selectedImages || [],
          codeAttachments: projectContext.codeAttachments || [],
          constraints: projectContext.constraints || {
            noInlineStyles: true,
            useTailwind: true,
            maxLines: 200,
            ariaRequired: false,
            mobileFirst: true,
          },
          conversationHistory: projectContext.conversationHistory || [],
          lastGeneratedPrompt: projectContext.lastGeneratedPrompt || '',
          framework: projectContext.framework || 'react',
          stylePreset: projectContext.stylePreset || 'modern',
          template: projectContext.template || null,
        });
      },

      // Force save immediately (for navigation away, etc.)
      forceSave: async () => {
        const { currentProjectId } = get();
        if (!currentProjectId) return { success: false };

        // Clear any pending debounce
        if (saveDebounceTimer) {
          clearTimeout(saveDebounceTimer);
          saveDebounceTimer = null;
        }

        try {
          const state = get();
          
          // Import projectStore dynamically
          const { useProjectStore } = await import('./projectStore');
          const projectStore = useProjectStore.getState();
          
          return await projectStore.saveProjectContext(state.currentProjectId, {
            contextSummary: state.contextSummary,
            sessionSummary: state.sessionSummary,
            userIntent: state.userIntent,
            selectedSnippets: state.selectedSnippets,
            selectedImages: state.selectedImages,
            codeAttachments: state.codeAttachments,
            constraints: state.constraints,
            conversationHistory: state.conversationHistory,
            lastGeneratedPrompt: state.lastGeneratedPrompt,
            framework: state.framework,
            stylePreset: state.stylePreset,
            template: state.template,
          });
        } catch (error) {
          console.warn('Force save failed (non-critical):', error);
          return { success: false, error: error.message };
        }
      },
    }),
    {
      name: 'build-eternal-prompt-storage',
      partialize: (state) => ({
        // User input
        userIntent: state.userIntent,
        
        // Context
        contextSummary: state.contextSummary,
        sessionSummary: state.sessionSummary,
        conversationHistory: state.conversationHistory,
        
        // Snippets and attachments
        selectedSnippets: state.selectedSnippets,
        selectedImages: state.selectedImages,
        codeAttachments: state.codeAttachments,
        
        // Settings
        constraints: state.constraints,
        framework: state.framework,
        stylePreset: state.stylePreset,
        template: state.template,
        
        // Project reference
        currentProjectId: state.currentProjectId,
        
        // Last generated
        lastGeneratedPrompt: state.lastGeneratedPrompt,
      }),
    }
  )
);

// Helper function to build composite prompt with structured Markdown formatting
// Optimized for modern AI models (Claude, GPT-4, etc.) with clear sections and vibe coding style
function buildPrompt(state) {
  const parts = [];

  // Safe access to nested properties
  const contextSummary = state.contextSummary || {};
  const componentsUsed = contextSummary.componentsUsed || [];
  const selectedSnippets = state.selectedSnippets || [];
  const selectedImages = state.selectedImages || [];
  const codeAttachments = state.codeAttachments || [];
  const conversationHistory = state.conversationHistory || [];
  const constraints = state.constraints || {};
  const template = state.template || null;

  // ═══════════════════════════════════════════════════════════════════
  // HEADER - Clear role and task definition
  // ═══════════════════════════════════════════════════════════════════
  parts.push('# ✨ Development Request');
  parts.push('');
  parts.push('You are an expert developer specializing in modern, production-ready code.');
  parts.push('Create clean, accessible, and well-structured code that matches the provided references exactly.');
  parts.push('');

  // ═══════════════════════════════════════════════════════════════════
  // 1. PROJECT CONTEXT - Background information with extended memory
  // ═══════════════════════════════════════════════════════════════════
  const hasContext = contextSummary.globalIntent || 
                     contextSummary.projectType || 
                     componentsUsed.length > 0 ||
                     contextSummary.techStack?.length > 0 ||
                     contextSummary.designStyle;
  
  if (hasContext) {
    parts.push('---');
    parts.push('## 📋 Project Context');
    parts.push('');
    if (contextSummary.projectType) {
      parts.push(`**Project Type:** ${contextSummary.projectType}`);
    }
    if (contextSummary.globalIntent) {
      parts.push(`**Overall Goal:** ${contextSummary.globalIntent}`);
    }
    if (contextSummary.designStyle) {
      parts.push(`**Design Style:** ${contextSummary.designStyle}`);
    }
    if (contextSummary.techStack?.length > 0) {
      parts.push(`**Tech Stack:** ${contextSummary.techStack.join(', ')}`);
    }
    if (componentsUsed.length > 0) {
      parts.push(`**Existing Components:** ${componentsUsed.join(', ')}`);
    }
    if (contextSummary.lastChange) {
      parts.push(`**Recent Changes:** ${contextSummary.lastChange}`);
    }
    parts.push('');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 2. USER REQUEST - The main task (most important)
  // ═══════════════════════════════════════════════════════════════════
  if (state.userIntent) {
    parts.push('---');
    parts.push('## 🎯 Request');
    parts.push('');
    parts.push('**What I need:**');
    parts.push(state.userIntent);
    parts.push('');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 3. TECHNICAL STACK - Framework and styling requirements
  // ═══════════════════════════════════════════════════════════════════
  const framework = state.framework || 'react';
  const stylePreset = state.stylePreset || 'glass';
  
  parts.push('---');
  parts.push('## ⚙️ Technical Stack');
  parts.push('');
  parts.push(`| Property | Value |`);
  parts.push(`|----------|-------|`);
  parts.push(`| Framework | ${framework.charAt(0).toUpperCase() + framework.slice(1)} |`);
  parts.push(`| Styling | ${getStyleDescription(stylePreset)} |`);
  if (template?.framework) {
    parts.push(`| Template Framework | ${template.framework} |`);
  }
  if (template?.styleLibrary) {
    parts.push(`| Style Library | ${template.styleLibrary} |`);
  }
  parts.push('');

  // ═══════════════════════════════════════════════════════════════════
  // 4. TEMPLATE - Selected design template with full details
  // ═══════════════════════════════════════════════════════════════════
  if (template) {
    parts.push('---');
    parts.push('## 🎨 Design Template');
    parts.push('');
    parts.push(`**Template:** ${template.name}`);
    if (template.categoryName) {
      parts.push(`**Category:** ${template.categoryName}`);
    }
    if (template.description) {
      parts.push(`**Description:** ${template.description}`);
    }
    if (template.tags?.length > 0) {
      parts.push(`**Tags:** ${template.tags.join(', ')}`);
    }
    
    // Color Palette (for theme templates)
    if (template.colorPalette && Object.keys(template.colorPalette).length > 0) {
      parts.push('');
      parts.push('### 🎨 Color Palette');
      parts.push('Use these exact colors:');
      parts.push('');
      parts.push('| Color Name | Value |');
      parts.push('|------------|-------|');
      Object.entries(template.colorPalette).forEach(([name, value]) => {
        parts.push(`| ${name} | \`${value}\` |`);
      });
      parts.push('');
    }
    
    // Main Template Code
    if (template.code) {
      parts.push('');
      parts.push('### 📄 Main Template Code');
      parts.push('Use this as the primary reference:');
      parts.push('');
      parts.push('```' + (template.language || 'jsx'));
      parts.push(template.code);
      parts.push('```');
      parts.push('');
    }

    // Template Components (variants)
    if (template.components && template.components.length > 0) {
      parts.push('');
      parts.push('### Template Components');
      parts.push('This template includes ' + template.components.length + ' component variant(s):');
      parts.push('');
      
      template.components.forEach((comp, idx) => {
        parts.push('#### ' + (idx + 1) + '. ' + comp.name);
        if (comp.componentType && comp.componentType !== 'other') {
          parts.push('**Type:** ' + comp.componentType);
        }
        if (comp.description) {
          parts.push('**Description:** ' + comp.description);
        }
        if (comp.imageUrl) {
          parts.push('**Visual Reference:** Image provided');
        }
        if (comp.code) {
          parts.push('');
          parts.push('```' + (template.language || 'jsx'));
          parts.push(comp.code);
          parts.push('```');
        }
        parts.push('');
      });
    }

    // Usage Notes
    if (template.usageNotes) {
      parts.push('### 📝 Usage Notes');
      parts.push(template.usageNotes);
      parts.push('');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 5. CODE ATTACHMENTS - Additional code references
  // ═══════════════════════════════════════════════════════════════════
  if (codeAttachments.length > 0) {
    parts.push('---');
    parts.push('## 📎 Code Attachments');
    parts.push('');
    parts.push('Reference these existing code snippets:');
    parts.push('');
    
    codeAttachments.forEach((code, index) => {
      parts.push(`### ${index + 1}. ${code.name || `Code Block ${index + 1}`}`);
      parts.push('');
      parts.push('```' + (code.language || 'jsx'));
      parts.push(code.code || '');
      parts.push('```');
      parts.push('');
    });
  }

  // ═══════════════════════════════════════════════════════════════════
  // 6. CODE SNIPPETS - Component references with images
  // ═══════════════════════════════════════════════════════════════════
  if (selectedSnippets.length > 0) {
    parts.push('---');
    parts.push('## 🧱 Code Snippet References');
    parts.push('');
    parts.push(`Match the style and patterns from these ${selectedSnippets.length} reference component(s):`);
    parts.push('');
    
    const snippetsWithImages = selectedSnippets.filter(s => s.imageUrl || s.imageDataUrl);
    
    selectedSnippets.forEach((snippet, index) => {
      parts.push(`### ${index + 1}. ${snippet.name || 'Component'}`);
      parts.push('');
      
      // Metadata table
      const meta = [];
      if (snippet.source) meta.push(`Source: ${snippet.source}`);
      if (snippet.category) meta.push(`Category: ${snippet.category}`);
      if (snippet.language) meta.push(`Language: ${snippet.language}`);
      if (meta.length > 0) {
        parts.push(`*${meta.join(' | ')}*`);
        parts.push('');
      }
      
      if (snippet.description) {
        parts.push(`**Purpose:** ${snippet.description}`);
        parts.push('');
      }
      
      if (snippet.imageUrl || snippet.imageDataUrl) {
        parts.push('🖼️ **Visual reference image attached** - Match this design exactly');
        parts.push('');
      }
      
      if (snippet.code) {
        parts.push('**Code:**');
        parts.push('```' + (snippet.language || 'jsx'));
        parts.push(snippet.code);
        parts.push('```');
        parts.push('');
      }
      
      if (snippet.props && Object.keys(snippet.props).length > 0) {
        parts.push('**Available Props:**');
        Object.entries(snippet.props).forEach(([prop, value]) => {
          parts.push(`- \`${prop}\`: ${value}`);
        });
        parts.push('');
      }
    });
    
    if (snippetsWithImages.length > 0) {
      parts.push(`> 📸 **${snippetsWithImages.length} visual reference(s) attached.** Analyze the images carefully and match their exact visual style, spacing, typography, and design patterns.`);
      parts.push('');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 7. IMAGE ATTACHMENTS - Manual visual references
  // ═══════════════════════════════════════════════════════════════════
  if (selectedImages.length > 0) {
    parts.push('---');
    parts.push('## 🖼️ Visual Design References');
    parts.push('');
    parts.push(`${selectedImages.length} design reference image(s) attached:`);
    parts.push('');
    
    selectedImages.forEach((image, index) => {
      parts.push(`${index + 1}. **${image.name || 'Image'}** - ${image.description || 'UI reference to replicate'}`);
    });
    parts.push('');
    parts.push('> **Important:** Analyze these images in detail. Replicate their:');
    parts.push('> - Visual hierarchy and layout');
    parts.push('> - Color scheme and contrast');
    parts.push('> - Typography and spacing');
    parts.push('> - Border radius, shadows, and effects');
    parts.push('> - Interactive states (hover, focus, active)');
    parts.push('');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 8. CONSTRAINTS - Code requirements and rules
  // ═══════════════════════════════════════════════════════════════════
  const activeConstraints = [];
  if (constraints.noInlineStyles) activeConstraints.push('❌ No inline styles - use CSS classes or Tailwind utilities only');
  if (constraints.useTailwind) activeConstraints.push('✅ Use Tailwind CSS utility classes');
  if (constraints.maxLines) activeConstraints.push(`📏 Keep each component under ${constraints.maxLines} lines`);
  if (constraints.ariaRequired) activeConstraints.push('♿ Include ARIA accessibility attributes');
  if (constraints.mobileFirst) activeConstraints.push('📱 Use mobile-first responsive design');

  if (activeConstraints.length > 0) {
    parts.push('---');
    parts.push('## ⚠️ Code Constraints');
    parts.push('');
    parts.push('Follow these rules strictly:');
    parts.push('');
    activeConstraints.forEach((c) => parts.push(`- ${c}`));
    parts.push('');
  }

  // ═══════════════════════════════════════════════════════════════════
  // 9. SESSION CONTEXT - AI-generated session summary (Full Memory)
  // ═══════════════════════════════════════════════════════════════════
  const sessionSummary = state.sessionSummary || '';
  const techStack = contextSummary.techStack || [];
  const designStyle = contextSummary.designStyle || '';
  const sessionPhase = contextSummary.sessionPhase || '';
  
  const hasMemory = sessionSummary || techStack.length > 0 || designStyle || sessionPhase;
  
  if (hasMemory) {
    parts.push('---');
    parts.push('## 🧠 Session Memory');
    parts.push('');
    
    // Extended context details
    if (techStack.length > 0 || designStyle || sessionPhase) {
      parts.push('**Session Intelligence:**');
      if (techStack.length > 0) {
        parts.push(`- **Tech Stack:** ${techStack.join(', ')}`);
      }
      if (designStyle) {
        parts.push(`- **Design Style:** ${designStyle}`);
      }
      if (sessionPhase) {
        parts.push(`- **Phase:** ${sessionPhase.charAt(0).toUpperCase() + sessionPhase.slice(1)}`);
      }
      parts.push('');
    }
    
    if (sessionSummary) {
      parts.push('**Session Summary:**');
      parts.push(sessionSummary);
      parts.push('');
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // 10. OUTPUT FORMAT - Clear expectations
  // ═══════════════════════════════════════════════════════════════════
  parts.push('---');
  parts.push('## ✅ Expected Output');
  parts.push('');
  parts.push('Please provide:');
  parts.push('1. **Complete, working code** - No placeholders or TODOs');
  parts.push('2. **Production-ready quality** - Clean, well-organized, and maintainable');
  parts.push('3. **Proper exports** - Ready to import and use');
  parts.push('4. **Comments only where necessary** - Explain complex logic, not obvious code');
  parts.push('');
  
  if (selectedImages.length > 0 || selectedSnippets.some(s => s.imageUrl || s.imageDataUrl)) {
    parts.push('> 🎨 **Match the visual references exactly** - The images show the target design.');
  }

  return parts.join('\n');
}

// Helper to get style description
function getStyleDescription(stylePreset) {
  const styles = {
    glass: 'Tailwind CSS + Glassmorphism (blur, transparency, subtle borders)',
    modern: 'Modern minimalist with clean lines and subtle shadows',
    brutalist: 'Bold, raw aesthetic with strong contrasts',
    neubrutalism: 'Playful neo-brutalism with thick borders and shadows',
    minimal: 'Ultra-minimal with focus on whitespace and typography',
    dark: 'Dark theme optimized with proper contrast ratios',
    gradient: 'Rich gradients with smooth color transitions',
  };
  return styles[stylePreset] || stylePreset;
}

// Helper to format time ago
function getTimeAgo(timestamp) {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
