# Styling and themes

Chronora ships its own design system: no global stylesheet to import, no framework CSS. Component styles are encapsulated, and every colour, radius, size and shadow is a CSS custom property you can override.

## Themes

`light` (default), `dark`, and `auto` (follows `prefers-color-scheme`).

```ts
provideChronora({ theme: 'auto' });        // global
```

```html
<chr-date-picker theme="dark" />           <!-- per component -->
```

The effective theme is written to the host as `data-chr-theme="light|dark|auto"`; popups carry the same attribute.

## Custom properties

Override any of these on `:root` (or `body`):

| Property | Light default | Dark default | Used for |
| --- | --- | --- | --- |
| `--chr-primary` | `#3b5bdb` | `#7c93ff` | Selection, today ring, focus accents, primary buttons |
| `--chr-primary-contrast` | `#ffffff` | `#0f1226` | Text on `--chr-primary` |
| `--chr-primary-soft` | `#e7ecff` | `#252c58` | Range fill, focus halo, active preset |
| `--chr-surface` | `#ffffff` | `#1b1e2e` | Input and popup background |
| `--chr-surface-alt` | `#f4f5f8` | `#242840` | Disabled / read-only background |
| `--chr-surface-hover` | `#eceef4` | `#2d3250` | Hover background |
| `--chr-text` | `#1c2033` | `#eceef8` | Text |
| `--chr-text-muted` | `#5f6680` | `#a6abc6` | Weekdays, placeholders, adjacent-month days |
| `--chr-text-disabled` | `#a4a9bd` | `#646a88` | Disabled text |
| `--chr-border` | `#cfd3e1` | `#3a4064` | Dividers |
| `--chr-border-strong` | `#8189a5` | `#6b74a6` | Input border |
| `--chr-danger` | `#c92a2a` | `#ff8787` | Invalid state and error messages |
| `--chr-focus-ring` | `#3b5bdb` | `#9db0ff` | Keyboard focus outline |
| `--chr-shadow` | soft two-layer shadow | stronger | Popup elevation |
| `--chr-radius` | `8px` | | Inputs and popups |
| `--chr-radius-sm` | `6px` | | Cells and buttons |
| `--chr-font-family` | system UI stack | | |
| `--chr-font-size` | `14px` | | |
| `--chr-cell-size` | `36px` (`40px` ≤ 420px wide) | | Calendar cell height |
| `--chr-spacing` | `8px` | | Padding unit |
| `--chr-field-width` | `14rem` (time `12rem`, date-time `18rem`, range `22rem`) | | Width of the input fields (all are `inline-block`, capped at 100% of the container). Set `width: 100%` on a field's host element to make it fill its container. |

A value you set applies to **both** light and dark; scope it yourself if you want different values:

```css
:root {
  --chr-primary: #0f766e;
  --chr-radius: 12px;
}
@media (prefers-color-scheme: dark) {
  :root { --chr-primary: #5eead4; }
}
```

> **Set variables on `:root` or `body`.** Popups render in the CDK overlay container, which is a sibling of your app root, so variables set on an arbitrary ancestor of the picker do not reach the popup. Variables on the host element itself (or `:root`) always reach the input.

## How it works

`theming/_tokens.scss` defines, per component host, private `--_chr-*` aliases that each fall back from the public property to a theme default (`--_chr-primary: var(--chr-primary, #3b5bdb)`), plus dark defaults under `[data-chr-theme='dark']` and `@media (prefers-color-scheme: dark)` for `auto`. Because the public property is read with a fallback, your override wins in either theme.

## States

Every interactive element has hover, `:focus-visible`, selected, disabled and invalid styling:

- Calendar cells: `.chr-selected`, `.chr-today`, `.chr-outside`, `.chr-disabled`, `.chr-in-range`, `.chr-range-start`, `.chr-range-end`.
- Fields: invalid (red border, `aria-invalid`), disabled, read-only.
- High-contrast: selected cells and fields get a system `Highlight` outline under `forced-colors: active`.

Internal class names are not a stable API — customise through the custom properties and the `cellTemplate` inputs rather than by targeting `.chr-*` classes.

## Responsive behaviour

Popups are limited to the viewport (`max-width: calc(100vw - 16px)`), repositioned/flipped by the CDK, and on narrow screens (≤ 420px, ≤ 560px for the wider popups) the calendar uses larger cells, the date-time popup stacks the time lists under the calendar, and range presets wrap above the calendar.
