// Initial snippets data pack
// Note: imageUrl can be a URL or imageDataUrl can be base64 data
// Users can add their own images to snippets later
export const initialSnippets = [
  // BUTTONS
  {
    id: 'shadcn-button-1',
    name: 'Primary Button',
    description: 'A primary action button with hover states',
    source: 'shadcn',
    category: 'buttons',
    tags: ['modern', 'minimal', 'animated'],
    language: 'jsx',
    // imageUrl: null, // Add image URL here when available
    // imageDataUrl: null, // Or base64 data URL
    code: `<Button className="bg-primary text-primary-foreground hover:bg-primary/90">
  Click me
</Button>`,
    usage: 'Use for primary call-to-action buttons in forms and pages.',
    props: {
      variant: 'default | destructive | outline | secondary | ghost | link',
      size: 'default | sm | lg | icon',
    },
  },
  {
    id: 'uiverse-button-1',
    name: 'Gradient Glow Button',
    description: 'Animated gradient button with glow effect',
    source: 'uiverse',
    category: 'buttons',
    tags: ['gradient', 'animated', 'modern', 'glass'],
    language: 'jsx',
    code: `<button className="relative px-6 py-3 font-semibold text-white 
  bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl
  hover:shadow-[0_0_20px_rgba(168,85,247,0.5)] transition-all duration-300
  before:absolute before:inset-0 before:bg-gradient-to-r before:from-purple-600 before:to-pink-600 
  before:rounded-xl before:opacity-0 hover:before:opacity-100 before:-z-10 before:blur-xl">
  Glow Button
</button>`,
    usage: 'Eye-catching CTA button with glowing hover effect.',
  },
  {
    id: 'uiverse-button-2',
    name: 'Neumorphic Button',
    description: 'Soft UI neumorphism styled button',
    source: 'uiverse',
    category: 'buttons',
    tags: ['neumorphism', 'modern', 'light'],
    language: 'jsx',
    code: `<button className="px-8 py-4 rounded-2xl bg-gray-100 
  shadow-[6px_6px_12px_#c5c5c5,-6px_-6px_12px_#ffffff]
  hover:shadow-[inset_6px_6px_12px_#c5c5c5,inset_-6px_-6px_12px_#ffffff]
  transition-all duration-200 font-medium text-gray-700">
  Neumorphic
</button>`,
    usage: 'Soft UI button for light-themed interfaces.',
  },

  // CARDS
  {
    id: 'shadcn-card-1',
    name: 'Basic Card',
    description: 'Simple card with header, content, and footer',
    source: 'shadcn',
    category: 'cards',
    tags: ['minimal', 'modern'],
    language: 'jsx',
    code: `<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description here</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here.</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>`,
    usage: 'General purpose card for displaying grouped content.',
    props: {
      className: 'Custom CSS classes',
    },
  },
  {
    id: 'uiverse-card-1',
    name: 'Glass Card',
    description: 'Glassmorphism card with blur backdrop',
    source: 'uiverse',
    category: 'cards',
    tags: ['glass', 'modern', 'dark', 'animated'],
    language: 'jsx',
    code: `<div className="p-6 rounded-2xl 
  bg-white/10 backdrop-blur-lg border border-white/20
  shadow-[0_8px_32px_rgba(0,0,0,0.3)]
  hover:bg-white/15 transition-all duration-300">
  <h3 className="text-xl font-semibold text-white mb-2">Glass Card</h3>
  <p className="text-gray-300">Beautiful glassmorphism effect with blur.</p>
</div>`,
    usage: 'Modern glass-effect card for dark themed dashboards.',
  },
  {
    id: 'shadcn-card-2',
    name: 'Pricing Card',
    description: 'Pricing tier card with features list',
    source: 'shadcn',
    category: 'cards',
    tags: ['ecommerce', 'modern', 'minimal'],
    language: 'jsx',
    code: `<Card className="w-80">
  <CardHeader>
    <CardTitle>Pro Plan</CardTitle>
    <CardDescription>For growing businesses</CardDescription>
    <div className="text-4xl font-bold">$29<span className="text-lg font-normal">/mo</span></div>
  </CardHeader>
  <CardContent>
    <ul className="space-y-2">
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-green-500" />
        Unlimited projects
      </li>
      <li className="flex items-center gap-2">
        <Check className="h-4 w-4 text-green-500" />
        Priority support
      </li>
    </ul>
  </CardContent>
  <CardFooter>
    <Button className="w-full">Get Started</Button>
  </CardFooter>
</Card>`,
    usage: 'Use for pricing pages and subscription tiers.',
  },

  // NAVIGATION
  {
    id: 'shadcn-nav-1',
    name: 'Sidebar Navigation',
    description: 'Collapsible sidebar with icons and links',
    source: 'shadcn',
    category: 'navigation',
    tags: ['dashboard', 'modern', 'animated'],
    language: 'jsx',
    code: `<aside className="w-64 h-screen bg-background border-r">
  <div className="p-4">
    <h2 className="text-xl font-bold">Dashboard</h2>
  </div>
  <nav className="space-y-1 px-2">
    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
      <Home className="h-5 w-5" />
      Home
    </a>
    <a href="#" className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-accent">
      <Settings className="h-5 w-5" />
      Settings
    </a>
  </nav>
</aside>`,
    usage: 'Dashboard sidebar navigation with icon support.',
  },
  {
    id: 'shadcn-nav-2',
    name: 'Top Navigation Bar',
    description: 'Responsive navbar with logo and menu',
    source: 'shadcn',
    category: 'navigation',
    tags: ['modern', 'minimal'],
    language: 'jsx',
    code: `<nav className="flex items-center justify-between px-6 py-4 border-b">
  <div className="flex items-center gap-8">
    <a href="/" className="text-xl font-bold">Logo</a>
    <div className="hidden md:flex items-center gap-6">
      <a href="#" className="text-muted-foreground hover:text-foreground">Features</a>
      <a href="#" className="text-muted-foreground hover:text-foreground">Pricing</a>
      <a href="#" className="text-muted-foreground hover:text-foreground">About</a>
    </div>
  </div>
  <Button>Get Started</Button>
</nav>`,
    usage: 'Top navigation bar for landing pages and websites.',
  },

  // FORMS
  {
    id: 'shadcn-form-1',
    name: 'Login Form',
    description: 'Email and password login form',
    source: 'shadcn',
    category: 'forms',
    tags: ['auth', 'modern', 'minimal'],
    language: 'jsx',
    code: `<form className="space-y-4 w-80">
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="you@example.com" />
  </div>
  <div className="space-y-2">
    <Label htmlFor="password">Password</Label>
    <Input id="password" type="password" />
  </div>
  <Button className="w-full">Sign In</Button>
  <p className="text-center text-sm text-muted-foreground">
    Don't have an account? <a href="#" className="text-primary hover:underline">Sign up</a>
  </p>
</form>`,
    usage: 'Standard login form with email and password fields.',
  },
  {
    id: 'uiverse-form-1',
    name: 'Glass Input Field',
    description: 'Glassmorphism styled input with focus effects',
    source: 'uiverse',
    category: 'forms',
    tags: ['glass', 'modern', 'dark', 'animated'],
    language: 'jsx',
    code: `<input 
  type="text" 
  placeholder="Enter text..."
  className="w-full px-4 py-3 rounded-xl 
    bg-white/5 backdrop-blur-sm border border-white/10
    text-white placeholder-gray-400
    focus:outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20
    transition-all duration-300"
/>`,
    usage: 'Glass-styled input for dark themed forms.',
  },

  // MODALS
  {
    id: 'shadcn-modal-1',
    name: 'Dialog Modal',
    description: 'Accessible modal dialog with overlay',
    source: 'shadcn',
    category: 'modals',
    tags: ['modern', 'minimal'],
    language: 'jsx',
    code: `<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Are you sure?</DialogTitle>
      <DialogDescription>
        This action cannot be undone.
      </DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`,
    usage: 'Confirmation dialogs and modal interactions.',
  },

  // LAYOUTS
  {
    id: 'layout-1',
    name: 'Dashboard Layout',
    description: 'Full dashboard layout with sidebar and header',
    source: 'shadcn',
    category: 'layouts',
    tags: ['dashboard', 'modern'],
    language: 'jsx',
    code: `<div className="flex h-screen">
  {/* Sidebar */}
  <aside className="w-64 border-r bg-background">
    <nav className="p-4 space-y-2">
      {/* Nav items */}
    </nav>
  </aside>
  
  {/* Main Content */}
  <div className="flex-1 flex flex-col">
    {/* Header */}
    <header className="h-16 border-b flex items-center px-6">
      <h1 className="text-xl font-semibold">Dashboard</h1>
    </header>
    
    {/* Content */}
    <main className="flex-1 p-6 overflow-auto">
      {/* Page content */}
    </main>
  </div>
</div>`,
    usage: 'Base layout for admin dashboards and panels.',
  },
  {
    id: 'layout-2',
    name: 'Hero Section',
    description: 'Landing page hero with CTA',
    source: 'shadcn',
    category: 'layouts',
    tags: ['modern', 'minimal', 'animated'],
    language: 'jsx',
    code: `<section className="py-24 px-6 text-center">
  <h1 className="text-5xl font-bold tracking-tight mb-6">
    Code Eternal UI
  </h1>
  <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
    The ultimate prompt builder that supercharges your AI coding workflow
  </p>
  <div className="flex items-center justify-center gap-4">
    <Button size="lg">Get Started</Button>
    <Button size="lg" variant="outline">Learn More</Button>
  </div>
</section>`,
    usage: 'Landing page hero section with headline and CTA.',
  },

  // ICONS (Lucide)
  {
    id: 'lucide-icons-1',
    name: 'Common Icons Pack',
    description: 'Frequently used Lucide icons',
    source: 'lucide',
    category: 'icons',
    tags: ['minimal'],
    language: 'jsx',
    code: `import { 
  Home, Settings, User, Search, Menu, X, 
  ChevronDown, ChevronRight, Plus, Minus,
  Check, Copy, Edit, Trash, Eye, EyeOff,
  Mail, Lock, Bell, Star, Heart, Share
} from 'lucide-react';

// Usage
<Home className="h-5 w-5" />
<Settings className="h-5 w-5" />
<User className="h-5 w-5" />`,
    usage: 'Import and use individual icons from lucide-react.',
  },

  // ANIMATIONS
  {
    id: 'anim-1',
    name: 'Fade In Up',
    description: 'Framer Motion fade in with upward slide',
    source: 'custom',
    category: 'animations',
    tags: ['animated', 'modern'],
    language: 'jsx',
    code: `import { motion } from 'framer-motion';

<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
>
  Content here
</motion.div>`,
    usage: 'Smooth entrance animation for elements.',
  },
  {
    id: 'anim-2',
    name: 'Stagger Children',
    description: 'Staggered animation for list items',
    source: 'custom',
    category: 'animations',
    tags: ['animated', 'modern'],
    language: 'jsx',
    code: `import { motion } from 'framer-motion';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

<motion.ul variants={container} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.li key={item.id} variants={item}>
      {item.content}
    </motion.li>
  ))}
</motion.ul>`,
    usage: 'Staggered animation for lists and grids.',
  },
];
