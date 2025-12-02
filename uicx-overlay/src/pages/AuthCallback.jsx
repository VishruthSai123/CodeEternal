import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../stores/authStore';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';

function AuthCallback({ onComplete }) {
  const [status, setStatus] = useState('processing'); // 'processing' | 'success' | 'error'
  const [message, setMessage] = useState('Completing sign in...');
  const { initialize } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the URL hash/query parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const queryParams = new URLSearchParams(window.location.search);
        
        // Check for error in URL
        const error = hashParams.get('error') || queryParams.get('error');
        const errorDescription = hashParams.get('error_description') || queryParams.get('error_description');
        
        if (error) {
          throw new Error(errorDescription || error);
        }

        // Check if we have a code (PKCE flow) - need to exchange it
        const code = queryParams.get('code');
        
        if (code) {
          console.log('PKCE code detected, exchanging for session...');
          // Exchange the code for a session
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            throw exchangeError;
          }
          
          if (data.session) {
            console.log('Session obtained from code exchange');
            setStatus('success');
            setMessage('Sign in successful! Redirecting...');
            
            // Re-initialize auth store with the new session
            await initialize();
            
            // Clear URL and complete
            window.history.replaceState({}, document.title, window.location.pathname);
            
            setTimeout(() => {
              onComplete?.();
            }, 1500);
            return;
          }
        }

        // Fallback: Check if session already exists (token in hash)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          throw sessionError;
        }

        if (session) {
          setStatus('success');
          setMessage('Sign in successful! Redirecting...');
          
          // Re-initialize auth store with the new session
          await initialize();
          
          // Complete after a short delay
          setTimeout(() => {
            onComplete?.();
          }, 1500);
        } else {
          // No session yet, wait for it
          setMessage('Waiting for authentication...');
          
          // Listen for auth state change
          const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, newSession) => {
            if (event === 'SIGNED_IN' && newSession) {
              setStatus('success');
              setMessage('Sign in successful! Redirecting...');
              await initialize();
              subscription.unsubscribe();
              setTimeout(() => {
                onComplete?.();
              }, 1500);
            }
          });

          // Timeout after 30 seconds
          setTimeout(() => {
            subscription.unsubscribe();
            if (status === 'processing') {
              setStatus('error');
              setMessage('Authentication timed out. Please try again.');
            }
          }, 30000);
        }
      } catch (error) {
        console.error('Auth callback error:', error);
        setStatus('error');
        setMessage(error.message || 'Authentication failed. Please try again.');
        
        // Go back to auth page after showing error
        setTimeout(() => {
          onComplete?.();
        }, 3000);
      }
    };

    handleCallback();
  }, [initialize, status, onComplete]);

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
