import { useEffect, useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function AuthCallback({ onComplete }) {
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('Completing sign in...');
  const { initialize } = useAuthStore();
  const handledRef = useRef(false);

  useEffect(() => {
    // Prevent double execution
    if (handledRef.current) return;
    handledRef.current = true;

    const handleCallback = async () => {
      try {
        console.log('AuthCallback: Starting OAuth callback handling...');
        console.log('AuthCallback: Current URL:', window.location.href);
        console.log('AuthCallback: Hash:', window.location.hash);
        
        // Check for error in URL first
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        const error = hashParams.get('error') || queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
        
        if (error) {
          throw new Error(errorDescription || error);
        }

        // With detectSessionInUrl: true, Supabase automatically processes the hash
        // and triggers an auth state change. We need to listen for that.
        
        // First, check if session already exists (Supabase may have already processed it)
        const { data: { session: existingSession } } = await supabase.auth.getSession();
        
        if (existingSession) {
          console.log('AuthCallback: Session already exists!', existingSession.user?.email);
          setStatus('success');
          setMessage('Sign in successful! Redirecting...');
          
          // Clear URL hash if present
          if (window.location.hash) {
            window.history.replaceState({}, document.title, window.location.pathname);
          }
          
          await initialize();
          
          setTimeout(() => {
            onComplete?.();
          }, 1000);
          return;
        }

        // If no session yet, wait for auth state change
        console.log('AuthCallback: No session yet, listening for auth state changes...');
        setMessage('Authenticating...');
        
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log('AuthCallback: Auth state changed:', event, session?.user?.email);
          
          if (event === 'SIGNED_IN' && session) {
            setStatus('success');
            setMessage('Sign in successful! Redirecting...');
            
            // Clear URL hash if present
            if (window.location.hash) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            
            await initialize();
            subscription.unsubscribe();
            
            setTimeout(() => {
              onComplete?.();
            }, 1000);
          } else if (event === 'TOKEN_REFRESHED' && session) {
            // Token refreshed means we have a valid session
            setStatus('success');
            setMessage('Sign in successful! Redirecting...');
            
            await initialize();
            subscription.unsubscribe();
            
            setTimeout(() => {
              onComplete?.();
            }, 1000);
          }
        });

        // Also poll for session as a fallback (every 500ms for 15 seconds)
        let attempts = 0;
        const maxAttempts = 30;
        
        const pollInterval = setInterval(async () => {
          attempts++;
          const { data: { session } } = await supabase.auth.getSession();
          
          if (session) {
            console.log('AuthCallback: Session detected via polling');
            clearInterval(pollInterval);
            subscription.unsubscribe();
            
            setStatus('success');
            setMessage('Sign in successful! Redirecting...');
            
            if (window.location.hash) {
              window.history.replaceState({}, document.title, window.location.pathname);
            }
            
            await initialize();
            
            setTimeout(() => {
              onComplete?.();
            }, 1000);
          } else if (attempts >= maxAttempts) {
            console.log('AuthCallback: Polling timed out');
            clearInterval(pollInterval);
            subscription.unsubscribe();
            
            setStatus('error');
            setMessage('Authentication timed out. Please try again.');
            
            setTimeout(() => {
              onComplete?.();
            }, 3000);
          }
        }, 500);
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed. Please try again.');
        
        setTimeout(() => {
          onComplete?.();
        }, 3000);
      }
    };

    handleCallback();
  }, [initialize, onComplete]);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-surface-dark">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-teal/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-purple/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'processing' && (
            <Loader2 className="w-16 h-16 text-accent-teal animate-spin mx-auto" />
          )}
          {status === 'success' && (
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
          )}
          {status === 'error' && (
            <XCircle className="w-16 h-16 text-red-400 mx-auto" />
          )}
        </div>

        {/* Message */}
        <h2 className={`text-xl font-semibold mb-2 ${
          status === 'error' ? 'text-red-400' : 
          status === 'success' ? 'text-green-400' : 
          'text-white'
        }`}>
          {status === 'processing' && 'Processing...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Error'}
        </h2>
        <p className="text-gray-400">{message}</p>

        {/* Retry button for errors */}
        {status === 'error' && (
          <button
            onClick={() => onComplete?.()}
            className="mt-6 px-6 py-2 rounded-xl font-medium text-white
                       bg-gradient-to-r from-accent-teal to-accent-blue
                       hover:shadow-glow-teal transition-all"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export default AuthCallback;
