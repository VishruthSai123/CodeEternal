/**
 * Auto-summarization hook - Full Memory System
 * Comprehensively tracks and summarizes session context including:
 * - User intent and requests
 * - Code snippets and attachments
 * - Images and templates
 * - Conversation history and recent actions
 * - Tech stack and design style detection
 */
import { useEffect, useRef, useCallback } from 'react';
import { usePromptStore } from '../stores/promptStore';
import { useHistoryStore } from '../stores/historyStore';
import { useTemplateStore } from '../stores/templateStore';
import geminiService from '../core/geminiService';

// Debounce delay in ms - slightly longer for stability
const DEBOUNCE_DELAY = 2500;
const MIN_INTENT_LENGTH = 15;

export function useAutoSummarize() {
  const { 
    userIntent, 
    selectedSnippets, 
    codeAttachments,
    imageAttachments,
    contextSummary,
    conversationHistory,
    selectedConstraints,
    updateContextSummary,
    setAutoSummarizing,
    setSessionSummary
  } = usePromptStore();

  const { selectedTemplate, selectedComponents } = useTemplateStore();
  const { promptHistory, recentWork } = useHistoryStore();
  
  const debounceTimer = useRef(null);
  const lastSummarized = useRef('');

  const generateSummary = useCallback(async () => {
    if (!geminiService.isReady()) return;
    if (!userIntent || userIntent.length < MIN_INTENT_LENGTH) return;
    
    // Build content hash to prevent duplicate analysis
    const contentHash = `${userIntent}-${selectedSnippets?.length || 0}-${codeAttachments?.length || 0}-${selectedTemplate?.id || 'none'}`;
    if (contentHash === lastSummarized.current) return;
    lastSummarized.current = contentHash;

    setAutoSummarizing(true);
    
    try {
      // ========== GATHER COMPREHENSIVE CONTEXT ==========
      
      // 1. Code Snippets
      const snippetDetails = (selectedSnippets || []).map(s => ({
        name: s.name || 'unnamed',
        language: s.language || 'unknown',
        preview: s.content?.substring(0, 100) || ''
      }));

      // 2. Code Attachments (full files)
      const attachmentDetails = (codeAttachments || []).map(a => ({
        filename: a.name || a.filename || 'file',
        language: a.language || 'unknown',
        lines: a.content?.split('\n').length || 0
      }));

      // 3. Image Attachments
      const imageDetails = (imageAttachments || []).map(img => ({
        name: img.name || 'image',
        type: img.type || 'image'
      }));

      // 4. Template Context
      const templateContext = selectedTemplate ? {
        name: selectedTemplate.name,
        category: selectedTemplate.category,
        description: selectedTemplate.description?.substring(0, 100),
        components: (selectedComponents || []).map(c => c.name || c.type)
      } : null;

      // 5. History Context (expanded)
      const recentPrompts = (promptHistory || []).slice(0, 5).map(p => {
        const match = p.content?.match(/## 🎯 Request[\s\S]*?>([\s\S]*?)(?=---|##|$)/);
        return match ? match[1].trim().slice(0, 80) : '';
      }).filter(Boolean);

      const recentActions = (recentWork || conversationHistory || []).slice(-5).map(w => {
        if (w.action) return `[${w.action}] ${w.summary?.substring(0, 50) || ''}`;
        return w.summary || w.content?.substring(0, 50) || '';
      }).filter(Boolean);

      // 6. Constraints
      const constraints = selectedConstraints || [];

      // ========== BUILD MEMORY PROMPT ==========
      const prompt = `You are a session memory system. Analyze the development context and create a comprehensive memory snapshot.

## CURRENT SESSION DATA

### User's Current Request
"${userIntent}"

### Project Context (existing)
- Type: ${contextSummary.projectType || 'Not determined'}
- Goal: ${contextSummary.globalIntent || 'Not specified'}
- Last Change: ${contextSummary.lastChange || 'None'}

### Code Snippets (${snippetDetails.length})
${snippetDetails.length > 0 ? snippetDetails.map(s => `- ${s.name} (${s.language}): "${s.preview}..."`).join('\n') : 'None'}

### Code Attachments (${attachmentDetails.length} files)
${attachmentDetails.length > 0 ? attachmentDetails.map(a => `- ${a.filename} (${a.language}, ${a.lines} lines)`).join('\n') : 'None'}

### Images (${imageDetails.length})
${imageDetails.length > 0 ? imageDetails.map(i => `- ${i.name} (${i.type})`).join('\n') : 'None'}

### Selected Template
${templateContext ? `- Name: ${templateContext.name}
- Category: ${templateContext.category}
- Description: ${templateContext.description}
- Components: ${templateContext.components.join(', ') || 'None'}` : 'No template selected'}

### Active Constraints
${constraints.length > 0 ? constraints.join(', ') : 'None'}

### Recent Requests (last 5)
${recentPrompts.length > 0 ? recentPrompts.map((p, i) => `${i + 1}. "${p}"`).join('\n') : 'No history'}

### Recent Actions (last 5)
${recentActions.length > 0 ? recentActions.map((a, i) => `${i + 1}. ${a}`).join('\n') : 'No actions'}

## OUTPUT REQUIREMENTS

Return ONLY valid JSON with this exact structure (no markdown, no explanation):

{
  "projectType": "specific app/website/component type being built",
  "globalIntent": "the overarching goal of this entire session",
  "componentsUsed": ["list", "of", "UI", "components", "mentioned", "or", "used"],
  "lastChange": "most recent meaningful action or change",
  "sessionSummary": "A detailed 3-4 sentence summary capturing: what the user is building, the current progress, key decisions made, and immediate next steps. Include specific technical details like frameworks, design styles, or component names mentioned.",
  "techStack": ["detected", "technologies", "and", "frameworks"],
  "designStyle": "detected design style if any (glassmorphism, neumorphism, etc.)",
  "sessionPhase": "planning|designing|coding|debugging|refining"
}`;

      const response = await geminiService.generateContent(prompt, {
        temperature: 0.25,
        maxTokens: 600
      });

      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Update context with richer data
        if (parsed.projectType || parsed.globalIntent || parsed.techStack) {
          const newSummary = {
            projectType: parsed.projectType || contextSummary.projectType,
            globalIntent: parsed.globalIntent || contextSummary.globalIntent,
            componentsUsed: parsed.componentsUsed || contextSummary.componentsUsed || [],
            lastChange: parsed.lastChange || contextSummary.lastChange || 'Auto-analyzed',
            // Extended fields for full memory
            techStack: parsed.techStack || contextSummary.techStack || [],
            designStyle: parsed.designStyle || contextSummary.designStyle || '',
            sessionPhase: parsed.sessionPhase || contextSummary.sessionPhase || 'planning'
          };
          
          updateContextSummary(newSummary);

          // Save to summary history
          useHistoryStore.getState().addSummaryToHistory(newSummary);
        }
        
        // Set comprehensive session summary
        if (parsed.sessionSummary) {
          setSessionSummary(parsed.sessionSummary);
        }
      }
    } catch (error) {
      console.error('Auto-summarize failed:', error);
    } finally {
      setAutoSummarizing(false);
    }
  }, [
    userIntent, 
    selectedSnippets, 
    codeAttachments,
    imageAttachments,
    selectedTemplate,
    selectedComponents,
    selectedConstraints,
    contextSummary, 
    conversationHistory,
    promptHistory, 
    recentWork, 
    updateContextSummary, 
    setAutoSummarizing,
    setSessionSummary
  ]);

  // Auto-trigger summary when content changes
  useEffect(() => {
    if (!geminiService.isReady()) return;
    if (!userIntent || userIntent.length < MIN_INTENT_LENGTH) return;
    
    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new debounced timer
    debounceTimer.current = setTimeout(() => {
      generateSummary();
    }, DEBOUNCE_DELAY);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [userIntent, selectedSnippets, generateSummary]);

  // Also trigger on significant context changes (template, attachments)
  useEffect(() => {
    if (!geminiService.isReady()) return;
    if (!userIntent || userIntent.length < MIN_INTENT_LENGTH) return;
    
    // When template or attachments change, re-analyze after delay
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      lastSummarized.current = ''; // Force re-analysis
      generateSummary();
    }, DEBOUNCE_DELAY + 500);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [selectedTemplate?.id, codeAttachments?.length, imageAttachments?.length]);

  return { generateSummary };
}

export default useAutoSummarize;
