import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Lock, User, Eye, EyeOff, Sparkles, 
  ArrowRight, Github, Chrome, AlertCircle, Check,
  Minus, X, Pin, PinOff, RefreshCw, ExternalLink
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useAppStore } from '../stores/appStore';

function AuthPage() {
  const [mode, setMode] = useState('login'); // 'login' | 'signup' | 'forgot'
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    displayName: '',
  });
  const [successMessage, setSuccessMessage] = useState('');

  const { signIn, signUp, signInWithOAuth, resetPassword, isLoading, error, clearError } = useAuthStore();
  const { isPinned, setIsPinned } = useAppStore();

  // Window controls
  const handleMinimize = () => window.electron?.minimize();
  const handleClose = () => window.electron?.close();
  const handleRefresh = () => {
    if (typeof window.electron?.refresh === 'function') {
      window.electron.refresh();
    } else {
      window.location.reload();
    }
  };
  const handleTogglePin = () => {
    window.electron?.togglePin();
  };

  // Sync pin state on mount
  useEffect(() => {
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
  }, [setIsPinned]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    clearError();
    setSuccessMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMessage('');

    if (mode === 'login') {
      const result = await signIn(formData.email, formData.password);
      if (result.success) {
        // Auth store will update, App will redirect
      }
    } else if (mode === 'signup') {
      const result = await signUp(formData.email, formData.password, formData.displayName);
      if (result.success) {
        if (result.needsConfirmation) {
          setSuccessMessage('Check your email to confirm your account!');
          setMode('login');
        }
      }
    } else if (mode === 'forgot') {
      const result = await resetPassword(formData.email);
      if (result.success) {
        setSuccessMessage('Password reset link sent to your email!');
        setMode('login');
      }
    }
  };

  const handleOAuth = async (provider) => {
    await signInWithOAuth(provider);
  };

  return (
    <div className="h-screen flex flex-col bg-surface-dark rounded-2xl overflow-hidden border border-glass-border">
      {/* Title Bar with Window Controls */}
      <div className="drag-region flex items-center justify-between h-10 px-3 border-b border-glass-border bg-surface-dark flex-shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <img src="./icon-rounded.png" alt="Code Eternal" className="w-5 h-5 object-cover" />
          <h1 className="text-sm font-semibold text-gradient">Code Eternal</h1>
        </div>

        <div className="no-drag flex items-center gap-1">
          {/* Pin Toggle */}
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

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </button>

          {/* Minimize */}
          <button
            onClick={handleMinimize}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-glass-hover transition-colors"
            title="Minimize"
          >
            <Minus size={14} />
          </button>

          {/* Close */}
          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Main Content - Scrollable */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
        <div className="min-h-full flex items-center justify-center p-4 relative">
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
        {/* Logo & Title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-[25%] mb-4 overflow-hidden"
          >
            <img src="./icon-rounded.png" alt="Code Eternal" className="w-full h-full object-cover" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-2">Code Eternal</h1>
          <p className="text-xs text-accent-teal mb-2">Context-Aware Prompt Builder</p>
          <p className="text-gray-400">
            {mode === 'login' && 'Welcome back! Sign in to continue.'}
            {mode === 'signup' && 'Create your account to get started.'}
            {mode === 'forgot' && 'Enter your email to reset password.'}
          </p>
        </div>

        {/* Auth Card */}
        <motion.div
          layout
          className="glass-panel p-6 rounded-2xl"
        >
          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 
                           flex items-center gap-2 text-red-400 text-sm"
              >
                <AlertCircle size={16} />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Success Message */}
          <AnimatePresence>
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-lg bg-green-500/10 border border-green-500/30 
                           flex items-center gap-2 text-green-400 text-sm"
              >
                <Check size={16} />
                {successMessage}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name (Signup only) */}
            <AnimatePresence>
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm text-gray-400 mb-1.5">Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={formData.displayName}
                      onChange={(e) => handleChange('displayName', e.target.value)}
                      placeholder="Your name"
                      className="glass-input pl-10 py-3 w-full"
                      required={mode === 'signup'}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">Email</label>
              <div className="relative">
                <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  placeholder="you@example.com"
                  className="glass-input pl-10 py-3 w-full"
                  required
                />
              </div>
            </div>

            {/* Password (Not for forgot) */}
            <AnimatePresence>
              {mode !== 'forgot' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                >
                  <label className="block text-sm text-gray-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      placeholder="••••••••"
                      className="glass-input pl-10 pr-10 py-3 w-full"
                      required={mode !== 'forgot'}
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Forgot Password Link */}
            {mode === 'login' && (
              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setMode('forgot')}
                  className="text-sm text-accent-teal hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl font-medium text-white
                         bg-gradient-to-r from-accent-teal to-accent-blue
                         hover:shadow-glow-teal transition-all
                         disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' && 'Sign In'}
                  {mode === 'signup' && 'Create Account'}
                  {mode === 'forgot' && 'Send Reset Link'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          {mode !== 'forgot' && (
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-glass-border" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-3 bg-surface-dark text-gray-500">or continue with</span>
              </div>
            </div>
          )}

          {/* OAuth Buttons */}
          {mode !== 'forgot' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('google')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl
                           bg-glass-hover border border-glass-border
                           text-gray-300 hover:text-white hover:border-accent-teal/30
                           transition-all disabled:opacity-50"
              >
                <Chrome size={18} />
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('github')}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl
                           bg-glass-hover border border-glass-border
                           text-gray-300 hover:text-white hover:border-accent-teal/30
                           transition-all disabled:opacity-50"
              >
                <Github size={18} />
                GitHub
              </button>
            </div>
          )}

          {/* Toggle Mode */}
          <div className="mt-6 text-center text-sm text-gray-400">
            {mode === 'login' && (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('signup')}
                  className="text-accent-teal hover:underline"
                >
                  Sign up
                </button>
              </>
            )}
            {mode === 'signup' && (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => setMode('login')}
                  className="text-accent-teal hover:underline"
                >
                  Sign in
                </button>
              </>
            )}
            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-accent-teal hover:underline"
              >
                Back to sign in
              </button>
            )}
          </div>
        </motion.div>

            {/* Footer */}
            <p className="text-center text-xs text-gray-500 mt-6">
              By continuing, you agree to our Terms of Service and Privacy Policy.
            </p>
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
