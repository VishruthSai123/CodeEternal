import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Minus,
  X,
  Pin,
  PinOff,
  PanelLeft,
  PanelRight,
  Maximize2,
  ChevronLeft,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import usePlatform from '../../hooks/usePlatform';

function TitleBar({ projectName, onBackToHome }) {
  const { isPinned, setIsPinned } = useAppStore();
  const { isElectron, canMinimize, canClose, canPin, canDock } = usePlatform();
  const [showDockOptions, setShowDockOptions] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Sync pin state with electron on mount
  useEffect(() => {
    const syncPinState = async () => {
      if (window.electron?.getPinState) {
        const pinState = await window.electron.getPinState();
        setIsPinned(pinState);
      }
    };
    syncPinState();

    // Listen for pin state changes from electron
    const cleanup = window.electron?.onPinStateChanged?.((pinned) => {
      setIsPinned(pinned);
    });

    return () => cleanup?.();
  }, [setIsPinned]);

  const handleMinimize = () => {
    window.electron?.minimize();
  };

  const handleClose = () => {
    window.electron?.close();
  };

  const handleTogglePin = () => {
    window.electron?.togglePin();
    // State will be updated via onPinStateChanged callback
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    window.electron?.refresh();
    // In case refresh doesn't work in electron, also do a window reload
    setTimeout(() => {
      if (window.electron?.refresh) {
        // Electron will handle it
      } else {
        window.location.reload();
      }
    }, 100);
  };

  const handleDock = (position) => {
    if (position === 'left') {
      window.electron?.dockLeft();
    } else if (position === 'right') {
      window.electron?.dockRight();
    } else {
      window.electron?.dockFloat();
    }
    setShowDockOptions(false);
  };

  return (
    <div className="drag-region flex items-center justify-between h-10 px-3 border-b border-glass-border bg-surface-dark">
      {/* App Title / Project Name */}
      <div className="flex items-center gap-2">
        {projectName && onBackToHome ? (
          <>
            <button
              onClick={onBackToHome}
              className="no-drag p-1 rounded-lg text-gray-400 hover:text-white 
                         hover:bg-glass-hover transition-colors"
              title="Back to Home"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <FolderOpen size={14} className="text-accent-teal" />
              <span className="text-sm font-medium text-white truncate max-w-32">
                {projectName}
              </span>
            </div>
          </>
        ) : (
          <>
            <img src="./icon-rounded.png" alt="Build Eternal" className="w-5 h-5 object-cover" />
            <h1 className="text-sm font-semibold text-gradient">Build Eternal</h1>
          </>
        )}
      </div>

      {/* Controls */}
      <div className="no-drag flex items-center gap-1">
        {/* Dock Options - Electron only */}
        {canDock && (
          <div className="relative">
            <button
              onClick={() => setShowDockOptions(!showDockOptions)}
              className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
              title="Dock position"
            >
              <Maximize2 size={14} />
            </button>

            {showDockOptions && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="absolute right-0 top-full mt-1 p-1 bg-surface-dark border border-glass-border rounded-lg shadow-glass z-50"
              >
                <button
                  onClick={() => handleDock('left')}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-300 hover:bg-glass-hover rounded-md"
                >
                  <PanelLeft size={12} /> Dock Left
                </button>
                <button
                  onClick={() => handleDock('right')}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-300 hover:bg-glass-hover rounded-md"
                >
                  <PanelRight size={12} /> Dock Right
                </button>
                <button
                  onClick={() => handleDock('float')}
                  className="flex items-center gap-2 w-full px-3 py-1.5 text-xs text-gray-300 hover:bg-glass-hover rounded-md"
                >
                  <Maximize2 size={12} /> Float
                </button>
              </motion.div>
            )}
          </div>
        )}

        {/* Pin Toggle - Electron only */}
        {canPin && (
          <button
            onClick={handleTogglePin}
            className={`p-1.5 rounded-lg transition-colors ${
              isPinned
                ? 'text-accent-teal hover:text-accent-teal/80'
                : 'text-gray-400 hover:text-white hover:bg-glass-hover'
            }`}
            title={isPinned ? 'Unpin overlay (window will hide when focus lost)' : 'Pin overlay (stay on top)'}
          >
            {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
        )}

        {/* Refresh - Always show */}
        <button
          onClick={handleRefresh}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
          title="Refresh"
        >
          <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
        </button>

        {/* Minimize - Electron only */}
        {canMinimize && (
          <button
            onClick={handleMinimize}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
        )}

        {/* Close - Electron only */}
        {canClose && (
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

export default TitleBar;
