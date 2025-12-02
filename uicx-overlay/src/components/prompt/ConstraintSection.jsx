import { usePromptStore } from '../../stores/promptStore';
import { Check } from 'lucide-react';

function ConstraintSection() {
  const { constraints, setConstraints, framework, setFramework, stylePreset, setStylePreset } = usePromptStore();

  const constraintOptions = [
    { key: 'noInlineStyles', label: 'No inline styles' },
    { key: 'useTailwind', label: 'Use Tailwind CSS' },
    { key: 'ariaRequired', label: 'Include ARIA attributes' },
    { key: 'mobileFirst', label: 'Mobile-first design' },
  ];

  const frameworks = [
    { value: 'react', label: 'React' },
    { value: 'nextjs', label: 'Next.js' },
    { value: 'vue', label: 'Vue' },
    { value: 'svelte', label: 'Svelte' },
    { value: 'html', label: 'HTML/CSS' },
  ];

  const stylePresets = [
    { value: 'glass', label: 'Glassmorphism' },
    { value: 'minimal', label: 'Minimal' },
    { value: 'material', label: 'Material' },
    { value: 'neumorphism', label: 'Neumorphism' },
    { value: 'brutalist', label: 'Brutalist' },
  ];

  return (
    <div className="space-y-4">
      {/* Framework Selection */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Framework</label>
        <div className="flex flex-wrap gap-1.5">
          {frameworks.map((fw) => (
            <button
              key={fw.value}
              onClick={() => setFramework(fw.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                framework === fw.value
                  ? 'bg-accent-teal/20 border-accent-teal/50 text-accent-teal'
                  : 'bg-glass-hover border-glass-border text-gray-400 hover:text-white'
              }`}
            >
              {fw.label}
            </button>
          ))}
        </div>
      </div>

      {/* Style Preset Selection */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Style Preset</label>
        <div className="flex flex-wrap gap-1.5">
          {stylePresets.map((style) => (
            <button
              key={style.value}
              onClick={() => setStylePreset(style.value)}
              className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                stylePreset === style.value
                  ? 'bg-accent-purple/20 border-accent-purple/50 text-accent-purple'
                  : 'bg-glass-hover border-glass-border text-gray-400 hover:text-white'
              }`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </div>

      {/* Constraint Toggles */}
      <div>
        <label className="text-xs text-gray-500 mb-2 block">Code Constraints</label>
        <div className="space-y-2">
          {constraintOptions.map((option) => (
            <label
              key={option.key}
              className="flex items-center gap-3 cursor-pointer group"
            >
              <div
                className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                  constraints[option.key]
                    ? 'bg-accent-teal border-accent-teal'
                    : 'bg-glass-hover border-glass-border group-hover:border-gray-500'
                }`}
                onClick={() =>
                  setConstraints({ [option.key]: !constraints[option.key] })
                }
              >
                {constraints[option.key] && (
                  <Check size={12} className="text-gray-900" />
                )}
              </div>
              <span className="text-sm text-gray-300">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Max Lines Slider */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs text-gray-500">Max Component Lines</label>
          <span className="text-xs text-accent-teal">{constraints.maxLines}</span>
        </div>
        <input
          type="range"
          min="50"
          max="500"
          step="50"
          value={constraints.maxLines}
          onChange={(e) => setConstraints({ maxLines: parseInt(e.target.value) })}
          className="w-full h-1 bg-glass-border rounded-full appearance-none cursor-pointer
                     [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 
                     [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full 
                     [&::-webkit-slider-thumb]:bg-accent-teal [&::-webkit-slider-thumb]:cursor-pointer"
        />
      </div>
    </div>
  );
}

export default ConstraintSection;
