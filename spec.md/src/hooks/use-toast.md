# use-toast.ts - Toast Notifications Hook

## Overview

`src/hooks/use-toast.ts` provides a custom hook for managing toast notifications in the application. It wraps shadcn/ui's toast system for consistent notification handling.

## Purpose

- Show success, error, warning, and info notifications
- Manage toast state and lifecycle
- Provide typed notification functions
- Handle toast dismissal

## Import

```typescript
import { useToast } from '@/hooks/use-toast';
import { toast } from 'sonner';
```

## Usage

### Basic Usage

```typescript
import { useToast } from '@/hooks/use-toast';

function MyComponent() {
  const { toast } = useToast();
  
  const handleSuccess = () => {
    toast({
      title: 'Success',
      description: 'Operation completed successfully',
    });
  };
  
  return <button onClick={handleSuccess}>Do Something</button>;
}
```

### Toast Types

```typescript
// Success
toast({
  title: 'Success',
  description: 'Agent created successfully',
  variant: 'default',
});

// Error
toast({
  title: 'Error',
  description: 'Failed to create agent',
  variant: 'destructive',
});

// Warning
toast({
  title: 'Warning',
  description: 'API key is missing',
});

// Info
toast({
  title: 'Info',
  description: 'Processing your request',
});
```

### With Action

```typescript
toast({
  title: 'Agent Created',
  description: 'Would you like to configure it now?',
  action: (
    <ToastAction altText="Configure" onClick={handleConfigure}>
      Configure
    </ToastAction>
  ),
});
```

### With Duration

```typescript
toast({
  title: 'Quick Update',
  description: 'This will disappear quickly',
  duration: 3000, // 3 seconds
});
```

---

## Toast Options

```typescript
interface ToastOptions {
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
  duration?: number;
  action?: React.ReactNode;
}
```

---

## Relationships

```
use-toast.ts
├── Uses sonner (toast library)
│   └── Provided by layout.tsx Toaster component
│
├── Used by page.tsx
│   └── All notification triggers
│
└── Used by components
    └── Success/error feedback
```

---

## Alternative: Direct Sonner Usage

For simpler cases, use sonner directly:

```typescript
import { toast } from 'sonner';

// Simple
toast.success('Success!');
toast.error('Failed!');
toast.info('Information');

// With promise
toast.promise(saveData(), {
  loading: 'Saving...',
  success: 'Saved!',
  error: 'Failed to save',
});

// With action
toast('Event created', {
  action: {
    label: 'Undo',
    onClick: () => console.log('Undo'),
  },
});
```
