# Styling and themes

Momentra ships its own design system: no global stylesheet to import, no framework CSS. Component styles are encapsulated, and every colour, radius, size and shadow is a CSS custom property you can override.

## Themes

`light` (default), `dark`, and `auto` (follows `prefers-color-scheme`).

```ts
provideMomentra({ theme: 'auto' });        // global
```

```html
<mtr-date-picker theme="dark" />           <!-- per component -->
```

The effective theme is written to the host as `data-mtr-theme="light|dark|auto"`; popups carry the same attribute.

## Custom properties

Override any of these on `:root` (or `body`):

| Property | Light default | Dark default | Used for |
| --- | --- | --- | --- |
| `--mtr-primary` | `#4c5bd4` | `#7f8cff` | Selected day, primary buttons, accents |
| `--mtr-primary-contrast` | `#ffffff` | `#0b0d12` | Text on `--mtr-primary` |
| `--mtr-primary-soft` | `#eceefd` | `#252a4a` | Active preset, selected time, soft fills |
| `--mtr-primary-text` | `#3542ae` | `#c3c9ff` | Text on `--mtr-primary-soft` |
| `--mtr-surface` | `#ffffff` | `#151821` | Field and popup background |
| `--mtr-surface-alt` | `#f7f8fa` | `#1b1f2a` | Disabled / read-only fields, side rails |
| `--mtr-surface-hover` | `#eef0f5` | `#232836` | Hover background |
| `--mtr-text` | `#151922` | `#e9ebf1` | Text |
| `--mtr-text-muted` | `#555d6e` | `#a1a8b8` | Placeholders, secondary text |
| `--mtr-text-subtle` | `#6f7685` | `#8e95a6` | Weekday headers, captions |
| `--mtr-text-disabled` | `#a6acb8` | `#565d6e` | Disabled text |
| `--mtr-border` | `#d5d9e1` | `#2c3242` | Dividers |
| `--mtr-border-strong` | `#b4bac7` | `#454d62` | Field border |
| `--mtr-danger` | `#c2342b` | `#f2766b` | Invalid state and error messages |
| `--mtr-today` | `#b45309` | `#f2b544` | Today marker |
| `--mtr-range` | `#e6e9fc` | `#21264a` | Days inside a selected range |
| `--mtr-range-text` | `#232a6b` | `#d6daff` | Text on `--mtr-range` |
| `--mtr-ring` | `rgba(76,91,212,.32)` | `rgba(127,140,255,.4)` | Focus halo |
| `--mtr-focus-ring` | `#4c5bd4` | `#7f8cff` | Keyboard focus outline |
| `--mtr-shadow` | soft two-layer shadow | stronger | Popup elevation |
| `--mtr-shadow-sm` | `0 1px 2px …` | stronger | Field elevation |
| `--mtr-radius` | `8px` | | Fields and popups |
| `--mtr-radius-sm` | `6px` | | Cells and buttons |
| `--mtr-font-family` | `Inter, system-ui, …` | | |
| `--mtr-font-size` | `14px` | | |
| `--mtr-spacing` | `12px` | | Calendar padding unit |
| `--mtr-cell-size` | `38px` | | Calendar column width |
| `--mtr-cell-height` | `34px` | | Calendar cell height |
| `--mtr-field-width` | `14rem` (time `12rem`, date-time `18rem`, range `22rem`) | | Width of the input fields (all are `inline-block`, capped at 100% of the container). Set `width: 100%` on a field's host element to make it fill its container. |
| `--mtr-spinner-width` | `26px` | | Up/down spinner buttons |
| `--mtr-infinite-width` / `--mtr-infinite-height` / `--mtr-infinite-rail-width` | `auto` / `300px` / `76px` | | `mtr-infinite-calendar` sizing |
| `--mtr-multiview-gap` | `34px` | | Gap between months in `mtr-multiview-calendar` |

A value you set applies to **both** light and dark; scope it yourself if you want different values:

```css
:root {
  --mtr-primary: #0f766e;
  --mtr-radius: 12px;
}
@media (prefers-color-scheme: dark) {
  :root { --mtr-primary: #5eead4; }
}
```

> **Set variables on `:root` or `body`.** Popups render in the CDK overlay container, which is a sibling of your app root, so variables set on an arbitrary ancestor of the picker do not reach the popup. Variables on the host element itself (or `:root`) always reach the input.

## How it works

`theming/_tokens.scss` defines, per component host, private `--_mtr-*` aliases that each fall back from the public property to a theme default (`--_mtr-primary: var(--mtr-primary, #3b5bdb)`), plus dark defaults under `[data-mtr-theme='dark']` and `@media (prefers-color-scheme: dark)` for `auto`. Because the public property is read with a fallback, your override wins in either theme.

## States

Every interactive element has hover, `:focus-visible`, selected, disabled and invalid styling:

- Calendar cells: `.mtr-selected`, `.mtr-today`, `.mtr-outside`, `.mtr-disabled`, `.mtr-in-range`, `.mtr-range-start`, `.mtr-range-end`.
- Fields: invalid (red border, `aria-invalid`), disabled, read-only.
- High-contrast: selected cells and fields get a system `Highlight` outline under `forced-colors: active`.

Internal class names are not a stable API — customise through the custom properties and the `cellTemplate` inputs rather than by targeting `.mtr-*` classes.

## Responsive behaviour

Popups are limited to the viewport (`max-width: calc(100vw - 16px)`), repositioned/flipped by the CDK, and on narrow screens (≤ 420px, ≤ 560px for the wider popups) the calendar uses larger cells, the date-time popup stacks the time lists under the calendar, and range presets wrap above the calendar.
