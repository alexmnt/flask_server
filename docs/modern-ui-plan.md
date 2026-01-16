# Modern CSS/UI Plan for Flask + MD3 + Tailwind

## Context (current project)
- Templates: `frontend/templates/layout.html`, `frontend/templates/pages/*.html`, `frontend/templates/partials/*.html`
- CSS entrypoint: `frontend/src/styles.css` (imports `frontend/src/md3-theme.css` + Tailwind)
- JS/TS entrypoint: `frontend/src/main.ts` and `frontend/src/app.ts`
- Build output: `frontend/static/dist` (Vite manifest in `.vite/manifest.json`)

## Goals
- Replace basic tooltips with richer, accessible help UI.
- Use modern CSS for layout and typography without breaking older browsers.
- Keep MD3 Web Components for controls and Tailwind for layout/spacing.
- Keep the server-rendered flow; HTMX enhances partial updates only.

## Feature shortlist (priority order)

1) Popover API (best replacement for tooltips)
- What: Native popover surfaces via `popover` and `popovertarget`.
- Why: Focusable, accessible, supports rich content (links, lists, actions), no JS required.
- Support: Chrome/Edge/Safari; Firefox in progress.
- Fallback: Simple JS toggle + `hidden` + `aria-expanded`.
- Docs: https://developer.mozilla.org/en-US/docs/Web/API/Popover_API

2) CSS Anchor Positioning (optional, progressive enhancement)
- What: Anchor a popover to its trigger using CSS only.
- Why: Precise alignment without JS positioning libs.
- Support: Limited; treat as progressive enhancement.
- Fallback: Position relative to a wrapper.
- Docs: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Anchor_Positioning

3) `:has()` for parent-state styling
- What: Style parent cards when child is focused/active.
- Why: Cleaner hover/focus effects without JS classes.
- Support: Modern Chrome/Safari/Firefox; still use fallbacks.
- Fallback: Add class via JS or keep current style.
- Docs: https://developer.mozilla.org/en-US/docs/Web/CSS/:has

4) Container queries
- What: Make components respond to their own container width.
- Why: Better component-level responsiveness than viewport-only breakpoints.
- Support: Modern browsers; use Tailwind breakpoints as fallback.
- Docs: https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Container_Queries

5) View Transitions (optional, progressive enhancement)
- What: Animate page/partial swaps smoothly.
- Why: Subtle polish when HTMX swaps content.
- Support: Chrome/Edge; Safari partial; Firefox pending.
- Fallback: Normal swaps (no animation).
- Docs: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API

6) Typography and color improvements
- `text-wrap: balance | pretty` for better headings and paragraphs.
- `color-mix()` and relative colors for consistent MD3 theming.
- Docs:
  - https://developer.mozilla.org/en-US/docs/Web/CSS/text-wrap
  - https://developer.mozilla.org/en-US/docs/Web/CSS/color_value/color-mix

7) Motion safety
- Respect `prefers-reduced-motion`.
- Docs: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

## Detailed implementation steps

Step 1: Add a reusable popover partial
- Create `frontend/templates/partials/help_popover.html`.
- Use a native `button` as the popover invoker (best compatibility).
- Example structure:
  - `button` with `popovertarget="help-baselines"`
  - `div id="help-baselines" popover` for the content
- Insert in `frontend/templates/pages/index.html` (e.g., near the table header or menu area).

Example markup:
```
<div class="popover-wrap">
  <button class="help-trigger" popovertarget="help-baselines" aria-label="Help">
    ?
  </button>
  <div id="help-baselines" class="popover-card" popover>
    <h3 class="md-typescale-title-small">Baselines help</h3>
    <p class="body">Short guidance and links.</p>
  </div>
</div>
```

Step 2: Popover styling + anchor positioning (progressive)
- Add styles in `frontend/src/md3-theme.css`.
- Base popover styling:
  - `background`, `border`, `border-radius`, `box-shadow`, `padding`
  - Width clamp and max-height with scroll
- Anchor positioning (if supported):
```
@supports (anchor-name: --help) {
  .help-trigger { anchor-name: --help; }
  .popover-card {
    position-anchor: --help;
    position: fixed;
    inset-area: bottom;
    margin-top: 8px;
  }
}
```
- Fallback:
```
@supports not (anchor-name: --help) {
  .popover-wrap { position: relative; }
  .popover-card { position: absolute; top: 100%; right: 0; margin-top: 8px; }
}
```

Step 3: JS fallback (only for non-supporting browsers)
- In `frontend/src/app.ts`:
  - Detect support: `const supportsPopover = "showPopover" in HTMLElement.prototype;`
  - If not supported, toggle `hidden` and `aria-expanded` on click.
- This keeps the project functional on older browsers.

Step 4: `:has()` enhancements
- Use to highlight cards when child elements are active.
- Example:
```
@supports selector(:has(*)) {
  .card:has(.help-trigger:focus-visible) {
    box-shadow: var(--shadow-md);
  }
}
```

Step 5: Container queries for layout refinements
- Add `container-type: inline-size;` to:
  - `.menu-grid`
  - `.table-card`
- Add `@container` rules for:
  - Menu tile spacing or label sizes
  - Table action layout on small containers

Step 6: Typography polish
- Add in `frontend/src/md3-theme.css`:
```
.md-typescale-title-large { text-wrap: balance; }
.body { text-wrap: pretty; }
```

Step 7: View transitions (optional)
- Wrap HTMX swaps in `document.startViewTransition` when available.
- Add light CSS transitions via `::view-transition-*`.
- Keep this optional to avoid unexpected behavior.

## Testing and rollout
- Verify popovers with mouse, keyboard, and screen reader focus.
- Check hover/focus consistency and shadow clipping.
- Test in Chrome, Safari, Firefox (latest).
- Confirm HTMX swaps still work with and without view transitions.
- If needed, gate enhancements behind `@supports` and keep fallbacks.

## Additional references
- HTMX events (for swap hooks): https://htmx.org/events/
- MD3 Web Components: https://github.com/material-components/material-web

## Decision notes (why this approach)
- Popover API replaces tooltips because it is accessible and supports rich content.
- Tailwind stays focused on layout; MD3 remains the control system.
- Progressive enhancement keeps UX stable on older browsers.
