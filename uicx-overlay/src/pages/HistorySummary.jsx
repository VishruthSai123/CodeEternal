import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History,
  FileText,
  Trash2,
  Copy,
  Check,
  ChevronRight,
  Clock,
  Sparkles,
} from 'lucide-react';
import { useHistoryStore } from '../stores/historyStore';
import { usePromptStore } from '../stores/promptStore';

function HistorySummary() {
  const [activeTab, setActiveTab] = useState('prompts');
  const [copied, setCopied] = useState(null);

  const {
    promptHistory,
    summaryHistory,
    removePromptFromHistory,
    removeSummaryFromHistory,
    clearPromptHistory,
    clearSummaryHistory,
  } = useHistoryStore();

  const { setUserIntent, updateContextSummary } = usePromptStore();

  const handleCopyPrompt = async (prompt, id) => {
    if (window.electron) {
      await window.electron.copyToClipboard(prompt.content);
    } else {
      await navigator.clipboard.writeText(prompt.content);
    }
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleReusePrompt = (prompt) => {
    // Extract the user intent portion from the prompt
    const lines = prompt.content.split('\n');
    const requestIndex = lines.findIndex((l) => l.includes('## Request'));
    if (requestIndex !== -1) {
      const nextSectionIndex = lines.findIndex(
        (l, i) => i > requestIndex && l.startsWith('##')
      );
      const intent = lines
        .slice(requestIndex + 1, nextSectionIndex !== -1 ? nextSectionIndex : undefined)
        .join('\n')
        .trim();
      setUserIntent(intent);
    }
  };

  const handleRestoreSummary = (summary) => {
    updateContextSummary({
      projectType: summary.projectType,
      globalIntent: summary.globalIntent,
      componentsUsed: summary.componentsUsed || [],
      lastChange: summary.lastChange,
    });
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;

    // Less than 1 minute
    if (diff < 60000) return 'Just now';
    // Less than 1 hour
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    // Less than 24 hours
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    // Otherwise show date
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPromptPreview = (content, maxLength = 100) => {
    const cleaned = content.replace(/^##.*$/gm, '').replace(/\n+/g, ' ').trim();
    return cleaned.length > maxLength
      ? cleaned.slice(0, maxLength) + '...'
      : cleaned;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-glass-border">
        <button
          onClick={() => setActiveTab('prompts')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'prompts'
              ? 'text-accent-teal border-b-2 border-accent-teal'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <History size={16} />
          Prompts
          {promptHistory.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-glass-hover rounded-full">
              {promptHistory.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('summaries')}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors ${
            activeTab === 'summaries'
              ? 'text-accent-teal border-b-2 border-accent-teal'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Sparkles size={16} />
          Summaries
          {summaryHistory.length > 0 && (
            <span className="px-1.5 py-0.5 text-xs bg-glass-hover rounded-full">
              {summaryHistory.length}
            </span>
          )}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4">
        <AnimatePresence mode="wait">
          {activeTab === 'prompts' ? (
            <motion.div
              key="prompts"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              {promptHistory.length > 0 ? (
                <>
                  {/* Clear All Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={clearPromptHistory}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Prompt List */}
                  {promptHistory.map((prompt) => (
                    <motion.div
                      key={prompt.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 bg-surface-light/50 border border-glass-border rounded-xl 
                                 hover:border-accent-teal/20 transition-all group"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={12} />
                          {formatDate(prompt.timestamp)}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleCopyPrompt(prompt, prompt.id)}
                            className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-glass-hover"
                            title="Copy prompt"
                          >
                            {copied === prompt.id ? (
                              <Check size={12} className="text-accent-teal" />
                            ) : (
                              <Copy size={12} />
                            )}
                          </button>
                          <button
                            onClick={() => handleReusePrompt(prompt)}
                            className="p-1 rounded-md text-gray-500 hover:text-accent-teal hover:bg-glass-hover"
                            title="Reuse prompt"
                          >
                            <ChevronRight size={12} />
                          </button>
                          <button
                            onClick={() => removePromptFromHistory(prompt.id)}
                            className="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-glass-hover"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Preview */}
                      <p className="text-sm text-gray-300 line-clamp-3">
                        {getPromptPreview(prompt.content, 150)}
                      </p>

                      {/* Stats */}
                      <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span>{prompt.content.length} chars</span>
                        {prompt.snippetCount > 0 && (
                          <span>{prompt.snippetCount} snippets</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                <EmptyState
                  icon={<History size={32} className="text-gray-500" />}
                  title="No prompts yet"
                  description="Your generated prompts will appear here"
                />
              )}
            </motion.div>
          ) : (
            <motion.div
              key="summaries"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="space-y-3"
            >
              {summaryHistory.length > 0 ? (
                <>
                  {/* Clear All Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={clearSummaryHistory}
                      className="text-xs text-gray-500 hover:text-red-400 transition-colors"
                    >
                      Clear all
                    </button>
                  </div>

                  {/* Summary List */}
                  {summaryHistory.map((summary) => (
                    <motion.div
                      key={summary.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="p-3 bg-surface-light/50 border border-glass-border rounded-xl 
                                 hover:border-accent-purple/20 transition-all group"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <Clock size={12} />
                          {formatDate(summary.timestamp)}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleRestoreSummary(summary)}
                            className="p-1 rounded-md text-gray-500 hover:text-accent-purple hover:bg-glass-hover"
                            title="Restore summary"
                          >
                            <ChevronRight size={12} />
                          </button>
                          <button
                            onClick={() => removeSummaryFromHistory(summary.id)}
                            className="p-1 rounded-md text-gray-500 hover:text-red-400 hover:bg-glass-hover"
                            title="Delete"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </div>

                      {/* Summary Content */}
                      <div className="space-y-1">
                        {summary.projectType && (
                          <p className="text-sm text-gray-300">
                            <span className="text-accent-purple">Type:</span>{' '}
                            {summary.projectType}
                          </p>
                        )}
                        {summary.globalIntent && (
                          <p className="text-sm text-gray-300">
                            <span className="text-accent-purple">Goal:</span>{' '}
                            {summary.globalIntent}
                          </p>
                        )}
                        {summary.componentsUsed?.length > 0 && (
                          <p className="text-sm text-gray-300">
                            <span className="text-accent-purple">Components:</span>{' '}
                            {summary.componentsUsed.join(', ')}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </>
              ) : (
                <EmptyState
                  icon={<Sparkles size={32} className="text-gray-500" />}
                  title="No summaries yet"
                  description="Project context summaries will appear here"
                />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function EmptyState({ icon, title, description }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-12">
      <div className="w-16 h-16 rounded-2xl bg-glass-hover flex items-center justify-center mb-4">
        {icon}
      </div>
      <p className="text-gray-400 mb-2">{title}</p>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}

export default HistorySummary;
