import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, ExternalLink, ImageIcon, Upload } from 'lucide-react';
import { usePromptStore } from '../../stores/promptStore';
import { useSnippetStore } from '../../stores/snippetStore';
import { useAppStore } from '../../stores/appStore';
import { useState, useRef } from 'react';

function SnippetSection() {
  const { selectedSnippets, removeSnippet, addSnippet } = usePromptStore();
  const { snippets: allSnippets } = useSnippetStore();
  const { setActiveTab } = useAppStore();
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const fileInputRefs = useRef({});

  // Quick add snippets - these reference actual snippets from the store
  const quickSnippetRefs = [
    { name: 'Glass Card', source: 'uiverse', category: 'cards' },
    { name: 'Gradient Glow Button', source: 'uiverse', category: 'buttons' },
    { name: 'Sidebar Navigation', source: 'shadcn', category: 'navigation' },
    { name: 'Basic Card', source: 'shadcn', category: 'cards' },
  ];

  // Find the actual snippet from the store
  const findFullSnippet = (ref) => {
    return allSnippets.find(s => 
      s.name.toLowerCase().includes(ref.name.toLowerCase().split(' ')[0]) &&
      s.source === ref.source
    );
  };

  const handleQuickAdd = (ref) => {
    // Find the full snippet with code from the store
    const fullSnippet = findFullSnippet(ref);
    
    if (fullSnippet) {
      addSnippet({
        ...fullSnippet,
        id: `${fullSnippet.id}-${Date.now()}`, // Unique ID for this selection
      });
    } else {
      // Fallback if not found - add with a note
      addSnippet({
        id: `quick-${Date.now()}`,
        name: ref.name,
        source: ref.source,
        category: ref.category,
        description: `${ref.name} component reference`,
        code: `// ${ref.name} - Add code from Snippets library`,
        language: 'jsx',
      });
    }
    setShowQuickAdd(false);
  };

  // Handle adding image to a snippet
  const handleAddImageToSnippet = (snippetId, file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // Update the snippet with the image
      const updatedSnippets = selectedSnippets.map(s => {
        if (s.id === snippetId) {
          return { ...s, imageDataUrl: e.target.result };
        }
        return s;
      });
      // We need to re-add the snippet with the image
      const snippet = selectedSnippets.find(s => s.id === snippetId);
      if (snippet) {
        removeSnippet(snippetId);
        addSnippet({ ...snippet, imageDataUrl: e.target.result });
      }
    };
    reader.readAsDataURL(file);
  };

  // Count snippets with images
  const snippetsWithImages = selectedSnippets.filter(s => s.imageDataUrl || s.imageUrl).length;

  return (
    <div className="space-y-3">
      {/* Selected Snippets */}
      {selectedSnippets.length > 0 ? (
        <div className="space-y-2">
          <AnimatePresence>
            {selectedSnippets.map((snippet) => (
              <motion.div
                key={snippet.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between p-2 bg-surface-dark 
                           border border-glass-border rounded-lg group"
              >
                <div className="flex items-center gap-2">
                  {/* Thumbnail - show image if available */}
                  <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-accent-teal/20 to-accent-purple/20 flex items-center justify-center">
                    {snippet.imageDataUrl || snippet.imageUrl ? (
                      <img 
                        src={snippet.imageDataUrl || snippet.imageUrl} 
                        alt={snippet.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-sm text-gray-400">
                        {snippet.name?.charAt(0) || 'S'}
                      </span>
                    )}
                    {/* Add image button overlay */}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => fileInputRefs.current[snippet.id] = el}
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          handleAddImageToSnippet(snippet.id, e.target.files[0]);
                        }
                      }}
                    />
                    <button
                      onClick={() => fileInputRefs.current[snippet.id]?.click()}
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 
                                 flex items-center justify-center transition-opacity"
                      title="Add reference image"
                    >
                      <ImageIcon size={14} className="text-white" />
                    </button>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-200">
                      {snippet.name}
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{snippet.source}</span>
                      {(snippet.imageDataUrl || snippet.imageUrl) && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-accent-purple/20 text-accent-purple rounded">
                          📸 Image
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => removeSnippet(snippet.id)}
                  className="p-1 text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <X size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <p className="text-sm text-gray-500 text-center py-4">
          No snippets added. Click below or go to Snippets tab.
        </p>
      )}

      {/* Quick Add Section */}
      <div className="relative" style={{ zIndex: showQuickAdd ? 50 : 1 }}>
        <button
          onClick={() => setShowQuickAdd(!showQuickAdd)}
          className="w-full flex items-center justify-center gap-2 py-2 border border-dashed 
                     border-glass-border rounded-lg text-sm text-gray-400 
                     hover:text-accent-teal hover:border-accent-teal/30 transition-all"
        >
          <Plus size={14} />
          Quick Add Snippet
        </button>

        <AnimatePresence>
          {showQuickAdd && (
            <>
              {/* Backdrop to close on click outside */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setShowQuickAdd(false)}
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 right-0 bottom-full mb-2 p-2 bg-surface-dark 
                           border border-glass-border rounded-xl shadow-glass-lg z-50"
              >
                <p className="text-xs text-gray-500 mb-2 px-1">Quick add popular snippets</p>
                <div className="grid grid-cols-2 gap-1.5 max-h-40 overflow-y-auto custom-scrollbar">
                  {quickSnippetRefs.map((ref, index) => (
                    <button
                      key={index}
                      onClick={() => handleQuickAdd(ref)}
                      className="p-2 text-left bg-glass-hover rounded-lg hover:bg-glass-active 
                                 transition-colors"
                    >
                      <p className="text-xs font-medium text-gray-200 truncate">
                        {ref.name}
                      </p>
                      <p className="text-xs text-gray-500">{ref.source}</p>
                    </button>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t border-glass-border">
                  <button
                    onClick={() => {
                      setShowQuickAdd(false);
                      setActiveTab('snippets');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-1.5 text-xs 
                               text-accent-teal hover:text-accent-teal/80"
                  >
                    <ExternalLink size={12} />
                    Browse All Snippets
                  </button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* Snippet count */}
      <p className="text-xs text-gray-500 text-right">
        {selectedSnippets.length} snippet{selectedSnippets.length !== 1 ? 's' : ''} selected
      </p>
    </div>
  );
}

export default SnippetSection;
