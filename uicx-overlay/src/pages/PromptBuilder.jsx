import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Send,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Paperclip,
  Code,
  FileText,
  Sliders,
  RefreshCw,
  Check,
  Keyboard,
  ImageIcon,
  Loader2,
} from 'lucide-react';
import { usePromptStore } from '../stores/promptStore';
import { useHistoryStore } from '../stores/historyStore';
import useAutoSummarize from '../hooks/useAutoSummarize';
import ContextSummarySection from '../components/prompt/ContextSummarySection';
import IntentSection from '../components/prompt/IntentSection';
import SnippetSection from '../components/prompt/SnippetSection';
import ConstraintSection from '../components/prompt/ConstraintSection';
import TemplateSelector from '../components/prompt/TemplateSelector';
import PromptPreview from '../components/prompt/PromptPreview';
import AttachmentsSection from '../components/prompt/AttachmentsSection';

function PromptBuilder({ onBrowseTemplates }) {
  const [expandedSections, setExpandedSections] = useState({
    context: true,
    intent: true,
    attachments: false,
    snippets: false,
    constraints: false,
    template: false,
  });
  const [copied, setCopied] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const { 
    generateCompositePrompt, 
    resetPromptBuilder, 
    addToHistory, 
    userIntent, 
    contextSummary, 
    selectedImages = [], 
    codeAttachments = [],
    selectedSnippets = [],
    isAutoSummarizing = false,
    getAllImagesForPrompt
  } = usePromptStore();
  const { addPromptToHistory } = useHistoryStore();
  
  // Enable auto-summarization in background
  useAutoSummarize();

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleCopyPrompt = useCallback(async () => {
    const prompt = generateCompositePrompt();
    
    if (window.electron) {
      await window.electron.copyToClipboard(prompt);
    } else {
      await navigator.clipboard.writeText(prompt);
    }

    // Add to history with context
    addPromptToHistory(prompt);
    addToHistory({
      content: userIntent,
      summary: `${contextSummary.projectType}: ${userIntent.slice(0, 50)}...`,
    });

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [generateCompositePrompt, addPromptToHistory, addToHistory, userIntent, contextSummary]);

  const handleSendToEditor = useCallback(async () => {
    await handleCopyPrompt();
    // In a full implementation, this would trigger a keyboard shortcut
    // to paste into the active window
  }, [handleCopyPrompt]);

  // Global keyboard shortcuts that work everywhere including in input fields
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl/Cmd + Enter to copy prompt (works in input fields)
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleCopyPrompt();
      }
      // Ctrl/Cmd + Shift + Enter to send
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'Enter') {
        e.preventDefault();
        handleSendToEditor();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCopyPrompt, handleSendToEditor]);

  // Listen for Electron global shortcuts
  useEffect(() => {
    const unsubscribeCopy = window.electron?.onQuickCopyPrompt(handleCopyPrompt);
    const unsubscribePaste = window.electron?.onQuickPastePrompt(handleSendToEditor);

    return () => {
      unsubscribeCopy?.();
      unsubscribePaste?.();
    };
  }, [handleCopyPrompt, handleSendToEditor]);

  // Count attachments for badge (including snippet images)
  const snippetImageCount = selectedSnippets.filter(s => s.imageDataUrl || s.imageUrl).length;
  const attachmentCount = selectedImages.length + codeAttachments.length;
  const totalImageCount = attachmentCount + snippetImageCount;

  return (
    <div className="h-full flex flex-col">
      {/* Hotkey hint + Auto-summary status */}
      <div className="px-4 py-2 bg-surface-dark border-b border-glass-border flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <Keyboard size={12} />
          <span>Press <kbd className="px-1.5 py-0.5 bg-surface-dark rounded text-gray-400">Ctrl+Enter</kbd> to copy</span>
        </div>
        {isAutoSummarizing && (
          <div className="flex items-center gap-1.5 text-accent-purple">
            <Loader2 size={10} className="animate-spin" />
            <span>Auto-analyzing...</span>
          </div>
        )}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4 space-y-3">
        {/* Context Summary Section */}
        <CollapsibleSection
          title="Project Context"
          icon={isAutoSummarizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          isExpanded={expandedSections.context}
          onToggle={() => toggleSection('context')}
          badge={isAutoSummarizing ? "Analyzing..." : "Auto-linked"}
          badgeColor="teal"
        >
          <ContextSummarySection />
        </CollapsibleSection>

        {/* User Intent Section */}
        <CollapsibleSection
          title="Your Request"
          icon={<FileText size={14} />}
          isExpanded={expandedSections.intent}
          onToggle={() => toggleSection('intent')}
        >
          <IntentSection />
        </CollapsibleSection>

        {/* Attachments Section (Images & Code) */}
        <CollapsibleSection
          title="Attachments"
          icon={<Paperclip size={14} />}
          isExpanded={expandedSections.attachments}
          onToggle={() => toggleSection('attachments')}
          badge={attachmentCount > 0 ? String(attachmentCount) : null}
          badgeColor="purple"
        >
          <AttachmentsSection />
        </CollapsibleSection>

        {/* Snippets Section */}
        <CollapsibleSection
          title="Code Snippets"
          icon={<Code size={14} />}
          isExpanded={expandedSections.snippets}
          onToggle={() => toggleSection('snippets')}
          badge={snippetImageCount > 0 ? `${selectedSnippets.length} (${snippetImageCount} 📸)` : selectedSnippets.length > 0 ? String(selectedSnippets.length) : null}
          badgeColor="blue"
        >
          <SnippetSection />
        </CollapsibleSection>

        {/* Constraints Section */}
        <CollapsibleSection
          title="Constraints"
          icon={<Sliders size={14} />}
          isExpanded={expandedSections.constraints}
          onToggle={() => toggleSection('constraints')}
        >
          <ConstraintSection />
        </CollapsibleSection>

        {/* Template Section */}
        <CollapsibleSection
          title="Template"
          icon={<FileText size={14} />}
          isExpanded={expandedSections.template}
          onToggle={() => toggleSection('template')}
        >
          <TemplateSelector onBrowseTemplates={onBrowseTemplates} />
        </CollapsibleSection>
      </div>

      {/* Action Bar */}
      <div className="p-4 border-t border-glass-border bg-surface-dark space-y-3">
        {/* Preview Toggle */}
        <button
          onClick={() => setShowPreview(!showPreview)}
          className="w-full flex items-center justify-center gap-2 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
          <span>{showPreview ? 'Hide' : 'Show'} Prompt Preview</span>
          <ChevronDown
            size={14}
            className={`transform transition-transform ${
              showPreview ? 'rotate-180' : ''
            }`}
          />
        </button>

        {/* Action Buttons */}
        <div className="flex gap-2">
          <button
            onClick={resetPromptBuilder}
            className="flex-shrink-0 p-2 glass-btn text-gray-400 hover:text-white"
            title="Reset prompt"
          >
            <RefreshCw size={18} />
          </button>

          <button
            onClick={handleCopyPrompt}
            className="flex-1 btn-primary flex items-center justify-center gap-2"
          >
            {copied ? (
              <>
                <Check size={18} />
                Copied!
              </>
            ) : (
              <>
                <Copy size={18} />
                Copy Prompt
              </>
            )}
          </button>

          <button
            onClick={handleSendToEditor}
            className="flex-1 btn-secondary flex items-center justify-center gap-2"
          >
            <Send size={18} />
            Send
          </button>
        </div>
      </div>

      {/* Prompt Preview Modal */}
      <AnimatePresence>
        {showPreview && (
          <PromptPreview onClose={() => setShowPreview(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

// Collapsible Section Component
function CollapsibleSection({ title, icon, isExpanded, onToggle, badge, badgeColor = 'teal', children }) {
  const badgeColorClasses = {
    teal: 'bg-accent-teal/20 text-accent-teal border-accent-teal/30',
    purple: 'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
    blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  };

  return (
    <div className="bg-surface-light/50 border border-glass-border rounded-xl">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-glass-hover transition-colors rounded-t-xl"
      >
        <div className="flex items-center gap-2">
          <span className="text-accent-teal">{icon}</span>
          <span className="text-sm font-medium text-gray-200">{title}</span>
          {badge && (
            <span className={`px-1.5 py-0.5 text-[10px] rounded border ${badgeColorClasses[badgeColor]}`}>
              {badge}
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronDown size={14} className="text-gray-400" />
        ) : (
          <ChevronRight size={14} className="text-gray-400" />
        )}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default PromptBuilder;
