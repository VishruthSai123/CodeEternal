import { useState, useEffect, useRef } from 'react';
import { usePromptStore } from '../../stores/promptStore';
import { Wand2, Loader2, ImageIcon, X, Clipboard } from 'lucide-react';
import geminiService from '../../core/geminiService';

function IntentSection() {
  const { 
    userIntent = '', 
    setUserIntent,
    contextSummary,
    selectedSnippets,
    selectedImages,
    codeAttachments,
    constraints,
    framework,
    stylePreset,
    addImage,
    removeImage
  } = usePromptStore();
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [pastedImage, setPastedImage] = useState(null); // For quick preview
  const textareaRef = useRef(null);

  const placeholderExamples = [
    "Create a responsive navigation bar with glass effect...",
    "Build a pricing card component with hover animations...",
    "Design a login form with validation states...",
    "Generate a dashboard sidebar with collapsible menu...",
  ];

  const randomPlaceholder =
    placeholderExamples[Math.floor(Math.random() * placeholderExamples.length)];

  // Handle paste event for images
  const handlePaste = (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;

    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        const file = item.getAsFile();
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageData = {
            name: `Pasted Image ${new Date().toLocaleTimeString()}`,
            dataUrl: event.target.result,
            description: 'UI reference image',
          };
          addImage(imageData);
          setPastedImage(event.target.result);
          // Auto-clear preview after 3 seconds
          setTimeout(() => setPastedImage(null), 3000);
        };
        reader.readAsDataURL(file);
        break;
      }
    }
  };

  // Handle paste from clipboard button
  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard?.read) {
        const clipboardItems = await navigator.clipboard.read();
        for (const item of clipboardItems) {
          for (const type of item.types) {
            if (type.startsWith('image/')) {
              const blob = await item.getType(type);
              const reader = new FileReader();
              reader.onload = (event) => {
                const imageData = {
                  name: `Pasted Image ${new Date().toLocaleTimeString()}`,
                  dataUrl: event.target.result,
                  description: 'UI reference image',
                };
                addImage(imageData);
                setPastedImage(event.target.result);
                setTimeout(() => setPastedImage(null), 3000);
              };
              reader.readAsDataURL(blob);
              return;
            }
          }
        }
        alert('No image found in clipboard. Copy an image first!');
      }
    } catch (err) {
      console.log('Clipboard read failed:', err);
      alert('Could not read clipboard. Try pressing Ctrl+V instead.');
    }
  };

  // Add paste listener
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.addEventListener('paste', handlePaste);
      return () => textarea.removeEventListener('paste', handlePaste);
    }
  }, []);

  const handleEnhancePrompt = async () => {
    if (!userIntent.trim()) return;

    setIsEnhancing(true);
    try {
      // Pass full context to enhance prompt
      const enhanced = await geminiService.enhancePrompt(userIntent, {
        contextSummary,
        selectedSnippets,
        selectedImages,
        codeAttachments,
        constraints,
        framework,
        stylePreset
      });
      setUserIntent(enhanced);
    } catch (error) {
      console.error('Enhance failed:', error);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Count attached images
  const imageCount = selectedImages?.length || 0;

  return (
    <div className="space-y-2">
      {/* Textarea with paste support */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={userIntent}
          onChange={(e) => setUserIntent(e.target.value)}
          placeholder={`${randomPlaceholder}\n\n💡 Tip: Paste an image (Ctrl+V) to add UI reference`}
          rows={4}
          className="glass-textarea text-sm"
        />
        
        {/* Pasted image preview overlay */}
        {pastedImage && (
          <div className="absolute bottom-2 right-2 p-1 bg-green-500/20 border border-green-500/50 rounded-lg animate-pulse">
            <div className="flex items-center gap-2">
              <img src={pastedImage} alt="Pasted" className="w-8 h-8 object-cover rounded" />
              <span className="text-xs text-green-400">Image added!</span>
            </div>
          </div>
        )}
      </div>

      {/* Image attachments preview */}
      {imageCount > 0 && (
        <div className="flex items-center gap-2 p-2 bg-accent-purple/10 border border-accent-purple/20 rounded-lg">
          <ImageIcon size={14} className="text-accent-purple" />
          <span className="text-xs text-accent-purple">{imageCount} image{imageCount !== 1 ? 's' : ''} attached</span>
          <div className="flex gap-1 ml-auto">
            {selectedImages.slice(0, 3).map((img, i) => (
              <div key={img.id || i} className="relative group">
                <img 
                  src={img.dataUrl} 
                  alt={img.name} 
                  className="w-6 h-6 object-cover rounded border border-glass-border"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute -top-1 -right-1 p-0.5 bg-red-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={8} className="text-white" />
                </button>
              </div>
            ))}
            {imageCount > 3 && (
              <span className="text-xs text-gray-400">+{imageCount - 3}</span>
            )}
          </div>
        </div>
      )}
      
      {/* Quick actions row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Paste Image Button */}
        <button
          onClick={handlePasteFromClipboard}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-glass-hover 
                     border border-glass-border rounded-lg text-gray-400 hover:text-accent-teal 
                     hover:border-accent-teal/30 transition-all"
          title="Paste image from clipboard"
        >
          <Clipboard size={12} />
          Paste Image
        </button>

        {/* AI Enhance Button */}
        <button
          onClick={handleEnhancePrompt}
          disabled={isEnhancing || !userIntent.trim()}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gradient-to-r from-accent-purple/20 to-accent-teal/20 
                     border border-accent-purple/30 rounded-lg text-accent-purple hover:text-white 
                     disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          title="Enhance with AI"
        >
          {isEnhancing ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Wand2 size={12} />
          )}
          {isEnhancing ? 'Enhancing...' : 'AI Enhance'}
        </button>

        {/* Quick intent suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {['Create', 'Update', 'Fix', 'Style'].map((action) => (
            <button
              key={action}
              onClick={() => setUserIntent(userIntent + (userIntent ? ' ' : '') + action + ' ')}
              className="px-2 py-1 text-xs bg-glass-hover border border-glass-border rounded-lg 
                         text-gray-400 hover:text-white hover:border-accent-teal/30 transition-all"
            >
              {action}
            </button>
          ))}
        </div>
      </div>

      {/* Character count */}
      <div className="flex justify-end">
        <span className="text-xs text-gray-500">
          {userIntent.length} characters
        </span>
      </div>
    </div>
  );
}

export default IntentSection;
