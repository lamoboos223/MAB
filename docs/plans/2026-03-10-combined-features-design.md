# Combined Features Design: Alert, Conditions, GET, Input States, Clone

## Feature 1: Alert Element

New `'alert'` ElementType — a colored notification banner with icon and text.

- **Variants**: info, warning, success, error — each with default colors
- **Settings**: `variant`, `icon` (configurable via icon picker), `showIcon`
- **Features**: i18n (EN/AR), inline editing, variant selector in Settings tab
- **Default styles per variant**: see alert-element-design.md

## Feature 2: Conditional Visibility (All Elements)

New optional `visibilityCondition` on `BuilderElement`:

```typescript
interface VisibilityCondition {
  source: 'element' | 'function';
  elementId?: string;
  functionBinding?: TwkBinding;
  operator: 'equals' | 'not_equals' | 'contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
  value?: string;
}
```

- Configured in Settings tab for any element type
- Canvas shows a badge indicator when condition is set
- Generated code uses conditional rendering

## Feature 3: GET Method for Buttons

- Add `GET` option to HTTP method dropdown
- When GET is selected, hide body mapping and payload sections (GET has no body)
- Keep URL, headers, success page, error message visible

## Feature 4: Disabled/Hidden for Input

- `settings['disabled']`: toggle in Settings tab, renders input as disabled with dimmed styling
- `settings['hidden']`: toggle in Settings tab, `display: none` in generated code, ghost preview on canvas

## Feature 5: Clone Element from Right Panel

- Clone button next to each element in the element list (properties panel no-selection state)
- Uses existing `copyElement` + `pasteElement` from BuilderService
