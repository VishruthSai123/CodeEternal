import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Grid, List, X, ChevronLeft, Plus, 
  Minus, Pin, PinOff, Sparkles, RefreshCw, Bookmark, Filter
} from 'lucide-react';
import * as LucideIcons from 'lucide-react';
import { useTemplateStore } from '../stores/templateStore';
import { usePromptStore } from '../stores/promptStore';
import { useAppStore } from '../stores/appStore';
import TemplateCard from '../components/templates/TemplateCard';
import TemplateDetailModal from '../components/templates/TemplateDetailModal';
import AddTemplateModal from '../components/templates/AddTemplateModal';

function BrowseTemplates({ onBack, initialCategory = null }) {
  const {
    templates,
    categories,
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    showSavedOnly,
    setShowSavedOnly,
    viewMode,
    setViewMode,
    getFilteredTemplates,
    fetchTemplates,
    fetchCategories,
    clearFilters,
    isLoading,
  } = useTemplateStore();

  const { setTemplate: setPromptTemplate, template: selectedTemplate } = usePromptStore();
  const { isPinned, setIsPinned } = useAppStore();

  const [showFilters, setShowFilters] = useState(false);
  const [viewingTemplate, setViewingTemplate] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const filteredTemplates = getFilteredTemplates();

  const hasActiveFilters =
    searchQuery ||
    (selectedCategory && selectedCategory !== 'all') ||
    showSavedOnly;

  // Fetch on mount
  useEffect(() => {
    fetchCategories();
    fetchTemplates();
  }, []);

  // Set initial category if provided
  useEffect(() => {
    if (initialCategory) {
      setSelectedCategory(initialCategory);
    }
  }, [initialCategory]);

  // Window controls
  const handleMinimize = () => window.electron?.minimize();
  const handleClose = () => window.electron?.close();
  const handleRefresh = () => {
    fetchTemplates();
    fetchCategories();
  };
  const handleTogglePin = () => {
    window.electron?.togglePin();
  };

  // Sync pin state
  useEffect(() => {
    const syncPinState = async () => {
      if (window.electron?.getPinState) {
        const pinState = await window.electron.getPinState();
        setIsPinned(pinState);
      }
    };
    syncPinState();

    const cleanup = window.electron?.onPinStateChanged?.((pinned) => {
      setIsPinned(pinned);
    });
    return () => cleanup?.();
  }, [setIsPinned]);

  const handleSelectTemplate = (template) => {
    // Set in prompt store (only one template can be selected)
    setPromptTemplate(template);
  };

  const handleViewTemplate = (template) => {
    setViewingTemplate(template);
  };

  // Get icon component by name
  const getIcon = (iconName) => {
    const IconComponent = LucideIcons[
      iconName
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
    ];
    return IconComponent || LucideIcons.Layout;
  };

  return (
    <div className="h-screen flex flex-col bg-surface-dark rounded-2xl overflow-hidden border border-glass-border">
      {/* Title Bar */}
      <div className="drag-region flex items-center justify-between h-10 px-3 border-b border-glass-border bg-surface-dark flex-shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <button
            onClick={onBack}
            className="no-drag p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
            title="Back to Home"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-accent-purple to-accent-teal flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <h1 className="text-sm font-semibold text-white">Browse Templates</h1>
          <span className="text-xs text-gray-500">({templates.length} total)</span>
        </div>

        <div className="no-drag flex items-center gap-1">
          <button
            onClick={() => setShowAddModal(true)}
            className="p-1.5 rounded-lg text-accent-purple hover:bg-accent-purple/10 transition-colors"
            title="Add Template"
          >
            <Plus size={14} />
          </button>
          <button
            onClick={handleTogglePin}
            className={`p-1.5 rounded-lg transition-colors ${
              isPinned
                ? 'text-accent-teal hover:text-accent-teal/80'
                : 'text-gray-400 hover:text-white hover:bg-glass-hover'
            }`}
            title={isPinned ? 'Unpin overlay' : 'Pin overlay'}
          >
            {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleMinimize}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-glass-border space-y-3 bg-surface-dark">
        {/* Search Bar */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search templates by name, description, or tags..."
            className="w-full pl-10 pr-10 py-2.5 bg-surface-light border border-glass-border rounded-xl
                       text-white placeholder-gray-500 focus:outline-none focus:border-accent-purple/50
                       transition-colors text-sm"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-2">
          {/* Category filter - scrollable */}
          <div className="flex-1 overflow-x-auto hide-scrollbar">
            <div className="flex gap-1.5">
              {categories.map((cat) => {
                const Icon = getIcon(cat.icon || 'layout');
                const isActive = selectedCategory === cat.value;
                return (
                  <button
                    key={cat.value}
                    onClick={() => setSelectedCategory(cat.value)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs whitespace-nowrap transition-all ${
                      isActive
                        ? 'bg-accent-purple/20 text-accent-purple border border-accent-purple/30'
                        : 'bg-glass-hover text-gray-400 border border-transparent hover:text-white'
                    }`}
                  >
                    <Icon size={12} />
                    {cat.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* View mode & saved filter */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`p-2 rounded-lg transition-colors ${
                showSavedOnly
                  ? 'bg-accent-purple/20 text-accent-purple'
                  : 'text-gray-400 hover:text-white hover:bg-glass-hover'
              }`}
              title="Show saved only"
            >
              <Bookmark size={14} className={showSavedOnly ? 'fill-current' : ''} />
            </button>
            <div className="flex rounded-lg border border-glass-border overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${
                  viewMode === 'grid'
                    ? 'bg-accent-purple/20 text-accent-purple'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <Grid size={14} />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${
                  viewMode === 'list'
                    ? 'bg-accent-purple/20 text-accent-purple'
                    : 'text-gray-400 hover:text-white'
                }`}
              >
                <List size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">
              {filteredTemplates.length} result{filteredTemplates.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={clearFilters}
              className="text-xs text-accent-purple hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      {/* Template Grid/List */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw size={24} className="animate-spin text-accent-purple" />
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <Sparkles size={48} className="text-gray-600 mb-4" />
            <h3 className="text-lg font-medium text-gray-400 mb-2">No templates found</h3>
            <p className="text-sm text-gray-500 mb-4">
              {hasActiveFilters
                ? 'Try adjusting your filters'
                : 'Be the first to add a template!'}
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-accent-purple/20 text-accent-purple 
                         rounded-lg hover:bg-accent-purple/30 transition-colors"
            >
              <Plus size={16} />
              Add Template
            </button>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-2'
            }
          >
            {filteredTemplates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                viewMode={viewMode}
                isSelected={selectedTemplate?.id === template.id}
                onSelect={handleSelectTemplate}
                onView={handleViewTemplate}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected template indicator */}
      {selectedTemplate && (
        <div className="p-3 border-t border-glass-border bg-accent-purple/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs text-accent-purple font-medium">Selected:</span>
              <span className="text-sm text-white">{selectedTemplate.name}</span>
            </div>
            <button
              onClick={() => setPromptTemplate(null)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <AnimatePresence>
        {viewingTemplate && (
          <TemplateDetailModal
            template={viewingTemplate}
            isSelected={selectedTemplate?.id === viewingTemplate.id}
            onSelect={handleSelectTemplate}
            onClose={() => setViewingTemplate(null)}
          />
        )}
        {showAddModal && (
          <AddTemplateModal onClose={() => setShowAddModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default BrowseTemplates;
