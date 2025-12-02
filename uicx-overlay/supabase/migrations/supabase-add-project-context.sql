-- =============================================
-- UICX OVERLAY - ADD PROJECT CONTEXT COLUMNS
-- =============================================
-- Run this in Supabase SQL Editor to add columns for saving
-- project context, session summary, prompts, templates, and conversation history
-- This enables persisting all data across refreshes and app reopening
-- =============================================

-- Add new columns to projects table for storing all project-related data
ALTER TABLE projects ADD COLUMN IF NOT EXISTS context_summary JSONB DEFAULT '{}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS session_summary TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS user_intent TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS selected_snippets JSONB DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS selected_images JSONB DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS code_attachments JSONB DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS constraints JSONB DEFAULT '{"noInlineStyles": true, "useTailwind": true, "maxLines": 200, "ariaRequired": false, "mobileFirst": true}';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS conversation_history JSONB DEFAULT '[]';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS last_generated_prompt TEXT DEFAULT '';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS template JSONB DEFAULT 'null';

-- Comment on columns for documentation
COMMENT ON COLUMN projects.context_summary IS 'JSON object containing projectType, componentsUsed, lastChange, globalIntent';
COMMENT ON COLUMN projects.session_summary IS 'AI-generated summary of the current session work';
COMMENT ON COLUMN projects.user_intent IS 'Current user intent/prompt text';
COMMENT ON COLUMN projects.selected_snippets IS 'Array of selected snippet objects with id, name, code, imageUrl, imageDataUrl';
COMMENT ON COLUMN projects.selected_images IS 'Array of manually attached images with id, name, dataUrl, description';
COMMENT ON COLUMN projects.code_attachments IS 'Array of code attachments with id, name, code, language';
COMMENT ON COLUMN projects.constraints IS 'Prompt constraints (noInlineStyles, useTailwind, maxLines, ariaRequired, mobileFirst)';
COMMENT ON COLUMN projects.conversation_history IS 'Array of conversation messages for context';
COMMENT ON COLUMN projects.last_generated_prompt IS 'The last generated composite prompt text';
COMMENT ON COLUMN projects.template IS 'Full template object including components - persists across refresh';

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('context_summary', 'session_summary', 'user_intent', 'selected_snippets', 
                    'selected_images', 'code_attachments', 'constraints', 'conversation_history',
                    'last_generated_prompt', 'template')
ORDER BY ordinal_position;

-- =============================================
-- TEMPLATE COLUMN STRUCTURE
-- =============================================
-- The template column stores the complete template object:
-- {
--   "id": "uuid",
--   "name": "Button Collection",
--   "description": "A complete set of button styles",
--   "categoryId": "uuid",
--   "categoryName": "Buttons",
--   "categorySlug": "buttons",
--   "categoryIcon": "mouse-pointer-click",
--   "categoryColor": "blue",
--   "code": "<div className=\"flex gap-4\">...</div>",
--   "language": "jsx",
--   "previewUrl": "https://storage.../preview.png",
--   "thumbnailUrl": "https://storage.../thumb.png",
--   "tags": ["button", "collection", "ui-kit"],
--   "framework": "react",
--   "styleLibrary": "tailwind",
--   "colorPalette": {
--     "primary": "#3b82f6",
--     "secondary": "#8b5cf6",
--     "background": "#0f172a"
--   },
--   "usageNotes": "Use these buttons for all CTAs",
--   "defaultConstraints": {},
--   "components": [
--     {
--       "id": "uuid",
--       "name": "Primary Button",
--       "description": "Main CTA button with solid background",
--       "componentType": "button",
--       "imageUrl": "https://storage.../primary-btn.png",
--       "code": "<button className=\"px-6 py-2.5 bg-blue-600...\">Button</button>",
--       "sortOrder": 0
--     },
--     {
--       "id": "uuid",
--       "name": "Secondary Button",
--       "description": "Outline button for secondary actions",
--       "componentType": "button",
--       "imageUrl": null,
--       "code": "<button className=\"px-6 py-2.5 border-2...\">Secondary</button>",
--       "sortOrder": 1
--     }
--   ],
--   "likesCount": 42,
--   "savesCount": 15,
--   "viewsCount": 1200,
--   "isPublic": true,
--   "userId": "uuid",
--   "createdAt": "2024-01-01T00:00:00Z",
--   "updatedAt": "2024-01-15T00:00:00Z"
-- }
--
-- This allows the full template with all components to persist
-- when user refreshes or reopens the app.
