---
name: Vibrant Food Delivery System
colors:
  surface: '#f9f9fc'
  surface-dim: '#dadadc'
  surface-bright: '#f9f9fc'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f3f6'
  surface-container: '#eeeef0'
  surface-container-high: '#e8e8ea'
  surface-container-highest: '#e2e2e5'
  on-surface: '#1a1c1e'
  on-surface-variant: '#5b4137'
  inverse-surface: '#2f3133'
  inverse-on-surface: '#f0f0f3'
  outline: '#8f7065'
  outline-variant: '#e4beb1'
  surface-tint: '#a73a00'
  primary: '#a73a00'
  on-primary: '#ffffff'
  primary-container: '#ff5c00'
  on-primary-container: '#521800'
  inverse-primary: '#ffb59a'
  secondary: '#7c5800'
  on-secondary: '#ffffff'
  secondary-container: '#feb700'
  on-secondary-container: '#6b4b00'
  tertiary: '#bb152c'
  on-tertiary: '#ffffff'
  tertiary-container: '#ff575e'
  on-tertiary-container: '#5f000f'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbce'
  primary-fixed-dim: '#ffb59a'
  on-primary-fixed: '#370e00'
  on-primary-fixed-variant: '#802a00'
  secondary-fixed: '#ffdea8'
  secondary-fixed-dim: '#ffba20'
  on-secondary-fixed: '#271900'
  on-secondary-fixed-variant: '#5e4200'
  tertiary-fixed: '#ffdad8'
  tertiary-fixed-dim: '#ffb3b1'
  on-tertiary-fixed: '#410007'
  on-tertiary-fixed-variant: '#92001c'
  background: '#f9f9fc'
  on-background: '#1a1c1e'
  surface-variant: '#e2e2e5'
typography:
  display-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 40px
    fontWeight: '800'
    lineHeight: 48px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-lg-mobile:
    fontFamily: Plus Jakarta Sans
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 34px
  title-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-md:
    fontFamily: Plus Jakarta Sans
    fontSize: 12px
    fontWeight: '600'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 8px
  sm: 12px
  md: 16px
  lg: 24px
  xl: 32px
  margin-mobile: 16px
  gutter-mobile: 12px
---

## Brand & Style

The brand personality of the design system is energetic, appetizing, and high-velocity. It is engineered for a mobile-first audience that values speed, freshness, and ease of use. The UI should evoke an immediate sensory response, mimicking the warmth and excitement of a bustling kitchen.

The visual direction follows a **Modern / High-Contrast** aesthetic. It utilizes generous white space to let food photography shine, balanced by high-chroma accent colors that guide the eye toward conversion points. The interface feels "alive" through the use of soft, organic shadows and fluid transitions, creating a tactile experience that feels as premium as the food being ordered.

## Colors

The palette is rooted in the "appetite-stimulating" spectrum. 
- **Primary (Vibrant Orange):** Used for main actions, active states, and brand-critical elements.
- **Secondary (Golden Yellow):** Reserved for highlights, ratings, and promotional badges to add warmth.
- **Tertiary (Deep Red):** Used sparingly for urgent notifications, discounts, or favorite toggles.
- **Neutrals:** A range of warm grays ensures the interface doesn't feel cold or clinical, providing a "paper-like" quality to the background surfaces.

Gradient usage is encouraged for headers and primary containers, specifically transitioning from Primary Orange to Tertiary Red to create a sense of movement and heat.

## Typography

This design system utilizes **Plus Jakarta Sans** for its modern, friendly, and highly legible characteristics. The geometric nature of the font complements the rounded UI elements, while its tall x-height ensures readability on small mobile screens.

Headlines should use heavy weights (700-800) to create a clear information hierarchy and inject personality. Body text remains clean and accessible, with a focus on generous line heights to prevent visual fatigue during menu browsing. All caps should be reserved exclusively for small labels and metadata to maintain a clean, editorial look.

## Layout & Spacing

The layout follows a **Fluid Grid** model optimized for mobile viewport constraints. A 4-column grid is used for mobile portrait views, expanding to 8 columns for tablets. 

The spacing rhythm is based on a 4px scale, ensuring consistent alignment across all components. 
- **Margins:** Standard 16px lateral margins for mobile screens to maximize content area.
- **Content Blocks:** Use "lg" (24px) spacing between distinct vertical sections (e.g., "Recently Ordered" vs "Categories").
- **Internal Padding:** Cards and containers use "md" (16px) padding to ensure content feels breathable and premium.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers**. Instead of harsh black shadows, this design system uses "Delicious Shadows"—soft, diffused blurs with a tiny hint of the primary color’s hue (e.g., a subtle orange tint in the shadow) to prevent the UI from looking muddy.

- **Level 0 (Background):** Solid off-white (#F8F9FA).
- **Level 1 (Cards/Inputs):** White surface with a 4px Y-offset shadow, 12px blur, 4% opacity.
- **Level 2 (Interactive/Buttons):** White surface with an 8px Y-offset shadow, 16px blur, 8% opacity.
- **Level 3 (Floating Actions):** Primary color surface with a high-diffusion shadow to indicate immediate priority.

## Shapes

The shape language is defined by a **Rounded** philosophy (0.5rem base radius). This removes visual tension and makes the interface feel more approachable and "friendly." 

- **Standard Buttons/Inputs:** 8px (0.5rem) corner radius.
- **Product Cards:** 16px (1rem) corner radius for a softer, containerized look.
- **Category Chips:** Full pill-shape (circular ends) to distinguish them from actionable buttons.
- **Images:** Always follow the radius of their parent container (usually 16px).

## Components

### Buttons
Primary buttons use the Primary Orange gradient with white text. They should have a minimum height of 48px for mobile tap targets. Secondary buttons use a subtle tinted background (Primary Orange at 10% opacity) with Primary Orange text.

### Product Cards
Cards are the "hero" of the experience. They feature a top-aligned image area with a soft background tint (matching the food category), followed by the item title in `title-md` and price in `title-md` with Primary Orange. Use a "+" icon button in the bottom right corner for quick-add actions.

### Category Chips
Horizontal scrolling chips with small icons. Active state uses a Primary Orange background; inactive state uses a light gray background with Slate text.

### Input Fields
Search bars and text inputs should have a subtle 1px border (#E9ECEF) and a soft Level 1 shadow. Focus states should swap the border for a 2px Primary Orange outline.

### Status Badges
Used for "Fast Delivery" or "Trending." Use the Tertiary Red or Secondary Yellow background with high-contrast text and a pill-shaped container.