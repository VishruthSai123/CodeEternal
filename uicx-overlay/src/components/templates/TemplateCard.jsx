import { motion } from 'framer-motion';
import { Check, Eye, Heart, Bookmark, Code, Palette, Layers } from 'lucide-react';
import { useTemplateStore } from '../../stores/templateStore';

function TemplateCard({ template, viewMode, isSelected, onSelect, onView }) {
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

  // Component count
  const componentCount = template.components?.length || 0;

  // Color palette preview for color theme templates
  const renderColorPalette = () => {
    if (!template.colorPalette) return null;
    const colors = template.colorPalette;
    const paletteColors = [
      colors.primary,
      colors.secondary,
      colors.accent,
      colors.background,
      colors.text,
    ].filter(Boolean);

    return (
      <div className="flex gap-1 mt-2">
        {paletteColors.slice(0, 5).map((color, i) => (
          <div
            key={i}
            className="w-5 h-5 rounded-full border border-glass-border"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>
    );
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
              ? 'bg-accent-purple/10 border-accent-purple/30'
              : 'bg-surface-light/50 border-glass-border hover:border-accent-purple/20'
          }`}
        onClick={() => onSelect(template)}
      >
        {/* Thumbnail */}
        <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-accent-purple/20 to-accent-teal/20 
                        flex items-center justify-center flex-shrink-0 overflow-hidden">
          {template.previewUrl || template.thumbnailUrl ? (
            <img
              src={template.thumbnailUrl || template.previewUrl}
              alt={template.name}
              className="w-full h-full object-cover rounded-lg"
            />
          ) : template.colorPalette ? (
            <Palette size={24} className="text-gray-400" />
          ) : (
            <Code size={24} className="text-gray-400" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h4 className="text-sm font-medium text-gray-200 truncate">
              {template.name}
            </h4>
          </div>
          <p className="text-xs text-gray-500 truncate mt-0.5">
            {template.description}
          </p>
          <div className="flex items-center gap-2 mt-1">
            <span className={`px-1.5 py-0.5 text-[10px] rounded border ${getCategoryColor(template.categoryColor)}`}>
              {template.categoryName}
            </span>
            {componentCount > 0 && (
              <span className="flex items-center gap-1 px-1.5 py-0.5 text-[10px] bg-accent-teal/20 text-accent-teal rounded">
                <Layers size={10} />
                {componentCount} component{componentCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 px-1.5 py-1 rounded text-xs transition-all ${
              isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
            }`}
          >
            <Heart size={12} className={isLiked ? 'fill-current' : ''} />
            <span>{currentTemplate.likesCount || 0}</span>
          </button>
          <button
            onClick={handleSave}
            className={`p-1 rounded transition-all ${
              isSaved ? 'text-accent-purple' : 'text-gray-500 hover:text-accent-purple'
            }`}
          >
            <Bookmark size={12} className={isSaved ? 'fill-current' : ''} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView(template);
            }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-glass-hover"
          >
            <Eye size={14} />
          </button>
          <div
            className={`w-6 h-6 rounded-md border flex items-center justify-center ${
              isSelected
                ? 'bg-accent-purple border-accent-purple'
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
            ? 'bg-accent-purple/10 border-accent-purple/30 ring-2 ring-accent-purple/50'
            : 'bg-surface-light/50 border-glass-border hover:border-accent-purple/20'
        }`}
      onClick={() => onSelect(template)}
    >
      {/* Component count badge */}
      {componentCount > 0 && (
        <div className="absolute top-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 
                        text-[10px] bg-accent-teal/20 text-accent-teal rounded border border-accent-teal/30">
          <Layers size={10} />
          {componentCount}
        </div>
      )}

      {/* Selection indicator */}
      <div
        className={`absolute top-2 right-2 w-5 h-5 rounded-md border flex items-center justify-center z-10 transition-all ${
          isSelected
            ? 'bg-accent-purple border-accent-purple'
            : 'border-glass-border bg-surface-dark opacity-0 group-hover:opacity-100'
        }`}
      >
        {isSelected && <Check size={10} className="text-white" />}
      </div>

      {/* Preview Image */}
      <div className="w-full aspect-[4/3] rounded-lg bg-gradient-to-br from-accent-purple/10 to-accent-teal/10 
                      flex items-center justify-center mb-3 overflow-hidden">
        {template.previewUrl || template.thumbnailUrl ? (
          <img
            src={template.thumbnailUrl || template.previewUrl}
            alt={template.name}
            className="w-full h-full object-cover"
          />
        ) : template.colorPalette ? (
          <div className="flex flex-col items-center gap-2">
            <Palette size={32} className="text-gray-500" />
            <div className="flex gap-1">
              {Object.values(template.colorPalette).slice(0, 6).map((color, i) => (
                <div
                  key={i}
                  className="w-4 h-4 rounded-full border border-glass-border"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        ) : (
          <Code size={32} className="text-gray-500" />
        )}
      </div>

      {/* Info */}
      <h4 className="text-sm font-medium text-gray-200 truncate mb-1">
        {template.name}
      </h4>

      <div className="flex items-center justify-between mb-2">
        <span className={`px-1.5 py-0.5 text-[10px] rounded border ${getCategoryColor(template.categoryColor)}`}>
          {template.categoryName || 'Uncategorized'}
        </span>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onView(template);
          }}
          className="p-1 rounded-md text-gray-500 hover:text-white hover:bg-glass-hover 
                     opacity-0 group-hover:opacity-100 transition-all"
        >
          <Eye size={12} />
        </button>
      </div>

      {/* Color palette for theme templates */}
      {template.categorySlug === 'color-themes' && renderColorPalette()}

      {/* Like and Save row */}
      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-2">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-xs transition-all ${
              isLiked ? 'text-red-400' : 'text-gray-500 hover:text-red-400'
            }`}
          >
            <Heart size={12} className={isLiked ? 'fill-current' : ''} />
            {currentTemplate.likesCount || 0}
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
        {/* Language badge */}
        <span className="text-[10px] text-gray-500 uppercase">
          {template.language || 'jsx'}
        </span>
      </div>
    </motion.div>
  );
}

export default TemplateCard;
