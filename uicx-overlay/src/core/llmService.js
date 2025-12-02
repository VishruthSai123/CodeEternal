/**
 * LLM Service - Handles AI-powered features
 * Supports: OpenAI, Google Gemini, Local LLMs (Ollama)
 */

// API Configuration storage key
const CONFIG_KEY = 'code-eternal-llm-config';

/**
 * Get stored LLM configuration
 */
export function getLLMConfig() {
  try {
    const stored = localStorage.getItem(CONFIG_KEY);
    return stored ? JSON.parse(stored) : {
      provider: 'none',
      openaiKey: '',
      geminiKey: '',
      ollamaUrl: 'http://localhost:11434',
      model: 'gpt-4o-mini',
    };
  } catch {
    return { provider: 'none' };
  }
}

/**
 * Save LLM configuration
 */
export function saveLLMConfig(config) {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

/**
 * Test API connection
 */
export async function testConnection(config) {
  try {
    switch (config.provider) {
      case 'openai':
        return await testOpenAI(config.openaiKey);
      case 'gemini':
        return await testGemini(config.geminiKey);
      case 'ollama':
        return await testOllama(config.ollamaUrl);
      default:
        return { success: true, message: 'No LLM configured (using rule-based)' };
    }
  } catch (error) {
    return { success: false, message: error.message };
  }
}

/**
 * Test OpenAI connection
 */
async function testOpenAI(apiKey) {
  const response = await fetch('https://api.openai.com/v1/models', {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Invalid API key');
  }
  
  return { success: true, message: 'OpenAI connected successfully!' };
}

/**
 * Test Google Gemini connection
 */
async function testGemini(apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
  );
  
  if (!response.ok) {
    throw new Error('Invalid Gemini API key');
  }
  
  return { success: true, message: 'Gemini connected successfully!' };
}

/**
 * Test Ollama connection
 */
async function testOllama(baseUrl) {
  const response = await fetch(`${baseUrl}/api/tags`);
  
  if (!response.ok) {
    throw new Error('Cannot connect to Ollama. Is it running?');
  }
  
  const data = await response.json();
  return { 
    success: true, 
    message: `Ollama connected! ${data.models?.length || 0} models available.`,
    models: data.models,
  };
}

/**
 * Generate context summary using LLM
 */
export async function generateSummary(context, config = null) {
  config = config || getLLMConfig();
  
  if (config.provider === 'none') {
    return generateRuleBasedSummary(context);
  }
  
  const prompt = buildSummaryPrompt(context);
  
  try {
    switch (config.provider) {
      case 'openai':
        return await callOpenAI(prompt, config);
      case 'gemini':
        return await callGemini(prompt, config);
      case 'ollama':
        return await callOllama(prompt, config);
      default:
        return generateRuleBasedSummary(context);
    }
  } catch (error) {
    console.error('LLM error, falling back to rule-based:', error);
    return generateRuleBasedSummary(context);
  }
}

/**
 * Build summary prompt
 */
function buildSummaryPrompt(context) {
  return `Extract info as JSON only. No extra text.

Context:
${JSON.stringify(context, null, 2)}

{"projectType":"project type","globalIntent":"main goal","componentsUsed":[],"lastChange":"recent work","suggestions":["suggestion 1","suggestion 2"]}`;
}

/**
 * Call OpenAI API
 */
async function callOpenAI(prompt, config) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.openaiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Output valid JSON only. No markdown, no explanations.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 500,
    }),
  });
  
  if (!response.ok) {
    throw new Error('OpenAI API error');
  }
  
  const data = await response.json();
  const content = data.choices[0]?.message?.content || '{}';
  
  try {
    return JSON.parse(content);
  } catch {
    return { globalIntent: content };
  }
}

/**
 * Call Google Gemini API
 */
async function callGemini(prompt, config) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${config.geminiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 500 },
      }),
    }
  );
  
  if (!response.ok) {
    throw new Error('Gemini API error');
  }
  
  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  
  try {
    // Extract JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { globalIntent: content };
  } catch {
    return { globalIntent: content };
  }
}

/**
 * Call Ollama API (local)
 */
async function callOllama(prompt, config) {
  const response = await fetch(`${config.ollamaUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.ollamaModel || 'llama3.2',
      prompt: prompt,
      stream: false,
    }),
  });
  
  if (!response.ok) {
    throw new Error('Ollama API error');
  }
  
  const data = await response.json();
  const content = data.response || '{}';
  
  try {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    return jsonMatch ? JSON.parse(jsonMatch[0]) : { globalIntent: content };
  } catch {
    return { globalIntent: content };
  }
}

/**
 * Rule-based summary (no LLM)
 */
function generateRuleBasedSummary(context) {
  const text = JSON.stringify(context).toLowerCase();
  
  // Detect project type
  let projectType = '';
  if (text.includes('dashboard') || text.includes('admin')) projectType = 'Dashboard';
  else if (text.includes('ecommerce') || text.includes('shop') || text.includes('cart')) projectType = 'E-commerce';
  else if (text.includes('landing') || text.includes('hero')) projectType = 'Landing Page';
  else if (text.includes('auth') || text.includes('login')) projectType = 'Authentication';
  else if (text.includes('blog') || text.includes('article')) projectType = 'Blog/CMS';
  else if (text.includes('saas') || text.includes('pricing')) projectType = 'SaaS';
  
  // Extract components
  const componentPatterns = /\b(button|card|modal|sidebar|navbar|header|footer|form|input|table|list|grid|avatar|badge|toast|alert)\b/gi;
  const matches = text.match(componentPatterns) || [];
  const componentsUsed = [...new Set(matches.map(m => m.charAt(0).toUpperCase() + m.slice(1).toLowerCase()))];
  
  return {
    projectType,
    globalIntent: context.globalIntent || '',
    componentsUsed: componentsUsed.slice(0, 8),
    lastChange: context.lastChange || '',
    suggestions: [],
  };
}

/**
 * Enhance prompt with AI suggestions
 */
export async function enhancePrompt(prompt, config = null) {
  config = config || getLLMConfig();
  
  if (config.provider === 'none') {
    return prompt; // No enhancement without LLM
  }
  
  const enhanceRequest = `Improve this UI generation prompt to be more specific and effective. Keep the same intent but add helpful details:

Original prompt:
${prompt}

Provide the enhanced prompt only, no explanations.`;

  try {
    switch (config.provider) {
      case 'openai':
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${config.openaiKey}`,
          },
          body: JSON.stringify({
            model: config.model || 'gpt-4o-mini',
            messages: [{ role: 'user', content: enhanceRequest }],
            temperature: 0.5,
            max_tokens: 1000,
          }),
        });
        const data = await response.json();
        return data.choices[0]?.message?.content || prompt;
      default:
        return prompt;
    }
  } catch {
    return prompt;
  }
}

export default {
  getLLMConfig,
  saveLLMConfig,
  testConnection,
  generateSummary,
  enhancePrompt,
};
