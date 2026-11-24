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
| `--chr-primary` | `#4c5bd4` | `#7f8cff` | Selected day, primary buttons, accents |
| `--chr-primary-contrast` | `#ffffff` | `#0b0d12` | Text on `--chr-primary` |
| `--chr-primary-soft` | `#eceefd` | `#252a4a` | Active preset, selected time, soft fills |
| `--chr-primary-text` | `#3542ae` | `#c3c9ff` | Text on `--chr-primary-soft` |
| `--chr-surface` | `#ffffff` | `#151821` | Field and popup background |
| `--chr-surface-alt` | `#f7f8fa` | `#1b1f2a` | Disabled / read-only fields, side rails |
| `--chr-surface-hover` | `#eef0f5` | `#232836` | Hover background |
| `--chr-text` | `#151922` | `#e9ebf1` | Text |
| `--chr-text-muted` | `#555d6e` | `#a1a8b8` | Placeholders, secondary text |
| `--chr-text-subtle` | `#6f7685` | `#8e95a6` | Weekday headers, captions |
| `--chr-text-disabled` | `#a6acb8` | `#565d6e` | Disabled text |
| `--chr-border` | `#d5d9e1` | `#2c3242` | Dividers |
| `--chr-border-strong` | `#b4bac7` | `#454d62` | Field border |
| `--chr-danger` | `#c2342b` | `#f2766b` | Invalid state and error messages |
| `--chr-today` | `#b45309` | `#f2b544` | Today marker |
| `--chr-range` | `#e6e9fc` | `#21264a` | Days inside a selected range |
| `--chr-range-text` | `#232a6b` | `#d6daff` | Text on `--chr-range` |
| `--chr-ring` | `rgba(76,91,212,.32)` | `rgba(127,140,255,.4)` | Focus halo |
| `--chr-focus-ring` | `#4c5bd4` | `#7f8cff` | Keyboard focus outline |
| `--chr-shadow` | soft two-layer shadow | stronger | Popup elevation |
| `--chr-shadow-sm` | `0 1px 2px …` | stronger | Field elevation |
| `--chr-radius` | `8px` | | Fields and popups |
| `--chr-radius-sm` | `6px` | | Cells and buttons |
| `--chr-font-family` | `Inter, system-ui, …` | | |
| `--chr-font-size` | `14px` | | |
| `--chr-spacing` | `12px` | | Calendar padding unit |
| `--chr-cell-size` | `38px` | | Calendar column width |
| `--chr-cell-height` | `34px` | | Calendar cell height |
| `--chr-field-width` | `14rem` (time `12rem`, date-time `18rem`, range `22rem`) | | Width of the input fields (all are `inline-block`, capped at 100% of the container). Set `width: 100%` on a field's host element to make it fill its container. |
| `--chr-spinner-width` | `26px` | | Up/down spinner buttons |
| `--chr-infinite-width` / `--chr-infinite-height` / `--chr-infinite-rail-width` | `auto` / `300px` / `76px` | | `chr-infinite-calendar` sizing |
| `--chr-multiview-gap` | `34px` | | Gap between months in `chr-multiview-calendar` |

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
