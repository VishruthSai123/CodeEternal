import { useState } from 'react';
import { usePromptStore } from '../../stores/promptStore';
import { Check, ChevronDown, ChevronRight, Code, Accessibility, Smartphone, Zap, Shield, Database, Sparkles, Settings } from 'lucide-react';

function ConstraintSection() {
  const { constraints, setConstraints, framework, setFramework, stylePreset, setStylePreset } = usePromptStore();
  const [expandedCategories, setExpandedCategories] = useState(['codeStyle', 'responsive']);

  const toggleCategory = (category) => {
    setExpandedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Organized constraint categories
  const constraintCategories = [
    {
      id: 'codeStyle',
      label: 'Code Style',
      icon: Code,
      color: 'teal',
      options: [
        { key: 'noInlineStyles', label: 'No inline styles', desc: 'Use CSS classes instead' },
        { key: 'useTailwind', label: 'Tailwind CSS', desc: 'Use utility classes' },
        { key: 'useTypeScript', label: 'TypeScript', desc: 'Use TypeScript syntax' },
        { key: 'strictTypes', label: 'Strict types', desc: 'No any, proper typing' },
        { key: 'modularCode', label: 'Modular code', desc: 'Split into components' },
        { key: 'documentedCode', label: 'Add comments', desc: 'Document complex logic' },
      ],
    },
    {
      id: 'accessibility',
      label: 'Accessibility',
      icon: Accessibility,
      color: 'purple',
      options: [
        { key: 'ariaRequired', label: 'ARIA attributes', desc: 'Include aria-* props' },
        { key: 'wcagCompliance', label: 'WCAG compliant', desc: 'Follow accessibility guidelines' },
        { key: 'keyboardNavigation', label: 'Keyboard nav', desc: 'Full keyboard support' },
      ],
    },
    {
      id: 'responsive',
      label: 'Responsive & Theme',
      icon: Smartphone,
      color: 'blue',
      options: [
        { key: 'mobileFirst', label: 'Mobile-first', desc: 'Start with mobile styles' },
        { key: 'darkModeSupport', label: 'Dark mode', desc: 'Support light/dark themes' },
        { key: 'rtlSupport', label: 'RTL support', desc: 'Right-to-left languages' },
      ],
    },
    {
      id: 'performance',
      label: 'Performance',
      icon: Zap,
      color: 'yellow',
      options: [
        { key: 'lazyLoading', label: 'Lazy loading', desc: 'Load components on demand' },
        { key: 'codeSpitting', label: 'Code splitting', desc: 'Split bundles smartly' },
        { key: 'memoization', label: 'Memoization', desc: 'Use memo, useMemo, useCallback' },
      ],
    },
    {
      id: 'security',
      label: 'Security',
      icon: Shield,
      color: 'red',
      options: [
        { key: 'inputValidation', label: 'Input validation', desc: 'Validate user inputs' },
        { key: 'xssPrevention', label: 'XSS prevention', desc: 'Sanitize dynamic content' },
        { key: 'csrfProtection', label: 'CSRF protection', desc: 'Protect form submissions' },
      ],
    },
    {
      id: 'dataHandling',
      label: 'Data & State',
      icon: Database,
      color: 'green',
      options: [
        { key: 'errorHandling', label: 'Error handling', desc: 'Try-catch, error boundaries' },
        { key: 'loadingStates', label: 'Loading states', desc: 'Show loading indicators' },
        { key: 'optimisticUpdates', label: 'Optimistic UI', desc: 'Instant feedback' },
        { key: 'testCoverage', label: 'Test ready', desc: 'Testable component structure' },
      ],
    },
    {
      id: 'animation',
      label: 'Animation',
      icon: Sparkles,
      color: 'pink',
      options: [
        { key: 'smoothTransitions', label: 'Smooth transitions', desc: 'Add CSS/Framer animations' },
        { key: 'reduceMotion', label: 'Reduce motion', desc: 'Respect prefers-reduced-motion' },
      ],
    },
  ];

  const frameworks = [
    { value: 'react', label: 'React', icon: '⚛️' },
    { value: 'nextjs', label: 'Next.js', icon: '▲' },
    { value: 'vue', label: 'Vue', icon: '💚' },
    { value: 'svelte', label: 'Svelte', icon: '🔥' },
    { value: 'angular', label: 'Angular', icon: '🅰️' },
    { value: 'html', label: 'HTML/CSS', icon: '🌐' },
    { value: 'python', label: 'Python', icon: '🐍' },
    { value: 'node', label: 'Node.js', icon: '💚' },
    { value: 'rust', label: 'Rust', icon: '🦀' },
    { value: 'go', label: 'Go', icon: '🐹' },
  ];

  const stylePresets = [
    { value: 'glass', label: 'Glass', desc: 'Glassmorphism' },
    { value: 'minimal', label: 'Minimal', desc: 'Clean & simple' },
    { value: 'material', label: 'Material', desc: 'Material Design' },
    { value: 'neumorphism', label: 'Neumorphic', desc: 'Soft UI' },
    { value: 'brutalist', label: 'Brutalist', desc: 'Bold & raw' },
    { value: 'corporate', label: 'Corporate', desc: 'Professional' },
    { value: 'playful', label: 'Playful', desc: 'Fun & colorful' },
    { value: 'dark', label: 'Dark', desc: 'Dark theme' },
  ];

  const colorClasses = {
    teal: { badge: 'bg-accent-teal/20 border-accent-teal/30 text-accent-teal', icon: 'text-accent-teal' },
    purple: { badge: 'bg-accent-purple/20 border-accent-purple/30 text-accent-purple', icon: 'text-accent-purple' },
    blue: { badge: 'bg-blue-500/20 border-blue-500/30 text-blue-400', icon: 'text-blue-400' },
    yellow: { badge: 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400', icon: 'text-yellow-400' },
    red: { badge: 'bg-red-500/20 border-red-500/30 text-red-400', icon: 'text-red-400' },
    green: { badge: 'bg-green-500/20 border-green-500/30 text-green-400', icon: 'text-green-400' },
    pink: { badge: 'bg-pink-500/20 border-pink-500/30 text-pink-400', icon: 'text-pink-400' },
  };

  const activeCount = Object.values(constraints).filter(v => v === true).length;

  return (
    <div className="space-y-4">
      {/* Framework Selection */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Framework / Language</label>
        <div className="flex flex-wrap gap-1.5">
          {frameworks.map((fw) => (
            <button
              key={fw.value}
              onClick={() => setFramework(fw.value)}
              className={`px-2.5 py-1.5 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${
                framework === fw.value
                  ? 'bg-accent-teal/20 border-accent-teal/40 text-accent-teal'
                  : 'bg-surface-light/30 border-glass-border text-gray-300 hover:text-white hover:border-gray-500 hover:bg-glass-hover'
              }`}
            >
              <span>{fw.icon}</span>
              {fw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style Preset Selection */}
      <div>
        <label className="text-xs text-gray-400 mb-2 block">Design Style</label>
        <div className="flex flex-wrap gap-1.5">
          {stylePresets.map((style) => (
            <button
              key={style.value}
              onClick={() => setStylePreset(style.value)}
              title={style.desc}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                stylePreset === style.value
                  ? 'bg-accent-purple/20 border-accent-purple/40 text-accent-purple'
                  : 'bg-surface-light/30 border-glass-border text-gray-300 hover:text-white hover:border-gray-500 hover:bg-glass-hover'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Constraints Header */}
      <div className="flex items-center justify-between">
        <label className="text-xs text-gray-400">
          Constraints <span className="text-accent-teal">({activeCount} active)</span>
        </label>
        <button
          onClick={() => setExpandedCategories(
            expandedCategories.length === constraintCategories.length 
              ? [] 
              : constraintCategories.map(c => c.id)
          )}
          className="text-xs text-gray-400 hover:text-accent-teal transition-colors"
        >
          {expandedCategories.length === constraintCategories.length ? 'Collapse all' : 'Expand all'}
        </button>
      </div>

      {/* Constraint Categories */}
      <div className="space-y-2">
        {constraintCategories.map((category) => {
          const Icon = category.icon;
          const isExpanded = expandedCategories.includes(category.id);
          const categoryActiveCount = category.options.filter(opt => constraints[opt.key]).length;
          
          return (
            <div key={category.id} className="rounded-lg border border-glass-border overflow-hidden">
              {/* Category Header */}
              <button
                onClick={() => toggleCategory(category.id)}
                className="w-full flex items-center justify-between p-2.5 bg-surface-light/30 hover:bg-glass-hover transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Icon size={14} className={colorClasses[category.color].icon} />
                  <span className="text-sm text-gray-200">{category.label}</span>
                  {categoryActiveCount > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${colorClasses[category.color].badge}`}>
                      {categoryActiveCount}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDown size={14} className="text-gray-400" />
                ) : (
                  <ChevronRight size={14} className="text-gray-400" />
                )}
              </button>

              {/* Category Options */}
              {isExpanded && (
                <div className="p-2 space-y-1 border-t border-glass-border bg-surface-dark/80">
                  {category.options.map((option) => (
                    <label
                      key={option.key}
                      className="flex items-start gap-2.5 p-1.5 rounded-md cursor-pointer hover:bg-glass-hover transition-colors group"
                    >
                      <div
                        className={`w-4 h-4 mt-0.5 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                          constraints[option.key]
                            ? `${colorClasses[category.color].badge}`
                            : 'bg-glass-hover border-glass-border group-hover:border-gray-500'
                        }`}
                        onClick={(e) => {
                          e.preventDefault();
                          setConstraints({ [option.key]: !constraints[option.key] });
                        }}
                      >
                        {constraints[option.key] && (
                          <Check size={10} className="text-current" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-sm text-gray-300 block">{option.label}</span>
                        <span className="text-xs text-gray-500">{option.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Max Lines Slider */}
      <div className="p-3 rounded-lg border border-glass-border bg-surface-light/30">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Settings size={14} className="text-gray-400" />
            <label className="text-sm text-gray-200">Max Component Lines</label>
          </div>
          <span className="text-sm font-medium text-accent-teal">{constraints.maxLines}</span>
        </div>
        <input
          type="range"
          min="50"
          max="500"
          step="25"
          value={constraints.maxLines}
          onChange={(e) => setConstraints({ maxLines: parseInt(e.target.value) })}
          className="w-full h-1.5 bg-glass-border rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 
                     [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:bg-accent-teal [&::-webkit-slider-thumb]:cursor-pointer
                     [&::-webkit-slider-thumb]:shadow-glow-teal [&::-webkit-slider-thumb]:transition-all
                     [&::-webkit-slider-thumb]:hover:scale-110"
        />
        <div className="flex justify-between text-xs text-gray-600 mt-1">
          <span>50</span>
          <span>500</span>
        </div>
      </div>
    </div>
  );
}

export default ConstraintSection;
