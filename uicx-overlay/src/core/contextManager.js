/**
 * Context Manager - Handles conversation context and auto-summarization
 * 
 * This module tracks conversation history, generates summaries,
 * and maintains project context across sessions.
 * Now with Gemini AI integration for intelligent summarization.
 */

import geminiService from './geminiService';

// Default context state
const DEFAULT_CONTEXT = {
  projectType: '',
  globalIntent: '',
  componentsUsed: [],
  lastChange: '',
  recentExchanges: [],
  aiSummary: '',
};

/**
 * Analyzes text to extract component mentions
 */
export function extractComponents(text) {
  const componentPatterns = [
    // React/UI components
    /\b(Button|Card|Modal|Dialog|Sidebar|Navbar|Header|Footer|Form|Input|Select|Dropdown|Menu|Tab|Table|List|Grid|Avatar|Badge|Toast|Alert|Tooltip|Popover)\b/gi,
    // Layout terms
    /\b(Dashboard|Layout|Page|Section|Container|Wrapper|Panel|View)\b/gi,
    // Common UI elements
    /\b(Icon|Image|Logo|Link|Checkbox|Radio|Switch|Slider|Progress|Spinner|Skeleton)\b/gi,
  ];

  const components = new Set();
  
  componentPatterns.forEach(pattern => {
    const matches = text.match(pattern);
    if (matches) {
      matches.forEach(match => {
        components.add(match.charAt(0).toUpperCase() + match.slice(1).toLowerCase());
      });
    }
  });

  return Array.from(components);
}

/**
 * Detects project type from text context
 */
export function detectProjectType(text) {
  const projectTypes = {
    dashboard: /\b(dashboard|admin|panel|analytics|metrics|charts)\b/i,
    ecommerce: /\b(ecommerce|shop|store|cart|checkout|product|payment)\b/i,
    landing: /\b(landing|homepage|hero|marketing|cta|testimonial)\b/i,
    auth: /\b(auth|login|signup|register|password|session)\b/i,
    social: /\b(social|feed|post|profile|follow|like|comment)\b/i,
    saas: /\b(saas|subscription|pricing|tier|plan|billing)\b/i,
    blog: /\b(blog|article|post|content|editor|markdown)\b/i,
    portfolio: /\b(portfolio|showcase|project|gallery|work)\b/i,
  };

  for (const [type, pattern] of Object.entries(projectTypes)) {
    if (pattern.test(text)) {
      return type.charAt(0).toUpperCase() + type.slice(1);
    }
  }

  return '';
}

/**
 * Generates a simple rule-based summary (no LLM required)
 */
export function generateRuleBasedSummary(exchanges) {
  if (!exchanges || exchanges.length === 0) {
    return {
      projectType: '',
      globalIntent: '',
      componentsUsed: [],
      lastChange: '',
    };
  }

  // Combine all exchange content
  const allContent = exchanges
    .map(e => e.content || e.summary || '')
    .join(' ');

  // Extract insights
  const projectType = detectProjectType(allContent);
  const components = extractComponents(allContent);
  
  // Get last meaningful exchange
  const lastExchange = exchanges[exchanges.length - 1];
  const lastChange = lastExchange?.summary || 
                     lastExchange?.content?.slice(0, 100) || 
                     '';

  // Try to extract intent from first exchange or overall content
  let globalIntent = '';
  if (exchanges[0]?.content) {
    // Look for intent patterns
    const intentMatch = exchanges[0].content.match(
      /(?:build|create|make|develop|design|implement|add)\s+(.+?)(?:\.|,|$)/i
    );
    if (intentMatch) {
      globalIntent = intentMatch[1].trim();
    }
  }

  return {
    projectType,
    globalIntent,
    componentsUsed: components.slice(0, 10), // Limit to 10 components
    lastChange: lastChange.slice(0, 100),
  };
}

/**
 * LLM-based summary generator using Gemini AI
 */
export async function generateLLMSummary(exchanges) {
  // Check if Gemini is available
  if (!geminiService.isReady()) {
    console.log('Gemini not configured, falling back to rule-based summary');
    return generateRuleBasedSummary(exchanges);
  }

  try {
    // Prepare exchange content for AI
    const exchangeContent = exchanges
      .slice(-10) // Last 10 exchanges for context
      .map((e, i) => `[${i + 1}] ${e.role || 'user'}: ${e.content || e.summary || ''}`)
      .join('\n');

    const prompt = `Extract session info as JSON only. No markdown, no extra text.

${exchangeContent}

{"projectType":"project type","globalIntent":"main goal","componentsUsed":[],"lastChange":"recent action","aiSummary":"2-3 sentence summary"}`;

    const response = await geminiService.generateContent(prompt, { 
      temperature: 0.3,
      maxTokens: 300 
    });

    // Parse the JSON response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        projectType: parsed.projectType || '',
        globalIntent: parsed.globalIntent || '',
        componentsUsed: parsed.componentsUsed || [],
        lastChange: parsed.lastChange || '',
        aiSummary: parsed.aiSummary || '',
      };
    }

    // Fallback if parsing fails
    return generateRuleBasedSummary(exchanges);
  } catch (error) {
    console.error('Gemini summary error:', error);
    return generateRuleBasedSummary(exchanges);
  }
}

/**
 * Generate AI-enhanced context summary
 */
export async function generateAISummary(text) {
  if (!geminiService.isReady()) {
    return null;
  }

  try {
    return await geminiService.summarizeContext(text);
  } catch (error) {
    console.error('AI summary failed:', error);
    return null;
  }
}

/**
 * Get AI suggestions for components based on context
 */
export async function getAIComponentSuggestions(context, framework = 'React') {
  if (!geminiService.isReady()) {
    return [];
  }

  try {
    return await geminiService.suggestComponents(context, framework);
  } catch (error) {
    console.error('AI suggestions failed:', error);
    return [];
  }
}

/**
 * Context Manager Class
 */
export class ContextManager {
  constructor(options = {}) {
    this.maxExchanges = options.maxExchanges || 50;
    this.context = { ...DEFAULT_CONTEXT };
    this.exchanges = [];
    this.useLLM = options.useLLM || false;
    this.apiKey = options.apiKey || '';
  }

  /**
   * Add a new exchange to history
   */
  addExchange(exchange) {
    this.exchanges.push({
      ...exchange,
      timestamp: Date.now(),
    });

    // Keep only recent exchanges
    if (this.exchanges.length > this.maxExchanges) {
      this.exchanges = this.exchanges.slice(-this.maxExchanges);
    }

    // Auto-update context
    this.updateContext();
  }

  /**
   * Update context based on current exchanges
   */
  async updateContext() {
    if (this.useLLM && this.apiKey) {
      this.context = await generateLLMSummary(this.exchanges, this.apiKey);
    } else {
      this.context = generateRuleBasedSummary(this.exchanges);
    }
    return this.context;
  }

  /**
   * Get current context
   */
  getContext() {
    return { ...this.context };
  }

  /**
   * Set context manually
   */
  setContext(updates) {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Clear all history
   */
  clear() {
    this.context = { ...DEFAULT_CONTEXT };
    this.exchanges = [];
  }

  /**
   * Export state for persistence
   */
  export() {
    return {
      context: this.context,
      exchanges: this.exchanges,
    };
  }

  /**
   * Import state from persistence
   */
  import(state) {
    if (state.context) this.context = state.context;
    if (state.exchanges) this.exchanges = state.exchanges;
  }
}

// Singleton instance
let contextManagerInstance = null;

export function getContextManager(options) {
  if (!contextManagerInstance) {
    contextManagerInstance = new ContextManager(options);
  }
  return contextManagerInstance;
}

export default ContextManager;
