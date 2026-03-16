# Button Toggle Visibility & Input Length Constraints

## Overview

Two new features for the miniapps builder:

1. **Button Toggle + Conditional Visibility**: Buttons can be toggled on/off, and other elements can be shown/hidden based on a button's active state.
2. **Input Length Constraints**: Developers can set min/max character limits on input fields, separate from regex validation.

---

## Feature 1: Button Toggle System

### Behavior

- Buttons with `toggleable` enabled act as independent toggles.
- Clicking toggles between active/inactive state.
- Active state is reflected via a CSS class (`active`) and a `data-active` attribute (`"true"` / `"false"`).
- Other elements can use the existing visibility condition system to show/hide based on a button's active state.

### Model Changes (`element.model.ts`)

Add two new operators to the `VisibilityCondition.operator` union type:

```typescript
operator: 'equals' | 'not_equals' | 'contains' | 'empty' | 'not_empty'
        | 'greater_than' | 'less_than'
        | 'button_active' | 'button_not_active';
```

### Element Settings

| Setting | Type | Description |
|---------|------|-------------|
| `settings['toggleable']` | `'true' \| 'false'` | Enables toggle behavior on a button |

### Condition UI (`settings-tab`)

- When source is "Another Element" and a **button** element is selected:
  - Show operators: `Button is Active` / `Button is Not Active`
  - Hide the "Value" field (not needed for these operators)
- When a non-button element is selected, show existing operators as before.

### Code Generation

**HTML**: No changes to button HTML structure beyond existing.

**JavaScript**:

1. **Toggle handler** for toggleable buttons:
   ```javascript
   button.addEventListener('click', function() {
     const isActive = this.getAttribute('data-active') === 'true';
     this.setAttribute('data-active', String(!isActive));
     this.classList.toggle('active');
     checkConditions();
   });
   ```

2. **evalCondition() extension**:
   ```javascript
   if (condition.operator === 'button_active') {
     const btn = document.getElementById(condition.elementId);
     return btn && btn.getAttribute('data-active') === 'true';
   }
   if (condition.operator === 'button_not_active') {
     const btn = document.getElementById(condition.elementId);
     return !btn || btn.getAttribute('data-active') !== 'true';
   }
   ```

3. **Event listeners**: Button click events trigger `checkConditions()` re-evaluation (in addition to existing `input`/`change` listeners).

**CSS**: Add an `.active` style for toggleable buttons (e.g., different background or border to indicate selected state).

### Import Service

- Parse `data-active` attribute from imported HTML to set `toggleable` setting.

---

## Feature 2: Input Length Constraints

### Behavior

- Developers can specify minimum and/or maximum character counts for input fields.
- Validation runs on form submission alongside existing regex validation.
- Validation is skipped for values set programmatically via TWK binding (only validates manual user input).
- Custom error messages are supported with sensible defaults.

### Element Settings

| Setting | Type | Description |
|---------|------|-------------|
| `settings['minLength']` | `string` (number) | Minimum character count |
| `settings['maxLength']` | `string` (number) | Maximum character count |
| `settings['lengthError']` | `string` | Custom error message (optional) |

### Settings Panel UI (`settings-tab`)

Below the existing regex section, add:

- **Min Length**: Number input field
- **Max Length**: Number input field
- **Length Error Message**: Text input field (shown conditionally when either min or max is set)

### Default Error Messages

| Condition | Default Message |
|-----------|----------------|
| Both min and max set | "Must be between {min} and {max} characters" |
| Only min set | "Must be at least {min} characters" |
| Only max set | "Must be at most {max} characters" |

### Code Generation

**HTML**:
- Add `data-min-length="{value}"` and `data-max-length="{value}"` attributes on the input element.
- Add `data-length-error="{message}"` attribute for custom error message.
- Add error span: `<span id="{inputId}-length-error" class="error-message" style="display:none">{message}</span>`

**JavaScript**:
- Validation function checks `element.value.length` against `data-min-length` and `data-max-length`.
- Skip validation if the input has `data-twk-set="true"` attribute (indicating value was set programmatically).
- Show/hide the `{inputId}-length-error` span based on validation result.
- Runs alongside regex validation on submit button click.

### Import Service

- Parse `minlength` / `maxlength` HTML attributes to populate `settings['minLength']` and `settings['maxLength']`.
- Parse `data-length-error` attribute for custom error message.

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/app/models/element.model.ts` | Add `button_active`, `button_not_active` operators |
| `src/app/services/builder.service.ts` | Default `toggleable` setting for buttons, default length settings for inputs |
| `src/app/services/code-generator.service.ts` | Toggle handler JS, length validation JS, condition evaluation extension |
| `src/app/services/import.service.ts` | Parse new attributes from imported HTML |
| `src/app/components/properties-panel/settings-tab/settings-tab.ts` | New UI fields for toggleable, min/max length, length error |
| `src/app/components/properties-panel/settings-tab/settings-tab.html` | Template for new fields |
| `src/app/components/canvas/canvas-element/canvas-element.ts` | Toggle active class in preview (optional) |
