import { motion } from 'framer-motion';
import { Wand2, Library, History, Settings } from 'lucide-react';

const tabs = [
  { id: 'prompt', label: 'Prompt', icon: Wand2 },
  { id: 'snippets', label: 'Snippets', icon: Library },
  { id: 'history', label: 'History', icon: History },
  { id: 'settings', label: 'Settings', icon: Settings },
];

function TabBar({ activeTab, onTabChange }) {
  return (
    <div className="flex items-center gap-1 px-3 py-2 border-b border-glass-border bg-surface-dark/20">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`relative flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'text-accent-teal'
                : 'text-gray-400 hover:text-white hover:bg-glass-hover'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>

            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute inset-0 bg-accent-teal/10 border border-accent-teal/20 rounded-lg -z-10"
                transition={{ type: 'spring', duration: 0.3 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}

export default TabBar;
