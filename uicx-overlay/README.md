# Code Eternal

> The ultimate context-aware prompt builder for AI Code Editors - Build code that lasts forever.

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-lightgrey)
![License](https://img.shields.io/badge/license-MIT-green)

## 🚀 Overview

Code Eternal is a floating desktop overlay that sits on top of any AI coding tool (Cursor, WindSurf, V0, etc.) and dramatically improves the quality of AI-generated code by providing:

- **Context-aware prompts** - Maintains full project memory across conversations
- **Template & snippet library** - Design system templates and reusable code components
- **Composite prompt builder** - Generates high-context prompts with code, images & constraints
- **Universal compatibility** - Works with any AI code editor via clipboard

## ✨ Features

### Prompt Builder
- Natural language intent input with AI enhancement
- Auto-summarized project context with full session memory
- Insert code snippets, templates, and image references
- Framework & style preset selection
- Code constraints (Tailwind, ARIA, mobile-first, etc.)
- Live prompt preview with smart formatting

### Template Library  
- Design style templates (Glassmorphism, Neumorphism, Dark Mode, etc.)
- Full page layouts with component variants
- One-click insert into prompts with full code

### Snippet Library
- Reusable code components from shadcn/ui & community
- Search and filter by source, category, and tags
- Code preview with syntax highlighting

### Context Manager
- Tracks project type, tech stack, and design style
- Remembers components in use and session phase
- Auto-updates with AI-powered summarization

### History
- View and reuse past prompts
- Restore previous context summaries

## 🛠️ Tech Stack

- **Electron** - Desktop app framework
- **React 18** - UI framework
- **Vite** - Fast bundling
- **TailwindCSS** - Styling
- **Zustand** - State management
- **Framer Motion** - Animations
- **Supabase** - Backend & auth
- **Google Gemini** - AI features

## 📦 Installation

### Prerequisites
- Node.js 18+
- npm or yarn

### Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/code-eternal.git
cd code-eternal

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
# Edit .env.local with your API keys

# Start development (web only)
npm run dev

# Start development (Electron desktop app)
npm run electron:dev
```

### Environment Variables

Create a `.env.local` file with:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

## 🚀 Deployment

### Web (Vercel)

1. Push your code to GitHub
2. Import project in [Vercel Dashboard](https://vercel.com/new)
3. Add environment variables in Vercel settings
4. Deploy!

Or via CLI:
```bash
npx vercel --prod
```

### Desktop (Electron)

```bash
# Build for all platforms
npm run electron:build

# Build for specific platform
npm run electron:build:win   # Windows
npm run electron:build:mac   # macOS
npm run electron:build:linux # Linux
```

Built executables will be in `build-output/` directory.

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+U` | Toggle overlay visibility |
| `Ctrl+Shift+C` | Quick copy prompt |
| `Ctrl+Shift+V` | Paste to editor |

## 📁 Project Structure

```
uicx-overlay/
├── electron/           # Electron main process
│   ├── main.js        # Main window setup
│   └── preload.js     # IPC bridge
├── src/               # React renderer
│   ├── components/    # UI components
│   ├── pages/         # Tab pages
│   ├── stores/        # Zustand stores
│   ├── core/          # Business logic
│   ├── hooks/         # Custom hooks
│   ├── lib/           # Utilities
│   └── data/          # Static data
├── assets/            # Images & icons
└── package.json
```

## 🎨 UI Design

- **Theme**: Modern AI UI 2025 with glassmorphism
- **Colors**: Teal (#14F4C9), Purple (#A855F7), Blue (#3B82F6)
- **Typography**: Inter + JetBrains Mono

## 🗺️ Roadmap

### v1.0 ✅ (Current)
- [x] Overlay panel with glass UI
- [x] Prompt builder with sections
- [x] Snippet library with cloud sync
- [x] Template library with likes/saves
- [x] Clipboard integration
- [x] Global hotkeys
- [x] AI-powered context summaries (Gemini)
- [x] User authentication (Supabase)
- [x] Cloud sync for projects
- [x] Web app deployment (Vercel)
- [x] Desktop app (Electron)

### v1.1 (Next)
- [ ] Landing page
- [ ] Snippet marketplace improvements
- [ ] More templates & snippets
- [ ] Performance optimizations

### v2.0 (Future)
- [ ] Team collaboration
- [ ] Custom AI integrations
- [ ] Browser extension
- [ ] VS Code extension

## 📄 License

MIT License - See [LICENSE](LICENSE) for details.

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting PRs.

---

Made with 💜 by the Code Eternal Team
