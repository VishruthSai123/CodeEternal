import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Grid, List, Filter, X, Plus, Check, Sparkles, Bookmark } from 'lucide-react';
import {
  useSnippetStore,
  SNIPPET_SOURCES,
  SNIPPET_CATEGORIES,
  SNIPPET_TAGS,
} from '../stores/snippetStore';
import { usePromptStore } from '../stores/promptStore';
import { useAuthStore } from '../stores/authStore';
import SnippetCard from '../components/snippets/SnippetCard';
import SnippetDetailModal from '../components/snippets/SnippetDetailModal';
import AddSnippetModal from '../components/snippets/AddSnippetModal';

function SnippetLibrary() {
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
    fetchSnippets,
    showSavedOnly,
    setShowSavedOnly,
  } = useSnippetStore();

  const { selectedSnippets, addSnippet, removeSnippet } = usePromptStore();
  const { isAuthenticated } = useAuthStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedSnippet, setSelectedSnippet] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Any authenticated user can add snippets
  const canAdd = isAuthenticated;

  // Fetch snippets when component mounts
  useEffect(() => {
    fetchSnippets();
  }, [fetchSnippets]);

  const filteredSnippets = getFilteredSnippets();

  const isSnippetSelected = (snippetId) =>
    selectedSnippets.some((s) => s.id === snippetId);

  const handleSnippetToggle = (snippet) => {
    if (isSnippetSelected(snippet.id)) {
      removeSnippet(snippet.id);
    } else {
      addSnippet(snippet);
    }
  };

  const hasActiveFilters =
    searchQuery ||
    selectedSource !== 'all' ||
    selectedCategory !== 'all' ||
    selectedTags.length > 0 ||
    showSavedOnly;

  return (
    <div className="h-full flex flex-col">
      {/* Search and Controls */}
      <div className="p-4 border-b border-glass-border space-y-3">
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
            placeholder="Search snippets..."
            className="glass-input pl-10 pr-10 py-2 text-sm"
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
            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showFilters || hasActiveFilters
                  ? 'bg-accent-teal/10 text-accent-teal border border-accent-teal/30'
                  : 'bg-glass-hover text-gray-400 border border-glass-border hover:text-white'
              }`}
            >
              <Filter size={14} />
              Filters
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-accent-teal" />
              )}
            </button>

            {/* Saved Toggle */}
            <button
              onClick={() => setShowSavedOnly(!showSavedOnly)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                showSavedOnly
                  ? 'bg-accent-purple/10 text-accent-purple border border-accent-purple/30'
                  : 'bg-glass-hover text-gray-400 border border-glass-border hover:text-white'
              }`}
            >
              <Bookmark size={14} className={showSavedOnly ? 'fill-current' : ''} />
              Saved
            </button>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-gray-500 hover:text-white transition-colors"
              >
                Clear all
              </button>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            {/* Add Snippet Button - Only shown if user has permission */}
            {canAdd && (
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg
                           bg-gradient-to-r from-accent-teal to-accent-blue text-white
                           hover:shadow-glow-teal transition-all"
              >
                <Sparkles size={14} />
                Add
              </button>
            )}

            <div className="flex items-center gap-1 bg-glass-hover rounded-lg p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-glass-active text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <Grid size={14} />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'list'
                  ? 'bg-glass-active text-white'
                  : 'text-gray-500 hover:text-white'
              }`}
            >
              <List size={14} />
            </button>
            </div>
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
              <div className="space-y-3 pt-3 border-t border-glass-border max-h-48 overflow-y-auto custom-scrollbar">
                {/* Source Filter */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">
                    Source
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SNIPPET_SOURCES.slice(0, 5).map((source) => (
                      <button
                        key={source.value}
                        onClick={() => setSelectedSource(source.value)}
                        className={`px-2 py-1 text-xs rounded-lg border transition-all ${
                          selectedSource === source.value
                            ? 'bg-accent-teal/20 border-accent-teal/50 text-accent-teal'
                            : 'bg-glass-hover border-glass-border text-gray-400 hover:text-white'
                        }`}
                      >
                        {source.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Category Filter - Top 7 categories */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">
                    Category
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {SNIPPET_CATEGORIES.slice(0, 8).map((cat) => (
                      <button
                        key={cat.value}
                        onClick={() => setSelectedCategory(cat.value)}
                        className={`px-2 py-1 text-xs rounded-lg border transition-all ${
                          selectedCategory === cat.value
                            ? 'bg-accent-purple/20 border-accent-purple/50 text-accent-purple'
                            : 'bg-glass-hover border-glass-border text-gray-400 hover:text-white'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags Filter - Top 6 tags */}
                <div>
                  <label className="text-xs text-gray-500 mb-2 block">Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SNIPPET_TAGS.slice(0, 6).map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-2 py-1 text-xs rounded-lg border transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-accent-blue/20 border-accent-blue/50 text-accent-blue'
                            : 'bg-glass-hover border-glass-border text-gray-400 hover:text-white'
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

      {/* Snippets Grid/List */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar p-4">
        {filteredSnippets.length > 0 ? (
          <div
            className={`${
              viewMode === 'grid'
                ? 'grid grid-cols-2 gap-3'
                : 'space-y-2'
            }`}
          >
            {filteredSnippets.map((snippet) => (
              <SnippetCard
                key={snippet.id}
                snippet={snippet}
                viewMode={viewMode}
                isSelected={isSnippetSelected(snippet.id)}
                onSelect={() => handleSnippetToggle(snippet)}
                onView={() => setSelectedSnippet(snippet)}
              />
            ))}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-2xl bg-glass-hover flex items-center justify-center mb-4">
              <Search size={24} className="text-gray-500" />
            </div>
            <p className="text-gray-400 mb-2">No snippets found</p>
            <p className="text-sm text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Selected Count Footer */}
      {selectedSnippets.length > 0 && (
        <div className="p-3 border-t border-glass-border bg-surface-dark">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check size={14} className="text-accent-teal" />
              <span className="text-sm text-gray-300">
                {selectedSnippets.length} snippet
                {selectedSnippets.length !== 1 ? 's' : ''} selected
              </span>
            </div>
            <button
              onClick={() => selectedSnippets.forEach((s) => removeSnippet(s.id))}
              className="text-xs text-gray-500 hover:text-white"
            >
              Clear all
            </button>
          </div>
        </div>
      )}

      {/* Snippet Detail Modal */}
      <AnimatePresence>
        {selectedSnippet && (
          <SnippetDetailModal
            snippet={selectedSnippet}
            isSelected={isSnippetSelected(selectedSnippet.id)}
            onSelect={() => handleSnippetToggle(selectedSnippet)}
            onClose={() => setSelectedSnippet(null)}
          />
        )}
      </AnimatePresence>

      {/* Add Snippet Modal */}
      <AnimatePresence>
        {showAddModal && (
          <AddSnippetModal onClose={() => setShowAddModal(false)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export default SnippetLibrary;
