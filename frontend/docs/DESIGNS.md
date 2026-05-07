---
name: Matchill
colors:
  surface: '#fff8f6'
  surface-dim: '#ecd6cc'
  surface-bright: '#fff8f6'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#fff1eb'
  surface-container: '#ffeae1'
  surface-container-high: '#fae4da'
  surface-container-highest: '#f4ded5'
  on-surface: '#241914'
  on-surface-variant: '#584238'
  inverse-surface: '#3b2e28'
  inverse-on-surface: '#ffede6'
  outline: '#8b7266'
  outline-variant: '#dfc0b3'
  surface-tint: '#a04100'
  primary: '#a04100'
  on-primary: '#ffffff'
  primary-container: '#ff7e36'
  on-primary-container: '#642600'
  inverse-primary: '#ffb693'
  secondary: '#006a65'
  on-secondary: '#ffffff'
  secondary-container: '#6ef4ea'
  on-secondary-container: '#006f69'
  tertiary: '#575f6d'
  on-tertiary: '#ffffff'
  tertiary-container: '#9ba3b3'
  on-tertiary-container: '#313947'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#ffdbcc'
  primary-fixed-dim: '#ffb693'
  on-primary-fixed: '#351000'
  on-primary-fixed-variant: '#7a3000'
  secondary-fixed: '#71f7ed'
  secondary-fixed-dim: '#4fdad1'
  on-secondary-fixed: '#00201e'
  on-secondary-fixed-variant: '#00504c'
  tertiary-fixed: '#dbe3f4'
  tertiary-fixed-dim: '#bfc7d7'
  on-tertiary-fixed: '#141c28'
  on-tertiary-fixed-variant: '#3f4755'
  background: '#fff8f6'
  on-background: '#241914'
  surface-variant: '#f4ded5'
typography:
  display-lg:
    fontFamily: Lexend
    fontSize: 48px
    fontWeight: '800'
    lineHeight: '1.1'
    letterSpacing: -0.02em
  headline-xl:
    fontFamily: Lexend
    fontSize: 32px
    fontWeight: '700'
    lineHeight: '1.2'
  headline-md:
    fontFamily: Lexend
    fontSize: 24px
    fontWeight: '700'
    lineHeight: '1.3'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '600'
    lineHeight: '1.2'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 40px
  xxl: 64px
  gutter: 16px
  margin: 20px
---

## Brand & Style

The personality of the design system is defined by "The Adrenaline Rush Meets Community Chill." It captures the friction and excitement of a live match while maintaining the approachability of a local sports club. The target audience includes active urbanites, competitive amateur athletes, and weekend warriors looking for seamless social connectivity.

The visual style is **High-Contrast / Bold**, utilizing aggressive color pairings and massive typography to create a sense of momentum. This is tempered by modern, clean execution and professional layouts that ensure the booking process feels reliable and fast. Every screen should feel "in motion," utilizing asymmetric layouts and diagonal accents to lead the eye toward key actions like "Book Now" or "Join Match."

## Colors

The palette is anchored by the **Vibrant Orange** and **Teal** from the logo, used to signify action and freshness respectively. 

- **Primary (Orange):** Used for primary calls-to-action (CTAs) and "hot" availability states.
- **Secondary (Teal):** Used for navigation elements, confirmation states, and community-focused features.
- **Deep Navy (Tertiary):** Provides the grounding force, used for high-impact typography and dark-mode surfaces to create sharp contrast against the vibrant primary colors.
- **Accents (Amber/Mint):** Used sparingly for secondary status indicators (e.g., "filling fast" or "new match").

Subtle gradients should be applied to primary buttons and headers, transitioning from the vibrant orange to a slightly deeper coral or from teal to the soft mint to mimic the logo's energy.

## Typography

This design system uses **Lexend** for all headings to leverage its athletic and clear character. To convey movement, top-level display headings should be occasionally styled with a slight italic/slanted variant (8 degrees) in marketing-heavy sections.

**Inter** is the workhorse for body text, providing high legibility in dense lists and complex booking schedules. We utilize tight tracking on large headings to create a dense, "heavy-impact" look, while keeping body text open and airy for maximum readability during high-activity use.

## Layout & Spacing

The layout philosophy follows a **fluid grid** model optimized for mobile-first interactions. We use an 8px base grid to maintain rhythmic consistency. 

Key layout decisions include:
- **Dynamic Padding:** Containers use generous vertical padding (`xl` or `xxl`) to separate different types of sports or booking categories, preventing the UI from feeling "cramped."
- **Asymmetric Spacing:** To increase energy, certain elements (like hero images or featured matches) should bleed off the edge of the grid or utilize staggered margins.
- **Standard Gutters:** 16px gutters are mandatory for multi-column card layouts to ensure touch targets remain distinct.

## Elevation & Depth

Hierarchy is established through **Tonal Layers** and **Tinted Shadows**. Rather than generic gray shadows, this design system uses low-opacity shadows tinted with the brand's Deep Navy or Teal to keep the interface looking "alive."

- **Level 1 (Base):** Neutral surface color.
- **Level 2 (Cards):** White background with a soft, 12% opacity Navy shadow (Blur: 10px, Y: 4px).
- **Level 3 (Pop-ups/Modals):** High-contrast background with a more pronounced shadow to create immediate focus.
- **Gradients as Depth:** Subtle linear gradients on surfaces create a "curved" feel, mimicking the surface of a ball or a court boundary.

## Shapes

The design system adopts a **Rounded** shape language (Level 2). This balances the "high-impact" typography with a friendly, communal feel.

- **Buttons:** 0.5rem (8px) corner radius for standard actions. Large "Match" buttons can scale to 1rem for a more approachable, tactile feel.
- **Cards:** Use `rounded-lg` (1rem) to soften the high-contrast imagery and bold text within.
- **Badges/Chips:** Utilize fully pill-shaped (rounded-full) corners to distinguish status indicators from clickable buttons.

## Components

### Buttons
Primary buttons use a vibrant gradient from Orange to Amber with bold, uppercase Lexend text. Secondary buttons utilize the Teal color with a ghost/outline style for less critical actions.

### Court Cards
Cards should feature high-quality imagery with a Teal or Orange "availability" badge anchored to the top-right. The bottom section should include high-contrast Navy text for the venue name and Inter-based labels for price and distance.

### Skill Level Badges
To facilitate matchmaking, skill levels (Beginner, Intermediate, Pro) are color-coded using the secondary and accent palette, utilizing pill shapes for quick visual scanning.

### Input Fields
Fields should have a subtle 1px border in a light Navy tint, which transforms into a bold 2px Teal border on focus, signaling the "active" state of the user.

### Floating Action Button (FAB)
The "Create Match" FAB is a prominent Orange circle with a white icon, positioned to be the most accessible element for one-handed mobile use.