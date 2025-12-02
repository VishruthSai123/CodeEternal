import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, Plus, FolderOpen, Search, Grid, List,
  ArrowRight, Clock, Star, Code, Layers, Settings,
  LogOut, User, ChevronRight, Zap, Minus, X, Pin, PinOff, RefreshCw,
  Heart, Eye, Bookmark
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import { useSnippetStore } from '../stores/snippetStore';
import { useAppStore } from '../stores/appStore';
import { useTemplateStore } from '../stores/templateStore';
import { usePromptStore } from '../stores/promptStore';

function HomePage({ onOpenProject, onCreateProject, onBrowseSnippets, onBrowseTemplates, onOpenSettings }) {
  const { profile, signOut } = useAuthStore();
  const { projects, isLoading: projectsLoading, fetchProjects, currentProject } = useProjectStore();
  const { snippets } = useSnippetStore();
  const { isPinned, setIsPinned } = useAppStore();
  const { templates, fetchTemplates, isLoading: templatesLoading } = useTemplateStore();
  const { forceSave, currentProjectId } = usePromptStore();
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [headerVisible, setHeaderVisible] = useState(true);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef(null);

  // Featured templates - top 10 sorted by likes (admin curated public templates)
  const featuredTemplates = [...templates]
    .filter(t => t.is_public) // Only public templates
    .sort((a, b) => (b.likes_count || 0) - (a.likes_count || 0))
    .slice(0, 10);

  // Handle scroll to show/hide header
  const handleScroll = (e) => {
    const currentScrollY = e.target.scrollTop;
    const scrollDelta = currentScrollY - lastScrollY.current;
    
    // Show header when scrolling down (negative delta) or at top
    // Hide header when scrolling up (positive delta) and not at top
    if (currentScrollY < 10) {
      setHeaderVisible(true);
    } else if (scrollDelta > 5) {
      setHeaderVisible(false);
    } else if (scrollDelta < -5) {
      setHeaderVisible(true);
    }
    
    lastScrollY.current = currentScrollY;
  };

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

  // Fetch projects immediately on mount
  useEffect(() => {
    fetchProjects();
    fetchTemplates(); // Fetch templates for featured section
  }, [fetchProjects, fetchTemplates]);

  // Filter projects by search
  const filteredProjects = projects.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Recent projects (last 3)
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 3);

  const handleSignOut = async () => {
    // Save current project context before signing out
    if (currentProjectId) {
      try {
        await forceSave();
        console.log('Context saved before sign out');
      } catch (e) {
        console.warn('Could not save before sign out:', e);
      }
    }
    await signOut();
  };

  return (
    <div className="h-screen flex flex-col bg-surface-dark rounded-2xl overflow-hidden border border-glass-border">
      {/* Title Bar with Window Controls */}
      <div className="drag-region flex items-center justify-between h-10 px-3 border-b border-glass-border bg-surface-dark flex-shrink-0 rounded-t-2xl">
        <div className="flex items-center gap-2">
          <img src="./icon-rounded.png" alt="Build Eternal" className="w-5 h-5 object-cover" />
          <h1 className="text-sm font-semibold text-gradient">Build Eternal</h1>
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

      {/* Scrollable Content */}
      <div 
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
      >
      {/* Header - Animated hide/show on scroll */}
      <motion.header 
        initial={{ y: 0 }}
        animate={{ y: headerVisible ? 0 : -80 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="sticky top-0 z-50 glass-panel border-b border-glass-border"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src="./icon-rounded.png" 
              alt="Build Eternal" 
              className="w-10 h-10 object-cover"
            />
            <div>
              <h1 className="text-lg font-bold text-white">Build Eternal</h1>
              <p className="text-xs text-gray-500">Context-Aware Prompt Builder</p>
            </div>
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-3 px-3 py-2 rounded-xl
                         bg-glass-hover border border-glass-border
                         hover:border-accent-teal/30 transition-all"
            >
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-teal to-accent-purple
                              flex items-center justify-center text-white font-medium">
                {profile?.display_name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-sm text-gray-300 hidden sm:block">
                {profile?.display_name || 'User'}
              </span>
            </button>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {showUserMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 mt-2 w-48 py-2 rounded-xl
                             bg-surface-dark border border-glass-border shadow-glass-lg"
                >
                  <div className="px-4 py-2 border-b border-glass-border">
                    <p className="text-sm font-medium text-white truncate">
                      {profile?.display_name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {profile?.email}
                    </p>
                  </div>
                  <button
                    onClick={() => { setShowUserMenu(false); onOpenSettings?.(); }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-300
                               hover:bg-glass-hover transition-colors"
                  >
                    <Settings size={16} />
                    Settings
                  </button>
                  <hr className="my-2 border-glass-border" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400
                               hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Sign Out
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome Section */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h2 className="text-3xl font-bold text-white mb-2">
            Welcome back, {profile?.display_name?.split(' ')[0] || 'there'}! 👋
          </h2>
          <p className="text-gray-400">
            Build powerful prompts with your curated snippet & template library.
          </p>
        </motion.section>

        {/* Quick Actions */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12"
        >
          {/* Create New Project */}
          <button
            onClick={onCreateProject}
            className="group p-6 rounded-2xl border-2 border-dashed border-accent-teal/30
                       hover:border-accent-teal hover:bg-accent-teal/5 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-teal/10 flex items-center justify-center
                              group-hover:bg-accent-teal/20 transition-colors">
                <Plus size={24} className="text-accent-teal" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Create New Project
                </h3>
                <p className="text-sm text-gray-400">
                  Start a new UI project workspace
                </p>
              </div>
              <ArrowRight size={20} className="ml-auto text-accent-teal opacity-0 
                                               group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Browse Snippets */}
          <button
            onClick={onBrowseSnippets}
            className="group p-6 rounded-2xl border border-glass-border
                       hover:border-accent-purple/50 hover:bg-accent-purple/5 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-purple/10 flex items-center justify-center
                              group-hover:bg-accent-purple/20 transition-colors">
                <Layers size={24} className="text-accent-purple" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Browse Snippets
                </h3>
                <p className="text-sm text-gray-400">
                  Explore {snippets.length}+ code snippets & templates
                </p>
              </div>
              <ArrowRight size={20} className="ml-auto text-accent-purple opacity-0 
                                               group-hover:opacity-100 transition-opacity" />
            </div>
          </button>

          {/* Browse Templates */}
          <button
            onClick={() => onBrowseTemplates && onBrowseTemplates(null)}
            className="group p-6 rounded-2xl border border-glass-border
                       hover:border-accent-blue/50 hover:bg-accent-blue/5 transition-all text-left"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-accent-blue/10 flex items-center justify-center
                              group-hover:bg-accent-blue/20 transition-colors">
                <Grid size={24} className="text-accent-blue" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">
                  Browse Templates
                </h3>
                <p className="text-sm text-gray-400">
                  Full page layouts, buttons, headers & more
                </p>
              </div>
              <ArrowRight size={20} className="ml-auto text-accent-blue opacity-0 
                                               group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        </motion.section>

        {/* Recent Projects */}
        {recentProjects.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-12"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Clock size={18} className="text-gray-500" />
                Recent Projects
              </h3>
              <button className="text-sm text-accent-teal hover:underline">
                View all
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentProjects.map((project) => (
                <motion.button
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  whileHover={{ scale: 1.02 }}
                  className="p-4 rounded-xl bg-surface-light/50 border border-glass-border
                             hover:border-accent-teal/30 transition-all text-left group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-teal/20 to-accent-purple/20
                                    flex items-center justify-center">
                      <FolderOpen size={20} className="text-accent-teal" />
                    </div>
                    <ChevronRight size={16} className="text-gray-500 opacity-0 
                                                       group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h4 className="font-medium text-white mb-1 truncate">
                    {project.name}
                  </h4>
                  <p className="text-xs text-gray-500">
                    {project.framework} • Updated {new Date(project.updated_at).toLocaleDateString()}
                  </p>
                </motion.button>
              ))}
            </div>
          </motion.section>
        )}

        {/* All Projects */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <FolderOpen size={18} className="text-gray-500" />
              Your Projects
            </h3>
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search projects..."
                  className="glass-input pl-9 pr-4 py-1.5 text-sm w-48"
                />
              </div>
              {/* View Toggle */}
              <div className="flex items-center gap-1 bg-glass-hover rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid' ? 'bg-glass-active text-white' : 'text-gray-500'
                  }`}
                >
                  <Grid size={14} />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list' ? 'bg-glass-active text-white' : 'text-gray-500'
                  }`}
                >
                  <List size={14} />
                </button>
              </div>
            </div>
          </div>

          {projectsLoading && projects.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent-teal/30 border-t-accent-teal 
                              rounded-full animate-spin" />
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' 
              : 'space-y-2'
            }>
              {filteredProjects.map((project) => (
                <motion.button
                  key={project.id}
                  onClick={() => onOpenProject(project)}
                  whileHover={{ scale: viewMode === 'grid' ? 1.02 : 1 }}
                  className={`text-left group transition-all ${
                    viewMode === 'grid'
                      ? 'p-4 rounded-xl bg-surface-light/50 border border-glass-border hover:border-accent-teal/30'
                      : 'p-3 rounded-lg bg-surface-light/30 border border-glass-border hover:border-accent-teal/30 flex items-center gap-4'
                  }`}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="flex items-start justify-between mb-3">
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-teal/20 to-accent-purple/20
                                        flex items-center justify-center">
                          <FolderOpen size={20} className="text-accent-teal" />
                        </div>
                        <span className="badge badge-teal">{project.framework}</span>
                      </div>
                      <h4 className="font-medium text-white mb-1 truncate">
                        {project.name}
                      </h4>
                      <p className="text-sm text-gray-400 line-clamp-2 mb-3">
                        {project.description || 'No description'}
                      </p>
                      <p className="text-xs text-gray-500">
                        Updated {new Date(project.updated_at).toLocaleDateString()}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-teal/20 to-accent-purple/20
                                      flex items-center justify-center flex-shrink-0">
                        <FolderOpen size={20} className="text-accent-teal" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-white truncate">
                          {project.name}
                        </h4>
                        <p className="text-xs text-gray-500">
                          {project.framework} • Updated {new Date(project.updated_at).toLocaleDateString()}
                        </p>
                      </div>
                      <ChevronRight size={16} className="text-gray-500 flex-shrink-0" />
                    </>
                  )}
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-glass-hover 
                              flex items-center justify-center">
                <FolderOpen size={32} className="text-gray-500" />
              </div>
              <p className="text-gray-400 mb-2">
                {searchQuery ? 'No projects found' : 'No projects yet'}
              </p>
              <p className="text-sm text-gray-500 mb-4">
                {searchQuery 
                  ? 'Try a different search term' 
                  : 'Create your first project to get started'
                }
              </p>
              {!searchQuery && (
                <button
                  onClick={onCreateProject}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg
                             bg-accent-teal text-white hover:shadow-glow-teal transition-all"
                >
                  <Plus size={16} />
                  Create Project
                </button>
              )}
            </div>
          )}
        </motion.section>

        {/* Featured Templates - Admin Curated (by likes) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <Star size={18} className="text-yellow-500" />
              Featured Templates
            </h3>
            <button 
              onClick={() => onBrowseTemplates && onBrowseTemplates(null)}
              className="text-sm text-accent-teal hover:underline"
            >
              Browse all
            </button>
          </div>

          {templatesLoading && featuredTemplates.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-accent-teal/30 border-t-accent-teal 
                              rounded-full animate-spin" />
            </div>
          ) : featuredTemplates.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {featuredTemplates.map((template, index) => (
                <motion.div
                  key={template.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  whileHover={{ scale: 1.03, y: -2 }}
                  onClick={() => onBrowseTemplates && onBrowseTemplates(template)}
                  className="relative group cursor-pointer rounded-xl overflow-hidden
                             border border-glass-border hover:border-accent-teal/50
                             bg-surface-light/50 transition-all duration-300"
                >
                  {/* Preview Image or Gradient */}
                  <div className="w-full aspect-[4/3] bg-gradient-to-br from-accent-teal/10 via-accent-purple/10 to-accent-blue/10">
                    {template.preview_url ? (
                      <img 
                        src={template.preview_url} 
                        alt={template.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Code size={20} className="text-gray-500" />
                      </div>
                    )}
                  </div>

                  {/* Overlay gradient */}
                  <div className="absolute inset-0 bg-gradient-to-t from-surface-dark via-transparent to-transparent opacity-90" />

                  {/* Content */}
                  <div className="absolute bottom-0 left-0 right-0 p-2.5">
                    {/* Category Badge */}
                    {template.category && (
                      <span className="inline-block px-1.5 py-0.5 mb-1.5 text-[10px] font-medium rounded-full
                                       bg-accent-teal/20 text-accent-teal border border-accent-teal/30 truncate max-w-full">
                        {template.category.name}
                      </span>
                    )}
                    
                    <h4 className="text-xs font-semibold text-white mb-1 truncate">
                      {template.name}
                    </h4>

                    {/* Stats Row */}
                    <div className="flex items-center gap-2 text-[10px] text-gray-400">
                      <span className="flex items-center gap-0.5">
                        <Heart size={10} className={template.likes_count > 0 ? 'text-red-400 fill-red-400' : ''} />
                        {template.likes_count || 0}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Eye size={10} />
                        {template.views_count || 0}
                      </span>
                      {template.components?.length > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Layers size={10} />
                          {template.components.length}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Hover overlay */}
                  <div className="absolute inset-0 bg-accent-teal/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  {/* Rank Badge for top 3 */}
                  {index < 3 && (
                    <div className={`absolute top-2 left-2 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold
                                    ${index === 0 ? 'bg-yellow-500 text-black' : 
                                      index === 1 ? 'bg-gray-300 text-black' : 
                                      'bg-amber-600 text-white'}`}>
                      {index + 1}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 rounded-xl bg-surface-light/30 border border-glass-border">
              <Star size={32} className="mx-auto mb-3 text-gray-500" />
              <p className="text-gray-400 mb-1">No featured templates yet</p>
              <p className="text-xs text-gray-500">
                Templates with likes will appear here
              </p>
            </div>
          )}
        </motion.section>
      </main>
      </div>
    </div>
  );
}

export default HomePage;
