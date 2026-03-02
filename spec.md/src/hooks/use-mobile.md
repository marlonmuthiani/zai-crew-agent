# use-mobile.ts - Mobile Detection Hook

## Overview

`src/hooks/use-mobile.ts` provides a custom hook for detecting mobile devices and responsive breakpoints.

## Purpose

- Detect mobile viewport
- Adjust UI for touch devices
- Implement responsive behaviors
- Handle orientation changes

## Import

```typescript
import { useMobile } from '@/hooks/use-mobile';
```

## Usage

### Basic Usage

```typescript
import { useMobile } from '@/hooks/use-mobile';

function MyComponent() {
  const isMobile = useMobile();
  
  return (
    <div className={isMobile ? 'p-2' : 'p-4'}>
      {isMobile ? 'Mobile View' : 'Desktop View'}
    </div>
  );
}
```

### With Breakpoint

```typescript
function ResponsiveComponent() {
  const isMobile = useMobile(768); // Custom breakpoint
  
  if (isMobile) {
    return <MobileNavigation />;
  }
  
  return <DesktopNavigation />;
}
```

---

## Hook Implementation

```typescript
import { useState, useEffect } from 'react';

export function useMobile(breakpoint: number = 768): boolean {
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    
    // Check on mount
    checkMobile();
    
    // Listen for resize
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, [breakpoint]);
  
  return isMobile;
}
```

---

## Common Use Cases

### Conditional Rendering

```typescript
function Navigation() {
  const isMobile = useMobile();
  
  return (
    <nav>
      {isMobile ? (
        <MobileMenu />
      ) : (
        <DesktopMenu />
      )}
    </nav>
  );
}
```

### Touch Events

```typescript
function InteractiveElement() {
  const isMobile = useMobile();
  
  return (
    <div
      onClick={!isMobile ? handleClick : undefined}
      onTouchStart={isMobile ? handleTouch : undefined}
    >
      Content
    </div>
  );
}
```

### Layout Adjustments

```typescript
function Dashboard() {
  const isMobile = useMobile();
  
  return (
    <div className={cn(
      'grid gap-4',
      isMobile ? 'grid-cols-1' : 'grid-cols-3'
    )}>
      {/* Cards */}
    </div>
  );
}
```

---

## Relationships

```
use-mobile.ts
├── React hooks
│   ├── useState
│   └── useEffect
│
└── Used by
    ├── page.tsx
    └── Responsive components
```

---

## Performance Notes

- Uses window resize listener (lightweight)
- Cleanup removes listener on unmount
- Consider debouncing for heavy operations
