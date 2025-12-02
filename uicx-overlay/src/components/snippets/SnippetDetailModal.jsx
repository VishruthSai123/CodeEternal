import { motion } from 'framer-motion';
import { X, Copy, Plus, Check, ExternalLink, Code, ChevronDown, Heart, Bookmark, Crown, Wand2 } from 'lucide-react';
import { useState } from 'react';
import { SNIPPET_VARIANTS, useSnippetStore } from '../../stores/snippetStore';

function SnippetDetailModal({ snippet, isSelected, onSelect, onClose, isViewOnly = false }) {
  const [copied, setCopied] = useState(false);
  const [promptCopied, setPromptCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [selectedVariant, setSelectedVariant] = useState(null); // null = main code

  const { 
    toggleLike, 
    toggleSave, 
    isSnippetLiked, 
    isSnippetSaved,
    likedSnippetIds,
    savedSnippetIds,
    snippets,
  } = useSnippetStore();

  // Get fresh snippet data from store
  const currentSnippet = snippets.find(s => s.id === snippet.id) || snippet;
  const isLiked = likedSnippetIds.includes(snippet.id);
  const isSaved = savedSnippetIds.includes(snippet.id);

  // Get all available code variants (main + additional variants)
  const getAllVariants = () => {
    const mainVariant = {
      type: snippet.language || 'jsx',
      code: snippet.code,
      isMain: true,
    };
    const additionalVariants = (snippet.variants || []).map((v) => ({
      ...v,
      isMain: false,
    }));
    return [mainVariant, ...additionalVariants];
  };

  const allVariants = getAllVariants();
  const currentVariant = selectedVariant !== null ? allVariants[selectedVariant] : allVariants[0];

  const getVariantInfo = (type) => {
    return SNIPPET_VARIANTS.find((v) => v.value === type) || { label: type, icon: '📄' };
  };

  const handleCopyCode = async () => {
    const codeToCopy = currentVariant?.code || snippet.code;
    if (codeToCopy) {
      if (window.electron) {
        await window.electron.copyToClipboard(codeToCopy);
      } else {
        await navigator.clipboard.writeText(codeToCopy);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    await toggleLike(snippet.id);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    await toggleSave(snippet.id);
  };

  // Generate AI prompt based on snippet and selected variant
  const generatePrompt = () => {
    const variantInfo = getVariantInfo(currentVariant?.type || snippet.language || 'jsx');
    const code = currentVariant?.code || snippet.code;
    
    const prompt = `Generate a production-ready ${variantInfo.label} component.

Component: ${snippet.name}
Description: ${snippet.description || 'Reusable UI component'}
Category: ${snippet.category || 'UI'}
Format: ${variantInfo.label}${snippet.tags?.length > 0 ? `\nStyle: ${snippet.tags.join(', ')}` : ''}

Reference:
${code}
${snippet.usage ? `\nNotes: ${snippet.usage}` : ''}

Requirements:
- ${variantInfo.label === 'TSX' ? 'TypeScript types and interfaces' : 'Clean component structure'}
- Tailwind CSS for styling
- Responsive design
- Accessible markup
- Optimized for production`;

    return prompt;
  };

  const handleCreatePrompt = async () => {
    const prompt = generatePrompt();
    
    if (window.electron) {
      await window.electron.copyToClipboard(prompt);
    } else {
      await navigator.clipboard.writeText(prompt);
    }
    
    setPromptCopied(true);
    setTimeout(() => setPromptCopied(false), 3000);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg max-h-[85vh] bg-surface-dark border border-glass-border 
                   rounded-2xl shadow-glass-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-glass-border">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-white">{snippet.name}</h3>
              {snippet.isAdminSnippet && (
                <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-yellow-500/20 text-yellow-400 rounded">
                  <Crown size={10} />
                  Featured
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge badge-teal">{snippet.source}</span>
              <span className="text-xs text-gray-500">{snippet.category}</span>
            </div>
          </div>
          
          {/* Like and Save buttons */}
          <div className="flex items-center gap-2 mr-2">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs transition-all ${
                isLiked
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                  : 'bg-glass-hover text-gray-400 border border-glass-border hover:text-white'
              }`}
            >
              <Heart size={14} className={isLiked ? 'fill-current' : ''} />
              {currentSnippet.likesCount || 0}
            </button>
            <button
              onClick={handleSave}
              className={`p-1.5 rounded-lg transition-all ${
                isSaved
                  ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                  : 'bg-glass-hover text-gray-400 border border-glass-border hover:text-white'
              }`}
            >
              <Bookmark size={14} className={isSaved ? 'fill-current' : ''} />
            </button>
          </div>
          
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white 
                       hover:bg-glass-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-glass-border">
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'text-accent-teal border-b-2 border-accent-teal'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setActiveTab('code')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'code'
                ? 'text-accent-teal border-b-2 border-accent-teal'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Code
          </button>
          <button
            onClick={() => setActiveTab('usage')}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'usage'
                ? 'text-accent-teal border-b-2 border-accent-teal'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Usage
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Preview Image - fits container properly */}
              <div className="w-full rounded-xl bg-gradient-to-br from-accent-teal/10 to-accent-purple/10 
                              flex items-center justify-center overflow-hidden border border-glass-border">
                {(snippet.imageDataUrl || snippet.thumbnail || snippet.imageUrl) ? (
                  <img
                    src={snippet.imageDataUrl || snippet.thumbnail || snippet.imageUrl}
                    alt={snippet.name}
                    className="w-full h-auto max-h-[300px] object-contain"
                  />
                ) : (
                  <div className="py-12">
                    <Code size={48} className="text-gray-500" />
                  </div>
                )}
              </div>

              {/* Description */}
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  Description
                </h4>
                <p className="text-sm text-gray-400">
                  {snippet.description || 'No description available.'}
                </p>
              </div>

              {/* Tags */}
              {snippet.tags && snippet.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {snippet.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 text-xs bg-glass-hover border border-glass-border 
                                   rounded-lg text-gray-400"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'code' && (
            <div className="space-y-3">
              {/* Variant Selector */}
              {allVariants.length > 1 && (
                <div className="flex flex-wrap gap-1.5">
                  {allVariants.map((variant, index) => {
                    const info = getVariantInfo(variant.type);
                    const isActive = (selectedVariant === null && index === 0) || selectedVariant === index;
                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedVariant(index)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-all ${
                          isActive
                            ? 'bg-accent-teal/20 border-accent-teal/50 text-accent-teal'
                            : 'bg-glass-hover border-glass-border text-gray-400 hover:text-white hover:border-gray-600'
                        }`}
                      >
                        <span>{info.icon}</span>
                        {info.label}
                        {variant.isMain && <span className="text-[10px] opacity-60">(main)</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">
                  {getVariantInfo(currentVariant?.type || snippet.language || 'jsx').label}
                </span>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-glass-hover 
                             rounded-lg text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <pre className="p-4 bg-surface-dark rounded-xl border border-glass-border 
                              overflow-x-auto text-sm text-gray-300 font-mono max-h-64 overflow-y-auto">
                <code>
                  {currentVariant?.code || snippet.code || '// No code available for this snippet'}
                </code>
              </pre>
            </div>
          )}

          {activeTab === 'usage' && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-300 mb-2">
                  How to Use
                </h4>
                <p className="text-sm text-gray-400">
                  {snippet.usage ||
                    'Add this snippet to your prompt to use it as a reference for the AI code generator.'}
                </p>
              </div>

              {snippet.props && (
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-2">Props</h4>
                  <div className="space-y-2">
                    {Object.entries(snippet.props).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-start gap-2 p-2 bg-glass-hover rounded-lg"
                      >
                        <code className="text-xs text-accent-teal">{key}</code>
                        <span className="text-xs text-gray-400">{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {snippet.source !== 'custom' && (
                <a
                  href={snippet.sourceUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-accent-teal hover:underline"
                >
                  <ExternalLink size={14} />
                  View on {snippet.source}
                </a>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-glass-border">
          {isViewOnly ? (
            // Browse Snippets mode - Create Prompt button
            <div className="space-y-2">
              <button
                onClick={handleCreatePrompt}
                className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${
                  promptCopied
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-accent-purple to-accent-blue text-white hover:shadow-glow-purple'
                }`}
              >
                {promptCopied ? (
                  <>
                    <Check size={16} />
                    Copied to Clipboard!
                  </>
                ) : (
                  <>
                    <Wand2 size={16} />
                    Create Prompt
                  </>
                )}
              </button>
              <p className="text-[10px] text-center text-gray-500">
                {promptCopied 
                  ? 'Paste this prompt in ChatGPT, Claude, or any AI assistant'
                  : `Generates an AI prompt for ${getVariantInfo(currentVariant?.type || snippet.language).label} • Ready to paste`
                }
              </p>
            </div>
          ) : (
            // Project mode - Add to Prompt button
            <button
              onClick={onSelect}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl font-medium transition-all ${
                isSelected
                  ? 'bg-accent-teal text-gray-900'
                  : 'bg-glass-hover border border-glass-border text-white hover:bg-glass-active'
              }`}
            >
              {isSelected ? (
                <>
                  <Check size={16} />
                  Added to Prompt
                </>
              ) : (
                <>
                  <Plus size={16} />
                  Add to Prompt
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default SnippetDetailModal;
