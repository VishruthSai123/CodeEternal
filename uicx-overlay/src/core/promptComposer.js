/**
 * Prompt Composer - Builds composite prompts from various inputs
 * 
 * This module handles the assembly of high-quality prompts
 * from user intent, context, snippets, and constraints.
 */

/**
 * Prompt section templates
 */
const SECTION_TEMPLATES = {
  context: (ctx) => {
    const parts = ['## Project Context'];
    if (ctx.projectType) parts.push(`**Project Type:** ${ctx.projectType}`);
    if (ctx.globalIntent) parts.push(`**Goal:** ${ctx.globalIntent}`);
    if (ctx.componentsUsed?.length > 0) {
      parts.push(`**Components in use:** ${ctx.componentsUsed.join(', ')}`);
    }
    if (ctx.lastChange) parts.push(`**Last change:** ${ctx.lastChange}`);
    return parts.length > 1 ? parts.join('\n') : '';
  },

  intent: (intent) => {
    if (!intent) return '';
    return `## Request\n${intent}`;
  },

  template: (template) => {
    if (!template) return '';
    const parts = [`## Template: ${template.name}`];
    if (template.description) parts.push(template.description);
    return parts.join('\n');
  },

  framework: (framework, stylePreset) => {
    const parts = ['## Technical Requirements'];
    parts.push(`**Framework:** ${framework}`);
    parts.push(`**Style:** ${stylePreset}`);
    return parts.join('\n');
  },

  snippets: (snippets) => {
    if (!snippets || snippets.length === 0) return '';
    
    const parts = ['## Reference Components'];
    snippets.forEach((snippet, index) => {
      parts.push(`\n### ${index + 1}. ${snippet.name} (${snippet.source})`);
      if (snippet.description) parts.push(snippet.description);
      if (snippet.code) {
        parts.push(`\`\`\`${snippet.language || 'jsx'}`);
        parts.push(snippet.code);
        parts.push('```');
      }
    });
    return parts.join('\n');
  },

  images: (images) => {
    if (!images || images.length === 0) return '';
    
    const parts = ['## Visual References'];
    images.forEach((image, index) => {
      parts.push(`${index + 1}. **${image.name}:** ${image.description || 'UI reference'}`);
    });
    return parts.join('\n');
  },

  constraints: (constraints) => {
    const items = [];
    if (constraints.noInlineStyles) items.push('No inline styles - use CSS classes');
    if (constraints.useTailwind) items.push('Use Tailwind CSS utility classes');
    if (constraints.maxLines) items.push(`Keep component under ${constraints.maxLines} lines`);
    if (constraints.ariaRequired) items.push('Include ARIA accessibility attributes');
    if (constraints.mobileFirst) items.push('Use mobile-first responsive design');
    
    if (items.length === 0) return '';
    
    return '## Constraints\n' + items.map(item => `- ${item}`).join('\n');
  },

  history: (history) => {
    if (!history || history.length === 0) return '';
    
    const recent = history.slice(-3);
    const parts = ['## Recent Context'];
    recent.forEach(entry => {
      const summary = entry.summary || entry.content?.slice(0, 100) || '';
      if (summary) parts.push(`- ${summary}`);
    });
    return parts.length > 1 ? parts.join('\n') : '';
  },
};

/**
 * Main prompt composer function
 */
export function composePrompt({
  userIntent = '',
  contextSummary = {},
  selectedSnippets = [],
  selectedImages = [],
  template = null,
  framework = 'react',
  stylePreset = 'modern',
  constraints = {},
  conversationHistory = [],
}) {
  const sections = [];

  // 1. Context Summary
  const contextSection = SECTION_TEMPLATES.context(contextSummary);
  if (contextSection) sections.push(contextSection);

  // 2. User Intent
  const intentSection = SECTION_TEMPLATES.intent(userIntent);
  if (intentSection) sections.push(intentSection);

  // 3. Template
  const templateSection = SECTION_TEMPLATES.template(template);
  if (templateSection) sections.push(templateSection);

  // 4. Framework & Style
  sections.push(SECTION_TEMPLATES.framework(framework, stylePreset));

  // 5. Snippets
  const snippetsSection = SECTION_TEMPLATES.snippets(selectedSnippets);
  if (snippetsSection) sections.push(snippetsSection);

  // 6. Images
  const imagesSection = SECTION_TEMPLATES.images(selectedImages);
  if (imagesSection) sections.push(imagesSection);

  // 7. Constraints
  const constraintsSection = SECTION_TEMPLATES.constraints(constraints);
  if (constraintsSection) sections.push(constraintsSection);

  // 8. Recent History
  const historySection = SECTION_TEMPLATES.history(conversationHistory);
  if (historySection) sections.push(historySection);

  return sections.join('\n\n');
}

/**
 * Generate a minimal prompt (for quick generation)
 */
export function composeMinimalPrompt({ userIntent, framework, stylePreset }) {
  return `Create a ${stylePreset} styled ${framework} component: ${userIntent}`;
}

/**
 * Calculate approximate token count
 */
export function estimateTokens(text) {
  // Rough estimate: ~4 characters per token
  return Math.ceil(text.length / 4);
}

/**
 * Validate prompt quality
 */
export function validatePrompt(prompt) {
  const issues = [];
  
  if (!prompt || prompt.length < 20) {
    issues.push('Prompt is too short');
  }
  
  if (prompt.length > 50000) {
    issues.push('Prompt may be too long for some AI models');
  }
  
  if (!prompt.includes('##')) {
    issues.push('Missing structured sections');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    tokenEstimate: estimateTokens(prompt),
  };
}

/**
 * Prompt quality scoring
 */
export function scorePrompt(prompt) {
  let score = 50; // Base score
  
  // Has context
  if (prompt.includes('## Project Context')) score += 10;
  
  // Has clear request
  if (prompt.includes('## Request')) score += 15;
  
  // Has technical requirements
  if (prompt.includes('## Technical Requirements')) score += 10;
  
  // Has reference code
  if (prompt.includes('```')) score += 10;
  
  // Has constraints
  if (prompt.includes('## Constraints')) score += 5;
  
  // Length bonus (but not too long)
  const length = prompt.length;
  if (length > 200 && length < 5000) score += 10;
  if (length > 5000 && length < 10000) score += 5;
  
  return Math.min(100, score);
}

export default {
  composePrompt,
  composeMinimalPrompt,
  estimateTokens,
  validatePrompt,
  scorePrompt,
};
