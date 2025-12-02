import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Grid, List, Filter, X, ChevronLeft, Code,
  Minus, Pin, PinOff, Sparkles, RefreshCw
} from 'lucide-react';
import {
  useSnippetStore,
  SNIPPET_SOURCES,
  SNIPPET_CATEGORIES,
  SNIPPET_TAGS,
} from '../stores/snippetStore';
import { useAppStore } from '../stores/appStore';
import SnippetCard from '../components/snippets/SnippetCard';
import SnippetDetailModal from '../components/snippets/SnippetDetailModal';

function BrowseSnippets({ onBack }) {
  const {
    searchQuery,
    setSearchQuery,
    selectedSource,
    setSelectedSource,
    selectedCategory,
    setSelectedCategory,
    selectedTags,
    toggleTag,
    clearFilters,
    viewMode,
    setViewMode,
    getFilteredSnippets,
    snippets,
  } = useSnippetStore();

  const { isPinned, setIsPinned } = useAppStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);

  const filteredSnippets = getFilteredSnippets();

  const hasActiveFilters =
    searchQuery ||
    selectedSource !== 'all' ||
    selectedCategory !== 'all' ||
    selectedTags.length > 0;

  // Window controls
  const handleMinimize = () => window.electron?.minimize();
  const handleClose = () => window.electron?.close();
  const handleRefresh = () => {
    if (typeof window.electron?.refresh === 'function') {
      window.electron.refresh();
    } else {
      window.location.reload();
    }
  };
  const handleTogglePin = () => {
    window.electron?.togglePin();
  };

  // Sync pin state on mount
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

  return (
    <div className="h-screen flex flex-col bg-surface-dark rounded-2xl overflow-hidden border border-glass-border">
      {/* Title Bar */}
      <div className="drag-region flex items-center justify-between h-10 px-3 border-b border-glass-border bg-surface-dark flex-shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-2">
          {/* Back Button */}
          <button
            onClick={onBack}
            className="no-drag p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
            title="Back to Home"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="w-5 h-5 rounded-lg bg-gradient-to-br from-accent-purple to-accent-blue flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <h1 className="text-sm font-semibold text-white">Browse Snippets</h1>
          <span className="text-xs text-gray-500">({snippets.length} total)</span>
        </div>

        <div className="no-drag flex items-center gap-1">
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
            <RefreshCw size={14} />
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
            placeholder="Search snippets by name, description, or tags..."
            className="w-full pl-10 pr-10 py-2.5 bg-surface-light border border-glass-border rounded-xl
                       text-white placeholder-gray-500 focus:outline-none focus:border-accent-teal/50
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

        {/* Controls Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/30'
                  : 'bg-surface-light text-gray-400 border border-glass-border hover:text-white'
              }`}
            >
              <Filter size={14} />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-accent-teal" />
              )}
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}

            <span className="text-xs text-gray-500">
              {filteredSnippets.length} results
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-surface-light rounded-lg p-0.5 border border-glass-border">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-accent-teal/20 text-accent-teal'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-accent-teal/20 text-accent-teal'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <List size={14} />
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="pt-3 space-y-3 border-t border-glass-border max-h-40 overflow-y-auto custom-scrollbar">
                {/* Source Filter - Top 5 */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Source</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SNIPPET_SOURCES.slice(0, 5).map((source) => (
                      <button
                        key={source.value}
                        onClick={() => setSelectedSource(source.value)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                          selectedSource === source.value
                            ? 'bg-accent-teal/20 border-accent-teal/50 text-accent-teal'
                            : 'bg-surface-light border-glass-border text-gray-400 hover:text-white'
                        }`}
                      >
                        {source.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter - Top 7 + All */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Category</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SNIPPET_CATEGORIES.slice(0, 8).map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                          selectedCategory === cat.value
                            ? 'bg-accent-purple/20 border-accent-purple/50 text-accent-purple'
                            : 'bg-surface-light border-glass-border text-gray-400 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags Filter - Top 6 */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SNIPPET_TAGS.slice(0, 6).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2.5 py-1 text-xs rounded-lg border transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue'
                            : 'bg-surface-light border-glass-border text-gray-400 hover:text-white'
                        }`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Snippets Grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4 bg-surface-dark">
        {filteredSnippets.length > 0 ? (
          <div
            className={`${
              viewMode === 'grid'
                ? 'grid grid-cols-2 lg:grid-cols-3 gap-3'
                : 'space-y-2'
            }`}
          >
            {filteredSnippets.map((snippet) => (
              <motion.div
                key={snippet.id}
                whileHover={{ scale: viewMode === 'grid' ? 1.02 : 1 }}
                onClick={() => setSelectedSnippet(snippet)}
                className={`cursor-pointer group ${
                  viewMode === 'grid'
                    ? 'p-3 rounded-xl bg-surface-light border border-glass-border hover:border-accent-purple/30 transition-all'
                    : 'p-3 rounded-lg bg-surface-light border border-glass-border hover:border-accent-purple/30 flex items-center gap-3'
                }`}
              >
                {viewMode === 'grid' ? (
                  <>
                    <div className="w-full aspect-video rounded-lg bg-gradient-to-br 
                                    from-accent-teal/10 to-accent-purple/10 mb-2
                                    flex items-center justify-center overflow-hidden">
                      {snippet.imageDataUrl || snippet.imageUrl ? (
                        <img 
                          src={snippet.imageDataUrl || snippet.imageUrl} 
                          alt={snippet.name} 
                          className="w-full h-full object-cover rounded-lg" 
                        />
                      ) : (
                        <Code size={24} className="text-gray-500" />
                      )}
                    </div>
                    <p className="text-sm font-medium text-white truncate">
                      {snippet.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {snippet.source} • {snippet.category}
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br 
                                    from-accent-teal/10 to-accent-purple/10
                                    flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {snippet.imageDataUrl || snippet.imageUrl ? (
                        <img 
                          src={snippet.imageDataUrl || snippet.imageUrl} 
                          alt={snippet.name} 
                          className="w-full h-full object-cover rounded-lg" 
                        />
                      ) : (
                        <Code size={20} className="text-gray-500" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {snippet.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {snippet.source} • {snippet.category}
                      </p>
                    </div>
                  </>
                )}
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-surface-light flex items-center justify-center mb-4">
              <Search size={32} className="text-gray-500" />
            </div>
            <p className="text-gray-400 mb-2">No snippets found</p>
            <p className="text-sm text-gray-500">
              {hasActiveFilters ? 'Try adjusting your filters' : 'No snippets available yet'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 text-sm text-accent-teal hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Snippet Detail Modal */}
      <AnimatePresence>
        {selectedSnippet && (
          <SnippetDetailModal
            snippet={selectedSnippet}
            onClose={() => setSelectedSnippet(null)}
            isViewOnly={true}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

export default BrowseSnippets;
