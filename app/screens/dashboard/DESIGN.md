# Design System Strategy: The Financial Sanctuary

## 1. Overview & Creative North Star
This design system is built upon the Creative North Star of **"The Lucid Sanctuary."** In the chaotic world of high-frequency finance and betting, our interface must act as a calming, high-clarity lens. We move beyond the "standard dashboard" by rejecting rigid, boxy layouts in favor of an organic, editorial flow. 

By leveraging **Plus Jakarta Sans**—a typeface that feels more sophisticated and geometric than standard Roboto—and embracing extreme corner radii, we create a UI that feels "molded" rather than "assembled." The experience is defined by intentional asymmetry and "Breathing Volume," where negative space is treated as a premium structural element rather than empty gaps.

---

## 2. Color & Surface Architecture
The color palette avoids the clinical coldness of pure greys, opting instead for a "Soft Light" approach that prioritizes comfort during long sessions.

### Surface Hierarchy & Nesting
We abandon the flat grid. Depth is achieved through a tiered "Stacking Logic":
*   **Base Layer:** `surface` (#f8f9fa) acts as the canvas.
*   **Sectioning:** Use `surface-container-low` (#f3f4f5) to define large content areas.
*   **Actionable Containers:** Use `surface-container-lowest` (#ffffff) for primary cards to create a natural, "soft-lift" effect.

### The "No-Line" Rule
**Explicit Instruction:** Traditional 1px solid borders (`#E5E7EB`) are prohibited for sectioning. Boundaries must be defined solely through background color shifts. A `surface-container-lowest` card sitting on a `surface-container-low` background provides all the separation a modern eye needs.

### Signature Textures & Glass
To provide a premium polish, utilize **Glassmorphism** for navigation bars and floating overlays.
*   **Glass Token:** `surface` at 70% opacity with a `20px` backdrop-blur. 
*   **Signature Gradient:** For primary CTAs, use a linear gradient: `primary` (#006c49) to `primary_container` (#10b981) at a 135-degree angle. This adds "soul" to the success-oriented actions.

---

## 3. Typography: Editorial Authority
We utilize **Plus Jakarta Sans** to elevate the interface from "utility" to "editorial."

*   **Display & Headlines:** Use `display-lg` and `headline-md` for high-impact data points (e.g., Total Balance). These should feel authoritative and large, creating a clear entry point for the eye.
*   **The Title Scale:** `title-lg` and `title-md` serve as the "Anchor" for cards, always paired with generous top-padding to let the content breathe.
*   **Labels & Metadata:** `label-md` and `label-sm` should be used for secondary data and micro-copy. Use `on_surface_variant` (#3c4a42) to reduce visual noise compared to the primary body text.

---

## 4. Elevation & Depth: Tonal Layering
We reject heavy, muddy shadows. Light and depth in this system mimic natural ambient light.

*   **The Layering Principle:** Depth is "stacked." Place a card (`surface-container-lowest`) on a background (`surface-container-low`) to create a soft, natural lift without any shadows.
*   **Ambient Shadows:** When a floating element (like a Modal or Dropdown) is required, use an extra-diffused shadow:
    *   `X: 0, Y: 12, Blur: 40, Spread: 0, Color: rgba(25, 28, 29, 0.06)`
*   **The "Ghost Border" Fallback:** If accessibility requires a stroke (e.g., in high-contrast modes), use a "Ghost Border": `outline-variant` (#bbcabf) at **15% opacity**. Never use a 100% opaque border.

---

## 5. Components

### Buttons & Interaction
*   **Primary:** High-roundness (`full`). Gradient-filled (`primary` to `primary_container`). White text. Subtle inner-glow on hover.
*   **Secondary:** Ghost style. No background, `primary` text, and a `Ghost Border`.
*   **Tertiary:** Low-impact. Text-only with an icon. Use for "Cancel" or "Back" actions.

### Cards & Lists
*   **Card Styling:** Radius of `lg` (2rem). No borders. Separation is achieved through `surface-container-lowest` on `surface-container-low`.
*   **The Divider Ban:** Do not use line dividers in lists. Use vertical white space (`1.5rem` minimum) or a 4px vertical pill of `primary_fixed` to indicate selection/active status.

### Inputs & Selection
*   **Input Fields:** `surface-container-highest` background. Radius of `DEFAULT` (1rem). The label should sit inside the container in `label-sm` for a "contained" feel.
*   **Chips:** Use `secondary_fixed` for informational chips and `primary_fixed` for success chips. These should be `full` rounded to look like smooth pebbles.

### Specialized Financial Components
*   **Profit/Loss Sparklines:** Use `primary` for growth and `tertiary` for loss. Lines should be 2px thick with a subtle gradient fill underneath (10% opacity) to create a "wave" feel.

---

## 6. Do’s and Don’ts

### Do
*   **Do** embrace asymmetry. If a dashboard has three cards, let one be wider to create visual interest.
*   **Do** use "Breathing Room." If you think a card needs more padding, add another `0.5rem`.
*   **Do** use `on_surface_variant` for all non-essential labels to maintain a clean hierarchy.

### Don’t
*   **Don’t** use black (#000000) for text. Always use `on_surface` (#191c1d) to keep the "Sanctuary" vibe.
*   **Don’t** use standard "Drop Shadows." Use Tonal Layering or Ambient Shadows only.
*   **Don’t** use 90-degree corners. Everything in this system—including input focus states—must be rounded to at least `0.5rem`.