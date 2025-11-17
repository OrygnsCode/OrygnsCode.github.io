# Origins Client Portal - Design Style Guide

## Design Philosophy

### Visual Language
The Origins Client Portal embodies a sophisticated, trustworthy, and modern aesthetic that conveys enterprise-grade reliability while maintaining exceptional usability. The design philosophy centers on creating a professional environment that instills confidence in both clients and administrators.

### Color Palette
**Primary Colors:**
- Deep Navy (#0D1B2A) - Primary brand color, used for headers, navigation, and key UI elements
- Accent Teal (#00B4D8) - Interactive elements, buttons, links, and status indicators
- Pure White (#FFFFFF) - Background, cards, and content areas
- Light Grey (#F4F7FA) - Secondary backgrounds, subtle dividers, and inactive states

**Supporting Colors:**
- Success Green (#10B981) - Positive actions, completed states, success messages
- Warning Amber (#F59E0B) - Pending states, attention items, warnings
- Error Red (#EF4444) - Error states, critical alerts, failed actions
- Text Charcoal (#374151) - Primary text content for optimal readability

### Typography
**Primary Font:** Inter (Sans-serif)
- Clean, modern, and highly legible across all devices
- Excellent readability at all sizes
- Professional appearance suitable for enterprise applications

**Font Hierarchy:**
- H1: 2.5rem (40px) - Page titles, bold weight
- H2: 2rem (32px) - Section headers, semibold weight
- H3: 1.5rem (24px) - Subsection headers, medium weight
- Body: 1rem (16px) - Regular content, normal weight
- Small: 0.875rem (14px) - Captions, metadata, light weight

## Visual Effects & Styling

### Used Libraries
- **Anime.js** - Smooth micro-interactions and UI animations
- **ECharts.js** - Interactive data visualizations and analytics charts
- **Typed.js** - Dynamic text effects for hero sections
- **Splitting.js** - Advanced text animations and effects
- **Pixi.js** - High-performance visual effects and backgrounds
- **Matter.js** - Physics-based animations for engaging interactions

### Animation Principles
- **Subtle Motion**: All animations serve a functional purpose
- **Consistent Timing**: 200-300ms for micro-interactions, 400-600ms for page transitions
- **Easing**: Custom cubic-bezier curves for natural, organic motion
- **Performance**: Hardware-accelerated transforms for smooth 60fps animations

### Header Effects
- **Gradient Flow Background**: Subtle animated gradient using CSS and Pixi.js
- **Floating Particles**: Minimal particle system suggesting connectivity and technology
- **Typography Animation**: Staggered letter reveals using Splitting.js
- **Depth Layers**: Parallax scrolling effects for visual hierarchy

### Interactive Elements
- **Hover States**: 3D tilt effects on cards, glow transitions on buttons
- **Loading States**: Skeleton screens and progress indicators
- **Micro-interactions**: Button press feedback, form field focus animations
- **Data Visualization**: Interactive charts with hover details and smooth transitions

### Layout & Spacing
- **Grid System**: 12-column responsive grid with consistent gutters
- **Vertical Rhythm**: 8px base unit for consistent spacing
- **Content Width**: Maximum 1200px with centered alignment
- **Mobile-First**: Responsive breakpoints at 640px, 768px, 1024px, 1280px

### Component Styling
- **Cards**: Subtle shadows, rounded corners (8px), hover elevation
- **Buttons**: Consistent padding, border-radius (6px), clear hierarchy
- **Forms**: Clean input styling, focus states, validation feedback
- **Navigation**: Fixed header with backdrop blur, smooth transitions

### Data Visualization Theme
- **Color Harmony**: Maximum 3 colors per chart, consistent with brand palette
- **Saturation**: All chart colors below 50% saturation for professional appearance
- **Accessibility**: High contrast ratios, colorblind-friendly palettes
- **Interactivity**: Smooth hover states, tooltip animations, zoom capabilities

### Background Treatment
- **Primary Background**: Consistent light grey (#F4F7FA) throughout all pages
- **Decorative Elements**: Subtle geometric patterns in corners
- **Visual Depth**: Layered cards and shadows for dimensional hierarchy
- **No Gradients**: Solid colors only, maintaining professional appearance

### Mobile Optimization
- **Touch Targets**: Minimum 44px for all interactive elements
- **Gesture Support**: Swipe navigation, pull-to-refresh
- **Performance**: Optimized animations, lazy loading, compressed assets
- **Accessibility**: Screen reader support, keyboard navigation, high contrast mode