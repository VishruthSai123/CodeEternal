import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2, WifiOff, RefreshCw, LogOut, Trash2 } from 'lucide-react';

function LoadingScreen({ status = 'loading', message, onRetry, onClearCache }) {
  const [showClearCacheButton, setShowClearCacheButton] = useState(false);

  // Show clear cache button after 3 seconds if still initializing
  useEffect(() => {
    if (status === 'initializing') {
      const timer = setTimeout(() => {
        setShowClearCacheButton(true);
      }, 3000);
      return () => clearTimeout(timer);
    } else if (status === 'error' || status === 'timeout' || status === 'offline') {
      setShowClearCacheButton(true);
    }
  }, [status]);

  const configs = {
    loading: {
      icon: Loader2,
      title: 'Loading Code Eternal',
      subtitle: 'Preparing your workspace...',
      iconClass: 'animate-spin text-accent-teal',
      showProgress: true,
    },
    initializing: {
      icon: Sparkles,
      title: 'Initializing',
      subtitle: 'Setting up your session...',
      iconClass: 'text-accent-teal animate-pulse',
      showProgress: true,
      showClearCache: true, // Show clear cache even during init in case it's stuck
    },
    connecting: {
      icon: Loader2,
      title: 'Connecting',
      subtitle: 'Establishing connection to servers...',
      iconClass: 'animate-spin text-accent-teal',
      showProgress: true,
    },
    offline: {
      icon: WifiOff,
      title: 'You\'re Offline',
      subtitle: 'Please check your internet connection',
      iconClass: 'text-yellow-400',
      showRetry: true,
      showClearCache: true,
    },
    error: {
      icon: RefreshCw,
      title: 'Connection Error',
      subtitle: message || 'Unable to connect to servers',
      iconClass: 'text-red-400',
      showRetry: true,
      showClearCache: true,
    },
    timeout: {
      icon: WifiOff,
      title: 'Connection Timeout',
      subtitle: 'Server is not responding. Try clearing cache.',
      iconClass: 'text-yellow-400',
      showRetry: true,
      showClearCache: true,
    },
  };

  const config = configs[status] || configs.loading;
  const Icon = config.icon;

  return (
    <div className="w-full h-screen flex flex-col items-center justify-center 
                    bg-surface-dark 
                    rounded-2xl border border-glass-border overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-teal/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/5 rounded-full blur-3xl" />
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative z-10 text-center"
      >
        {/* Logo */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="inline-flex items-center justify-center w-20 h-20 rounded-2xl 
                     bg-gradient-to-br from-accent-teal/20 to-accent-purple/20 
                     border border-glass-border mb-6"
        >
          <Icon size={36} className={config.iconClass} />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-2xl font-bold text-white mb-2"
        >
          {config.title}
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-gray-400 mb-6"
        >
          {config.subtitle}
        </motion.p>

        {/* Progress Bar */}
        {config.showProgress && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="w-48 mx-auto"
          >
            <div className="h-1 bg-glass-hover rounded-full overflow-hidden">
              <motion.div
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 1.5, 
                  ease: 'easeInOut' 
                }}
                className="h-full w-1/3 bg-gradient-to-r from-accent-teal to-accent-purple rounded-full"
              />
            </div>
          </motion.div>
        )}

        {/* Retry Button */}
        {config.showRetry && onRetry && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col items-center gap-3 mt-4"
          >
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                         bg-accent-teal text-white hover:shadow-glow-teal transition-all"
            >
              <RefreshCw size={16} />
              Try Again
            </button>
            
            {/* Clear Cache Button */}
            {showClearCacheButton && onClearCache && (
              <button
                onClick={onClearCache}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                           bg-red-500/10 text-red-400 border border-red-500/30
                           hover:bg-red-500/20 transition-all text-sm"
              >
                <Trash2 size={14} />
                Clear Cache & Logout
              </button>
            )}
          </motion.div>
        )}

        {/* Clear Cache during initializing (shows after 3s delay) */}
        {status === 'initializing' && showClearCacheButton && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center gap-2 mt-6"
          >
            <p className="text-xs text-gray-500">Taking too long?</p>
            <button
              onClick={() => {
                // Direct clear - don't rely on state
                localStorage.clear();
                sessionStorage.clear();
                window.location.reload();
              }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg
                         bg-red-500/10 text-red-400 border border-red-500/30
                         hover:bg-red-500/20 transition-all text-sm"
            >
              <Trash2 size={14} />
              Clear Cache & Restart
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Version */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="absolute bottom-4 text-xs text-gray-600"
      >
        Code Eternal v1.0.0
      </motion.p>
    </div>
  );
}

export default LoadingScreen;
