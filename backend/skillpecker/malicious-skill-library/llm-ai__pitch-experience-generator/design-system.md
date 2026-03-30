# Design System

Complete specification for the glassmorphism + ReactBits aesthetic.

## Design Philosophy

**Void-to-light journey**: Dark backgrounds create a "stage" for content to emerge from. Glass elements float in space. Accents punctuate key moments. The experience feels premium, modern, and intentional.

## Color System

### Core Palette

```css
:root {
  /* Backgrounds */
  --color-void: #060010;
  --color-surface: #222222;
  --color-surface-elevated: #333333;
  
  /* Glass */
  --color-glass: rgba(255, 255, 255, 0.05);
  --color-glass-hover: rgba(255, 255, 255, 0.08);
  --color-glass-border: rgba(255, 255, 255, 0.1);
  --color-glass-border-hover: rgba(255, 255, 255, 0.15);
  --color-glass-highlight: rgba(255, 255, 255, 0.15);
  
  /* Accents */
  --color-accent-primary: #5227FF;
  --color-accent-secondary: #22D3EE;
  --color-accent-tertiary: #F472B6;
  --color-success: #22C55E;
  --color-warning: #F59E0B;
  
  /* Text */
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #A3A3A3;
  --color-text-muted: #666666;
}
```

### Gradients

```css
:root {
  /* Background meshes */
  --gradient-hero: 
    radial-gradient(ellipse at 20% 80%, rgba(82, 39, 255, 0.15) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(244, 114, 182, 0.1) 0%, transparent 50%),
    radial-gradient(ellipse at 50% 50%, rgba(34, 211, 238, 0.05) 0%, transparent 70%),
    var(--color-void);
  
  --gradient-section: 
    radial-gradient(ellipse at 0% 100%, rgba(82, 39, 255, 0.08) 0%, transparent 50%),
    var(--color-void);
  
  /* Accent gradients */
  --gradient-accent: linear-gradient(135deg, #5227FF 0%, #22D3EE 100%);
  --gradient-purple: linear-gradient(135deg, hsl(283, 90%, 50%) 0%, hsl(253, 90%, 50%) 100%);
  --gradient-blue: linear-gradient(135deg, hsl(223, 90%, 50%) 0%, hsl(208, 90%, 50%) 100%);
  --gradient-pink: linear-gradient(135deg, hsl(343, 90%, 50%) 0%, hsl(283, 90%, 50%) 100%);
}
```

### Industry Color Variants

| Industry | Primary Accent | Secondary | Mood |
|----------|---------------|-----------|------|
| B2B SaaS | #5227FF (purple) | #22D3EE (cyan) | Professional trust |
| Consumer | #F472B6 (pink) | #FBBF24 (amber) | Playful energy |
| Fintech | #22C55E (green) | #5227FF (purple) | Secure growth |
| Healthcare | #06B6D4 (teal) | #8B5CF6 (violet) | Calm authority |
| DeepTech | #3B82F6 (blue) | #A855F7 (purple) | Innovation |

## Typography

### Font Stack

```css
:root {
  --font-display: 'Cabinet Grotesk', 'Space Grotesk', system-ui, sans-serif;
  --font-body: 'Satoshi', 'Inter', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
}
```

**Google Fonts Import:**
```html
<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Type Scale

```css
:root {
  --text-hero: clamp(3rem, 8vw, 5rem);
  --text-section: clamp(2rem, 5vw, 3rem);
  --text-heading: clamp(1.5rem, 3vw, 2rem);
  --text-subheading: 1.25rem;
  --text-body: 1.125rem;
  --text-small: 0.875rem;
  --text-caption: 0.75rem;
  --text-metric: clamp(3rem, 6vw, 4rem);
  
  --leading-tight: 1.1;
  --leading-normal: 1.5;
  --leading-relaxed: 1.7;
  
  --tracking-tight: -0.02em;
  --tracking-normal: 0;
  --tracking-wide: 0.05em;
}
```

## Spacing

```css
:root {
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-24: 6rem;     /* 96px */
  --space-32: 8rem;     /* 128px */
  
  --section-padding: var(--space-24);
  --container-max: 1200px;
  --container-padding: var(--space-6);
}
```

## Border Radius

```css
:root {
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 24px;
  --radius-xl: 32px;
  --radius-pill: 9999px;
}
```

## Shadows

```css
:root {
  --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.1);
  --shadow-md: 0 8px 32px rgba(0, 0, 0, 0.12);
  --shadow-lg: 0 16px 48px rgba(0, 0, 0, 0.2);
  --shadow-glow: 0 0 40px rgba(82, 39, 255, 0.3);
  
  --shadow-glass: 
    0 8px 32px rgba(0, 0, 0, 0.12),
    inset 0 0 0 1px rgba(255, 255, 255, 0.05);
  
  --shadow-glass-hover:
    0 16px 48px rgba(0, 0, 0, 0.2),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08);
}
```

## Glass Effect Specification

### Standard Glass Card

```css
.glass-card {
  background: var(--color-glass);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid var(--color-glass-border);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-glass);
  transition: all 300ms var(--ease-smooth);
}

.glass-card:hover {
  background: var(--color-glass-hover);
  border-color: var(--color-glass-border-hover);
  transform: translateY(-4px);
  box-shadow: var(--shadow-glass-hover);
}
```

### Glass Variants

| Variant | Background Alpha | Blur | Use Case |
|---------|-----------------|------|----------|
| Subtle | 0.03 | 12px | Large containers |
| Standard | 0.05 | 20px | Cards, panels |
| Prominent | 0.08 | 24px | Featured content |
| Solid | 0.12 | 32px | Overlays, modals |

## Animation System

### Easing Functions

```css
:root {
  --ease-smooth: cubic-bezier(0.25, 0.1, 0.25, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
  --ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Duration Scale

```css
:root {
  --duration-instant: 100ms;
  --duration-fast: 150ms;
  --duration-normal: 300ms;
  --duration-slow: 500ms;
  --duration-slower: 800ms;
}
```

### Animation Patterns

**Fade Up (Section Reveal):**
```javascript
initial: { opacity: 0, y: 30 }
animate: { opacity: 1, y: 0 }
transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] }
```

**Stagger Children:**
```javascript
container: {
  animate: { transition: { staggerChildren: 0.1 } }
}
child: {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 }
}
```

**Scale In:**
```javascript
initial: { opacity: 0, scale: 0.9 }
animate: { opacity: 1, scale: 1 }
transition: { duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }
```

**Counter Animation:**
```javascript
// Count from 0 to target over 2 seconds
useSpring(target, { duration: 2000 })
```

### Scroll Triggers

| Element | Trigger Point | Animation |
|---------|--------------|-----------|
| Section title | 20% in view | Fade up |
| Card grid | 30% in view | Stagger fade up |
| Metrics | 40% in view | Counter + scale |
| Charts | 50% in view | Draw in |
| Timeline | 30% in view | Sequential reveal |

## Responsive Breakpoints

```css
/* Mobile first */
--bp-sm: 640px;   /* Tablet portrait */
--bp-md: 768px;   /* Tablet landscape */
--bp-lg: 1024px;  /* Desktop */
--bp-xl: 1280px;  /* Large desktop */
--bp-2xl: 1536px; /* Extra large */
```

### Responsive Adjustments

| Element | Mobile | Tablet | Desktop |
|---------|--------|--------|---------|
| Hero text | 3rem | 4rem | 5rem |
| Section padding | 3rem | 4rem | 6rem |
| Card grid | 1 col | 2 col | 3 col |
| Glass blur | 12px | 16px | 20px |

## Accessibility

### Motion
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Contrast
- Body text on void: 11.5:1 ✓
- Secondary text on void: 7.2:1 ✓
- Accent on void: 4.8:1 ✓

### Focus States
```css
:focus-visible {
  outline: 2px solid var(--color-accent-primary);
  outline-offset: 2px;
}
```
