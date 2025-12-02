import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ImageIcon, 
  Code, 
  X, 
  Plus, 
  Upload, 
  Clipboard,
  Eye,
  FileCode
} from 'lucide-react';
import { usePromptStore } from '../../stores/promptStore';

function AttachmentsSection() {
  const { 
    selectedImages = [], 
    addImage, 
    removeImage, 
    codeAttachments = [],
    addCodeAttachment,
    removeCodeAttachment 
  } = usePromptStore();
  
  const [activeTab, setActiveTab] = useState('images');
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  // Handle image upload
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          addImage({
            name: file.name,
            dataUrl: event.target.result,
            description: '',
          });
        };
        reader.readAsDataURL(file);
      }
    });
    e.target.value = '';
  };

  // Handle paste from clipboard
  const handlePasteImage = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type);
            const reader = new FileReader();
            reader.onload = (event) => {
              addImage({
                name: `Screenshot ${new Date().toLocaleTimeString()}`,
                dataUrl: event.target.result,
                description: '',
              });
            };
            reader.readAsDataURL(blob);
          }
        }
      }
    } catch (err) {
      console.log('No image in clipboard');
    }
  };

  return (
    <div className="space-y-3">
      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 bg-glass-hover rounded-lg">
        <button
          onClick={() => setActiveTab('images')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs transition-all ${
            activeTab === 'images'
              ? 'bg-accent-teal/20 text-accent-teal'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <ImageIcon size={12} />
          Images ({selectedImages.length})
        </button>
        <button
          onClick={() => setActiveTab('code')}
          className={`flex-1 flex items-center justify-center gap-2 py-1.5 px-3 rounded-md text-xs transition-all ${
            activeTab === 'code'
              ? 'bg-accent-purple/20 text-accent-purple'
              : 'text-gray-400 hover:text-white'
          }`}
        >
          <Code size={12} />
          Code ({codeAttachments.length})
        </button>
      </div>

      {/* Images Tab */}
      {activeTab === 'images' && (
        <div className="space-y-2">
          {/* Upload Buttons */}
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-glass-hover border border-glass-border rounded-lg text-xs text-gray-300 hover:border-accent-teal/30 hover:text-accent-teal transition-all"
            >
              <Upload size={12} />
              Upload Image
            </button>
            <button
              onClick={handlePasteImage}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-3 bg-glass-hover border border-glass-border rounded-lg text-xs text-gray-300 hover:border-accent-teal/30 hover:text-accent-teal transition-all"
            >
              <Clipboard size={12} />
              Paste Screenshot
            </button>
          </div>

          {/* Image Grid */}
          <AnimatePresence>
            {selectedImages.length > 0 ? (
              <div className="grid grid-cols-3 gap-2">
                {selectedImages.map((image) => (
                  <motion.div
                    key={image.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="relative group aspect-square rounded-lg overflow-hidden border border-glass-border"
                  >
                    <img
                      src={image.dataUrl}
                      alt={image.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setShowImagePreview(image)}
                        className="p-1.5 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                      >
                        <Eye size={12} className="text-white" />
                      </button>
                      <button
                        onClick={() => removeImage(image.id)}
                        className="p-1.5 bg-red-500/50 rounded-lg hover:bg-red-500/70 transition-colors"
                      >
                        <X size={12} className="text-white" />
                      </button>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-1 bg-black/60">
                      <input
                        type="text"
                        value={image.description || ''}
                        onChange={(e) => {
                          const updated = selectedImages.map(img =>
                            img.id === image.id ? { ...img, description: e.target.value } : img
                          );
                          // Direct update through store would be better
                        }}
                        placeholder="Describe..."
                        className="w-full bg-transparent text-[10px] text-white placeholder-gray-400 outline-none"
                      />
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-gray-500">
                <ImageIcon size={24} className="mx-auto mb-2 opacity-50" />
                No images attached. Upload or paste a screenshot.
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Code Tab */}
      {activeTab === 'code' && (
        <div className="space-y-2">
          <button
            onClick={() => setShowCodeModal(true)}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-glass-hover border border-glass-border rounded-lg text-xs text-gray-300 hover:border-accent-purple/30 hover:text-accent-purple transition-all"
          >
            <Plus size={12} />
            Add Code Snippet
          </button>

          {/* Code List */}
          <AnimatePresence>
            {codeAttachments.length > 0 ? (
              <div className="space-y-2">
                {codeAttachments.map((code) => (
                  <motion.div
                    key={code.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-2 bg-glass-hover border border-glass-border rounded-lg"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <FileCode size={12} className="text-accent-purple" />
                        <span className="text-xs font-medium text-gray-200">
                          {code.name || 'Code Snippet'}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 bg-accent-purple/20 text-accent-purple rounded">
                          {code.language || 'jsx'}
                        </span>
                      </div>
                      <button
                        onClick={() => removeCodeAttachment(code.id)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <X size={12} />
                      </button>
                    </div>
                    <pre className="text-[10px] text-gray-400 overflow-hidden max-h-16 font-mono">
                      {code.code.slice(0, 200)}...
                    </pre>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-gray-500">
                <Code size={24} className="mx-auto mb-2 opacity-50" />
                No code attached. Add code for reference.
              </div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Code Modal */}
      <AnimatePresence>
        {showCodeModal && (
          <CodeAttachmentModal
            onClose={() => setShowCodeModal(false)}
            onAdd={(code) => {
              addCodeAttachment(code);
              setShowCodeModal(false);
            }}
          />
        )}
      </AnimatePresence>

      {/* Image Preview Modal */}
      <AnimatePresence>
        {showImagePreview && (
          <ImagePreviewModal
            image={showImagePreview}
            onClose={() => setShowImagePreview(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Code Attachment Modal
function CodeAttachmentModal({ onClose, onAdd }) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('jsx');

  const languages = ['jsx', 'tsx', 'css', 'html', 'js', 'ts', 'json', 'python'];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md bg-surface-dark border border-glass-border rounded-2xl p-4 space-y-4"
      >
        <h3 className="text-lg font-semibold text-white">Add Code Reference</h3>
        
        <div className="space-y-3">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Snippet name (optional)"
            className="glass-input text-sm"
          />
          
          <div className="flex gap-2">
            {languages.map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 text-xs rounded-md transition-all ${
                  language === lang
                    ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                    : 'bg-glass-hover text-gray-400 border border-transparent hover:text-white'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>

          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Paste your code here..."
            rows={10}
            className="glass-textarea text-sm font-mono"
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 py-2 text-sm text-gray-400 bg-glass-hover border border-glass-border rounded-lg hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => code.trim() && onAdd({ name, code, language })}
            disabled={!code.trim()}
            className="flex-1 py-2 text-sm bg-accent-purple/20 text-accent-purple border border-accent-purple/30 rounded-lg hover:bg-accent-purple/30 disabled:opacity-50 transition-all"
          >
            Add Code
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Image Preview Modal
function ImagePreviewModal({ image, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.9 }}
        className="max-w-2xl max-h-[80vh] relative"
      >
        <img
          src={image.dataUrl}
          alt={image.name}
          className="max-w-full max-h-[80vh] object-contain rounded-lg"
        />
        <button
          onClick={onClose}
          className="absolute -top-3 -right-3 p-2 bg-surface-dark border border-glass-border rounded-full text-gray-400 hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-black/60 rounded-b-lg">
          <p className="text-sm text-white">{image.name}</p>
          {image.description && (
            <p className="text-xs text-gray-400">{image.description}</p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AttachmentsSection;
