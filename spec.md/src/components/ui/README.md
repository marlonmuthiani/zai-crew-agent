# UI Components - shadcn/ui Library

## Overview

The `src/components/ui/` directory contains 40+ reusable UI components from the shadcn/ui library. These are Radix UI primitives styled with Tailwind CSS.

## Purpose

- Provide consistent, accessible UI components
- Enable rapid UI development
- Ensure design system consistency
- Support dark mode out of the box

## Component List

### Layout & Structure

| Component | File | Purpose |
|-----------|------|---------|
| Card | `card.tsx` | Container for content sections |
| Sheet | `sheet.tsx` | Side panel/drawer |
| Dialog | `dialog.tsx` | Modal dialogs |
| Tabs | `tabs.tsx` | Tabbed content |
| Accordion | `accordion.tsx` | Collapsible sections |
| Separator | `separator.tsx` | Visual dividers |
| ScrollArea | `scroll-area.tsx` | Custom scrollable areas |
| Resizable | `resizable.tsx` | Resizable panels |

### Forms & Input

| Component | File | Purpose |
|-----------|------|---------|
| Button | `button.tsx` | Clickable actions |
| Input | `input.tsx` | Text input field |
| Textarea | `textarea.tsx` | Multi-line text |
| Select | `select.tsx` | Dropdown selection |
| Checkbox | `checkbox.tsx` | Boolean toggle |
| Switch | `switch.tsx` | On/off toggle |
| Slider | `slider.tsx` | Range selection |
| Form | `form.tsx` | Form wrapper with validation |
| Label | `label.tsx` | Input labels |
| RadioGroup | `radio-group.tsx` | Mutually exclusive options |

### Navigation

| Component | File | Purpose |
|-----------|------|---------|
| NavigationMenu | `navigation-menu.tsx` | Site navigation |
| Breadcrumb | `breadcrumb.tsx` | Path indicator |
| Menubar | `menubar.tsx` | Menu bar |
| DropdownMenu | `dropdown-menu.tsx` | Dropdown menus |
| ContextMenu | `context-menu.tsx` | Right-click menus |
| Pagination | `pagination.tsx` | Page navigation |
| Sidebar | `sidebar.tsx` | Side navigation |

### Data Display

| Component | File | Purpose |
|-----------|------|---------|
| Table | `table.tsx` | Tabular data |
| Badge | `badge.tsx` | Status indicators |
| Avatar | `avatar.tsx` | User avatars |
| Progress | `progress.tsx` | Progress bars |
| Skeleton | `skeleton.tsx` | Loading placeholders |
| Chart | `chart.tsx` | Data visualization |
| Calendar | `calendar.tsx` | Date picker |
| HoverCard | `hover-card.tsx` | Hover tooltips |

### Feedback

| Component | File | Purpose |
|-----------|------|---------|
| Alert | `alert.tsx` | Alert messages |
| AlertDialog | `alert-dialog.tsx` | Confirmation dialogs |
| Toast | `toast.tsx` | Toast notifications |
| Toaster | `toaster.tsx` | Toast container |
| Sonner | `sonner.tsx` | Alternative toast system |

### Overlay

| Component | File | Purpose |
|-----------|------|---------|
| Popover | `popover.tsx` | Popup content |
| Tooltip | `tooltip.tsx` | Hover hints |
| Drawer | `drawer.tsx` | Bottom/side drawer |

### Utility

| Component | File | Purpose |
|-----------|------|---------|
| Command | `command.tsx` | Command palette |
| Toggle | `toggle.tsx` | Toggle button |
| ToggleGroup | `toggle-group.tsx` | Grouped toggles |
| AspectRatio | `aspect-ratio.tsx` | Aspect ratio container |
| Carousel | `carousel.tsx` | Image carousel |
| Collapsible | `collapsible.tsx` | Collapsible content |

---

## Usage Example

### Button

```tsx
import { Button } from '@/components/ui/button';

<Button variant="default" size="sm">
  Click me
</Button>

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
</Card>
```

### Dialog

```tsx
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Dialog Title</DialogTitle>
    </DialogHeader>
    Dialog content here
  </DialogContent>
</Dialog>
```

### Select

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select defaultValue="option1">
  <SelectTrigger>
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
  </SelectContent>
</Select>
```

---

## Customization

### Styling

Components use Tailwind CSS classes and can be customized with the `className` prop:

```tsx
<Button className="bg-indigo-500 hover:bg-indigo-600">
  Custom Button
</Button>
```

### Theming

Colors are controlled by CSS variables in `globals.css`:

```css
:root {
  --primary: 222.2 47.4% 11.2%;
  --secondary: 210 40% 96.1%;
  --accent: 210 40% 96.1%;
}
```

---

## Adding New Components

To add a new shadcn/ui component:

```bash
bunx shadcn@latest add [component-name]
```

Example:
```bash
bunx shadcn@latest add dialog
bunx shadcn@latest add select
```

---

## Accessibility

All components are built on Radix UI primitives, which provide:

- Keyboard navigation
- Screen reader support
- ARIA attributes
- Focus management

---

## Relationships

```
components/ui/
├── Used by page.tsx
│   └── All dashboard UI elements
│
├── Uses Tailwind CSS
│   └── Utility classes
│
├── Built on Radix UI
│   └── Accessible primitives
│
└── Imports from lib/utils.ts
    └── cn() helper for class merging
```
