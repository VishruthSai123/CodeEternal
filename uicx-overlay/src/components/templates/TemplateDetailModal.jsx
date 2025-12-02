import { motion } from 'framer-motion';
import { X, Copy, Check, Code, Heart, Bookmark, ChevronLeft, Palette, Download, Layers, Image } from 'lucide-react';
import { useState } from 'react';
import { useTemplateStore, COMPONENT_TYPES } from '../../stores/templateStore';

function TemplateDetailModal({ template, isSelected, onSelect, onClose }) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [selectedComponent, setSelectedComponent] = useState(null);

  const { 
    toggleLike, 
    toggleSave, 
    likedTemplateIds,
    savedTemplateIds,
    templates,
  } = useTemplateStore();

  // Get fresh template data from store
  const currentTemplate = templates.find(t => t.id === template.id) || template;
  const isLiked = likedTemplateIds.includes(template.id);
  const isSaved = savedTemplateIds.includes(template.id);
  const components = currentTemplate.components || [];

  const getComponentTypeLabel = (type) => {
    const found = COMPONENT_TYPES.find(ct => ct.value === type);
    return found?.label || type;
  };

  const handleCopyCode = async (code) => {
    if (code) {
      if (window.electron) {
        await window.electron.copyToClipboard(code);
      } else {
        await navigator.clipboard.writeText(code);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    await toggleLike(template.id);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    await toggleSave(template.id);
  };

  const getCategoryColor = (color) => {
    const colors = {
      teal: 'bg-accent-teal/20 text-accent-teal border-accent-teal/30',
      purple: 'bg-accent-purple/20 text-accent-purple border-accent-purple/30',
      blue: 'bg-accent-blue/20 text-accent-blue border-accent-blue/30',
      green: 'bg-green-500/20 text-green-400 border-green-500/30',
      yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      red: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[color] || colors.teal;
  };

  // Render color palette for theme templates
  const renderColorPalette = () => {
    if (!template.colorPalette) return null;
    const palette = template.colorPalette;

    return (
      <div className="p-4 bg-surface-light/50 rounded-xl border border-glass-border">
        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <Palette size={14} />
          Color Palette
        </h4>
        <div className="grid grid-cols-2 gap-2">
          {Object.entries(palette).map(([name, color]) => (
            <div key={name} className="flex items-center gap-2 p-2 bg-surface-dark rounded-lg">
              <div
                className="w-8 h-8 rounded-lg border border-glass-border"
                style={{ backgroundColor: color }}
              />
              <div>
                <p className="text-xs text-gray-400 capitalize">{name}</p>
                <p className="text-xs text-gray-500 font-mono">{color}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
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
        className="w-full max-w-2xl max-h-[90vh] bg-surface-dark border border-glass-border 
                   rounded-2xl shadow-glass-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between p-4 border-b border-glass-border">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white">{template.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2 py-0.5 text-xs rounded border ${getCategoryColor(template.categoryColor)}`}>
                {template.categoryName}
              </span>
              <span className="text-xs text-gray-500 uppercase">{template.language || 'jsx'}</span>
              {components.length > 0 && (
                <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-accent-teal/20 text-accent-teal rounded">
                  <Layers size={12} />
                  {components.length} component{components.length > 1 ? 's' : ''}
                </span>
              )}
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
              {currentTemplate.likesCount || 0}
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
            onClick={() => { setActiveTab('preview'); setSelectedComponent(null); }}
            className={`flex-1 py-2 text-sm font-medium transition-colors ${
              activeTab === 'preview'
                ? 'text-accent-purple border-b-2 border-accent-purple'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Preview
          </button>
          {template.code && (
            <button
              onClick={() => { setActiveTab('code'); setSelectedComponent(null); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'code'
                  ? 'text-accent-purple border-b-2 border-accent-purple'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Code
            </button>
          )}
          {components.length > 0 && (
            <button
              onClick={() => { setActiveTab('components'); setSelectedComponent(null); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-1 ${
                activeTab === 'components'
                  ? 'text-accent-purple border-b-2 border-accent-purple'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Layers size={14} />
              Components
            </button>
          )}
          {template.colorPalette && (
            <button
              onClick={() => { setActiveTab('palette'); setSelectedComponent(null); }}
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeTab === 'palette'
                  ? 'text-accent-purple border-b-2 border-accent-purple'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Colors
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {/* Preview Tab */}
          {activeTab === 'preview' && (
            <div className="space-y-4">
              {/* Main Image */}
              {template.previewUrl ? (
                <div className="w-full rounded-xl overflow-hidden bg-surface-light border border-glass-border">
                  <img
                    src={template.previewUrl}
                    alt={`${template.name} preview`}
                    className="w-full h-auto object-contain max-h-80"
                  />
                </div>
              ) : (
                <div className="w-full aspect-video rounded-xl bg-gradient-to-br from-accent-purple/10 to-accent-teal/10 
                                flex items-center justify-center border border-glass-border">
                  <div className="text-center">
                    <Image size={40} className="text-gray-500 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No preview image</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {template.description && (
                <p className="text-sm text-gray-400">{template.description}</p>
              )}

              {/* Tags */}
              {template.tags && template.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {template.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-1 text-xs bg-glass-hover text-gray-400 rounded-lg"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Usage Notes */}
              {template.usageNotes && (
                <div className="p-3 bg-surface-light/50 rounded-lg border border-glass-border">
                  <h4 className="text-xs font-medium text-gray-300 mb-1">Usage Notes</h4>
                  <p className="text-xs text-gray-500">{template.usageNotes}</p>
                </div>
              )}

              {/* Color palette preview in preview tab */}
              {template.colorPalette && renderColorPalette()}
            </div>
          )}

          {/* Code Tab */}
          {activeTab === 'code' && template.code && (
            <div className="space-y-4">
              {/* Language indicator */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Language:</span>
                <span className="px-2 py-0.5 text-xs bg-accent-purple/20 text-accent-purple rounded uppercase">
                  {template.language || 'jsx'}
                </span>
              </div>

              {/* Code block */}
              <div className="relative">
                <pre className="p-4 bg-surface-light rounded-xl border border-glass-border overflow-x-auto max-h-96">
                  <code className="text-xs text-gray-300 font-mono whitespace-pre">
                    {template.code || 'No code available'}
                  </code>
                </pre>
                <button
                  onClick={() => handleCopyCode(template.code)}
                  className="absolute top-2 right-2 p-2 rounded-lg bg-surface-dark/80 
                             text-gray-400 hover:text-white transition-colors"
                >
                  {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          )}

          {/* Components Tab */}
          {activeTab === 'components' && (
            <div className="space-y-3">
              {selectedComponent ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="space-y-4"
                >
                  {/* Back button */}
                  <button
                    onClick={() => setSelectedComponent(null)}
                    className="flex items-center gap-1 text-sm text-gray-400 hover:text-white transition-colors"
                  >
                    <ChevronLeft size={16} />
                    Back to Components
                  </button>

                  {/* Component header */}
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-medium text-white">{selectedComponent.name}</h4>
                    <span className="px-2 py-0.5 text-xs bg-accent-teal/20 text-accent-teal rounded">
                      {getComponentTypeLabel(selectedComponent.componentType)}
                    </span>
                  </div>

                  {selectedComponent.description && (
                    <p className="text-sm text-gray-400">{selectedComponent.description}</p>
                  )}

                  {/* Component image */}
                  {selectedComponent.imageUrl && (
                    <div className="w-full rounded-xl overflow-hidden bg-surface-light border border-glass-border">
                      <img
                        src={selectedComponent.imageUrl}
                        alt={selectedComponent.name}
                        className="w-full h-auto object-contain max-h-64"
                      />
                    </div>
                  )}

                  {/* Component code */}
                  {selectedComponent.code && (
                    <div className="relative">
                      <pre className="p-4 bg-surface-light rounded-xl border border-glass-border overflow-x-auto max-h-64">
                        <code className="text-xs text-gray-300 font-mono whitespace-pre">
                          {selectedComponent.code}
                        </code>
                      </pre>
                      <button
                        onClick={() => handleCopyCode(selectedComponent.code)}
                        className="absolute top-2 right-2 p-2 rounded-lg bg-surface-dark/80 
                                   text-gray-400 hover:text-white transition-colors"
                      >
                        {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </motion.div>
              ) : (
                <>
                  {components.length === 0 ? (
                    <div className="text-center py-8">
                      <Layers size={32} className="text-gray-500 mx-auto mb-2" />
                      <p className="text-sm text-gray-500">No components in this template</p>
                    </div>
                  ) : (
                    components.map((comp) => (
                      <motion.div
                        key={comp.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-3 bg-surface-light/50 rounded-xl border border-glass-border hover:border-accent-purple/30 transition-all cursor-pointer"
                        onClick={() => setSelectedComponent(comp)}
                      >
                        <div className="flex gap-3">
                          {/* Component image */}
                          <div className="w-20 h-16 rounded-lg bg-gradient-to-br from-accent-purple/10 to-accent-teal/10 
                                          flex items-center justify-center flex-shrink-0 overflow-hidden">
                            {comp.imageUrl ? (
                              <img
                                src={comp.imageUrl}
                                alt={comp.name}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <Code size={20} className="text-gray-500" />
                            )}
                          </div>

                          {/* Component info */}
                          <div className="flex-1 min-w-0">
                            <h5 className="text-sm font-medium text-gray-200 truncate">
                              {comp.name}
                            </h5>
                            <span className="inline-block px-1.5 py-0.5 text-[10px] bg-accent-teal/20 text-accent-teal rounded mt-1">
                              {getComponentTypeLabel(comp.componentType)}
                            </span>
                            {comp.description && (
                              <p className="text-xs text-gray-500 mt-1 line-clamp-1">{comp.description}</p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </>
              )}
            </div>
          )}

          {/* Palette Tab */}
          {activeTab === 'palette' && template.colorPalette && (
            <div className="space-y-4">
              {renderColorPalette()}
              
              {/* Copy as CSS variables */}
              <button
                onClick={async () => {
                  const cssVars = Object.entries(template.colorPalette)
                    .map(([name, value]) => `  --${name}: ${value};`)
                    .join('\n');
                  const css = `:root {\n${cssVars}\n}`;
                  await handleCopyCode(css);
                }}
                className="w-full py-2 px-4 rounded-lg bg-accent-purple/10 text-accent-purple 
                           border border-accent-purple/30 hover:bg-accent-purple/20 
                           transition-colors flex items-center justify-center gap-2"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                Copy as CSS Variables
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-glass-border">
          <button
            onClick={() => {
              onSelect(template);
              onClose();
            }}
            className={`w-full py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
              isSelected
                ? 'bg-accent-purple text-white'
                : 'bg-accent-purple/10 text-accent-purple border border-accent-purple/30 hover:bg-accent-purple/20'
            }`}
          >
            {isSelected ? (
              <>
                <Check size={16} />
                Selected
              </>
            ) : (
              <>
                <Download size={16} />
                Select Template
              </>
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default TemplateDetailModal;
