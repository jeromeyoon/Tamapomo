---
name: Zen Focus
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e4e2e1'
  on-surface: '#1b1c1c'
  on-surface-variant: '#57423e'
  inverse-surface: '#303030'
  inverse-on-surface: '#f3f0f0'
  outline: '#8a716d'
  outline-variant: '#dec0bb'
  surface-tint: '#a43b2c'
  primary: '#a43b2c'
  on-primary: '#ffffff'
  primary-container: '#ff7f6a'
  on-primary-container: '#73180c'
  inverse-primary: '#ffb4a7'
  secondary: '#874f46'
  on-secondary: '#ffffff'
  secondary-container: '#fdb5a8'
  on-secondary-container: '#79443b'
  tertiary: '#006b58'
  on-tertiary: '#ffffff'
  tertiary-container: '#00ba9a'
  on-tertiary-container: '#004336'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdad4'
  primary-fixed-dim: '#ffb4a7'
  on-primary-fixed: '#400200'
  on-primary-fixed-variant: '#842417'
  secondary-fixed: '#ffdad4'
  secondary-fixed-dim: '#fdb5a8'
  on-secondary-fixed: '#360f09'
  on-secondary-fixed-variant: '#6b3930'
  tertiary-fixed: '#6cfad7'
  tertiary-fixed-dim: '#49ddbb'
  on-tertiary-fixed: '#002019'
  on-tertiary-fixed-variant: '#005142'
  background: '#fcf9f8'
  on-background: '#1b1c1c'
  surface-variant: '#e4e2e1'
typography:
  timer-display:
    fontFamily: Hanken Grotesk
    fontSize: 80px
    fontWeight: '300'
    lineHeight: 80px
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Hanken Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Hanken Grotesk
    fontSize: 28px
    fontWeight: '600'
    lineHeight: 34px
  body-md:
    fontFamily: Hanken Grotesk
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-caps:
    fontFamily: Hanken Grotesk
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  pet-dialog:
    fontFamily: Hanken Grotesk
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 26px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  container-padding: 32px
  stack-sm: 12px
  stack-md: 24px
  stack-lg: 48px
  section-gap: 64px
---

## Brand & Style
The brand personality is calm, encouraging, and radically simple. It aims to reduce cognitive load for users seeking productivity through the Pomodoro technique while fostering an emotional connection with a virtual pet. 

The design style is **Ultra-Minimalism**. It relies on extreme whitespace, a restrained color palette, and high-quality typography to create a focused environment. By removing unnecessary containers and borders, the UI feels airy and unobtrusive. The virtual pet is integrated as a clean, vector-style companion that reacts to timer milestones, serving as the sole source of "warmth" in an otherwise clinical, functional space.

## Colors
The color strategy is "functional pop." The vast majority of the interface remains pure white (#FFFFFF) to provide a canvas for focus. 

- **Primary (Soft Coral):** Used exclusively for active states, primary action buttons, and the timer's progress arc. Its warmth provides a soft contrast to the stark background.
- **Neutral (Dark Grey):** Reserved for text and iconography to ensure high legibility without the harshness of pure black.
- **Secondary Neutral:** A very light grey used for inactive progress tracks or subtle background divisions where text-only separation isn't sufficient.

## Typography
The design system utilizes **Hanken Grotesk** for its precise, modern, and clinical yet approachable feel. 

The hierarchy is dominated by the **Timer Display**, which uses a light font weight and tight letter spacing to appear like a sophisticated piece of digital horology. Body text is kept small with generous line height to maintain the feeling of "air" within the layout. Labels are used sparingly in all-caps to denote secondary metadata or button text, providing a structural anchor to the fluid layout.

## Layout & Spacing
The layout follows a **No Grid** philosophy, relying on massive internal margins and safe areas to center the user's attention. 

- **Vertical Rhythm:** Elements are stacked centrally. The timer occupies the upper-middle third, the virtual pet sits in the lower-middle third, and controls are pinned to the bottom or floated with significant padding.
- **Mobile-First:** A 32px standard horizontal margin ensures content never feels cramped. 
- **Transitions:** Layout shifts between "Focus" and "Rest" states should be fluid, using the generous whitespace to expand or contract elements without jarring movements.

## Elevation & Depth
This design system intentionally avoids depth. There are no shadows, no blurs, and no multi-layered surfaces. 

Hierarchy is established solely through **size, color, and negative space**. If an element needs to be separated from the background, use a thin 1px line in `#F5F5F5` rather than a shadow. This creates a "paper-flat" aesthetic that feels lightweight and modern.

## Shapes
While the overall aesthetic is sharp and minimal, specific interactive elements use a **Rounded** (0.5rem) language to provide a touch of friendliness that matches the virtual pet concept.

The most prominent shape is the **Circle**, used for the primary timer progress indicator and pet avatars. Buttons should maintain a soft corner, avoiding the aggression of perfectly sharp 0px corners, but stopping short of pill-shapes to remain "architectural."

## Components
- **Buttons:** Primary buttons are filled with `#FF7F6A` with white text. Secondary buttons are text-only with a heavy weight or a 1px `#2D2D2D` outline. No gradients or shadows.
- **Timer Progress:** A thin (2px to 4px) circular stroke. The background track is `#F5F5F5`, and the active progress is `#FF7F6A`.
- **Lists:** Items are separated by whitespace and thin 1px horizontal rules. No container cards are used; the background of the list item is the background of the app.
- **Chips:** Small, rectangular with slightly rounded corners (4px). Used for tag-like data such as "Work," "Study," or "Meditation."
- **Inputs:** A single 1px bottom border that turns Soft Coral on focus. No box enclosure.
- **The Pet:** Represented as a minimalist vector illustration. It should be the only element that uses more than two colors (if necessary), though a monochromatic grey-scale pet is preferred to maintain the system's purity.