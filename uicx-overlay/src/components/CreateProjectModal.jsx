import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, FolderPlus, Sparkles, Code, Palette, 
  FileText, ArrowRight, Check
} from 'lucide-react';
import { useProjectStore } from '../stores/projectStore';

const FRAMEWORKS = [
  { id: 'react', name: 'React', icon: '⚛️' },
  { id: 'vue', name: 'Vue', icon: '💚' },
  { id: 'svelte', name: 'Svelte', icon: '🔥' },
  { id: 'next', name: 'Next.js', icon: '▲' },
  { id: 'angular', name: 'Angular', icon: '🅰️' },
  { id: 'html', name: 'HTML/CSS', icon: '🌐' },
];

const STYLE_PRESETS = [
  { id: 'modern', name: 'Modern', desc: 'Clean, minimal design' },
  { id: 'glassmorphism', name: 'Glassmorphism', desc: 'Frosted glass effects' },
  { id: 'neumorphism', name: 'Neumorphism', desc: 'Soft UI shadows' },
  { id: 'brutalist', name: 'Brutalist', desc: 'Bold, raw aesthetics' },
  { id: 'retro', name: 'Retro', desc: 'Vintage vibes' },
  { id: 'corporate', name: 'Corporate', desc: 'Professional look' },
];

function CreateProjectModal({ isOpen, onClose, onCreated }) {
  const { createProject, isCreating } = useProjectStore();
  
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    framework: 'react',
    stylePreset: 'modern',
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleCreate = async () => {
    const result = await createProject(formData);
    if (result.success) {
      onCreated(result.project);
      onClose();
      // Reset form
      setStep(1);
      setFormData({
        name: '',
        description: '',
        framework: 'react',
        stylePreset: 'modern',
      });
    }
  };

  const canProceed = () => {
    if (step === 1) return formData.name.trim().length > 0;
    return true;
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 
                 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg bg-surface-dark border border-glass-border 
                   rounded-2xl shadow-glass-lg overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-glass-border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-accent-teal/10">
              <FolderPlus size={20} className="text-accent-teal" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Create New Project</h3>
              <p className="text-xs text-gray-500">Step {step} of 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:text-white 
                       hover:bg-glass-hover transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-glass-hover">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(step / 3) * 100}%` }}
            className="h-full bg-gradient-to-r from-accent-teal to-accent-blue"
          />
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Name & Description */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-accent-teal/10 
                                  flex items-center justify-center">
                    <FileText size={24} className="text-accent-teal" />
                  </div>
                  <h4 className="text-lg font-medium text-white">Project Details</h4>
                  <p className="text-sm text-gray-400">Give your project a name</p>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Project Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="My Awesome App"
                    className="glass-input w-full py-3"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">
                    Description (optional)
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="What are you building?"
                    rows={3}
                    className="glass-input w-full py-3 resize-none"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 2: Framework */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-accent-purple/10 
                                  flex items-center justify-center">
                    <Code size={24} className="text-accent-purple" />
                  </div>
                  <h4 className="text-lg font-medium text-white">Choose Framework</h4>
                  <p className="text-sm text-gray-400">Select your tech stack</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {FRAMEWORKS.map((fw) => (
                    <button
                      key={fw.id}
                      onClick={() => handleChange('framework', fw.id)}
                      className={`p-4 rounded-xl border text-center transition-all ${
                        formData.framework === fw.id
                          ? 'bg-accent-purple/10 border-accent-purple/50'
                          : 'bg-glass-hover border-glass-border hover:border-accent-purple/30'
                      }`}
                    >
                      <span className="text-2xl mb-2 block">{fw.icon}</span>
                      <span className={`text-sm font-medium ${
                        formData.framework === fw.id ? 'text-accent-purple' : 'text-gray-300'
                      }`}>
                        {fw.name}
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Style Preset */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <div className="text-center mb-6">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-accent-blue/10 
                                  flex items-center justify-center">
                    <Palette size={24} className="text-accent-blue" />
                  </div>
                  <h4 className="text-lg font-medium text-white">Style Preference</h4>
                  <p className="text-sm text-gray-400">Choose your design style</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {STYLE_PRESETS.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => handleChange('stylePreset', style.id)}
                      className={`p-4 rounded-xl border text-left transition-all ${
                        formData.stylePreset === style.id
                          ? 'bg-accent-blue/10 border-accent-blue/50'
                          : 'bg-glass-hover border-glass-border hover:border-accent-blue/30'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`font-medium ${
                          formData.stylePreset === style.id ? 'text-accent-blue' : 'text-gray-300'
                        }`}>
                          {style.name}
                        </span>
                        {formData.stylePreset === style.id && (
                          <Check size={16} className="text-accent-blue" />
                        )}
                      </div>
                      <span className="text-xs text-gray-500">{style.desc}</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-glass-border">
          <button
            onClick={step > 1 ? handleBack : onClose}
            className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            {step > 1 ? 'Back' : 'Cancel'}
          </button>

          {step < 3 ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium
                         bg-gradient-to-r from-accent-teal to-accent-blue text-white
                         hover:shadow-glow-teal transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ArrowRight size={16} />
            </button>
          ) : (
            <button
              onClick={handleCreate}
              disabled={isCreating}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium
                         bg-gradient-to-r from-accent-teal to-accent-blue text-white
                         hover:shadow-glow-teal transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCreating ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles size={16} />
                  Create Project
                </>
              )}
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default CreateProjectModal;
