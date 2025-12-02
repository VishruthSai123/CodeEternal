-- =============================================
-- UICX OVERLAY - SUPABASE DATABASE SCHEMA v2
-- =============================================
-- This script safely handles existing tables
-- Run this in Supabase SQL Editor
-- =============================================

-- =============================================
-- 0. DROP EXISTING OBJECTS (Safe cleanup)
-- =============================================

-- Drop triggers first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
DROP TRIGGER IF EXISTS update_snippets_updated_at ON snippets;
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;

-- Drop functions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.get_active_project(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.set_active_project(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Drop policies (profiles)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Drop policies (projects)
DROP POLICY IF EXISTS "Users can view own projects" ON projects;
DROP POLICY IF EXISTS "Users can create own projects" ON projects;
DROP POLICY IF EXISTS "Users can update own projects" ON projects;
DROP POLICY IF EXISTS "Users can delete own projects" ON projects;
DROP POLICY IF EXISTS "Users can CRUD own projects" ON projects;

-- Drop policies (snippets)
DROP POLICY IF EXISTS "Users can view own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can view public snippets" ON snippets;
DROP POLICY IF EXISTS "Users can create own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can update own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can delete own snippets" ON snippets;
DROP POLICY IF EXISTS "Users can CRUD own snippets" ON snippets;

-- Drop policies (prompt_history)
DROP POLICY IF EXISTS "Users can view own prompt history" ON prompt_history;
DROP POLICY IF EXISTS "Users can create own prompt history" ON prompt_history;
DROP POLICY IF EXISTS "Users can delete own prompt history" ON prompt_history;
DROP POLICY IF EXISTS "Users can CRUD own history" ON prompt_history;

-- Drop policies (conversations)
DROP POLICY IF EXISTS "Users can view own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can create own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON conversations;
DROP POLICY IF EXISTS "Users can CRUD own conversations" ON conversations;

-- Drop policies (user_settings)
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can create own settings" ON user_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;

-- Drop tables in correct order (child tables first)
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS prompt_history CASCADE;
DROP TABLE IF EXISTS snippets CASCADE;
DROP TABLE IF EXISTS user_settings CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- =============================================
-- 1. PROFILES TABLE (extends auth.users)
-- =============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  avatar_url TEXT,
  
  -- Permissions (controlled by admin via SQL)
  can_add_snippets BOOLEAN DEFAULT FALSE,  -- Can user add custom snippets?
  is_admin BOOLEAN DEFAULT FALSE,          -- Is user an admin?
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-create profile when user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, avatar_url, can_add_snippets, is_admin)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE,  -- Default: cannot add snippets
    FALSE   -- Default: not admin
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 2. PROJECTS TABLE (User Workspaces)
-- =============================================
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  framework TEXT DEFAULT 'react',
  style_preset TEXT DEFAULT 'modern',
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_user_id ON projects(user_id);

-- =============================================
-- 3. SNIPPETS TABLE (Custom UI Snippets)
-- =============================================
CREATE TABLE snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'components',
  tags TEXT[] DEFAULT '{}',
  code TEXT,
  language TEXT DEFAULT 'jsx',
  image_url TEXT,
  usage_notes TEXT,
  is_public BOOLEAN DEFAULT FALSE,
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_snippets_user_id ON snippets(user_id);
CREATE INDEX idx_snippets_project_id ON snippets(project_id);
CREATE INDEX idx_snippets_category ON snippets(category);
CREATE INDEX idx_snippets_is_public ON snippets(is_public) WHERE is_public = TRUE;

-- =============================================
-- 4. PROMPT HISTORY TABLE
-- =============================================
CREATE TABLE prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  prompt_text TEXT NOT NULL,
  context_summary TEXT,
  session_summary TEXT,
  snippet_ids UUID[] DEFAULT '{}',
  framework TEXT,
  constraints TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prompt_history_user_id ON prompt_history(user_id);
CREATE INDEX idx_prompt_history_project_id ON prompt_history(project_id);
CREATE INDEX idx_prompt_history_created_at ON prompt_history(created_at DESC);

-- =============================================
-- 5. CONVERSATIONS TABLE (Chat History)
-- =============================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_project_id ON conversations(project_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- =============================================
-- 6. USER SETTINGS TABLE
-- =============================================
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  theme TEXT DEFAULT 'dark',
  default_framework TEXT DEFAULT 'react',
  default_style_preset TEXT DEFAULT 'modern',
  auto_summarize BOOLEAN DEFAULT TRUE,
  gemini_api_key TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 7. ENABLE ROW LEVEL SECURITY
-- =============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE snippets ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 8. RLS POLICIES
-- =============================================

-- PROFILES
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id)
  WITH CHECK (
    -- Users cannot change their own permissions
    can_add_snippets = (SELECT can_add_snippets FROM profiles WHERE id = auth.uid()) AND
    is_admin = (SELECT is_admin FROM profiles WHERE id = auth.uid())
  );

-- PROJECTS
CREATE POLICY "Users can view own projects" 
  ON projects FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own projects" 
  ON projects FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own projects" 
  ON projects FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own projects" 
  ON projects FOR DELETE 
  USING (auth.uid() = user_id);

-- SNIPPETS
CREATE POLICY "Users can view own snippets" 
  ON snippets FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view public snippets" 
  ON snippets FOR SELECT 
  USING (is_public = TRUE);

-- Only users with can_add_snippets permission can create snippets
CREATE POLICY "Users with permission can create snippets" 
  ON snippets FOR INSERT 
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND can_add_snippets = TRUE)
  );

CREATE POLICY "Users can update own snippets" 
  ON snippets FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own snippets" 
  ON snippets FOR DELETE 
  USING (auth.uid() = user_id);

-- PROMPT_HISTORY
CREATE POLICY "Users can view own prompt history" 
  ON prompt_history FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own prompt history" 
  ON prompt_history FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own prompt history" 
  ON prompt_history FOR DELETE 
  USING (auth.uid() = user_id);

-- CONVERSATIONS
CREATE POLICY "Users can view own conversations" 
  ON conversations FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" 
  ON conversations FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own conversations" 
  ON conversations FOR DELETE 
  USING (auth.uid() = user_id);

-- USER_SETTINGS
CREATE POLICY "Users can view own settings" 
  ON user_settings FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own settings" 
  ON user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings" 
  ON user_settings FOR UPDATE 
  USING (auth.uid() = user_id);

-- =============================================
-- 9. UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON projects
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_snippets_updated_at
  BEFORE UPDATE ON snippets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- 10. HELPER FUNCTIONS
-- =============================================

-- Get user's active project
CREATE OR REPLACE FUNCTION get_active_project(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
  v_project_id UUID;
BEGIN
  SELECT id INTO v_project_id
  FROM projects
  WHERE user_id = p_user_id AND is_active = TRUE
  LIMIT 1;
  RETURN v_project_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Set active project
CREATE OR REPLACE FUNCTION set_active_project(p_user_id UUID, p_project_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE projects SET is_active = FALSE WHERE user_id = p_user_id;
  UPDATE projects SET is_active = TRUE WHERE id = p_project_id AND user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 11. STORAGE SETUP
-- =============================================

-- Delete existing buckets (if they exist)
DELETE FROM storage.buckets WHERE id IN ('snippet-images', 'avatars');

-- Create snippet-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'snippet-images', 
  'snippet-images', 
  TRUE,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- Create avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars', 
  'avatars', 
  TRUE,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);

-- =============================================
-- 12. STORAGE POLICIES
-- =============================================

-- Drop existing storage policies
DROP POLICY IF EXISTS "Users can upload snippet images" ON storage.objects;
DROP POLICY IF EXISTS "Public can view snippet images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own snippet images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Public can view avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own avatar" ON storage.objects;

-- Snippet images policies
CREATE POLICY "Users can upload snippet images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'snippet-images');

CREATE POLICY "Public can view snippet images"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'snippet-images');

CREATE POLICY "Users can delete own snippet images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'snippet-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Avatar policies
CREATE POLICY "Users can upload avatars"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'avatars');

CREATE POLICY "Public can view avatars"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =============================================
-- 13. ADMIN HELPER FUNCTIONS
-- =============================================

-- Grant snippet creation permission to a user (run as admin)
-- Usage: SELECT grant_snippet_permission('user@email.com');
CREATE OR REPLACE FUNCTION grant_snippet_permission(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET can_add_snippets = TRUE 
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Revoke snippet creation permission from a user
-- Usage: SELECT revoke_snippet_permission('user@email.com');
CREATE OR REPLACE FUNCTION revoke_snippet_permission(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET can_add_snippets = FALSE 
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Make a user admin
-- Usage: SELECT make_admin('user@email.com');
CREATE OR REPLACE FUNCTION make_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET is_admin = TRUE, can_add_snippets = TRUE 
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove admin status from a user
-- Usage: SELECT remove_admin('user@email.com');
CREATE OR REPLACE FUNCTION remove_admin(user_email TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET is_admin = FALSE 
  WHERE email = user_email;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- DONE! Database is ready 🚀
-- =============================================

-- =============================================
-- ADMIN COMMANDS (Run these manually to grant permissions)
-- =============================================
-- 
-- Grant snippet creation to a user:
-- SELECT grant_snippet_permission('user@example.com');
--
-- Make someone admin (also grants snippet permission):
-- SELECT make_admin('your@email.com');
--
-- Revoke snippet permission:
-- SELECT revoke_snippet_permission('user@example.com');
--
-- Check user permissions:
-- SELECT email, can_add_snippets, is_admin FROM profiles;
--
-- =============================================
