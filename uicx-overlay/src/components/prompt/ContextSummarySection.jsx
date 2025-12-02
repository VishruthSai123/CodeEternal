import { useState } from 'react';
import { usePromptStore } from '../../stores/promptStore';
import { useHistoryStore } from '../../stores/historyStore';
import { Edit3, Target, Layers, Clock, Wand2, Loader2, Sparkles, FileText } from 'lucide-react';
import geminiService from '../../core/geminiService';

function ContextSummarySection() {
  const { 
    contextSummary = { projectType: '', globalIntent: '', componentsUsed: [], lastChange: '' }, 
    updateContextSummary,
    sessionSummary = '',
    setSessionSummary
  } = usePromptStore();
  const [isGenerating, setIsGenerating] = useState(false);
  const [pasteContext, setPasteContext] = useState('');
  const [showPasteInput, setShowPasteInput] = useState(false);

  const handleAIAnalyze = async () => {
    if (!pasteContext.trim()) return;

    setIsGenerating(true);
    try {
      const prompt = `Extract key info as JSON only. No markdown, no extra text.

${pasteContext}

{"projectType":"project type","globalIntent":"main goal","componentsUsed":[],"lastChange":"recent action","sessionSummary":"1-2 sentence summary"}`;

      const response = await geminiService.generateContent(prompt, { 
        temperature: 0.3,
        maxTokens: 250 
      });

      // Parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        const newSummary = {
          projectType: parsed.projectType || contextSummary.projectType,
          globalIntent: parsed.globalIntent || contextSummary.globalIntent,
          componentsUsed: parsed.componentsUsed || contextSummary.componentsUsed,
          lastChange: parsed.lastChange || contextSummary.lastChange,
        };
        
        updateContextSummary(newSummary);
        
        // Save to summary history
        useHistoryStore.getState().addSummaryToHistory(newSummary);
        
        if (parsed.sessionSummary) {
          setSessionSummary(parsed.sessionSummary);
        }
        setPasteContext('');
        setShowPasteInput(false);
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      alert('AI analysis failed. Please check your API key.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* AI Context Analyzer */}
      <div className="p-3 bg-gradient-to-r from-accent-purple/10 to-accent-teal/10 border border-accent-purple/20 rounded-xl">
        <button
          onClick={() => setShowPasteInput(!showPasteInput)}
          className="w-full flex items-center gap-2 text-sm text-accent-purple hover:text-accent-teal transition-colors"
        >
          <Wand2 size={14} />
          <span>AI Context Analyzer</span>
          <span className="ml-auto text-xs text-accent-teal">✓ Ready</span>
        </button>

        {showPasteInput && (
          <div className="mt-3 space-y-2">
            <textarea
              value={pasteContext}
              onChange={(e) => setPasteContext(e.target.value)}
              placeholder="Paste your conversation or code context here and AI will extract project details..."
              className="glass-input text-sm h-24 resize-none"
            />
            <button
              onClick={handleAIAnalyze}
              disabled={isGenerating || !pasteContext.trim()}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-accent-purple/20 text-accent-purple border border-accent-purple/30 rounded-lg text-sm hover:bg-accent-purple/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {isGenerating ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles size={14} />
                  Analyze with AI
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Project Type */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-accent-purple/10">
          <Target size={14} className="text-accent-purple" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Project Type</label>
          <input
            type="text"
            value={contextSummary.projectType}
            onChange={(e) =>
              updateContextSummary({ projectType: e.target.value })
            }
            placeholder="e.g., Fintech Dashboard, E-commerce, SaaS..."
            className="glass-input text-sm py-2"
          />
        </div>
      </div>

      {/* Global Intent */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-accent-teal/10">
          <Layers size={14} className="text-accent-teal" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Project Goal</label>
          <input
            type="text"
            value={contextSummary.globalIntent}
            onChange={(e) =>
              updateContextSummary({ globalIntent: e.target.value })
            }
            placeholder="e.g., Build a modern admin panel..."
            className="glass-input text-sm py-2"
          />
        </div>
      </div>

      {/* Components Used */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-accent-blue/10">
          <Edit3 size={14} className="text-accent-blue" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">
            Components in Use
          </label>
          <input
            type="text"
            value={contextSummary.componentsUsed?.join(', ') || ''}
            onChange={(e) =>
              updateContextSummary({
                componentsUsed: e.target.value
                  .split(',')
                  .map((s) => s.trim())
                  .filter(Boolean),
              })
            }
            placeholder="e.g., Sidebar, Card, DataTable..."
            className="glass-input text-sm py-2"
          />
        </div>
      </div>

      {/* Last Change */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-yellow-500/10">
          <Clock size={14} className="text-yellow-500" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Last Change</label>
          <input
            type="text"
            value={contextSummary.lastChange}
            onChange={(e) =>
              updateContextSummary({ lastChange: e.target.value })
            }
            placeholder="e.g., Added user authentication flow..."
            className="glass-input text-sm py-2"
          />
        </div>
      </div>

      {/* Session Summary */}
      <div className="flex items-start gap-3">
        <div className="p-1.5 rounded-lg bg-accent-teal/10">
          <FileText size={14} className="text-accent-teal" />
        </div>
        <div className="flex-1">
          <label className="text-xs text-gray-500 mb-1 block">Session Summary</label>
          <textarea
            value={sessionSummary}
            onChange={(e) => setSessionSummary(e.target.value)}
            placeholder="AI-generated summary of your session work..."
            rows={2}
            className="glass-textarea text-sm"
          />
          <p className="text-[10px] text-gray-600 mt-1">
            This summary is included in your prompt instead of raw history
          </p>
        </div>
      </div>

      {/* Auto-summary info */}
      <p className="text-xs text-gray-500 italic">
        💡 Context & session summary auto-update as you type
      </p>
    </div>
  );
}

export default ContextSummarySection;
