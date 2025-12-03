import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase, isSupabaseConfigured, clearAuthStorage } from '../lib/supabase';

// Session refresh interval - refresh every 15 minutes to keep session alive
const SESSION_REFRESH_INTERVAL = 15 * 60 * 1000; // 15 minutes in ms
let refreshTimer = null;
let keepAliveTimer = null;

// Helper function to fetch profile using direct REST API
// Uses session access token for proper authentication
const fetchProfileDirect = async (userId, accessToken = null) => {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    // Use access token if provided, otherwise fall back to anon key
    const authToken = accessToken || supabaseKey;
    
    const response = await fetch(
      `${supabaseUrl}/rest/v1/profiles?id=eq.${userId}&select=*`,
      {
        method: 'GET',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) return null;
    
    const profiles = await response.json();
    return profiles[0] || null;
  } catch (error) {
    console.error('Direct profile fetch failed:', error);
    return null;
  }
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      // State
      user: null,
      profile: null,
      session: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,
      
      // Track intentional logout within the store
      isIntentionalLogout: false,

      // Permissions (from profile)
      canAddSnippets: false,
      isAdmin: false,

      // Session status
      sessionStatus: 'initializing', // 'initializing' | 'active' | 'expired' | 'refreshing' | 'error'
      lastActivity: null,
      isOnline: navigator.onLine,
      sessionExpiresAt: null,

      // Set online status
      setOnlineStatus: (isOnline) => set({ isOnline }),

      // Update last activity
      updateLastActivity: () => set({ lastActivity: Date.now() }),

      // Start keep-alive timer - refreshes session periodically to prevent expiry
      startKeepAlive: () => {
        // Clear any existing timer
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }

        // Refresh session every 30 minutes to keep it alive indefinitely
        keepAliveTimer = setInterval(async () => {
          const { isAuthenticated, isOnline } = get();
          if (isAuthenticated && isOnline) {
            console.log('Keep-alive: refreshing session...');
            await get().refreshSession();
          }
        }, SESSION_REFRESH_INTERVAL);

        console.log('Session keep-alive started (refresh every 30 minutes)');
      },

      // Stop keep-alive timer
      stopKeepAlive: () => {
        if (keepAliveTimer) {
          clearInterval(keepAliveTimer);
          keepAliveTimer = null;
        }
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
      },

      // Schedule automatic session refresh before expiry
      scheduleSessionRefresh: (session) => {
        // Clear any existing timer
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }

        if (!session?.expires_at) return;

        const expiresAt = session.expires_at * 1000; // Convert to ms
        // Refresh 10 minutes before expiry
        const refreshAt = expiresAt - (10 * 60 * 1000);
        const timeUntilRefresh = refreshAt - Date.now();

        if (timeUntilRefresh > 0) {
          console.log(`Session refresh scheduled in ${Math.round(timeUntilRefresh / 1000 / 60)} minutes`);
          refreshTimer = setTimeout(async () => {
            console.log('Auto-refreshing session before expiry...');
            await get().refreshSession();
          }, timeUntilRefresh);
        } else if (Date.now() < expiresAt) {
          // Session is about to expire, refresh now
          console.log('Session expiring soon, refreshing immediately...');
          get().refreshSession();
        }

        // Also start keep-alive for extra protection
        get().startKeepAlive();
      },

      // Refresh profile data (to get updated admin status, etc.)
      refreshProfile: async () => {
        const { user, session } = get();
        if (!user) return { success: false, error: 'Not authenticated' };

        console.log('Refreshing profile for user:', user.id);

        try {
          // Use session access token for proper authentication
          const accessToken = session?.access_token;
          const profile = await fetchProfileDirect(user.id, accessToken);
          
          console.log('Profile fetched:', profile);

          if (profile) {
            set({
              profile,
              canAddSnippets: profile.can_add_snippets || false,
              isAdmin: profile.is_admin || false,
            });
            return { success: true, profile };
          } else {
            return { success: false, error: 'Profile not found' };
          }
        } catch (error) {
          console.error('Failed to refresh profile:', error);
          return { success: false, error: error.message };
        }
      },

      // Check if session is valid - be more lenient
      isSessionValid: () => {
        const { session, isAuthenticated } = get();
        // If we have authentication state, consider it valid
        // Supabase will handle the actual token refresh
        if (isAuthenticated && session) return true;
        if (!session?.expires_at) return false;
        const expiresAt = session.expires_at * 1000;
        return Date.now() < expiresAt;
      },

      // Refresh session manually
      refreshSession: async () => {
        const { session: currentSession, isAuthenticated } = get();
        
        // If not authenticated, nothing to refresh
        if (!isAuthenticated) {
          return { success: false, error: 'Not authenticated' };
        }

        try {
          set({ sessionStatus: 'refreshing' });
          
          const { data, error } = await supabase.auth.refreshSession();
          
          if (error) {
            console.error('Session refresh error:', error);
            // Don't mark as expired - try to recover silently
            // The session might still work for API calls
            set({ sessionStatus: 'active' });
            return { success: false, error: error.message };
          }

          if (data.session) {
            const newSession = data.session;
            set({ 
              session: newSession,
              user: data.user || get().user,
              sessionStatus: 'active',
              lastActivity: Date.now(),
              sessionExpiresAt: newSession.expires_at * 1000,
              error: null,
            });
            
            // Schedule next refresh
            get().scheduleSessionRefresh(newSession);
            
            console.log('Session refreshed successfully, expires:', new Date(newSession.expires_at * 1000));
            return { success: true };
          }
          
          // No session returned but no error - keep current state
          set({ sessionStatus: 'active' });
          return { success: true };
        } catch (error) {
          console.error('Session refresh failed:', error);
          // Don't expire the session - just log the error
          // User can continue working, we'll try again later
          set({ sessionStatus: 'active' });
          return { success: false, error: error.message };
        }
      },

      // Restore session from storage on startup
      restoreSession: async () => {
        try {
          // First check if we have a persisted session in Supabase storage
          const { data: { session }, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session:', error);
            // Don't return null - check persisted state
          }

          if (session) {
            // Verify the session is still valid
            const expiresAt = session.expires_at * 1000;
            if (Date.now() < expiresAt) {
              console.log('Valid session restored from storage');
              return session;
            } else {
              // Try to refresh the expired session
              console.log('Session expired, attempting refresh...');
              try {
                const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
                if (refreshData?.session) {
                  console.log('Expired session refreshed successfully');
                  return refreshData.session;
                }
                if (refreshError) {
                  console.warn('Refresh failed:', refreshError);
                }
              } catch (refreshErr) {
                console.warn('Refresh attempt failed:', refreshErr);
              }
            }
          }

          // No valid session from Supabase
          // Clear any stale persisted state to prevent confusion
          const persistedState = get();
          if (persistedState.isAuthenticated && persistedState.user) {
            console.log('No Supabase session, but have stale persisted auth state - attempting one more recovery...');
            
            // Try one more time to get/refresh session
            try {
              // First try refresh
              const { data: refreshData } = await supabase.auth.refreshSession();
              if (refreshData?.session) {
                console.log('Session recovered via refresh');
                return refreshData.session;
              }
              
              // Then try getSession
              const { data: retryData } = await supabase.auth.getSession();
              if (retryData?.session) {
                console.log('Session recovered on retry');
                return retryData.session;
              }
            } catch (e) {
              console.warn('Session recovery failed:', e);
            }
            
            // No valid session - user needs to re-login
            // Don't return fake session, return null so initialize() handles it properly
            console.log('Could not recover session - user needs to re-authenticate');
          }

          return null;
        } catch (error) {
          console.error('Error restoring session:', error);
          // On error, try one more refresh attempt
          try {
            const { data: refreshData } = await supabase.auth.refreshSession();
            if (refreshData?.session) {
              return refreshData.session;
            }
          } catch (e) {
            console.warn('Final refresh attempt failed:', e);
          }
          return null;
        }
      },

      // Initialize auth state
      initialize: async () => {
        // Check if we already have persisted auth state FIRST
        const persistedState = get();
        if (persistedState.isAuthenticated && persistedState.user) {
          console.log('Found persisted auth state - validating session...');
          
          // Show UI immediately while we validate
          set({ 
            isLoading: false, 
            sessionStatus: 'active',
            error: null,
          });
          
          // Validate the session is actually working
          try {
            const { data, error } = await supabase.auth.getSession();
            
            if (error || !data?.session) {
              console.warn('Persisted session is invalid - clearing and re-authenticating');
              // Clear corrupted session data
              clearAuthStorage();
              localStorage.removeItem('code-eternal-auth');
              localStorage.removeItem('code-eternal-projects');
              
              set({
                user: null,
                profile: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
                sessionStatus: 'expired',
                error: 'Session expired. Please login again.',
              });
              return;
            }
            
            // Session is valid - update with fresh data
            set({
              session: data.session,
              user: data.session.user,
              sessionExpiresAt: data.session.expires_at * 1000,
            });
            
            // Start keep-alive timer
            get().startKeepAlive();
            get().scheduleSessionRefresh(data.session);
            console.log('Session validated successfully');
            
          } catch (e) {
            console.error('Session validation failed:', e);
            // On error, clear and force re-login
            clearAuthStorage();
            set({
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              isLoading: false,
              sessionStatus: 'error',
            });
          }
          
          return;
        }

        // No persisted state - do full initialization
        set({ isLoading: true, error: null, sessionStatus: 'initializing' });

        // If Supabase is not configured, skip auth
        if (!isSupabaseConfigured) {
          console.warn('Supabase not configured, skipping auth initialization');
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            sessionStatus: 'error',
          });
          return;
        }

        // Set a timeout for initialization
        const timeoutId = setTimeout(() => {
          const currentState = get();
          if (currentState.isLoading && currentState.sessionStatus === 'initializing') {
            console.error('Auth initialization timed out');
            // Don't clear session on timeout - it might still be valid
            // Just mark as error and let user retry
            set({
              isLoading: false,
              error: 'Connection timeout - tap to retry',
              sessionStatus: 'error',
            });
          }
        }, 10000); // 10 second timeout

        try {
          // Try to restore session
          const session = await get().restoreSession();
          
          clearTimeout(timeoutId);

          if (session?.user) {
            // Fetch profile (non-blocking)
            let profile = null;
            try {
              const { data, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', session.user.id)
                .single();
              
              if (!profileError) {
                profile = data;
              }
            } catch (profileErr) {
              console.warn('Profile fetch error:', profileErr);
            }

            set({
              user: session.user,
              profile,
              session,
              isAuthenticated: true,
              isLoading: false,
              canAddSnippets: profile?.can_add_snippets || false,
              isAdmin: profile?.is_admin || false,
              sessionStatus: 'active',
              lastActivity: Date.now(),
              sessionExpiresAt: session.expires_at * 1000,
              error: null,
            });

            // Schedule automatic session refresh
            get().scheduleSessionRefresh(session);
            
            console.log('Auth initialized with active session');
          } else {
            // No session found - check if we have persisted auth state
            // For a productivity app, we maintain the illusion of being logged in
            const currentState = get();
            if (currentState.isAuthenticated && currentState.user) {
              console.log('No session but have persisted auth state - keeping user logged in');
              set({
                isLoading: false,
                sessionStatus: 'refreshing', // Will try to refresh later
                error: null,
              });
              // Try to get a new session in the background
              supabase.auth.getSession().then(({ data }) => {
                if (data?.session) {
                  set({
                    session: data.session,
                    sessionStatus: 'active',
                    sessionExpiresAt: data.session.expires_at * 1000,
                  });
                  get().scheduleSessionRefresh(data.session);
                }
              });
            } else {
              set({
                user: null,
                profile: null,
                session: null,
                isAuthenticated: false,
                isLoading: false,
                canAddSnippets: false,
                isAdmin: false,
                sessionStatus: 'expired',
                error: null,
              });
              console.log('Auth initialized - no session');
            }
          }
        } catch (error) {
          clearTimeout(timeoutId);
          console.error('Auth initialization error:', error);
          // On error, check if we have persisted state to fall back to
          const currentState = get();
          if (currentState.isAuthenticated && currentState.user) {
            console.log('Init error but have persisted state - keeping user logged in');
            set({ 
              isLoading: false,
              sessionStatus: 'refreshing',
              error: null,
            });
          } else {
            set({ 
              user: null,
              profile: null,
              session: null,
              isAuthenticated: false,
              error: error.message, 
              isLoading: false, 
              sessionStatus: 'error' 
            });
          }
        }
      },

      // Sign up with email/password
      signUp: async (email, password, displayName) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                display_name: displayName,
                full_name: displayName,
              },
            },
          });

          if (error) throw error;

          // If email confirmation is disabled, user is logged in immediately
          if (data.user && data.session) {
            // Fetch profile using session access token
            const profile = await fetchProfileDirect(data.user.id, data.session.access_token);

            set({
              user: data.user,
              profile,
              session: data.session,
              isAuthenticated: true,
              isLoading: false,
              canAddSnippets: profile?.can_add_snippets || false,
              isAdmin: profile?.is_admin || false,
              sessionStatus: 'active',
              sessionExpiresAt: data.session.expires_at * 1000,
              lastActivity: Date.now(),
            });

            // Schedule session refresh
            get().scheduleSessionRefresh(data.session);

            return { success: true, needsConfirmation: false };
          }

          set({ isLoading: false });
          return { success: true, needsConfirmation: true };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Sign in with email/password
      signIn: async (email, password) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (error) throw error;

          // Fetch profile using session access token
          const profile = await fetchProfileDirect(data.user.id, data.session.access_token);

          set({
            user: data.user,
            profile,
            session: data.session,
            isAuthenticated: true,
            isLoading: false,
            canAddSnippets: profile?.can_add_snippets || false,
            isAdmin: profile?.is_admin || false,
            sessionStatus: 'active',
            sessionExpiresAt: data.session.expires_at * 1000,
            lastActivity: Date.now(),
            error: null,
          });

          // Schedule session refresh
          get().scheduleSessionRefresh(data.session);

          console.log('Sign in successful, session expires at:', new Date(data.session.expires_at * 1000));
          return { success: true };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Sign in with OAuth (Google, GitHub)
      signInWithOAuth: async (provider) => {
        try {
          set({ isLoading: true, error: null });

          // For OAuth, always use the current origin as redirect
          // This works for both web and Electron (which loads from Vercel)
          const redirectUrl = window.location.origin;

          console.log(`OAuth ${provider} login, redirect to: ${redirectUrl}`);

          // Build query params based on provider
          // Google: Force account selection screen every time
          // GitHub: Allow re-authentication
          const queryParams = {};
          
          if (provider === 'google') {
            // prompt=select_account: Always show Google account picker
            // access_type=offline: Get refresh token for long-lived sessions
            queryParams.prompt = 'select_account';
            queryParams.access_type = 'offline';
          } else if (provider === 'github') {
            // Force GitHub to show the authorization screen
            queryParams.allow_signup = 'true';
          }

          // Let Supabase handle the OAuth flow normally
          // It will redirect the current page to the OAuth provider
          // and then back to our app with tokens in the URL hash
          const { error } = await supabase.auth.signInWithOAuth({
            provider,
            options: {
              redirectTo: redirectUrl,
              queryParams,
            },
          });

          if (error) throw error;

          // OAuth will redirect the page, no further action needed
          return { success: true };
        } catch (error) {
          console.error('OAuth error:', error);
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Sign out - THIS IS THE ONLY WAY SESSION SHOULD END
      signOut: async () => {
        try {
          // Mark as intentional logout FIRST - this is the ONLY way to truly end session
          set({ isIntentionalLogout: true });

          // Stop all timers immediately
          get().stopKeepAlive();

          // Clear all auth state FIRST (before async operations)
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            canAddSnippets: false,
            isAdmin: false,
            sessionStatus: 'expired',
            sessionExpiresAt: null,
            lastActivity: null,
            error: null,
          });

          // Clear all storage
          clearAuthStorage();
          localStorage.removeItem('code-eternal-auth-state');
          localStorage.removeItem('code-eternal-auth');
          localStorage.removeItem('code-eternal-projects');
          localStorage.removeItem('code-eternal-prompts');

          // Sign out from Supabase (non-blocking)
          supabase.auth.signOut().catch(err => {
            console.warn('Supabase signOut error (non-blocking):', err);
          });

          console.log('Logged out successfully');
          return { success: true };
        } catch (error) {
          console.error('Sign out error:', error);
          // Even on error, make sure state is cleared
          set({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            sessionStatus: 'expired',
          });
          return { success: false, error: error.message };
        }
      },

      // Update profile
      updateProfile: async (updates) => {
        try {
          const { user } = get();
          if (!user) throw new Error('Not authenticated');

          const { data, error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();

          if (error) throw error;

          set({ profile: data });
          return { success: true };
        } catch (error) {
          set({ error: error.message });
          return { success: false, error: error.message };
        }
      },

      // Reset password (send email)
      resetPassword: async (email) => {
        try {
          set({ isLoading: true, error: null });

          // For Electron app, we use the production URL as the redirect
          // The app will detect this on load and show the password reset form
          const redirectUrl = 'https://codeeternal.vercel.app/reset-password';
          
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: redirectUrl,
          });

          if (error) throw error;

          set({ isLoading: false });
          return { success: true };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Update password (after reset link clicked)
      updatePassword: async (newPassword) => {
        try {
          set({ isLoading: true, error: null });

          const { data, error } = await supabase.auth.updateUser({
            password: newPassword,
          });

          if (error) throw error;

          set({ isLoading: false });
          return { success: true, data };
        } catch (error) {
          set({ error: error.message, isLoading: false });
          return { success: false, error: error.message };
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Retry initialization
      retryInitialize: async () => {
        set({ error: null, sessionStatus: 'initializing' });
        await get().initialize();
      },

      // Clear all cache and logout (nuclear option)
      clearCacheAndLogout: () => {
        // Mark as intentional logout in store
        useAuthStore.setState({ isIntentionalLogout: true });
        
        // Stop all timers
        get().stopKeepAlive();

        // Immediately clear all localStorage items
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            keysToRemove.push(key);
          }
        }
        keysToRemove.forEach(key => localStorage.removeItem(key));

        // Clear sessionStorage too
        sessionStorage.clear();

        // Force page reload immediately
        window.location.reload();
      },
    }),
    {
      name: 'code-eternal-auth-state',
      partialize: (state) => ({
        // Only persist non-sensitive data for session restoration
        // Permissions (isAdmin, canAddSnippets) are always fetched fresh from server
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
        // Only persist minimal user info for display during loading
        user: state.user ? { 
          id: state.user.id, 
          email: state.user.email,
          // Don't persist full user metadata
        } : null,
        sessionExpiresAt: state.sessionExpiresAt,
        // Don't persist isIntentionalLogout - it's runtime only
        // Don't persist isAdmin or canAddSnippets - always fetch from server
      }),
    }
  )
);

// Listen for auth state changes from Supabase
supabase.auth.onAuthStateChange(async (event, session) => {
  console.log('Auth state change:', event);
  const store = useAuthStore.getState();

  switch (event) {
    case 'SIGNED_IN':
      if (session?.user) {
        // Fetch profile using session access token
        const profile = await fetchProfileDirect(session.user.id, session.access_token);

        useAuthStore.setState({
          user: session.user,
          profile,
          session,
          isAuthenticated: true,
          isLoading: false,
          canAddSnippets: profile?.can_add_snippets || false,
          isAdmin: profile?.is_admin || false,
          sessionStatus: 'active',
          sessionExpiresAt: session.expires_at * 1000,
          lastActivity: Date.now(),
          error: null,
        });

        // Schedule session refresh
        store.scheduleSessionRefresh(session);
      }
      break;

    case 'SIGNED_OUT':
      // ONLY clear state if user intentionally logged out
      // For a productivity app, we NEVER want the session to expire automatically
      const storeState = useAuthStore.getState();
      if (storeState.isIntentionalLogout) {
        console.log('Intentional logout detected, clearing auth state');
        
        // Reset the flag
        useAuthStore.setState({ isIntentionalLogout: false });
        
        // Clear refresh timer
        if (refreshTimer) {
          clearTimeout(refreshTimer);
          refreshTimer = null;
        }
        
        useAuthStore.setState({
          user: null,
          profile: null,
          session: null,
          isAuthenticated: false,
          isLoading: false,
          canAddSnippets: false,
          isAdmin: false,
          sessionStatus: 'expired',
          sessionExpiresAt: null,
        });
      } else {
        // Session expired or was invalidated externally - try to recover
        console.log('Session ended unexpectedly (not intentional logout), attempting to restore...');
        
        // Check if we have persisted auth state
        const currentState = useAuthStore.getState();
        if (currentState.isAuthenticated && currentState.user) {
          console.log('Have persisted auth state, will keep user logged in');
          
          // Keep the user logged in - don't clear state
          useAuthStore.setState({ 
            isLoading: false,
            sessionStatus: 'active', // Keep as active so app works normally
          });
          
          // Try to get a new session in background - Supabase might restore from refresh token
          setTimeout(async () => {
            try {
              // Try refresh first
              const { data: refreshData } = await supabase.auth.refreshSession();
              if (refreshData?.session) {
                console.log('Session refreshed successfully in background!');
                useAuthStore.setState({
                  session: refreshData.session,
                  sessionStatus: 'active',
                  sessionExpiresAt: refreshData.session.expires_at * 1000,
                });
                store.scheduleSessionRefresh(refreshData.session);
                return;
              }
              
              // If refresh fails, try getSession
              const { data } = await supabase.auth.getSession();
              if (data?.session) {
                console.log('Session restored from storage in background!');
                useAuthStore.setState({
                  session: data.session,
                  sessionStatus: 'active',
                  sessionExpiresAt: data.session.expires_at * 1000,
                });
                store.scheduleSessionRefresh(data.session);
              }
            } catch (err) {
              console.warn('Background session recovery failed:', err);
              // Keep user logged in anyway - they can continue working
            }
          }, 1000);
        } else {
          // No persisted state, this is a real logout
          console.log('No persisted state, clearing auth');
          useAuthStore.setState({
            user: null,
            profile: null,
            session: null,
            isAuthenticated: false,
            isLoading: false,
            sessionStatus: 'expired',
          });
        }
      }
      break;

    case 'TOKEN_REFRESHED':
      if (session) {
        console.log('Token refreshed, new expiry:', new Date(session.expires_at * 1000));
        useAuthStore.setState({ 
          session,
          sessionStatus: 'active',
          sessionExpiresAt: session.expires_at * 1000,
          lastActivity: Date.now(),
        });
        // Reschedule next refresh
        store.scheduleSessionRefresh(session);
      }
      break;

    case 'USER_UPDATED':
      if (session?.user) {
        useAuthStore.setState({ user: session.user });
      }
      break;

    case 'PASSWORD_RECOVERY':
      // Handle password recovery if needed
      break;

    default:
      console.log('Unhandled auth event:', event);
  }
});

// Handle online/offline status
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    useAuthStore.setState({ isOnline: true });
    // Try to refresh session when coming back online
    const store = useAuthStore.getState();
    if (store.isAuthenticated && !store.isSessionValid()) {
      store.refreshSession();
    }
  });

  window.addEventListener('offline', () => {
    useAuthStore.setState({ isOnline: false });
  });

  // Handle visibility change - refresh session when tab becomes visible
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      const store = useAuthStore.getState();
      if (store.isAuthenticated) {
        // Always try to refresh session when tab becomes visible for productivity app
        // This ensures session stays fresh
        console.log('Tab visible, proactively refreshing session...');
        store.refreshSession();
      }
    }
  });
}

export default useAuthStore;
