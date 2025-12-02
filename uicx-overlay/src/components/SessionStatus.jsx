import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, RefreshCw, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

function SessionStatus() {
  const { 
    isOnline, 
    setOnlineStatus, 
    sessionStatus, 
    refreshSession,
    isSessionValid,
    lastActivity 
  } = useAuthStore();
  
  const [showStatus, setShowStatus] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setOnlineStatus(true);
    const handleOffline = () => setOnlineStatus(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnlineStatus]);

  // Show status indicator when offline or session issues
  useEffect(() => {
    if (!isOnline || sessionStatus === 'expired' || sessionStatus === 'error') {
      setShowStatus(true);
    } else if (sessionStatus === 'active' && isOnline) {
      // Hide after a short delay when back to normal
      const timer = setTimeout(() => setShowStatus(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, sessionStatus]);

  // Check session validity periodically
  useEffect(() => {
    const checkSession = async () => {
      if (!isSessionValid() && sessionStatus === 'active') {
        await refreshSession();
      }
    };

    // Check every 5 minutes
    const interval = setInterval(checkSession, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [isSessionValid, refreshSession, sessionStatus]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refreshSession();
    setIsRefreshing(false);
  };

  const getStatusConfig = () => {
    if (!isOnline) {
      return {
        icon: WifiOff,
        message: 'You\'re offline',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10 border-yellow-500/30',
      };
    }

    switch (sessionStatus) {
      case 'refreshing':
        return {
          icon: RefreshCw,
          message: 'Refreshing session...',
          color: 'text-accent-teal',
          bgColor: 'bg-accent-teal/10 border-accent-teal/30',
          animate: true,
        };
      case 'expired':
        return {
          icon: AlertCircle,
          message: 'Session expired',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10 border-red-500/30',
          showRefresh: true,
        };
      case 'error':
        return {
          icon: AlertCircle,
          message: 'Connection error',
          color: 'text-red-400',
          bgColor: 'bg-red-500/10 border-red-500/30',
          showRefresh: true,
        };
      case 'active':
        return {
          icon: CheckCircle,
          message: 'Connected',
          color: 'text-green-400',
          bgColor: 'bg-green-500/10 border-green-500/30',
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();

  if (!config || !showStatus) return null;

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className={`fixed top-12 left-1/2 -translate-x-1/2 z-50 
                    flex items-center gap-2 px-3 py-1.5 rounded-full
                    border ${config.bgColor} backdrop-blur-sm`}
      >
        <Icon 
          size={14} 
          className={`${config.color} ${config.animate ? 'animate-spin' : ''}`} 
        />
        <span className={`text-xs font-medium ${config.color}`}>
          {config.message}
        </span>
        {config.showRefresh && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="ml-1 p-1 rounded-full hover:bg-white/10 transition-colors"
          >
            {isRefreshing ? (
              <Loader2 size={12} className="animate-spin text-gray-400" />
            ) : (
              <RefreshCw size={12} className="text-gray-400" />
            )}
          </button>
        )}
      </motion.div>
    </AnimatePresence>
  );
}

export default SessionStatus;
