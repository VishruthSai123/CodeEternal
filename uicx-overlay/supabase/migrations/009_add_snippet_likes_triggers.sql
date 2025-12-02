-- Add triggers to auto-update likes_count for snippets
-- This ensures likes_count stays in sync with snippet_likes table

-- Function to update snippet likes count
CREATE OR REPLACE FUNCTION update_snippet_likes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE snippets 
        SET likes_count = COALESCE(likes_count, 0) + 1 
        WHERE id = NEW.snippet_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE snippets 
        SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0)
        WHERE id = OLD.snippet_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS trigger_snippet_likes_count ON snippet_likes;

-- Create trigger for snippet likes
CREATE TRIGGER trigger_snippet_likes_count
    AFTER INSERT OR DELETE ON snippet_likes
    FOR EACH ROW EXECUTE FUNCTION update_snippet_likes_count();

-- Recalculate all snippet likes counts to fix any inconsistencies
UPDATE snippets s
SET likes_count = (
    SELECT COUNT(*) 
    FROM snippet_likes sl 
    WHERE sl.snippet_id = s.id
);

-- Verify unique constraint exists (one like per user per snippet)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'snippet_likes_snippet_id_user_id_key'
    ) THEN
        ALTER TABLE snippet_likes 
        ADD CONSTRAINT snippet_likes_snippet_id_user_id_key 
        UNIQUE (snippet_id, user_id);
    END IF;
END $$;

-- Verify unique constraint for saves (one save per user per snippet)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'snippet_saves_snippet_id_user_id_key'
    ) THEN
        ALTER TABLE snippet_saves 
        ADD CONSTRAINT snippet_saves_snippet_id_user_id_key 
        UNIQUE (snippet_id, user_id);
    END IF;
END $$;
