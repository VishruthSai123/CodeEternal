/**
 * Gemini AI Service
 * Handles all LLM operations using Google's Gemini API
 * Built-in API - no user configuration needed
 */

// Built-in API key - used through Electron main process for security
const BUILT_IN_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || '';
const DEFAULT_MODEL = 'gemini-2.0-flash';

class GeminiService {
  constructor() {
    this.model = DEFAULT_MODEL;
  }

  /**
   * Check if service is ready - always ready with built-in API
   */
  isReady() {
    return true; // Always ready - uses built-in API
  }

  /**
   * Set the model to use
   */
  setModel(modelName) {
    this.model = modelName;
  }

  /**
   * Get the API key (from built-in or env)
   */
  getApiKey() {
    return BUILT_IN_API_KEY;
  }

  /**
   * Generate content using Electron IPC or direct fetch
   */
  async generateContent(prompt, options = {}) {
    const modelToUse = options.model || this.model;
    const apiKey = this.getApiKey();

    if (!apiKey) {
      throw new Error('AI service not configured. Please contact support.');
    }

    try {
      // Use Electron IPC if available (avoids CORS)
      if (window.electron?.geminiGenerate) {
        const result = await window.electron.geminiGenerate(apiKey, modelToUse, prompt);
        if (!result.success) {
          throw new Error(result.error || 'API request failed');
        }
        return result.text;
      }

      // Fallback to direct fetch (for browser dev)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelToUse}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    } catch (error) {
      console.error('Gemini generation error:', error);
      throw error;
    }
  }

  /**
   * Generate content with streaming (simplified - not using SDK)
   */
  async *generateContentStream(prompt, options = {}) {
    // For now, just use non-streaming
    const result = await this.generateContent(prompt, options);
    yield result;
  }

  /**
   * Summarize context for the prompt builder
   */
  async summarizeContext(context, maxLength = 200) {
    const prompt = `Summarize this development context in ${maxLength} words or less. Include technical details, current task, and relevant info. No formatting, no introductions. Direct summary only.

Context:
${context}`;

    return this.generateContent(prompt);
  }

  /**
   * Generate UI component suggestions based on context
   */
  async suggestComponents(context, framework = 'React') {
    const prompt = `List 3-5 relevant ${framework} UI components for this context. One component per line, no numbering, no descriptions.

Context: ${context}`;

    const response = await this.generateContent(prompt);
    return response.split('\n').filter(line => line.trim()).slice(0, 5);
  }

  /**
   * Enhance user's request text - ONLY improves the request wording
   * Does NOT repeat context since the full build prompt already contains everything
   */
  async enhancePrompt(rawPrompt, context = {}) {
    const {
      contextSummary = {},
      selectedSnippets = [],
      framework = 'react',
      stylePreset = 'glass',
      codeAttachments = [],
      selectedImages = []
    } = context;

    // Determine what assets are available (for awareness, not repetition)
    const hasSnippets = selectedSnippets.length > 0;
    const hasImages = (context.selectedImages?.length || 0) > 0;
    const hasCode = codeAttachments.length > 0;
    const hasContext = contextSummary.projectType || contextSummary.globalIntent;

    const prompt = `You are a prompt optimizer. Your ONLY job is to enhance and clarify the user's request text.

RULES:
- DO NOT repeat project context, templates, components, or code references
- DO NOT list frameworks, styles, or constraints (they're already in the full prompt)
- DO NOT say "based on the attached images" or "using the provided snippets" 
- ONLY make the user's intent clearer, more specific, and actionable
- Keep it concise - if the request is clear, barely change it
- Focus on: specificity, clarity, and completeness of the actual request

USER'S ORIGINAL REQUEST:
"${rawPrompt}"

AWARENESS (don't repeat these, just be aware):
- Framework: ${framework}
- Style: ${stylePreset}
- Has reference images: ${hasImages ? 'Yes' : 'No'}
- Has code snippets: ${hasSnippets ? 'Yes' : 'No'}
- Has code attachments: ${hasCode ? 'Yes' : 'No'}
- Has project context: ${hasContext ? 'Yes' : 'No'}

OUTPUT REQUIREMENTS:
1. Return ONLY the enhanced request text
2. Keep it short if the original was short
3. Add specificity about UI behavior, states, or interactions if missing
4. Don't add fluff or unnecessary explanations
5. Don't reference "attached", "provided", or "above" resources
6. Output the enhanced request directly, nothing else

Enhanced request:`;

    return this.generateContent(prompt, { temperature: 0.3, maxTokens: 300 });
  }

  /**
   * Generate a complete prompt from components - comprehensive version
   */
  async composePrompt({ intent, context, snippets, constraints, framework }) {
    // Build snippet details
    const snippetDetails = snippets?.length > 0 
      ? snippets.map(s => {
          let detail = `- ${s.name}`;
          if (s.description) detail += `: ${s.description}`;
          if (s.category) detail += ` [${s.category}]`;
          if (s.imageUrl || s.imageDataUrl) detail += ' (has visual reference)';
          return detail;
        }).join('\n')
      : 'None';

    // Build snippet code references
    const snippetCodes = snippets?.filter(s => s.code).map(s => 
      `### ${s.name}\n\`\`\`${s.language || 'jsx'}\n${s.code}\n\`\`\``
    ).join('\n\n') || '';

    // Build constraints
    const constraintsList = [];
    if (constraints?.noInlineStyles) constraintsList.push('No inline styles, use CSS classes');
    if (constraints?.useTailwind) constraintsList.push('Use Tailwind CSS utility classes');
    if (constraints?.maxLines) constraintsList.push(`Keep components under ${constraints.maxLines} lines`);
    if (constraints?.ariaRequired) constraintsList.push('Include ARIA accessibility attributes');
    if (constraints?.mobileFirst) constraintsList.push('Mobile-first responsive design');

    const prompt = `You are creating a comprehensive UI development prompt. Take all the provided inputs and create a detailed, professional prompt that will help an AI assistant generate exactly what the user needs.

USER INTENT:
${intent || 'Not specified'}

PROJECT CONTEXT:
${context || 'Not specified'}

REFERENCE COMPONENTS:
${snippetDetails}

${snippetCodes ? `CODE REFERENCES:\n${snippetCodes}` : ''}

FRAMEWORK: ${framework || 'React'}
CONSTRAINTS: ${constraintsList.length > 0 ? constraintsList.join(', ') : 'Standard best practices'}

INSTRUCTIONS FOR YOUR OUTPUT:
1. Create a comprehensive prompt that includes ALL the information above
2. Be specific about what component to build, its functionality, and styling
3. Include the reference code snippets in the output prompt
4. Specify the framework, styling approach, and all constraints
5. If there are reference images, mention that visual references are attached
6. Use clear sections: Request, Technical Requirements, Reference Code, Constraints
7. Be detailed and thorough - longer is better for clarity
8. No emojis, no fancy formatting, just clean professional text
9. Output ONLY the enhanced prompt, nothing else

Enhanced Prompt:`;

    return this.generateContent(prompt);
  }

  /**
   * Analyze code and suggest improvements
   */
  async analyzeCode(code, framework = 'React') {
    const prompt = `Analyze this ${framework} code. List 2-3 specific improvements. No introductions, direct suggestions only.

Code:
${code}`;

    return this.generateContent(prompt);
  }
}

// Singleton instance
const geminiService = new GeminiService();

export default geminiService;
export { GeminiService };
