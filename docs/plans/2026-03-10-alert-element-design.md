# Alert/Banner Element Design

## Overview

Add a new `alert` element type to the miniapps builder — a colored notification banner with icon and text, used for tips, warnings, status messages, etc.

## Element Type

New type: `'alert'` added to the `ElementType` union.

## Settings

- **`variant`**: `'info'` | `'warning'` | `'success'` | `'error'` (default: `'warning'`)
- **`icon`**: Configurable via icon picker. Defaults per variant:
  - info: `info-circle`
  - warning: `exclamation-triangle`
  - success: `check-circle`
  - error: `times-circle`
- **`showIcon`**: `'true'` | `'false'` (default: `'true'`)

## Default Styles per Variant

| Variant | Background | Text Color | Border |
|---------|-----------|------------|--------|
| info    | `#dbeafe` | `#1e40af`  | `1px solid #93c5fd` |
| warning | `#fef3c7` | `#92400e`  | `1px solid #fcd34d` |
| success | `#dcfce7` | `#166534`  | `1px solid #86efac` |
| error   | `#fee2e2` | `#991b1b`  | `1px solid #fca5a5` |

All variants: `borderRadius: 12px`, `padding: 12px 16px`

## Canvas Rendering

Rounded bar with icon on the trailing side + text content. Supports RTL layout for Arabic.

## Features

- i18n (EN/AR) for text content
- Inline editing (double-click to edit text on canvas)
- Variant selector dropdown in Settings tab
- Icon picker in Settings tab
- Show/hide icon toggle
- All styles customizable via Style tab (overrides variant defaults)

## Files to Change

1. `src/app/models/element.model.ts` — add `'alert'` to `ElementType`
2. `src/app/components/element-palette/element-palette.ts` — add to palette list
3. `src/app/services/builder.service.ts` — add default creation in `createDefaultElement()`
4. `src/app/components/canvas-element/canvas-element.html` — add `@case ('alert')` rendering
5. `src/app/components/canvas-element/canvas-element.ts` — add `'alert'` to `editableText` getter
6. `src/app/components/canvas-element/canvas-element.scss` — add `.el-alert` styles
7. `src/app/components/properties-panel/settings-tab/settings-tab.html` — add `@case ('alert')` settings
8. `src/app/components/properties-panel/settings-tab/settings-tab.ts` — add `'alert'` to i18n-eligible list (if filtered)
9. `src/app/components/properties-panel/properties-panel.ts` — add icon to `iconMap`
