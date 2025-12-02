import { motion } from 'framer-motion';
import { Plus, Check, Eye, Code, Heart, Bookmark, Crown } from 'lucide-react';
import { useSnippetStore } from '../../stores/snippetStore';

function SnippetCard({ snippet, viewMode, isSelected, onSelect, onView }) {
  const { 
    toggleLike, 
    toggleSave, 
    likedSnippetIds, 
    savedSnippetIds,
    snippets,
  } = useSnippetStore();

  // Get fresh snippet data from store
  const currentSnippet = snippets.find(s => s.id === snippet.id) || snippet;
  const isLiked = likedSnippetIds.includes(snippet.id);
  const isSaved = savedSnippetIds.includes(snippet.id);

  const handleLike = async (e) => {
    e.stopPropagation();
    await toggleLike(snippet.id);
  };

  const handleSave = async (e) => {
    e.stopPropagation();
    await toggleSave(snippet.id);
  };

  const getSourceBadgeColor = (source) => {
    switch (source) {
      case 'shadcn':
        return 'badge-teal';
      case 'uiverse':
        return 'badge-purple';
      case 'lucide':
      case 'heroicons':
        return 'badge-blue';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-3 p-3 rounded-xl border transition-all cursor-pointer
          ${
            isSelected
              ? 'bg-accent-teal/10 border-accent-teal/30'
              : 'bg-surface-light/50 border-glass-border hover:border-accent-teal/20'
          }`}
        onClick={onSelect}
      >
        {/* Thumbnail */}
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-accent-teal/20 to-accent-purple/20 
                        flex items-center justify-center flex-shrink-0">
          {(snippet.imageDataUrl || snippet.thumbnail || snippet.imageUrl) ? (
            <img
              src={snippet.imageDataUrl || snippet.thumbnail || snippet.imageUrl}
              alt={snippet.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : (
            <Code size={18} className="text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-medium text-gray-200 truncate">
              {snippet.name}
            </h4>
            {snippet.isAdminSnippet && (
              <Crown size={12} className="text-yellow-400 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <p className="text-xs text-gray-500 truncate">
              {snippet.description}
            </p>
            {snippet.variants && snippet.variants.length > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] bg-accent-purple/20 text-accent-purple rounded flex-shrink-0">
                +{snippet.variants.length}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-all ${
              isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
            }`}
          >
            <Heart size={12} className={isLiked ? 'fill-current' : ''} />
            <span>{currentSnippet.likesCount || 0}</span>
          </button>
          {/* Save */}
          <button
            onClick={handleSave}
            className={`p-1 rounded transition-all ${
              isSaved ? 'text-accent-purple' : 'text-gray-500 hover:text-accent-purple'
            }`}
          >
            <Bookmark size={12} className={isSaved ? 'fill-current' : ''} />
          </button>
          <span className={`badge ${getSourceBadgeColor(snippet.source)}`}>
            {snippet.source}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-glass-hover"
          >
            <Eye size={14} />
          </button>
          <div
            className={`w-6 h-6 rounded-md border flex items-center justify-center ${
              isSelected
                ? 'bg-accent-teal border-accent-teal'
                : 'border-glass-border'
            }`}
          >
            {isSelected && <Check size={12} className="text-gray-900" />}
          </div>
        </div>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative p-3 rounded-xl border transition-all cursor-pointer group
        ${
          isSelected
            ? 'bg-accent-teal/10 border-accent-teal/30'
            : 'bg-surface-light/50 border-glass-border hover:border-accent-teal/20'
        }`}
      onClick={onSelect}
    >
      {/* Admin badge */}
      {snippet.isAdminSnippet && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 
                        text-[10px] bg-yellow-500/20 text-yellow-400 rounded border border-yellow-500/30">
          <Crown size={10} />
          Featured
        </div>
      )}

      {/* Selection indicator */}
      <div
        className={`absolute top-2 right-2 w-5 h-5 rounded-md border flex items-center justify-center z-10 ${
          isSelected
            ? 'bg-accent-teal border-accent-teal'
            : 'border-glass-border bg-surface-dark opacity-0 group-hover:opacity-100'
        }`}
      >
        {isSelected ? (
          <Check size={10} className="text-gray-900" />
        ) : (
          <Plus size={10} className="text-gray-400" />
        )}
      </div>

      {/* Thumbnail */}
      <div className="w-full aspect-video rounded-lg bg-gradient-to-br from-accent-teal/10 to-accent-purple/10 
                      flex items-center justify-center mb-3 overflow-hidden">
        {(snippet.imageDataUrl || snippet.thumbnail || snippet.imageUrl) ? (
          <img
            src={snippet.imageDataUrl || snippet.thumbnail || snippet.imageUrl}
            alt={snippet.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <Code size={24} className="text-gray-500" />
        )}
      </div>

      {/* Info */}
      <h4 className="text-sm font-medium text-gray-200 truncate mb-1">
        {snippet.name}
      </h4>

      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1">
          <span className={`badge ${getSourceBadgeColor(snippet.source)}`}>
            {snippet.source}
          </span>
          {/* Show variant count badge */}
          {snippet.variants && snippet.variants.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-accent-purple/20 text-accent-purple rounded">
              +{snippet.variants.length}
            </span>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView();
          }}
          className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-glass-hover 
                     opacity-0 group-hover:opacity-100 transition-all"
        >
          <Eye size={12} />
        </button>
      </div>

      {/* Like and Save row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-all ${
              isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
            }`}
          >
            <Heart size={12} className={isLiked ? 'fill-current' : ''} />
            {currentSnippet.likesCount || 0}
          </button>
          <button
            onClick={handleSave}
            className={`transition-all ${
              isSaved ? 'text-accent-purple' : 'text-gray-500 hover:text-accent-purple'
            }`}
          >
            <Bookmark size={12} className={isSaved ? 'fill-current' : ''} />
          </button>
        </div>
        {/* Tags */}
        {snippet.tags && snippet.tags.length > 0 && (
          <div className="flex gap-1">
            {snippet.tags.slice(0, 1).map((tag) => (
              <span key={tag} className="text-[10px] text-gray-500">
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default SnippetCard;
