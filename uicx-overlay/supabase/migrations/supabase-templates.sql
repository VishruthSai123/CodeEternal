-- =============================================
-- UICX OVERLAY - TEMPLATES SYSTEM
-- =============================================
-- Run this in Supabase SQL Editor to create the full
-- template system with design style categories, full page
-- templates, and UI component variants
-- =============================================

-- Drop tables if they exist (for clean setup)
DROP TABLE IF EXISTS template_saves CASCADE;
DROP TABLE IF EXISTS template_likes CASCADE;
DROP TABLE IF EXISTS template_components CASCADE;
DROP TABLE IF EXISTS template_images CASCADE;
DROP TABLE IF EXISTS templates CASCADE;
DROP TABLE IF EXISTS template_categories CASCADE;

-- =============================================
-- 1. TEMPLATE CATEGORIES TABLE (Design Styles)
-- =============================================
-- Categories are DESIGN STYLES, not UI component types
CREATE TABLE template_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    icon TEXT DEFAULT 'palette', -- lucide icon name
    color TEXT DEFAULT 'teal', -- accent color: teal, purple, blue, yellow, red, green
    preview_image TEXT, -- Example image showing the style
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert DESIGN STYLE categories (not UI components!)
INSERT INTO template_categories (name, slug, description, icon, color, sort_order) VALUES
    ('Glassmorphism', 'glassmorphism', 'Frosted glass effect with blur, transparency, and subtle borders', 'glasses', 'teal', 1),
    ('Neumorphism', 'neumorphism', 'Soft UI with subtle shadows creating embossed/debossed effects', 'circle', 'purple', 2),
    ('Modern Minimal', 'modern-minimal', 'Clean lines, whitespace, and simple elegant design', 'minus', 'blue', 3),
    ('Dark Mode', 'dark-mode', 'Dark themes optimized for low-light with proper contrast', 'moon', 'gray', 4),
    ('Gradient', 'gradient', 'Rich color gradients with smooth transitions and vibrant palettes', 'palette', 'pink', 5),
    ('Brutalist', 'brutalist', 'Raw, bold aesthetic with strong typography and minimal decoration', 'square', 'yellow', 6),
    ('Neo-Brutalism', 'neo-brutalism', 'Playful brutalism with thick borders, bold colors, and shadows', 'zap', 'red', 7),
    ('Retro/Vintage', 'retro-vintage', 'Nostalgic designs with retro colors and vintage aesthetics', 'radio', 'orange', 8),
    ('Flat Design', 'flat-design', 'Simple 2D elements without shadows or depth effects', 'layers', 'green', 9),
    ('Material Design', 'material-design', 'Google Material with elevation, motion, and bold colors', 'box', 'blue', 10),
    ('Skeuomorphic', 'skeuomorphic', 'Realistic textures and 3D effects mimicking real objects', 'image', 'brown', 11),
    ('Cyberpunk', 'cyberpunk', 'Neon colors, dark backgrounds, futuristic tech aesthetic', 'cpu', 'cyan', 12),
    ('Pastel', 'pastel', 'Soft, muted colors with gentle gradients and rounded shapes', 'cloud', 'pink', 13),
    ('Corporate', 'corporate', 'Professional, trustworthy designs for business applications', 'briefcase', 'slate', 14),
    ('Playful', 'playful', 'Fun, colorful designs with animations and friendly feel', 'smile', 'yellow', 15);

-- =============================================
-- 2. TEMPLATES TABLE (Full Page Layouts)
-- =============================================
-- Each template is a FULL PAGE design in a specific style category
CREATE TABLE templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Basic info
    name TEXT NOT NULL, -- e.g., "Dashboard Layout", "Landing Page", "Auth Page"
    description TEXT,
    category_id UUID REFERENCES template_categories(id) ON DELETE SET NULL, -- Design style (Glassmorphism, etc.)
    
    -- Full page layout code
    code TEXT, -- Complete page layout code
    language TEXT DEFAULT 'jsx', -- jsx, tsx, html, vue, svelte
    
    -- Visual content
    preview_url TEXT, -- Full page screenshot
    thumbnail_url TEXT, -- Smaller thumbnail for grid view
    
    -- Metadata
    tags TEXT[] DEFAULT '{}', -- e.g., ['dashboard', 'admin', 'dark']
    framework TEXT DEFAULT 'react', -- react, vue, svelte, html
    style_library TEXT DEFAULT 'tailwind', -- tailwind, css, scss
    
    -- Color palette for this template
    color_palette JSONB DEFAULT 'null',
    
    -- Usage and configuration
    usage_notes TEXT,
    default_constraints JSONB DEFAULT '{}',
    
    -- User info
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Stats
    likes_count INTEGER DEFAULT 0,
    saves_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_templates_category ON templates(category_id);
CREATE INDEX idx_templates_user ON templates(user_id);
CREATE INDEX idx_templates_public ON templates(is_public);
CREATE INDEX idx_templates_likes ON templates(likes_count DESC);
CREATE INDEX idx_templates_created ON templates(created_at DESC);

-- =============================================
-- 3. TEMPLATE COMPONENTS TABLE (UI Component Variants)
-- =============================================
-- Each template contains multiple UI COMPONENTS (buttons, headers, cards, etc.)
-- These are the individual pieces that make up the full page
CREATE TABLE template_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    
    -- Component info
    name TEXT NOT NULL, -- e.g., "Primary Button", "Navigation Header", "Feature Card"
    description TEXT,
    
    -- Component type (UI element category)
    component_type TEXT NOT NULL DEFAULT 'other', 
    -- Types: button, header, navigation, sidebar, card, form, input, modal, 
    --        table, footer, hero, alert, badge, avatar, dropdown, tabs, accordion, other
    
    -- Visual reference
    image_url TEXT, -- Screenshot of this specific component
    
    -- Component code
    code TEXT NOT NULL, -- The component's code
    
    -- Ordering
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_template_components_template ON template_components(template_id);
CREATE INDEX idx_template_components_type ON template_components(component_type);

-- =============================================
-- 4. TEMPLATE LIKES TABLE
-- =============================================
CREATE TABLE template_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, user_id)
);

CREATE INDEX idx_template_likes_template ON template_likes(template_id);
CREATE INDEX idx_template_likes_user ON template_likes(user_id);

-- =============================================
-- 5. TEMPLATE SAVES TABLE
-- =============================================
CREATE TABLE template_saves (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID NOT NULL REFERENCES templates(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(template_id, user_id)
);

CREATE INDEX idx_template_saves_template ON template_saves(template_id);
CREATE INDEX idx_template_saves_user ON template_saves(user_id);

-- =============================================
-- 6. FUNCTIONS FOR LIKES/SAVES COUNT
-- =============================================

-- Function to update likes count
CREATE OR REPLACE FUNCTION update_template_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE templates SET likes_count = likes_count + 1 WHERE id = NEW.template_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE templates SET likes_count = GREATEST(0, likes_count - 1) WHERE id = OLD.template_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to update saves count
CREATE OR REPLACE FUNCTION update_template_saves_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE templates SET saves_count = saves_count + 1 WHERE id = NEW.template_id;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE templates SET saves_count = GREATEST(0, saves_count - 1) WHERE id = OLD.template_id;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_template_likes_count ON template_likes;
CREATE TRIGGER trigger_template_likes_count
    AFTER INSERT OR DELETE ON template_likes
    FOR EACH ROW EXECUTE FUNCTION update_template_likes_count();

DROP TRIGGER IF EXISTS trigger_template_saves_count ON template_saves;
CREATE TRIGGER trigger_template_saves_count
    AFTER INSERT OR DELETE ON template_saves
    FOR EACH ROW EXECUTE FUNCTION update_template_saves_count();

-- =============================================
-- 7. DISABLE RLS (Matching your existing setup)
-- =============================================
ALTER TABLE template_categories DISABLE ROW LEVEL SECURITY;
ALTER TABLE templates DISABLE ROW LEVEL SECURITY;
ALTER TABLE template_components DISABLE ROW LEVEL SECURITY;
ALTER TABLE template_likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE template_saves DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. INSERT SAMPLE TEMPLATES (Optional)
-- =============================================
-- Structure: Category (Design Style) -> Template (Full Page) -> Components (UI Elements)

DO $$
DECLARE
    glass_cat_id UUID;
    neu_cat_id UUID;
    dark_cat_id UUID;
    modern_cat_id UUID;
    template_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO glass_cat_id FROM template_categories WHERE slug = 'glassmorphism';
    SELECT id INTO neu_cat_id FROM template_categories WHERE slug = 'neumorphism';
    SELECT id INTO dark_cat_id FROM template_categories WHERE slug = 'dark-mode';
    SELECT id INTO modern_cat_id FROM template_categories WHERE slug = 'modern-minimal';

    -- ═══════════════════════════════════════════════════════════════
    -- GLASSMORPHISM - Dashboard Template
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO templates (name, description, category_id, code, language, tags, is_public, color_palette)
    VALUES (
        'Glass Dashboard',
        'Modern dashboard layout with frosted glass panels and blur effects',
        glass_cat_id,
        '<div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-teal-800 p-8">
  {/* Glass Sidebar */}
  <aside className="fixed left-0 top-0 h-full w-64 backdrop-blur-xl bg-white/10 border-r border-white/20 p-6">
    <div className="text-white font-bold text-xl mb-8">Dashboard</div>
    <nav className="space-y-2">
      <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white">Home</a>
      <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5">Analytics</a>
      <a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl text-white/70 hover:bg-white/5">Settings</a>
    </nav>
  </aside>
  
  {/* Main Content */}
  <main className="ml-64 space-y-6">
    {/* Header */}
    <header className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6">
      <h1 className="text-2xl font-bold text-white">Welcome back</h1>
      <p className="text-white/60">Here is your overview</p>
    </header>
    
    {/* Stats Cards */}
    <div className="grid grid-cols-3 gap-6">
      <div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6">
        <p className="text-white/60 text-sm">Total Users</p>
        <p className="text-3xl font-bold text-white mt-2">24,500</p>
      </div>
    </div>
  </main>
</div>',
        'jsx',
        ARRAY['dashboard', 'admin', 'glass', 'blur'],
        TRUE,
        '{"background": "linear-gradient(135deg, #581c87, #1e3a8a, #115e59)", "surface": "rgba(255,255,255,0.1)", "border": "rgba(255,255,255,0.2)", "text": "#ffffff", "textMuted": "rgba(255,255,255,0.6)", "primary": "#14b8a6", "blur": "24px"}'::jsonb
    ) RETURNING id INTO template_id;

    -- Glass Dashboard Components
    INSERT INTO template_components (template_id, name, description, component_type, code, sort_order) VALUES
        (template_id, 'Glass Card', 'Frosted glass card with blur effect', 'card',
         '<div className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6 hover:bg-white/15 transition-all">
  <h3 className="text-lg font-semibold text-white">Card Title</h3>
  <p className="text-white/60 mt-2">Card content goes here</p>
</div>', 0),
        (template_id, 'Glass Button', 'Transparent button with glass effect', 'button',
         '<button className="px-6 py-3 backdrop-blur-xl bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-white font-medium transition-all">
  Glass Button
</button>', 1),
        (template_id, 'Glass Nav Item', 'Sidebar navigation item', 'navigation',
         '<a href="#" className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/10 text-white hover:bg-white/15 transition-all">
  <span>Nav Item</span>
</a>', 2),
        (template_id, 'Glass Input', 'Form input with glass styling', 'input',
         '<input type="text" placeholder="Enter text..." className="w-full px-4 py-3 backdrop-blur-xl bg-white/5 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-white/40 focus:bg-white/10 transition-all" />', 3),
        (template_id, 'Glass Header', 'Page header with blur effect', 'header',
         '<header className="backdrop-blur-xl bg-white/10 rounded-2xl border border-white/20 p-6">
  <h1 className="text-2xl font-bold text-white">Page Title</h1>
  <p className="text-white/60">Page description</p>
</header>', 4);

    -- ═══════════════════════════════════════════════════════════════
    -- NEUMORPHISM - Settings Page Template
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO templates (name, description, category_id, code, language, tags, is_public, color_palette)
    VALUES (
        'Neu Settings Page',
        'Soft UI settings page with embossed and debossed elements',
        neu_cat_id,
        '<div className="min-h-screen bg-[#e0e5ec] p-8">
  <div className="max-w-2xl mx-auto space-y-6">
    {/* Header */}
    <div className="rounded-2xl bg-[#e0e5ec] shadow-[8px_8px_16px_#b8bcc2,-8px_-8px_16px_#ffffff] p-8">
      <h1 className="text-2xl font-bold text-gray-700">Settings</h1>
      <p className="text-gray-500">Manage your preferences</p>
    </div>
    
    {/* Settings Cards */}
    <div className="rounded-2xl bg-[#e0e5ec] shadow-[8px_8px_16px_#b8bcc2,-8px_-8px_16px_#ffffff] p-6">
      <div className="flex items-center justify-between">
        <span className="text-gray-700">Dark Mode</span>
        <button className="w-14 h-8 rounded-full bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#b8bcc2,inset_-4px_-4px_8px_#ffffff]">
          <div className="w-6 h-6 rounded-full bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bcc2,-4px_-4px_8px_#ffffff] ml-1"></div>
        </button>
      </div>
    </div>
  </div>
</div>',
        'jsx',
        ARRAY['settings', 'soft-ui', 'neumorphism'],
        TRUE,
        '{"background": "#e0e5ec", "shadowDark": "#b8bcc2", "shadowLight": "#ffffff", "text": "#374151", "textMuted": "#6b7280", "primary": "#6366f1"}'::jsonb
    ) RETURNING id INTO template_id;

    -- Neumorphism Components
    INSERT INTO template_components (template_id, name, description, component_type, code, sort_order) VALUES
        (template_id, 'Neu Card (Raised)', 'Raised card with soft shadow', 'card',
         '<div className="rounded-2xl bg-[#e0e5ec] shadow-[8px_8px_16px_#b8bcc2,-8px_-8px_16px_#ffffff] p-6">
  <h3 className="text-lg font-semibold text-gray-700">Card Title</h3>
  <p className="text-gray-500 mt-2">Card content</p>
</div>', 0),
        (template_id, 'Neu Card (Pressed)', 'Inset card with pressed effect', 'card',
         '<div className="rounded-2xl bg-[#e0e5ec] shadow-[inset_8px_8px_16px_#b8bcc2,inset_-8px_-8px_16px_#ffffff] p-6">
  <h3 className="text-lg font-semibold text-gray-700">Pressed Card</h3>
  <p className="text-gray-500 mt-2">Inset content area</p>
</div>', 1),
        (template_id, 'Neu Button', 'Soft raised button', 'button',
         '<button className="px-6 py-3 rounded-xl bg-[#e0e5ec] shadow-[6px_6px_12px_#b8bcc2,-6px_-6px_12px_#ffffff] text-gray-700 font-medium hover:shadow-[4px_4px_8px_#b8bcc2,-4px_-4px_8px_#ffffff] active:shadow-[inset_4px_4px_8px_#b8bcc2,inset_-4px_-4px_8px_#ffffff] transition-all">
  Neu Button
</button>', 2),
        (template_id, 'Neu Toggle', 'Soft toggle switch', 'input',
         '<button className="w-14 h-8 rounded-full bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#b8bcc2,inset_-4px_-4px_8px_#ffffff] relative">
  <div className="absolute left-1 top-1 w-6 h-6 rounded-full bg-[#e0e5ec] shadow-[4px_4px_8px_#b8bcc2,-4px_-4px_8px_#ffffff] transition-all"></div>
</button>', 3),
        (template_id, 'Neu Input', 'Inset text input', 'input',
         '<input type="text" placeholder="Enter text..." className="w-full px-4 py-3 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_8px_#b8bcc2,inset_-4px_-4px_8px_#ffffff] text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300" />', 4);

    -- ═══════════════════════════════════════════════════════════════
    -- DARK MODE - Landing Page Template
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO templates (name, description, category_id, code, language, tags, is_public, color_palette)
    VALUES (
        'Dark Landing Page',
        'Sleek dark theme landing page with proper contrast and accessibility',
        dark_cat_id,
        '<div className="min-h-screen bg-gray-950 text-white">
  {/* Navigation */}
  <nav className="border-b border-gray-800 px-6 py-4">
    <div className="max-w-7xl mx-auto flex items-center justify-between">
      <div className="text-xl font-bold">Brand</div>
      <div className="flex items-center gap-6">
        <a href="#" className="text-gray-400 hover:text-white transition-colors">Features</a>
        <a href="#" className="text-gray-400 hover:text-white transition-colors">Pricing</a>
        <button className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium hover:bg-gray-100">Get Started</button>
      </div>
    </div>
  </nav>
  
  {/* Hero */}
  <section className="max-w-7xl mx-auto px-6 py-24 text-center">
    <h1 className="text-5xl font-bold mb-6">Build something amazing</h1>
    <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">Create beautiful, responsive interfaces with our comprehensive design system.</p>
    <div className="flex items-center justify-center gap-4">
      <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold hover:bg-gray-100">Start Free</button>
      <button className="px-8 py-4 border border-gray-700 rounded-xl font-semibold hover:border-gray-600">Learn More</button>
    </div>
  </section>
</div>',
        'jsx',
        ARRAY['landing', 'hero', 'dark', 'marketing'],
        TRUE,
        '{"background": "#030712", "surface": "#111827", "border": "#1f2937", "text": "#ffffff", "textMuted": "#9ca3af", "primary": "#ffffff", "primaryText": "#030712"}'::jsonb
    ) RETURNING id INTO template_id;

    -- Dark Mode Components
    INSERT INTO template_components (template_id, name, description, component_type, code, sort_order) VALUES
        (template_id, 'Dark Navbar', 'Dark theme navigation bar', 'navigation',
         '<nav className="border-b border-gray-800 bg-gray-950 px-6 py-4">
  <div className="max-w-7xl mx-auto flex items-center justify-between">
    <div className="text-xl font-bold text-white">Brand</div>
    <div className="flex items-center gap-6">
      <a href="#" className="text-gray-400 hover:text-white transition-colors">Link</a>
      <button className="px-4 py-2 bg-white text-gray-900 rounded-lg font-medium">CTA</button>
    </div>
  </div>
</nav>', 0),
        (template_id, 'Dark Hero', 'Hero section for dark theme', 'hero',
         '<section className="bg-gray-950 text-center py-24 px-6">
  <h1 className="text-5xl font-bold text-white mb-6">Headline Here</h1>
  <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">Supporting text goes here</p>
  <button className="px-8 py-4 bg-white text-gray-900 rounded-xl font-semibold">Get Started</button>
</section>', 1),
        (template_id, 'Dark Card', 'Content card for dark theme', 'card',
         '<div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 hover:border-gray-700 transition-colors">
  <h3 className="text-lg font-semibold text-white">Card Title</h3>
  <p className="text-gray-400 mt-2">Card description text</p>
</div>', 2),
        (template_id, 'Dark Primary Button', 'Light button on dark background', 'button',
         '<button className="px-6 py-3 bg-white text-gray-900 rounded-xl font-medium hover:bg-gray-100 transition-colors">
  Primary Action
</button>', 3),
        (template_id, 'Dark Secondary Button', 'Outline button for dark theme', 'button',
         '<button className="px-6 py-3 border border-gray-700 text-white rounded-xl font-medium hover:border-gray-600 hover:bg-gray-900 transition-colors">
  Secondary
</button>', 4);

    -- ═══════════════════════════════════════════════════════════════
    -- MODERN MINIMAL - Profile Page Template
    -- ═══════════════════════════════════════════════════════════════
    INSERT INTO templates (name, description, category_id, code, language, tags, is_public, color_palette)
    VALUES (
        'Minimal Profile Page',
        'Clean, whitespace-focused profile page with elegant typography',
        modern_cat_id,
        '<div className="min-h-screen bg-white">
  <div className="max-w-3xl mx-auto px-6 py-16">
    {/* Profile Header */}
    <div className="text-center mb-16">
      <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gray-100"></div>
      <h1 className="text-3xl font-light text-gray-900 mb-2">Jane Doe</h1>
      <p className="text-gray-500">Product Designer</p>
    </div>
    
    {/* Bio */}
    <section className="mb-16">
      <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">About</h2>
      <p className="text-gray-600 leading-relaxed">Creating thoughtful digital experiences with a focus on simplicity and function.</p>
    </section>
    
    {/* Links */}
    <section>
      <h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Connect</h2>
      <div className="space-y-3">
        <a href="#" className="block py-3 border-b border-gray-100 text-gray-900 hover:text-gray-600 transition-colors">Twitter →</a>
        <a href="#" className="block py-3 border-b border-gray-100 text-gray-900 hover:text-gray-600 transition-colors">LinkedIn →</a>
      </div>
    </section>
  </div>
</div>',
        'jsx',
        ARRAY['profile', 'minimal', 'clean', 'whitespace'],
        TRUE,
        '{"background": "#ffffff", "surface": "#f9fafb", "border": "#f3f4f6", "text": "#111827", "textMuted": "#6b7280", "primary": "#111827"}'::jsonb
    ) RETURNING id INTO template_id;

    -- Modern Minimal Components
    INSERT INTO template_components (template_id, name, description, component_type, code, sort_order) VALUES
        (template_id, 'Minimal Section Header', 'Uppercase label for sections', 'header',
         '<h2 className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-4">Section Title</h2>', 0),
        (template_id, 'Minimal Link', 'Clean link with arrow', 'navigation',
         '<a href="#" className="block py-3 border-b border-gray-100 text-gray-900 hover:text-gray-600 transition-colors">Link Text →</a>', 1),
        (template_id, 'Minimal Button', 'Simple text button', 'button',
         '<button className="text-gray-900 font-medium hover:text-gray-600 transition-colors">Action →</button>', 2),
        (template_id, 'Minimal Card', 'Clean card with subtle border', 'card',
         '<div className="p-6 border border-gray-100 rounded-lg hover:border-gray-200 transition-colors">
  <h3 className="font-medium text-gray-900 mb-2">Title</h3>
  <p className="text-gray-500 text-sm">Description text</p>
</div>', 3),
        (template_id, 'Minimal Input', 'Borderless input with underline', 'input',
         '<input type="text" placeholder="Enter text..." className="w-full py-3 border-b border-gray-200 text-gray-900 placeholder-gray-400 focus:outline-none focus:border-gray-900 transition-colors" />', 4);

END $$;

-- =============================================
-- 9. STORAGE BUCKET FOR TEMPLATE IMAGES
-- =============================================
-- Create storage bucket for template images (run in Supabase Dashboard > Storage)
-- Or use this SQL (may require admin privileges):

-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('templates', 'templates', true)
-- ON CONFLICT (id) DO NOTHING;

-- Enable public access to templates bucket
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'templates');
-- CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'templates' AND auth.role() = 'authenticated');

-- NOTE: You may need to create the 'templates' bucket manually in Supabase Dashboard:
-- 1. Go to Storage in Supabase Dashboard
-- 2. Click "New bucket"
-- 3. Name it "templates"
-- 4. Check "Public bucket"
-- 5. Click "Create bucket"

-- =============================================
-- 10. VERIFY SETUP
-- =============================================
SELECT 'template_categories' as table_name, COUNT(*) as count FROM template_categories
UNION ALL
SELECT 'templates', COUNT(*) FROM templates
UNION ALL
SELECT 'template_components', COUNT(*) FROM template_components
UNION ALL
SELECT 'template_likes', COUNT(*) FROM template_likes
UNION ALL
SELECT 'template_saves', COUNT(*) FROM template_saves;

-- Show categories
SELECT name, slug, icon, color, sort_order FROM template_categories ORDER BY sort_order;

-- Show templates with component count
SELECT t.name, c.name as category, t.likes_count, 
       (SELECT COUNT(*) FROM template_components tc WHERE tc.template_id = t.id) as component_count
FROM templates t 
LEFT JOIN template_categories c ON t.category_id = c.id
ORDER BY t.created_at DESC;
