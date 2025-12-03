import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TitleBar from './components/layout/TitleBar';
import TabBar from './components/layout/TabBar';
import PromptBuilder from './pages/PromptBuilder';
import SnippetLibrary from './pages/SnippetLibrary';
import HistorySummary from './pages/HistorySummary';
import Settings from './pages/Settings';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import BrowseSnippets from './pages/BrowseSnippets';
import BrowseTemplates from './pages/BrowseTemplates';
import SettingsPage from './pages/SettingsPage';
import AuthCallback from './pages/AuthCallback';
import CreateProjectModal from './components/CreateProjectModal';
import LoadingScreen from './components/LoadingScreen';
import SessionStatus from './components/SessionStatus';
import { useAppStore } from './stores/appStore';
import { useAuthStore } from './stores/authStore';
import { useProjectStore } from './stores/projectStore';
import { usePromptStore } from './stores/promptStore';
import { useSnippetStore } from './stores/snippetStore';
import { supabase } from './lib/supabase';
import useSessionMonitor from './hooks/useSessionMonitor';

// Check if current URL is an OAuth callback
const isOAuthCallback = () => {
  const hash = window.location.hash;
  const path = window.location.pathname;
  
  // Check for OAuth callback path or tokens in hash
  return path.includes('/auth/callback') || 
         hash.includes('access_token') || 
         hash.includes('error=');
};

function App() {
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [showBrowseSnippets, setShowBrowseSnippets] = useState(false);
  const [showBrowseTemplates, setShowBrowseTemplates] = useState(false);
  const [browseTemplateCategory, setBrowseTemplateCategory] = useState(null);
  const [showSettings, setShowSettings] = useState(false);
  const [isOAuthProcessing, setIsOAuthProcessing] = useState(isOAuthCallback());
  
  const { initializeApp, activeTab, setActiveTab } = useAppStore();
  const { 
    isAuthenticated, 
    isLoading: authLoading, 
    isOnline,
    sessionStatus,
    error: authError,
    initialize: initAuth,
    clearCacheAndLogout
  } = useAuthStore();
  const { currentProject, setCurrentProject, clearCurrentProject, loadProjectContext } = useProjectStore();
  const { setCurrentProjectId, loadFromProject, forceSave, clearContext } = usePromptStore();
  const { fetchSnippets } = useSnippetStore();

  // Monitor session health
  useSessionMonitor();

  // Handle OAuth callback completion
  const handleOAuthComplete = () => {
    // Clear URL hash/params and OAuth processing state
    window.history.replaceState({}, document.title, window.location.pathname);
    setIsOAuthProcessing(false);
  };

  useEffect(() => {
    initializeApp();
    initAuth();
    // Fetch public snippets for all users
    fetchSnippets();
  }, [initializeApp, initAuth, fetchSnippets]);

  // Restore project context on app load if there's a persisted currentProject
  useEffect(() => {
    const restoreProjectContext = async () => {
      if (currentProject?.id) {
        try {
          // ALWAYS fetch fresh project data from DB - never trust cache
          const { data, error } = await supabase
            .from('projects')
            .select('*')
            .eq('id', currentProject.id)
            .single();
          
          if (!error && data) {
            // Use fresh DB data
            setCurrentProject(data);
            setCurrentProjectId(data.id);
            const context = loadProjectContext(data);
            loadFromProject(context);
            console.log('Project context restored from database:', {
              userIntent: data.user_intent?.substring(0, 50),
              hasSessionSummary: !!data.session_summary,
              snippetsCount: data.selected_snippets?.length || 0,
            });
          } else {
            // Project was deleted or inaccessible - clear it
            console.warn('Project not found in DB, clearing local cache');
            clearCurrentProject();
            setCurrentProjectId(null);
          }
        } catch (e) {
          console.error('Failed to restore project context:', e);
          // Don't clear on network error - might be temporary
        }
      }
    };

    // Only run once on mount when authenticated
    if (isAuthenticated && !authLoading) {
      restoreProjectContext();
    }
  }, [isAuthenticated, authLoading]); // Run when auth state is ready

  const handleOpenProject = async (project) => {
    setCurrentProject(project);
    setCurrentProjectId(project.id);
    setActiveTab('prompt');
    
    // Fetch fresh project data to ensure we have all columns (including context)
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('id', project.id)
        .single();
      
      if (!error && data) {
        // Update with fresh data that includes context columns
        setCurrentProject(data);
        const context = loadProjectContext(data);
        loadFromProject(context);
      } else {
        // Fallback to cached project data
        const context = loadProjectContext(project);
        loadFromProject(context);
      }
    } catch (e) {
      // Fallback to cached project data
      const context = loadProjectContext(project);
      loadFromProject(context);
    }
  };

  const handleProjectCreated = (project) => {
    // Clear all previous context for fresh project
    clearContext();
    setCurrentProject(project);
    setCurrentProjectId(project.id);
    setActiveTab('prompt');
  };

  const handleBackToHome = async () => {
    // Save current project context before navigating away
    try {
      await forceSave();
    } catch (err) {
      console.warn('Save on exit failed:', err);
    }
    // Clear context so next project starts fresh
    clearContext();
    clearCurrentProject();
  };

  const handleRetry = () => {
    initAuth();
  };

  const handleClearCache = async () => {
    // Force save before logout to preserve data
    if (currentProject?.id) {
      try {
        await forceSave();
        console.log('Context saved before logout');
      } catch (e) {
        console.warn('Could not save before logout:', e);
      }
    }
    clearCacheAndLogout();
  };

  // OAuth callback processing
  if (isOAuthProcessing) {
    return <AuthCallback onComplete={handleOAuthComplete} />;
  }

  // Loading state
  if (authLoading) {
    return <LoadingScreen status="initializing" onClearCache={handleClearCache} />;
  }

  // Offline state
  if (!isOnline && !isAuthenticated) {
    return <LoadingScreen status="offline" onRetry={handleRetry} onClearCache={handleClearCache} />;
  }

  // Error state (including timeout)
  if (sessionStatus === 'error' && !isAuthenticated) {
    const status = authError?.includes('timeout') ? 'timeout' : 'error';
    return <LoadingScreen status={status} message={authError} onRetry={handleRetry} onClearCache={handleClearCache} />;
  }

  // Not authenticated - show auth page
  if (!isAuthenticated) {
    return <AuthPage />;
  }

  // Browse Snippets screen (standalone from home)
  if (showBrowseSnippets) {
    return (
      <>
        <SessionStatus />
        <BrowseSnippets onBack={() => setShowBrowseSnippets(false)} />
      </>
    );
  }

  // Browse Templates screen (standalone from home or prompt builder)
  if (showBrowseTemplates) {
    return (
      <>
        <SessionStatus />
        <BrowseTemplates 
          onBack={() => {
            setShowBrowseTemplates(false);
            setBrowseTemplateCategory(null);
          }}
          initialCategory={browseTemplateCategory}
        />
      </>
    );
  }

  // Settings screen (standalone from home)
  if (showSettings) {
    return (
      <>
        <SessionStatus />
        <SettingsPage onBack={() => setShowSettings(false)} />
      </>
    );
  }

  // Authenticated but no project selected - show home page
  if (!currentProject) {
    return (
      <>
        <SessionStatus />
        <HomePage 
          onOpenProject={handleOpenProject}
          onCreateProject={() => setShowCreateProject(true)}
          onBrowseSnippets={() => setShowBrowseSnippets(true)}
          onBrowseTemplates={(category) => {
            setBrowseTemplateCategory(category);
            setShowBrowseTemplates(true);
          }}
          onOpenSettings={() => setShowSettings(true)}
        />
        <AnimatePresence>
          {showCreateProject && (
            <CreateProjectModal
              isOpen={showCreateProject}
              onClose={() => setShowCreateProject(false)}
              onCreated={handleProjectCreated}
            />
          )}
        </AnimatePresence>
      </>
    );
  }

  // Project workspace view
  const handleBrowseTemplates = (category) => {
    setBrowseTemplateCategory(category);
    setShowBrowseTemplates(true);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'prompt':
        return <PromptBuilder onBrowseTemplates={handleBrowseTemplates} />;
      case 'snippets':
        return <SnippetLibrary />;
      case 'history':
        return <HistorySummary />;
      case 'settings':
        return <Settings />;
      default:
        return <PromptBuilder onBrowseTemplates={handleBrowseTemplates} />;
    }
  };

  return (
    <div className="w-full h-screen flex flex-col bg-surface-dark overflow-hidden rounded-2xl border border-glass-border">
      {/* Session Status Indicator */}
      <SessionStatus />
      
      {/* Title Bar with Back Button */}
      <TitleBar 
        projectName={currentProject?.name}
        onBackToHome={handleBackToHome}
      />

      {/* Tab Navigation */}
      <TabBar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <main className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="h-full"
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

export default App;
