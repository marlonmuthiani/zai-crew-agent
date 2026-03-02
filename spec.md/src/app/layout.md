# layout.tsx - Root Layout

## Overview

`src/app/layout.tsx` is the root layout component that wraps all pages in the Next.js application. It provides essential providers, fonts, and global configuration.

## Purpose

- Define HTML document structure
- Load and configure fonts
- Provide global context providers
- Set up theme management
- Include global styles

## File Structure

```typescript
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from '@/components/ui/sonner';
import './globals.css';

// Font configuration
const inter = Inter({ subsets: ['latin'] });

// Metadata
export const metadata: Metadata = {
  title: 'Team AI Dashboard',
  description: 'Multi-agent AI collaboration platform',
};

// Root Layout Component
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Key Components

### Font Configuration

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',  // Optional: improves loading
});
```

**Available Options:**
- `subsets`: Character sets to include
- `display`: Font loading behavior
- `variable`: CSS variable name (for Tailwind)

### Metadata

```typescript
export const metadata: Metadata = {
  title: {
    default: 'Team AI Dashboard',
    template: '%s | Team AI Dashboard'
  },
  description: 'Multi-agent AI collaboration platform',
  keywords: ['AI', 'agents', 'collaboration', 'dashboard'],
  authors: [{ name: 'Team' }],
  creator: 'Team AI',
  icons: {
    icon: '/logo.svg',
  },
};
```

### Theme Provider

```typescript
<ThemeProvider
  attribute="class"      // Use class-based dark mode
  defaultTheme="dark"    // Start in dark mode
  enableSystem           // Respect system preference
  disableTransitionOnChange  // Prevent flash
>
  {children}
</ThemeProvider>
```

**Props:**
| Prop | Type | Purpose |
|------|------|---------|
| `attribute` | string | How to apply theme ('class' or 'data-theme') |
| `defaultTheme` | string | Initial theme ('light', 'dark', 'system') |
| `enableSystem` | boolean | Use system preference |
| `storageKey` | string | Local storage key for preference |

### Toaster

```typescript
<Toaster 
  position="bottom-right"
  richColors
  closeButton
/>
```

Provides toast notifications via `sonner`.

---

## Providers Available

The layout can include additional providers:

### Potential Additions

```typescript
// React Query
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// State Management
import { Provider as ZustandProvider } from 'zustand';

// Internationalization
import { NextIntlClientProvider } from 'next-intl';
```

---

## Usage in Components

### Theme Access

```typescript
import { useTheme } from 'next-themes';

function MyComponent() {
  const { theme, setTheme, systemTheme } = useTheme();
  
  return (
    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
      Toggle Theme
    </button>
  );
}
```

### Toast Notifications

```typescript
import { toast } from 'sonner';

function MyComponent() {
  const handleAction = () => {
    toast.success('Action completed!');
    toast.error('Something went wrong');
    toast.info('For your information');
  };
}
```

---

## HTML Structure

The layout generates:

```html
<!DOCTYPE html>
<html lang="en" class="dark">
  <head>
    <!-- Metadata, fonts, styles -->
  </head>
  <body class="font-sans antialiased">
    <div class="theme-provider">
      <!-- Page content -->
    </div>
    <div id="toaster">
      <!-- Toast notifications -->
    </div>
  </body>
</html>
```

---

## Relationships

```
layout.tsx
├── Imports globals.css
│   └── All global styles
│
├── Provides ThemeProvider
│   └── Used by page.tsx for dark mode
│
├── Provides Toaster
│   └── Used by all components for notifications
│
└── Wraps page.tsx
    └── All page content
```

---

## Adding Providers

To add a new provider:

```typescript
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <QueryClientProvider client={queryClient}>
            <OtherProvider>
              {children}
            </OtherProvider>
          </QueryClientProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
```

---

## Performance Considerations

- **Font Loading**: Google fonts are optimized by Next.js
- **Provider Order**: Minimal providers to reduce tree depth
- **suppressHydrationWarning**: Prevents hydration mismatch for theme class

---

## SEO Metadata

Enhanced metadata for search engines:

```typescript
export const metadata: Metadata = {
  title: 'Team AI Dashboard',
  description: 'Multi-agent AI collaboration platform',
  openGraph: {
    title: 'Team AI Dashboard',
    description: 'Collaborate with 79+ AI providers',
    type: 'website',
    images: ['/og-image.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Team AI Dashboard',
  },
};
```
