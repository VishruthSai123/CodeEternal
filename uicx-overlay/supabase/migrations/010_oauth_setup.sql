-- =============================================
-- OAUTH AUTHENTICATION SETUP FOR CODE ETERNAL
-- =============================================
-- This migration enhances the profiles table and triggers
-- to properly handle OAuth providers (Google, GitHub)
-- =============================================

-- =============================================
-- 1. UPDATE PROFILES TABLE FOR OAUTH
-- =============================================

-- Add OAuth-specific columns if they don't exist
DO $$ 
BEGIN
  -- Add auth_provider column to track how user signed up
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'auth_provider') THEN
    ALTER TABLE profiles ADD COLUMN auth_provider TEXT DEFAULT 'email';
  END IF;
  
  -- Add provider_id for OAuth user identification
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'provider_id') THEN
    ALTER TABLE profiles ADD COLUMN provider_id TEXT;
  END IF;
  
  -- Add last_sign_in_at to track user activity
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'last_sign_in_at') THEN
    ALTER TABLE profiles ADD COLUMN last_sign_in_at TIMESTAMPTZ;
  END IF;
END $$;

-- =============================================
-- 2. ENHANCED USER CREATION TRIGGER
-- =============================================
-- This trigger handles both email signup and OAuth providers

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  provider_name TEXT;
  provider_user_id TEXT;
  user_avatar TEXT;
  user_name TEXT;
BEGIN
  -- Determine the auth provider
  provider_name := COALESCE(
    NEW.raw_app_meta_data->>'provider',
    'email'
  );
  
  -- Get provider-specific user ID
  provider_user_id := COALESCE(
    NEW.raw_user_meta_data->>'provider_id',
    NEW.raw_user_meta_data->>'sub'
  );
  
  -- Get avatar URL based on provider
  user_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',          -- Google uses 'picture'
    NEW.raw_user_meta_data->>'avatar_url'        -- GitHub uses 'avatar_url'
  );
  
  -- Get display name based on provider
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'user_name',        -- GitHub username
    NEW.raw_user_meta_data->>'preferred_username',
    split_part(NEW.email, '@', 1)
  );

  INSERT INTO public.profiles (
    id, 
    email, 
    display_name, 
    avatar_url, 
    auth_provider,
    provider_id,
    last_sign_in_at,
    created_at, 
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    user_name,
    user_avatar,
    provider_name,
    provider_user_id,
    NOW(),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    auth_provider = COALESCE(EXCLUDED.auth_provider, profiles.auth_provider),
    provider_id = COALESCE(EXCLUDED.provider_id, profiles.provider_id),
    last_sign_in_at = NOW(),
    updated_at = NOW();
    
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 3. SIGN-IN TRACKING TRIGGER
-- =============================================
-- Updates last_sign_in_at on every login

CREATE OR REPLACE FUNCTION public.handle_user_sign_in()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.profiles
  SET 
    last_sign_in_at = NOW(),
    updated_at = NOW(),
    -- Update avatar if provider gives us a new one
    avatar_url = COALESCE(
      NEW.raw_user_meta_data->>'avatar_url',
      NEW.raw_user_meta_data->>'picture',
      profiles.avatar_url
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for sign-in updates (on auth.users update)
DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF last_sign_in_at ON auth.users
  FOR EACH ROW 
  WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
  EXECUTE FUNCTION public.handle_user_sign_in();

-- =============================================
-- 4. RLS POLICIES FOR OAUTH USERS
-- =============================================
-- Ensure OAuth users have same permissions as email users

-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable" ON profiles;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- Allow viewing basic profile info for other users (for snippets, etc.)
CREATE POLICY "Public profiles are viewable" ON profiles
  FOR SELECT USING (true);

-- =============================================
-- 5. HELPER FUNCTION TO GET USER PROVIDER
-- =============================================

CREATE OR REPLACE FUNCTION public.get_user_provider(user_id UUID)
RETURNS TEXT AS $$
  SELECT auth_provider FROM profiles WHERE id = user_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- =============================================
-- 6. INDEX FOR FASTER LOOKUPS
-- =============================================

CREATE INDEX IF NOT EXISTS idx_profiles_auth_provider ON profiles(auth_provider);
CREATE INDEX IF NOT EXISTS idx_profiles_provider_id ON profiles(provider_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_sign_in ON profiles(last_sign_in_at DESC);

-- =============================================
-- DONE! 
-- =============================================
-- After running this migration, configure OAuth providers in Supabase Dashboard:
-- 1. Go to Authentication > Providers
-- 2. Enable Google and GitHub
-- 3. Add your OAuth credentials
-- 4. Set redirect URLs
-- =============================================
