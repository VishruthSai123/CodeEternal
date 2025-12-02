-- Add variants column to snippets table
-- This allows storing multiple code versions (TSX, JSX, HTML, Tailwind, React, etc.)

ALTER TABLE snippets 
ADD COLUMN IF NOT EXISTS variants JSONB DEFAULT '[]'::jsonb;

-- Add comment for documentation
COMMENT ON COLUMN snippets.variants IS 'Array of code variants: [{type: "tsx", code: "..."}, {type: "html", code: "..."}]';

-- Create index for better performance when querying variants
CREATE INDEX IF NOT EXISTS idx_snippets_variants ON snippets USING gin(variants);
