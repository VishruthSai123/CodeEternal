import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle,
  Minus, X, Pin, PinOff, AlertCircle, ArrowRight, Monitor
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';

function ResetPasswordPage({ onComplete }) {
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'success' | 'error'
  const [message, setMessage] = useState('Verifying reset link...');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');
  
  const { updatePassword, isLoading, error, clearError, initialize } = useAuthStore();
  const { isPinned, setIsPinned } = useAppStore();
  const handledRef = useRef(false);

  // Detect if running in Electron (desktop) or browser (mobile/web)
  const isElectron = !!window.electron;
  const isMobile = !isElectron && (
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
    window.innerWidth < 768
  );

  // Window controls (desktop only)
  const handleMinimize = () => window.electron?.minimize();
  const handleClose = () => window.electron?.close();
  const handleTogglePin = () => window.electron?.togglePin();

  // Sync pin state on mount (desktop only)
  useEffect(() => {
    if (!isElectron) return;
    
    const syncPinState = async () => {
      if (window.electron?.getPinState) {
        const pinState = await window.electron.getPinState();
        setIsPinned(pinState);
      }
    };
    syncPinState();

    const cleanup = window.electron?.onPinStateChanged?.((pinned) => {
      setIsPinned(pinned);
    });
    return () => cleanup?.();
  }, [setIsPinned, isElectron]);

  // Handle the password reset token from URL
  useEffect(() => {
    if (handledRef.current) return;
    handledRef.current = true;

    const handleResetToken = async () => {
      try {
        console.log('ResetPasswordPage: Processing reset link...');
        
        // Check for errors in URL
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const urlError = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');
        
        if (urlError) {
          throw new Error(errorDescription || urlError);
        }

        // Wait for Supabase to process the token and create a session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          console.log('ResetPasswordPage: Session established for:', session.user?.email);
          setStatus('ready');
          setMessage(`Enter a new password for ${session.user?.email}`);
          window.history.replaceState({}, document.title, window.location.pathname);
        } else {
          // If no session, listen for auth state changes
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'PASSWORD_RECOVERY' || (event === 'SIGNED_IN' && session)) {
              setStatus('ready');
              setMessage(`Enter a new password for ${session?.user?.email || 'your account'}`);
              window.history.replaceState({}, document.title, window.location.pathname);
              subscription.unsubscribe();
            }
          });

          // Timeout after 10 seconds
          setTimeout(() => {
            if (status === 'loading') {
              setStatus('error');
              setMessage('Reset link expired or invalid. Please request a new one.');
            }
          }, 10000);
        }
      } catch (err) {
        console.error('ResetPasswordPage: Error:', err);
        setStatus('error');
        setMessage(err.message || 'Failed to verify reset link');
      }
    };

    handleResetToken();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    clearError();

    if (password.length < 6) {
      setFormError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    const result = await updatePassword(password);
    
    if (result.success) {
      setStatus('success');
      setMessage('Password updated successfully!');
      
      // Only redirect on desktop (Electron), not on mobile/web
      if (isElectron) {
        setTimeout(async () => {
          await initialize();
          onComplete?.();
        }, 2000);
      }
      // On mobile, just stay on success page - no redirect
    }
  };

  const handleBackToLogin = () => {
    window.history.replaceState({}, document.title, window.location.pathname);
    if (isElectron) {
      onComplete?.();
    }
    // On mobile, just clear URL but stay on page
  };

  // Mobile/Web Layout
  if (isMobile || !isElectron) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-br from-[#0f0f1a] via-[#1a1a2e] to-[#16213e]">
        {/* Simple Header */}
        <header className="flex items-center justify-center py-6 px-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <img src="./icon-rounded.png" alt="Code Eternal" className="w-8 h-8 object-cover rounded-lg" />
            <h1 className="text-lg font-bold text-white">Code Eternal</h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 flex items-center justify-center p-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-sm"
          >
            {/* Logo */}
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-4 overflow-hidden bg-white/5 border border-white/10"
              >
                <img src="./icon-rounded.png" alt="Code Eternal" className="w-full h-full object-cover" />
              </motion.div>
              <h2 className="text-2xl font-bold text-white mb-2">Reset Password</h2>
            </div>

            {/* Card */}
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-2xl">
              {/* Loading State */}
              {status === 'loading' && (
                <div className="text-center py-8">
                  <Loader2 className="w-12 h-12 text-[#14F4C9] animate-spin mx-auto mb-4" />
                  <p className="text-gray-400">{message}</p>
                </div>
              )}

              {/* Error State */}
              {status === 'error' && (
                <div className="text-center py-8">
                  <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
                  <p className="text-red-400 mb-6">{message}</p>
                  <p className="text-gray-500 text-sm">
                    Please request a new password reset link from the desktop app.
                  </p>
                </div>
              )}

              {/* Success State - Mobile stays here, no redirect */}
              {status === 'success' && (
                <div className="text-center py-8">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring' }}
                  >
                    <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                  </motion.div>
                  <h3 className="text-xl font-bold text-white mb-2">Password Updated!</h3>
                  <p className="text-green-400 mb-6">{message}</p>
                  
                  <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                    <div className="flex items-center justify-center gap-2 mb-3">
                      <Monitor size={20} className="text-[#14F4C9]" />
                      <span className="text-white font-medium">Continue on Desktop</span>
                    </div>
                    <p className="text-gray-400 text-sm">
                      You can now log in with your new password in the Code Eternal desktop app.
                    </p>
                  </div>
                </div>
              )}

              {/* Ready - Show Password Form */}
              {status === 'ready' && (
                <>
                  <p className="text-gray-400 text-center mb-6 text-sm">{message}</p>

                  {/* Error Messages */}
                  <AnimatePresence>
                    {(formError || error) && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 
                                   flex items-center gap-2 text-red-400 text-sm"
                      >
                        <AlertCircle size={16} />
                        {formError || error}
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    {/* New Password */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">New Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl
                                     text-white placeholder-gray-500 focus:outline-none focus:border-[#14F4C9]/50
                                     transition-colors"
                          required
                          minLength={6}
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label className="block text-sm text-gray-400 mb-1.5">Confirm Password</label>
                      <div className="relative">
                        <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="w-full pl-10 pr-10 py-3 bg-white/5 border border-white/10 rounded-xl
                                     text-white placeholder-gray-500 focus:outline-none focus:border-[#14F4C9]/50
                                     transition-colors"
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                        >
                          {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Submit Button */}
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full py-3 bg-gradient-to-r from-[#14F4C9] to-[#3B82F6] 
                                 text-gray-900 font-semibold rounded-xl
                                 hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                                 flex items-center justify-center gap-2"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Updating...
                        </>
                      ) : (
                        <>
                          Update Password
                          <ArrowRight size={18} />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 mt-6">
              Code Eternal - AI-Powered Prompt Builder
            </p>
          </motion.div>
        </main>
      </div>
    );
  }

  // Desktop (Electron) Layout - Original design with window controls
  return (
    <div className="h-screen flex flex-col bg-surface-dark rounded-2xl overflow-hidden border border-glass-border">
      {/* Title Bar */}
      <div className="drag-region flex items-center justify-between h-10 px-3 border-b border-glass-border bg-surface-dark flex-shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <img src="./icon-rounded.png" alt="Code Eternal" className="w-5 h-5 object-cover" />
          <h1 className="text-sm font-semibold text-gradient">Reset Password</h1>
        </div>

        <div className="no-drag flex items-center gap-1">
          <button
            onClick={handleTogglePin}
            className={`p-1.5 rounded-lg transition-colors ${
              isPinned
                ? 'text-accent-teal hover:text-accent-teal/80'
                : 'text-gray-400 hover:text-white hover:bg-glass-hover'
            }`}
            title={isPinned ? 'Unpin overlay' : 'Pin overlay'}
          >
            {isPinned ? <Pin size={14} /> : <PinOff size={14} />}
          </button>
          <button
            onClick={handleMinimize}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
            title="Minimize"
          >
            <Minus size={14} />
          </button>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-teal/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative w-full max-w-md"
        >
          {/* Logo */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.1 }}
              className="inline-flex items-center justify-center w-16 h-16 rounded-[25%] mb-4 overflow-hidden"
            >
              <img src="./icon-rounded.png" alt="Code Eternal" className="w-full h-full object-cover" />
            </motion.div>
            <h1 className="text-2xl font-bold text-white mb-2">Reset Password</h1>
          </div>

          {/* Card */}
          <div className="glass-panel p-6 rounded-2xl">
            {/* Loading State */}
            {status === 'loading' && (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 text-accent-teal animate-spin mx-auto mb-4" />
                <p className="text-gray-400">{message}</p>
              </div>
            )}

            {/* Error State */}
            {status === 'error' && (
              <div className="text-center py-8">
                <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{message}</p>
                <button
                  onClick={handleBackToLogin}
                  className="px-6 py-2 bg-glass-hover border border-glass-border rounded-xl
                             text-white hover:bg-glass-active transition-colors"
                >
                  Back to Login
                </button>
              </div>
            )}

            {/* Success State */}
            {status === 'success' && (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-4" />
                <p className="text-green-400 mb-2">{message}</p>
                <p className="text-gray-500 text-sm">Redirecting...</p>
              </div>
            )}

            {/* Ready - Show Password Form */}
            {status === 'ready' && (
              <>
                <p className="text-gray-400 text-center mb-6">{message}</p>

                {/* Error Messages */}
                <AnimatePresence>
                  {(formError || error) && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 
                                 flex items-center gap-2 text-red-400 text-sm"
                    >
                      <AlertCircle size={16} />
                      {formError || error}
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">New Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="glass-input pl-10 pr-10 py-3 w-full"
                        required
                        minLength={6}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="glass-input pl-10 pr-10 py-3 w-full"
                        required
                        minLength={6}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                      >
                        {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-3 bg-gradient-to-r from-accent-teal to-accent-blue 
                               text-white font-semibold rounded-xl shadow-neon-teal
                               hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed
                               flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader2 size={18} className="animate-spin" />
                        Updating...
                      </>
                    ) : (
                      <>
                        Update Password
                        <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                </form>

                {/* Back to Login */}
                <div className="mt-4 text-center">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-sm text-gray-500 hover:text-accent-teal transition-colors"
                  >
                    Cancel and return to login
                  </button>
                </div>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default ResetPasswordPage;
