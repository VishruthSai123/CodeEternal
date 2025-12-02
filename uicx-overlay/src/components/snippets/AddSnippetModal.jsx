import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Code, ImageIcon, Tag, Folder, Type, FileText, Sparkles, Plus, Trash2, Clipboard } from 'lucide-react';
import { useSnippetStore, SNIPPET_CATEGORIES, SNIPPET_TAGS, SNIPPET_VARIANTS } from '../../stores/snippetStore';

function AddSnippetModal({ onClose }) {
  const { addSnippet } = useSnippetStore();
  const fileInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'buttons',
    tags: [],
    language: 'jsx',
    code: '',
    usage: '',
    imageDataUrl: null,
    variants: [], // Array of { type: 'tsx' | 'jsx' | 'html' | etc., code: string }
  });

  const [showVariantForm, setShowVariantForm] = useState(false);
  const [newVariant, setNewVariant] = useState({ type: 'tsx', code: '' });

  const [dragOver, setDragOver] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleTagToggle = (tag) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag],
    }));
  };

  const handleAddVariant = () => {
    if (newVariant.code.trim()) {
      setFormData((prev) => ({
        ...prev,
        variants: [...prev.variants, { ...newVariant }],
      }));
      setNewVariant({ type: 'tsx', code: '' });
      setShowVariantForm(false);
    }
  };

  const handleRemoveVariant = (index) => {
    setFormData((prev) => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const getAvailableVariantTypes = () => {
    const usedTypes = formData.variants.map((v) => v.type);
    usedTypes.push(formData.language); // Main code language is also "used"
    return SNIPPET_VARIANTS.filter((v) => !usedTypes.includes(v.value));
  };

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        handleChange('imageDataUrl', e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle paste from clipboard (Ctrl+V)
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        handleImageUpload(file);
        break;
      }
    }
  };

  // Handle paste button click (read from clipboard API)
  const handlePasteFromClipboard = async () => {
    try {
      // Try clipboard API first
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              handleImageUpload(blob);
              return;
            }
          }
        }
      }
    } catch (err) {
      console.log('Clipboard read failed, use Ctrl+V instead');
    }
  };

  // Add global paste listener for the modal
  useEffect(() => {
    const handleGlobalPaste = (e) => {
      handlePaste(e);
    };
    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      return;
    }

    setIsSubmitting(true);
    
    await addSnippet({
      name: formData.name.trim(),
      description: formData.description.trim(),
      category: formData.category,
      tags: formData.tags,
      language: formData.language,
      code: formData.code,
      variants: formData.variants, // Include variants
      usage: formData.usage.trim(),
      imageDataUrl: formData.imageDataUrl,
    });

    setIsSubmitting(false);
    onClose();
  };

  const categories = SNIPPET_CATEGORIES.filter((c) => c.value !== 'all');

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
        className="w-full max-w-lg max-h-[90vh] bg-surface-dark border border-glass-border 
                   rounded-2xl shadow-glass-lg overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent-teal/10">
              <Sparkles size={18} className="text-accent-teal" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Add Custom Snippet</h3>
              <p className="text-xs text-gray-500">Create your own code snippet with code & image</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white 
                       hover:bg-glass-hover transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Name */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <Type size={14} />
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              placeholder="e.g., Animated Card Hover"
              className="glass-input w-full py-2 px-3 text-sm"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <FileText size={14} />
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Brief description of this snippet..."
              rows={2}
              className="glass-input w-full py-2 px-3 text-sm resize-none"
            />
          </div>

          {/* Image Upload */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <ImageIcon size={14} />
              Preview Image
              <span className="text-xs text-gray-500 ml-auto">Press Ctrl+V to paste</span>
            </label>
            <div className="space-y-2">
              <div
                onDrop={handleDrop}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`relative w-full aspect-video rounded-xl border-2 border-dashed 
                            cursor-pointer transition-all overflow-hidden
                            ${dragOver 
                              ? 'border-accent-teal bg-accent-teal/10' 
                              : 'border-glass-border hover:border-accent-teal/50 bg-glass-hover'
                            }`}
              >
                {formData.imageDataUrl ? (
                  <>
                    <img
                      src={formData.imageDataUrl}
                      alt="Preview"
                      className="w-full h-full object-contain"
                    />
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleChange('imageDataUrl', null);
                      }}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-red-500/80 
                                 text-white hover:bg-red-500 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </>
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                    <Upload size={24} className={dragOver ? 'text-accent-teal' : 'text-gray-500'} />
                    <p className="text-sm text-gray-400">
                      Drop image here or <span className="text-accent-teal">browse</span>
                    </p>
                    <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              {/* Paste button */}
              {!formData.imageDataUrl && (
                <button
                  type="button"
                  onClick={handlePasteFromClipboard}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 
                             bg-glass-hover border border-glass-border rounded-lg text-xs 
                             text-gray-300 hover:border-accent-teal/30 hover:text-accent-teal transition-all"
                >
                  <Clipboard size={12} />
                  Paste from Clipboard
                </button>
              )}
            </div>
          </div>

          {/* Category */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <Folder size={14} />
              Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => handleChange('category', cat.value)}
                  className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                    formData.category === cat.value
                      ? 'bg-accent-purple/20 border-accent-purple/50 text-accent-purple'
                      : 'bg-glass-hover border-glass-border text-gray-400 hover:text-white'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <Tag size={14} />
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {SNIPPET_TAGS.map((tag) => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleTagToggle(tag)}
                  className={`px-2 py-1 text-xs rounded-lg border transition-all ${
                    formData.tags.includes(tag)
                      ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue'
                      : 'bg-glass-hover border-glass-border text-gray-400 hover:text-white'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Code */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <Code size={14} />
              Main Code *
            </label>
            <div className="flex items-center gap-2 mb-2">
              <select
                value={formData.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="glass-input py-1 px-2 text-xs"
              >
                {SNIPPET_VARIANTS.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.icon} {v.label}
                  </option>
                ))}
              </select>
              <span className="text-xs text-gray-500">(Primary variant)</span>
            </div>
            <textarea
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder={`<button className="...">\n  Click me\n</button>`}
              rows={6}
              className="glass-input w-full py-2 px-3 text-sm font-mono resize-none"
              spellCheck={false}
            />
          </div>

          {/* Code Variants */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <Code size={14} />
                Code Variants
                <span className="text-xs text-gray-500">(TSX, HTML, Tailwind, etc.)</span>
              </label>
              {getAvailableVariantTypes().length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setNewVariant({ type: getAvailableVariantTypes()[0].value, code: '' });
                    setShowVariantForm(true);
                  }}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-accent-teal/10 
                             text-accent-teal rounded-lg hover:bg-accent-teal/20 transition-colors"
                >
                  <Plus size={12} />
                  Add Variant
                </button>
              )}
            </div>

            {/* Existing Variants */}
            {formData.variants.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.variants.map((variant, index) => {
                  const variantInfo = SNIPPET_VARIANTS.find((v) => v.value === variant.type);
                  return (
                    <div
                      key={index}
                      className="p-3 bg-glass-hover border border-glass-border rounded-lg"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="flex items-center gap-2 text-sm text-gray-300">
                          <span>{variantInfo?.icon}</span>
                          {variantInfo?.label || variant.type}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveVariant(index)}
                          className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <pre className="text-xs text-gray-400 font-mono bg-surface-dark p-2 rounded max-h-20 overflow-y-auto">
                        {variant.code.substring(0, 200)}
                        {variant.code.length > 200 && '...'}
                      </pre>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Variant Form */}
            {showVariantForm && (
              <div className="p-3 bg-accent-teal/5 border border-accent-teal/20 rounded-lg space-y-3">
                <div className="flex items-center gap-2">
                  <select
                    value={newVariant.type}
                    onChange={(e) => setNewVariant((prev) => ({ ...prev, type: e.target.value }))}
                    className="glass-input py-1 px-2 text-xs"
                  >
                    {getAvailableVariantTypes().map((v) => (
                      <option key={v.value} value={v.value}>
                        {v.icon} {v.label}
                      </option>
                    ))}
                  </select>
                  <span className="text-xs text-gray-500">variant</span>
                </div>
                <textarea
                  value={newVariant.code}
                  onChange={(e) => setNewVariant((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder={`Paste ${newVariant.type.toUpperCase()} code here...`}
                  rows={4}
                  className="glass-input w-full py-2 px-3 text-sm font-mono resize-none"
                  spellCheck={false}
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleAddVariant}
                    disabled={!newVariant.code.trim()}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium
                               bg-accent-teal text-gray-900 rounded-lg hover:bg-accent-teal/90
                               disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Plus size={12} />
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowVariantForm(false)}
                    className="px-3 py-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {formData.variants.length === 0 && !showVariantForm && (
              <p className="text-xs text-gray-500 italic">
                Add code variants so users can choose their preferred format (TSX, HTML, Tailwind, etc.)
              </p>
            )}
          </div>

          {/* Usage Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <FileText size={14} />
              Usage Notes
            </label>
            <textarea
              value={formData.usage}
              onChange={(e) => handleChange('usage', e.target.value)}
              placeholder="How and when to use this snippet..."
              rows={2}
              className="glass-input w-full py-2 px-3 text-sm resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-glass-border">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || isSubmitting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium
                       bg-gradient-to-r from-accent-teal to-accent-blue text-white rounded-lg
                       hover:shadow-glow-teal transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles size={14} />
            )}
            {isSubmitting ? 'Saving...' : 'Add Snippet'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AddSnippetModal;
