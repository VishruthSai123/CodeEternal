import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePromptStore } from '../../stores/promptStore';
import { useTemplateStore, TEMPLATE_CATEGORIES } from '../../stores/templateStore';
import * as LucideIcons from 'lucide-react';
import { Check, X, ChevronRight, ExternalLink, Sparkles } from 'lucide-react';

function TemplateSelector({ onBrowseTemplates }) {
  const { template, setTemplate } = usePromptStore();
  const { 
    categories, 
    templates, 
    fetchCategories, 
    fetchTemplates,
    getTemplatesByCategory,
    isLoading,
  } = useTemplateStore();

  const [expandedCategory, setExpandedCategory] = useState(null);

  // Fetch categories and templates on mount
  useEffect(() => {
    if (categories.length <= 1) {
      fetchCategories();
    }
    if (templates.length === 0) {
      fetchTemplates();
    }
  }, []);

  // Get categories with template counts
  const getCategoriesWithCounts = () => {
    const cats = categories.length > 1 ? categories : TEMPLATE_CATEGORIES;
    return cats
      .filter((c) => c.value !== 'all')
      .map((cat) => ({
        ...cat,
        count: templates.filter((t) => t.categorySlug === cat.value).length,
      }));
  };

  const categoriesWithCounts = getCategoriesWithCounts();

  // Get icon component by name
  const getIcon = (iconName) => {
    if (!iconName) return LucideIcons.Layout;
    const IconComponent = LucideIcons[
      iconName
        .split('-')
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join('')
    ];
    return IconComponent || LucideIcons.Layout;
  };

  const getColorClasses = (color, isSelected) => {
    const colors = {
      teal: isSelected
        ? 'border-accent-teal bg-accent-teal/10'
        : 'border-glass-border hover:border-accent-teal/50',
      purple: isSelected
        ? 'border-accent-purple bg-accent-purple/10'
        : 'border-glass-border hover:border-accent-purple/50',
      blue: isSelected
        ? 'border-accent-blue bg-accent-blue/10'
        : 'border-glass-border hover:border-accent-blue/50',
      green: isSelected
        ? 'border-green-500 bg-green-500/10'
        : 'border-glass-border hover:border-green-500/50',
      yellow: isSelected
        ? 'border-yellow-500 bg-yellow-500/10'
        : 'border-glass-border hover:border-yellow-500/50',
      red: isSelected
        ? 'border-red-500 bg-red-500/10'
        : 'border-glass-border hover:border-red-500/50',
    };
    return colors[color] || colors.teal;
  };

  const getIconColor = (color) => {
    const colors = {
      teal: 'text-accent-teal',
      purple: 'text-accent-purple',
      blue: 'text-accent-blue',
      green: 'text-green-400',
      yellow: 'text-yellow-400',
      red: 'text-red-400',
    };
    return colors[color] || colors.teal;
  };

  const handleCategoryClick = (categorySlug) => {
    if (expandedCategory === categorySlug) {
      setExpandedCategory(null);
    } else {
      setExpandedCategory(categorySlug);
    }
  };

  const handleSelectTemplate = (tmpl) => {
    setTemplate(template?.id === tmpl.id ? null : tmpl);
  };

  const handleBrowseCategory = (categorySlug) => {
    if (onBrowseTemplates) {
      onBrowseTemplates(categorySlug);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-500">
          Browse templates by category
        </p>
        {onBrowseTemplates && (
          <button
            onClick={() => onBrowseTemplates(null)}
            className="text-xs text-accent-purple hover:underline flex items-center gap-1"
          >
            Browse All
            <ExternalLink size={10} />
          </button>
        )}
      </div>

      {/* Category Grid */}
      <div className="grid grid-cols-2 gap-2">
        {categoriesWithCounts.slice(0, 6).map((cat) => {
          const Icon = getIcon(cat.icon);
          const isExpanded = expandedCategory === cat.value;
          const categoryTemplates = getTemplatesByCategory(cat.value);

          return (
            <div key={cat.value} className="relative">
              <motion.button
                onClick={() => handleCategoryClick(cat.value)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`w-full relative p-3 rounded-xl border text-left transition-all ${
                  isExpanded
                    ? getColorClasses(cat.color, true)
                    : getColorClasses(cat.color, false)
                }`}
              >
                <div className="flex items-start justify-between">
                  <Icon size={18} className={getIconColor(cat.color)} />
                  <span className="text-[10px] text-gray-500">{cat.count}</span>
                </div>
                <h4 className="text-xs font-medium text-gray-200 mt-2 line-clamp-1">
                  {cat.label}
                </h4>
              </motion.button>
            </div>
          );
        })}
      </div>

      {/* View more categories link */}
      {categoriesWithCounts.length > 6 && (
        <button
          onClick={() => onBrowseTemplates && onBrowseTemplates(null)}
          className="w-full text-center text-xs text-gray-500 hover:text-accent-purple transition-colors"
        >
          +{categoriesWithCounts.length - 6} more categories
        </button>
      )}

      {/* Expanded Category Templates */}
      <AnimatePresence>
        {expandedCategory && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-surface-light/50 rounded-xl border border-glass-border space-y-2">
              <div className="flex items-center justify-between">
                <h5 className="text-xs font-medium text-gray-300">
                  {categoriesWithCounts.find((c) => c.value === expandedCategory)?.label}
                </h5>
                <button
                  onClick={() => handleBrowseCategory(expandedCategory)}
                  className="text-[10px] text-accent-purple hover:underline flex items-center gap-1"
                >
                  View All
                  <ChevronRight size={10} />
                </button>
              </div>

              {/* Template list preview */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {getTemplatesByCategory(expandedCategory).slice(0, 5).map((tmpl) => {
                  const isSelected = template?.id === tmpl.id;
                  return (
                    <button
                      key={tmpl.id}
                      onClick={() => handleSelectTemplate(tmpl)}
                      className={`w-full flex items-center gap-2 p-2 rounded-lg text-left transition-all ${
                        isSelected
                          ? 'bg-accent-purple/20 border border-accent-purple/30'
                          : 'bg-surface-dark border border-transparent hover:border-glass-border'
                      }`}
                    >
                      {/* Thumbnail */}
                      <div className="w-10 h-10 rounded-lg bg-surface-light flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {tmpl.thumbnailUrl || tmpl.previewUrl ? (
                          <img
                            src={tmpl.thumbnailUrl || tmpl.previewUrl}
                            alt={tmpl.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Sparkles size={14} className="text-gray-500" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-gray-200 truncate">
                          {tmpl.name}
                        </p>
                        <p className="text-[10px] text-gray-500 truncate">
                          {tmpl.description}
                        </p>
                      </div>
                      {isSelected && (
                        <Check size={12} className="text-accent-purple flex-shrink-0" />
                      )}
                    </button>
                  );
                })}

                {getTemplatesByCategory(expandedCategory).length === 0 && (
                  <p className="text-xs text-gray-500 text-center py-4">
                    No templates in this category yet
                  </p>
                )}

                {getTemplatesByCategory(expandedCategory).length > 5 && (
                  <button
                    onClick={() => handleBrowseCategory(expandedCategory)}
                    className="w-full py-2 text-xs text-accent-purple hover:bg-accent-purple/10 
                               rounded-lg transition-colors"
                  >
                    +{getTemplatesByCategory(expandedCategory).length - 5} more templates
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Selected Template Display */}
      {template && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 bg-accent-purple/10 rounded-xl border border-accent-purple/30"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded-lg bg-surface-light flex items-center justify-center overflow-hidden">
                {template.thumbnailUrl || template.previewUrl ? (
                  <img
                    src={template.thumbnailUrl || template.previewUrl}
                    alt={template.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Sparkles size={18} className="text-accent-purple" />
                )}
              </div>
              <div>
                <p className="text-sm font-medium text-white">
                  {template.name}
                </p>
                <p className="text-xs text-gray-400">
                  {template.categoryName || template.category || 'Template'}
                </p>
              </div>
            </div>
            <button
              onClick={() => setTemplate(null)}
              className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-glass-hover"
            >
              <X size={14} />
            </button>
          </div>
          
          {/* Tags */}
          {template.tags && template.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {template.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="text-[10px] text-gray-500">
                  #{tag}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

export default TemplateSelector;
