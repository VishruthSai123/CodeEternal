import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Upload, Code, ImageIcon, Tag, Folder, Type, FileText, 
  Sparkles, Plus, Trash2, Clipboard, Palette, Layers
} from 'lucide-react';
import { useTemplateStore, TEMPLATE_CATEGORIES, CODE_LANGUAGES, COMPONENT_TYPES } from '../../stores/templateStore';

function AddTemplateModal({ onClose }) {
  const { addTemplate, categories } = useTemplateStore();
  const mainImageInputRef = useRef(null);
  const componentImageInputRef = useRef(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    categorySlug: 'buttons',
    tags: [],
    language: 'jsx',
    code: '',
    usageNotes: '',
    framework: 'react',
    styleLibrary: 'tailwind',
    mainImage: null, // {dataUrl}
    components: [], // Array of {name, componentType, imageDataUrl, code, description}
    colorPalette: null,
  });

  const [showComponentForm, setShowComponentForm] = useState(false);
  const [newComponent, setNewComponent] = useState({
    name: '',
    componentType: 'button',
    imageDataUrl: null,
    code: '',
    description: '',
  });
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [newColor, setNewColor] = useState({ name: '', value: '#3b82f6' });
  const [tagInput, setTagInput] = useState('');
  const [dragOver, setDragOver] = useState(false);

  // Get categories from store or use defaults
  const categoryOptions = categories.length > 0 
    ? categories.filter((c) => c.value !== 'all')
    : TEMPLATE_CATEGORIES.filter((c) => c.value !== 'all');

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleChange('tags', [...formData.tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag) => {
    handleChange('tags', formData.tags.filter((t) => t !== tag));
  };

  const handleAddComponent = () => {
    if (newComponent.name.trim()) {
      setFormData((prev) => ({
        ...prev,
        components: [...prev.components, { ...newComponent }],
      }));
      setNewComponent({
        name: '',
        componentType: 'button',
        imageDataUrl: null,
        code: '',
        description: '',
      });
      setShowComponentForm(false);
    }
  };

  const handleRemoveComponent = (index) => {
    setFormData((prev) => ({
      ...prev,
      components: prev.components.filter((_, i) => i !== index),
    }));
  };

  const handleAddColor = () => {
    if (newColor.name.trim() && newColor.value) {
      const palette = formData.colorPalette || {};
      handleChange('colorPalette', { ...palette, [newColor.name.trim()]: newColor.value });
      setNewColor({ name: '', value: '#3b82f6' });
    }
  };

  const handleRemoveColor = (name) => {
    const palette = { ...formData.colorPalette };
    delete palette[name];
    handleChange('colorPalette', Object.keys(palette).length > 0 ? palette : null);
  };

  const handleMainImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setFormData((prev) => ({
          ...prev,
          mainImage: { dataUrl: e.target.result },
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleComponentImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setNewComponent((prev) => ({
          ...prev,
          imageDataUrl: e.target.result,
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle paste from clipboard
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        // If component form is open, paste there; otherwise main image
        if (showComponentForm) {
          handleComponentImageUpload(file);
        } else {
          handleMainImageUpload(file);
        }
        break;
      }
    }
  };

  useEffect(() => {
    const handleGlobalPaste = (e) => handlePaste(e);
    document.addEventListener('paste', handleGlobalPaste);
    return () => document.removeEventListener('paste', handleGlobalPaste);
  }, [showComponentForm]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleMainImageUpload(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) return;

    setIsSubmitting(true);
    
    try {
      await addTemplate({
        name: formData.name.trim(),
        description: formData.description.trim(),
        categorySlug: formData.categorySlug,
        tags: formData.tags,
        language: formData.language,
        code: formData.code,
        usageNotes: formData.usageNotes.trim(),
        framework: formData.framework,
        styleLibrary: formData.styleLibrary,
        mainImage: formData.mainImage,
        components: formData.components,
        colorPalette: formData.colorPalette,
      });
      onClose();
    } catch (error) {
      console.error('Failed to add template:', error);
    }

    setIsSubmitting(false);
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
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-accent-purple/10">
              <Sparkles size={18} className="text-accent-purple" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Add Template</h3>
              <p className="text-xs text-gray-500">Create a reusable UI template with components</p>
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
              placeholder="e.g., Primary Button, Dashboard Header"
              className="w-full px-3 py-2 bg-surface-light border border-glass-border rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple/50
                         transition-colors text-sm"
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
              placeholder="Describe what this template is for..."
              rows={2}
              className="w-full px-3 py-2 bg-surface-light border border-glass-border rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple/50
                         transition-colors text-sm resize-none"
            />
          </div>

          {/* Category & Framework Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <Folder size={14} />
                Category
              </label>
              <select
                value={formData.categorySlug}
                onChange={(e) => handleChange('categorySlug', e.target.value)}
                className="w-full px-3 py-2 bg-surface-light border border-glass-border rounded-lg
                           text-white focus:outline-none focus:border-accent-purple/50
                           transition-colors text-sm"
              >
                {categoryOptions.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
                <Code size={14} />
                Framework
              </label>
              <select
                value={formData.framework}
                onChange={(e) => handleChange('framework', e.target.value)}
                className="w-full px-3 py-2 bg-surface-light border border-glass-border rounded-lg
                           text-white focus:outline-none focus:border-accent-purple/50
                           transition-colors text-sm"
              >
                <option value="react">React</option>
                <option value="vue">Vue</option>
                <option value="svelte">Svelte</option>
                <option value="html">HTML</option>
                <option value="angular">Angular</option>
              </select>
            </div>
          </div>

          {/* Main Image Upload */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <ImageIcon size={14} />
              Main Preview Image
            </label>
            
            {/* Main image preview */}
            {formData.mainImage && (
              <div className="relative mb-3 group">
                <img
                  src={formData.mainImage.dataUrl}
                  alt="Main Preview"
                  className="w-full aspect-video object-cover rounded-lg border border-glass-border"
                />
                <button
                  type="button"
                  onClick={() => handleChange('mainImage', null)}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500/80 text-white
                             opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Upload area */}
            {!formData.mainImage && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-4 text-center transition-colors ${
                  dragOver
                    ? 'border-accent-purple bg-accent-purple/10'
                    : 'border-glass-border hover:border-accent-purple/50'
                }`}
              >
                <input
                  ref={mainImageInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => e.target.files?.[0] && handleMainImageUpload(e.target.files[0])}
                  className="hidden"
                />
                <div className="flex flex-col items-center gap-2">
                  <Upload size={24} className="text-gray-500" />
                  <p className="text-xs text-gray-500">
                    Drag & drop image, or{' '}
                    <button
                      type="button"
                      onClick={() => mainImageInputRef.current?.click()}
                      className="text-accent-purple hover:underline"
                    >
                      browse
                    </button>
                  </p>
                  <p className="text-[10px] text-gray-600">Paste from clipboard: Ctrl+V</p>
                </div>
              </div>
            )}
          </div>

          {/* Code */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <Code size={14} />
                Main Code
              </label>
              <select
                value={formData.language}
                onChange={(e) => handleChange('language', e.target.value)}
                className="px-2 py-1 bg-surface-light border border-glass-border rounded-lg
                           text-xs text-gray-300 focus:outline-none"
              >
                {CODE_LANGUAGES.map((v) => (
                  <option key={v.value} value={v.value}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <textarea
              value={formData.code}
              onChange={(e) => handleChange('code', e.target.value)}
              placeholder="Paste your main component code here..."
              rows={6}
              className="w-full px-3 py-2 bg-surface-light border border-glass-border rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple/50
                         transition-colors text-xs font-mono resize-y"
            />
          </div>

          {/* Components (UI variants) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <Layers size={14} />
                Components ({formData.components.length})
              </label>
              {!showComponentForm && (
                <button
                  type="button"
                  onClick={() => setShowComponentForm(true)}
                  className="flex items-center gap-1 px-2 py-1 text-xs text-accent-teal 
                             hover:bg-accent-teal/10 rounded-lg transition-colors"
                >
                  <Plus size={12} />
                  Add Component
                </button>
              )}
            </div>

            <p className="text-xs text-gray-500 mb-2">
              Add individual UI components like buttons, headers, etc. with their own images and code.
            </p>

            {/* Existing components */}
            {formData.components.length > 0 && (
              <div className="space-y-2 mb-3">
                {formData.components.map((comp, index) => {
                  const typeLabel = COMPONENT_TYPES.find((ct) => ct.value === comp.componentType)?.label || comp.componentType;
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-2 bg-surface-light 
                                 rounded-lg border border-glass-border"
                    >
                      {/* Preview image */}
                      <div className="w-12 h-10 rounded bg-surface-dark flex items-center justify-center overflow-hidden">
                        {comp.imageDataUrl ? (
                          <img src={comp.imageDataUrl} alt={comp.name} className="w-full h-full object-cover" />
                        ) : (
                          <Code size={14} className="text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-300 truncate">{comp.name}</p>
                        <span className="text-[10px] text-accent-teal">{typeLabel}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveComponent(index)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* New component form */}
            {showComponentForm && (
              <div className="p-3 bg-surface-light rounded-xl border border-accent-teal/30 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-medium text-accent-teal">New Component</h4>
                  <button
                    type="button"
                    onClick={() => {
                      setShowComponentForm(false);
                      setNewComponent({ name: '', componentType: 'button', imageDataUrl: null, code: '', description: '' });
                    }}
                    className="p-1 text-gray-500 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>

                {/* Component Name & Type */}
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={newComponent.name}
                    onChange={(e) => setNewComponent((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Component name *"
                    className="px-2 py-1.5 bg-surface-dark border border-glass-border rounded-lg
                               text-sm text-white focus:outline-none"
                  />
                  <select
                    value={newComponent.componentType}
                    onChange={(e) => setNewComponent((prev) => ({ ...prev, componentType: e.target.value }))}
                    className="px-2 py-1.5 bg-surface-dark border border-glass-border rounded-lg
                               text-sm text-gray-300 focus:outline-none"
                  >
                    {COMPONENT_TYPES.map((ct) => (
                      <option key={ct.value} value={ct.value}>{ct.label}</option>
                    ))}
                  </select>
                </div>

                {/* Component Image */}
                <div>
                  {newComponent.imageDataUrl ? (
                    <div className="relative">
                      <img
                        src={newComponent.imageDataUrl}
                        alt="Component preview"
                        className="w-full h-24 object-cover rounded-lg border border-glass-border"
                      />
                      <button
                        type="button"
                        onClick={() => setNewComponent((prev) => ({ ...prev, imageDataUrl: null }))}
                        className="absolute top-1 right-1 p-1 rounded-full bg-red-500/80 text-white"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ) : (
                    <div className="border border-dashed border-glass-border rounded-lg p-3 text-center">
                      <input
                        ref={componentImageInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => e.target.files?.[0] && handleComponentImageUpload(e.target.files[0])}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => componentImageInputRef.current?.click()}
                        className="text-xs text-gray-400 hover:text-accent-teal"
                      >
                        <ImageIcon size={16} className="mx-auto mb-1" />
                        Add component image
                      </button>
                    </div>
                  )}
                </div>

                {/* Component Code */}
                <textarea
                  value={newComponent.code}
                  onChange={(e) => setNewComponent((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="Component code..."
                  rows={4}
                  className="w-full px-2 py-1.5 bg-surface-dark border border-glass-border rounded-lg
                             text-xs text-white font-mono focus:outline-none resize-y"
                />

                <button
                  type="button"
                  onClick={handleAddComponent}
                  disabled={!newComponent.name.trim()}
                  className="w-full py-1.5 bg-accent-teal/20 text-accent-teal rounded-lg
                             text-xs font-medium hover:bg-accent-teal/30 transition-colors
                             disabled:opacity-50"
                >
                  Add Component
                </button>
              </div>
            )}
          </div>

          {/* Color Palette (for color themes) */}
          {formData.categorySlug === 'color-themes' && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <Palette size={14} />
                  Color Palette
                </label>
                <button
                  type="button"
                  onClick={() => setShowColorPalette(!showColorPalette)}
                  className="text-xs text-accent-purple hover:underline"
                >
                  {showColorPalette ? 'Hide' : 'Add Colors'}
                </button>
              </div>

              {/* Existing colors */}
              {formData.colorPalette && Object.keys(formData.colorPalette).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {Object.entries(formData.colorPalette).map(([name, value]) => (
                    <div
                      key={name}
                      className="flex items-center gap-1.5 px-2 py-1 bg-surface-light 
                                 rounded-lg border border-glass-border"
                    >
                      <div
                        className="w-4 h-4 rounded border border-glass-border"
                        style={{ backgroundColor: value }}
                      />
                      <span className="text-xs text-gray-300">{name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveColor(name)}
                        className="text-gray-500 hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add color form */}
              {showColorPalette && (
                <div className="flex items-center gap-2 p-2 bg-surface-light rounded-lg border border-glass-border">
                  <input
                    type="color"
                    value={newColor.value}
                    onChange={(e) => setNewColor((prev) => ({ ...prev, value: e.target.value }))}
                    className="w-8 h-8 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={newColor.name}
                    onChange={(e) => setNewColor((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="Color name (e.g., primary)"
                    className="flex-1 px-2 py-1 bg-surface-dark border border-glass-border rounded
                               text-xs text-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddColor}
                    disabled={!newColor.name.trim()}
                    className="px-2 py-1 bg-accent-purple/20 text-accent-purple rounded
                               text-xs hover:bg-accent-purple/30 disabled:opacity-50"
                  >
                    Add
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tags */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <Tag size={14} />
              Tags
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1 px-2 py-1 bg-accent-purple/20 
                             text-accent-purple text-xs rounded-lg"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-white"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                placeholder="Add a tag..."
                className="flex-1 px-3 py-2 bg-surface-light border border-glass-border rounded-lg
                           text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple/50
                           transition-colors text-sm"
              />
              <button
                type="button"
                onClick={handleAddTag}
                disabled={!tagInput.trim()}
                className="px-3 py-2 bg-accent-purple/20 text-accent-purple rounded-lg
                           hover:bg-accent-purple/30 transition-colors disabled:opacity-50"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>

          {/* Usage Notes */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-300 mb-2">
              <FileText size={14} />
              Usage Notes
            </label>
            <textarea
              value={formData.usageNotes}
              onChange={(e) => handleChange('usageNotes', e.target.value)}
              placeholder="Any special instructions or notes..."
              rows={2}
              className="w-full px-3 py-2 bg-surface-light border border-glass-border rounded-lg
                         text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple/50
                         transition-colors text-sm resize-none"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-glass-border">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-glass-border text-gray-400
                       hover:text-white hover:bg-glass-hover transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.name.trim()}
            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-accent-purple to-accent-teal
                       text-white font-medium hover:opacity-90 transition-opacity
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Adding...' : 'Add Template'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AddTemplateModal;
