import { motion } from 'framer-motion';
import { X, Copy, Check, ImageIcon, Download, ExternalLink } from 'lucide-react';
import { usePromptStore } from '../../stores/promptStore';
import { useState, useMemo } from 'react';

function PromptPreview({ onClose }) {
  const { 
    getCompositePrompt,
    getAllImagesForPrompt,
    contextSummary = {}, 
    userIntent = '', 
    selectedSnippets = [], 
    constraints = {}, 
    framework = 'react',
    selectedImages = [],
    codeAttachments = []
  } = usePromptStore();
  const [copied, setCopied] = useState(false);
  const [copiedImageId, setCopiedImageId] = useState(null);
  const [activeTab, setActiveTab] = useState('prompt'); // 'prompt' or 'images'

  // Use useMemo to prevent recalculating on every render
  const prompt = useMemo(() => getCompositePrompt(), [
    userIntent, contextSummary, selectedSnippets, constraints, framework, selectedImages, codeAttachments
  ]);

  // Get all images (snippet images + attached images)
  const allImages = useMemo(() => getAllImagesForPrompt(), [selectedSnippets, selectedImages]);

  const handleCopy = async () => {
    if (window.electron) {
      await window.electron.copyToClipboard(prompt);
    } else {
      await navigator.clipboard.writeText(prompt);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Copy a single image to clipboard
  const handleCopyImage = async (image, index) => {
    try {
      // Convert data URL to blob
      const response = await fetch(image.dataUrl);
      const blob = await response.blob();
      
      // Try to copy to clipboard
      if (navigator.clipboard?.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ [blob.type]: blob })
        ]);
        setCopiedImageId(index);
        setTimeout(() => setCopiedImageId(null), 2000);
      } else {
        // Fallback: open in new tab for manual copy
        window.open(image.dataUrl, '_blank');
      }
    } catch (err) {
      console.error('Failed to copy image:', err);
      // Fallback: open in new tab
      window.open(image.dataUrl, '_blank');
    }
  };

  // Download image
  const handleDownloadImage = (image, index) => {
    const link = document.createElement('a');
    link.href = image.dataUrl;
    link.download = `${image.name || `image-${index + 1}`}.png`;
    link.click();
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
        className="w-full max-w-2xl max-h-[85vh] bg-surface-dark border border-glass-border 
                   rounded-2xl shadow-glass-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <h3 className="text-lg font-semibold text-white">Prompt Preview</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-accent-teal/10 text-accent-teal 
                         hover:bg-accent-teal/20 transition-colors"
              title="Copy prompt text"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-gray-400 hover:text-white 
                         hover:bg-glass-hover transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-glass-border">
          <button
            onClick={() => setActiveTab('prompt')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors ${
              activeTab === 'prompt' 
                ? 'bg-glass-hover text-white border-b-2 border-accent-teal' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Copy size={14} />
            Prompt Text
          </button>
          <button
            onClick={() => setActiveTab('images')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm transition-colors ${
              activeTab === 'images' 
                ? 'bg-glass-hover text-white border-b-2 border-accent-purple' 
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <ImageIcon size={14} />
            Images ({allImages.length})
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {activeTab === 'prompt' ? (
            <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed">
              {prompt || 'No prompt generated yet. Add some content to the builder.'}
            </pre>
          ) : (
            <div className="space-y-4">
              {allImages.length > 0 ? (
                <>
                  {/* Image Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    {allImages.map((image, index) => (
                      <div 
                        key={index}
                        className="group relative bg-glass-hover border border-glass-border rounded-xl overflow-hidden"
                      >
                        {/* Image */}
                        <div className="aspect-video bg-black/20">
                          <img
                            src={image.dataUrl}
                            alt={image.name}
                            className="w-full h-full object-contain"
                            draggable="true"
                          />
                        </div>

                        {/* Info & Actions */}
                        <div className="p-3 space-y-2">
                          <div>
                            <p className="text-sm font-medium text-white truncate">{image.name}</p>
                            <p className="text-xs text-gray-500">
                              {image.source === 'snippet' ? '📦 From snippet' : '📎 Attached'}
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleCopyImage(image, index)}
                              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs rounded-lg transition-all ${
                                copiedImageId === index
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-accent-teal/10 text-accent-teal hover:bg-accent-teal/20'
                              }`}
                            >
                              {copiedImageId === index ? (
                                <>
                                  <Check size={12} />
                                  Copied!
                                </>
                              ) : (
                                <>
                                  <Copy size={12} />
                                  Copy
                                </>
                              )}
                            </button>
                            <button
                              onClick={() => handleDownloadImage(image, index)}
                              className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs 
                                         bg-glass-hover text-gray-300 hover:text-white rounded-lg transition-all"
                              title="Download image"
                            >
                              <Download size={12} />
                            </button>
                            <button
                              onClick={() => window.open(image.dataUrl, '_blank')}
                              className="flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs 
                                         bg-glass-hover text-gray-300 hover:text-white rounded-lg transition-all"
                              title="Open in new tab"
                            >
                              <ExternalLink size={12} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                  <ImageIcon size={48} className="mb-4 opacity-50" />
                  <p className="text-sm">No images attached</p>
                  <p className="text-xs mt-1">Add images via the Intent section or select snippets with images</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-glass-border">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>{prompt.length} characters</span>
            <div className="flex items-center gap-4">
              {allImages.length > 0 && (
                <span className="text-accent-purple">{allImages.length} image{allImages.length !== 1 ? 's' : ''}</span>
              )}
              <span>~{Math.ceil(prompt.length / 4)} tokens</span>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default PromptPreview;
