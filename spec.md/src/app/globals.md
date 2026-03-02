# globals.css - Global Styles

## Overview

`src/app/globals.css` contains all global CSS styles, Tailwind CSS imports, and custom CSS animations used throughout the dashboard.

## Purpose

- Import Tailwind CSS base styles
- Define CSS custom properties (variables)
- Create custom animations
- Apply base styling to HTML elements
- Define utility classes

## File Structure

```css
/* 1. Tailwind Imports */
@import "tailwindcss";

/* 2. CSS Custom Properties */
@theme {
  --font-sans: ...
  --color-background: ...
  --color-foreground: ...
}

/* 3. Base Styles */
html { ... }
body { ... }

/* 4. Custom Animations */
@keyframes pulse-slow { ... }
@keyframes float { ... }

/* 5. Utility Classes */
.animate-pulse-slow { ... }
```

---

## CSS Custom Properties

### Theme Variables

```css
@theme {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
  
  /* Light mode colors */
  --color-background: #ffffff;
  --color-foreground: #0a0a0a;
  
  /* Dark mode colors */
  --color-background-dark: #0a0a0a;
  --color-foreground-dark: #fafafa;
}
```

### Color Palette

The dashboard uses a professional dark theme:

| Variable | Light Mode | Dark Mode | Usage |
|----------|------------|-----------|-------|
| background | #ffffff | #0a0a1a | Page background |
| foreground | #0a0a0a | #fafafa | Primary text |
| card | #ffffff | #1e1e2e | Card backgrounds |
| border | #e5e5e5 | #334155 | Borders |

---

## Custom Animations

### pulse-slow

A gentle pulsing effect for background elements.

```css
@keyframes pulse-slow {
  0%, 100% {
    opacity: 0.1;
  }
  50% {
    opacity: 0.15;
  }
}

.animate-pulse-slow {
  animation: pulse-slow 4s ease-in-out infinite;
}
```

**Usage:** Subtle background gradient animations

### float

A floating effect for elements.

```css
@keyframes float {
  0%, 100% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
}

.animate-float {
  animation: float 3s ease-in-out infinite;
}
```

**Usage:** Floating UI elements

### glow-pulse

A pulsing glow effect.

```css
@keyframes glow-pulse {
  0%, 100% {
    box-shadow: 0 0 20px rgba(99, 102, 241, 0.3);
  }
  50% {
    box-shadow: 0 0 40px rgba(99, 102, 241, 0.5);
  }
}

.animate-glow-pulse {
  animation: glow-pulse 2s ease-in-out infinite;
}
```

**Usage:** Attention-grabbing elements

---

## Animation Delays

Staggered animation support:

```css
.animation-delay-1000 {
  animation-delay: 1s;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-3000 {
  animation-delay: 3s;
}
```

---

## Utility Classes

### Scrollbar Styling

```css
/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.2);
}
```

### Focus States

```css
*:focus-visible {
  outline: 2px solid #6366f1;
  outline-offset: 2px;
}
```

---

## Base Element Styles

```css
html {
  scroll-behavior: smooth;
}

body {
  font-family: var(--font-sans);
  background-color: var(--color-background);
  color: var(--color-foreground);
  antialiased;
}

/* Selection */
::selection {
  background-color: rgba(99, 102, 241, 0.3);
}
```

---

## Dark Mode Support

Dark mode is applied via class-based switching:

```css
.dark {
  --color-background: #0a0a1a;
  --color-foreground: #fafafa;
}
```

Controlled by `next-themes` in layout.tsx.

---

## Relationships

```
globals.css
├── Imported by layout.tsx
│   └── Applied to all pages
│
├── Uses Tailwind CSS
│   └── @tailwind utilities
│
└── Provides styles for
    ├── page.tsx (animations, colors)
    └── All UI components
```

---

## Adding Custom Styles

### New Animation

```css
@keyframes my-animation {
  0% { transform: scale(1); }
  100% { transform: scale(1.1); }
}

.animate-my-animation {
  animation: my-animation 0.3s ease-out;
}
```

### New Utility Class

```css
.my-custom-class {
  property: value;
}
```

---

## Performance Notes

- Animations use `transform` and `opacity` for GPU acceleration
- No heavy box-shadows or filters on animated elements
- CSS variables enable efficient theming
- Tailwind handles tree-shaking of unused styles
