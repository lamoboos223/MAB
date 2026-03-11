# Alert Element Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a new `alert` element type — a colored notification banner with icon, variant selector, i18n, and inline editing.

**Architecture:** New `'alert'` ElementType following the existing pattern. Each variant (info/warning/success/error) has default styles. Rendered as a rounded bar with icon + text. Settings tab provides variant dropdown, icon picker, and i18n toggles.

**Tech Stack:** Angular 19, TypeScript, SCSS

---

### Task 1: Add `alert` to ElementType and palette

**Files:**
- Modify: `src/app/models/element.model.ts:1-12`
- Modify: `src/app/components/element-palette/element-palette.ts:22-34`

**Step 1: Add `'alert'` to the ElementType union**

In `src/app/models/element.model.ts`, add `'alert'` to the union:

```typescript
export type ElementType =
  | 'text'
  | 'button'
  | 'image'
  | 'input'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'map'
  | 'date-picker'
  | 'media-select'
  | 'divider'
  | 'alert';
```

**Step 2: Add `alert` to the palette list**

In `src/app/components/element-palette/element-palette.ts`, add after the divider entry:

```typescript
{ type: 'alert', label: 'Alert', icon: '!' }
```

**Step 3: Add icon to properties panel iconMap**

In `src/app/components/properties-panel/properties-panel.ts`, add to `iconMap`:

```typescript
alert: '⚠',
```

**Step 4: Commit**

```bash
git add src/app/models/element.model.ts src/app/components/element-palette/element-palette.ts src/app/components/properties-panel/properties-panel.ts
git commit -m "feat(alert): add alert to ElementType, palette, and icon map"
```

---

### Task 2: Add default element creation in BuilderService

**Files:**
- Modify: `src/app/services/builder.service.ts:127-178`

**Step 1: Add `case 'alert'` to `createDefaultElement` switch**

After the `case 'divider'` block (line ~177), add:

```typescript
case 'alert':
  base.staticContent = 'This is an alert message';
  base.settings = { variant: 'warning', icon: 'exclamation-triangle', showIcon: 'true' };
  base.styles = {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    border: '1px solid #fcd34d',
    borderRadius: '12px',
    padding: '12px 16px'
  };
  break;
```

**Step 2: Commit**

```bash
git add src/app/services/builder.service.ts
git commit -m "feat(alert): add default alert element creation"
```

---

### Task 3: Add canvas rendering for alert

**Files:**
- Modify: `src/app/components/canvas-element/canvas-element.html:148-151` (before closing `}` of switch)
- Modify: `src/app/components/canvas-element/canvas-element.ts:82-93` (editableText getter)

**Step 1: Add `@case ('alert')` to canvas-element.html**

After the `@case ('divider')` block (line ~150), add before the closing `}`:

```html
@case ('alert') {
  @if (editing) {
    <input class="inline-edit" [value]="editValue" (input)="editValue = $any($event.target).value" (blur)="finishEdit()" (keydown)="onEditKeydown($event)" autofocus />
  } @else {
    <div class="el-alert" [class.el-alert--no-icon]="element.settings['showIcon'] === 'false'">
      @if (element.settings['showIcon'] !== 'false' && element.settings['icon']) {
        <i class="pi pi-{{ element.settings['icon'] }} el-alert__icon"></i>
      }
      <span class="el-alert__text">{{ displayContent }}</span>
    </div>
  }
}
```

**Step 2: Add `'alert'` to the `editableText` getter in canvas-element.ts**

In the `get editableText()` getter, add alert to the text/button logic. After the `if (element.type === 'button')` block:

```typescript
if (this.element.type === 'alert') {
  return this.element.staticContent;
}
```

**Step 3: Add `'alert'` to the `finishEdit()` method**

In `finishEdit()`, update the condition on line 116 to include `'alert'`:

```typescript
if (type === 'text' || type === 'button' || type === 'alert') {
```

**Step 4: Commit**

```bash
git add src/app/components/canvas-element/canvas-element.html src/app/components/canvas-element/canvas-element.ts
git commit -m "feat(alert): add canvas rendering and inline editing for alert"
```

---

### Task 4: Add alert SCSS styles

**Files:**
- Modify: `src/app/components/canvas-element/canvas-element.scss` (append at end)

**Step 1: Add `.el-alert` styles**

Append to the end of canvas-element.scss:

```scss
.el-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-height: 40px;
  box-sizing: border-box;

  &__icon {
    flex-shrink: 0;
    font-size: 18px;
    opacity: 0.85;
  }

  &__text {
    flex: 1;
    font-size: 13px;
    line-height: 1.5;
  }

  &--no-icon {
    .el-alert__text { width: 100%; }
  }
}
```

**Step 2: Commit**

```bash
git add src/app/components/canvas-element/canvas-element.scss
git commit -m "feat(alert): add alert element styles"
```

---

### Task 5: Add settings tab for alert

**Files:**
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.html:3` (i18n eligible list)
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.html` (add case before closing `}`)

**Step 1: Add `'alert'` to the i18n-eligible list**

On line 3 of settings-tab.html, add `'alert'` to the array:

```html
@if (['text', 'button', 'input', 'dropdown', 'radio', 'checkbox', 'date-picker', 'media-select', 'alert'].includes(el.type)) {
```

**Step 2: Add `@case ('alert')` settings block**

After the `@case ('divider')` block, add:

```html
@case ('alert') {
  <div class="field">
    <label>Variant</label>
    <select [ngModel]="el.settings['variant'] || 'warning'" (ngModelChange)="onVariantChange($event)">
      <option value="info">Info</option>
      <option value="warning">Warning</option>
      <option value="success">Success</option>
      <option value="error">Error</option>
    </select>
  </div>
  <div class="field">
    <label>{{ el.i18nEnabled ? 'Message (English)' : 'Message' }}</label>
    <textarea [ngModel]="el.staticContent" (ngModelChange)="updateContent($event)" rows="3"></textarea>
  </div>
  @if (el.i18nEnabled) {
    <div class="field ar-field">
      <label>Message (Arabic)</label>
      <textarea dir="rtl" [ngModel]="el.i18n?.ar?.staticContent ?? ''" (ngModelChange)="updateArContent($event)" rows="3"></textarea>
    </div>
  }
  <div class="field">
    <label>Icon</label>
    <app-icon-picker [value]="el.settings['icon'] || ''" (valueChange)="updateSetting('icon', $event)"></app-icon-picker>
  </div>
  <label class="switch-row">
    <span class="switch-row__label">Show Icon</span>
    <span class="switch" [class.switch--on]="el.settings['showIcon'] !== 'false'" (click)="updateSetting('showIcon', el.settings['showIcon'] === 'false' ? 'true' : 'false')">
      <span class="switch__knob"></span>
    </span>
  </label>
}
```

**Step 3: Commit**

```bash
git add src/app/components/properties-panel/settings-tab/settings-tab.html
git commit -m "feat(alert): add settings tab with variant, icon, and i18n"
```

---

### Task 6: Add `onVariantChange` method to SettingsTab

**Files:**
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.ts`

**Step 1: Add variant change handler**

Add the following method to the `SettingsTab` class:

```typescript
onVariantChange(variant: string): void {
  const el = this.element;
  if (!el) return;

  const variantStyles: Record<string, { backgroundColor: string; color: string; border: string }> = {
    info:    { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
    warning: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
    success: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
    error:   { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }
  };

  const variantIcons: Record<string, string> = {
    info: 'info-circle',
    warning: 'exclamation-triangle',
    success: 'check-circle',
    error: 'times-circle'
  };

  const styles = variantStyles[variant] ?? variantStyles['warning'];
  const icon = variantIcons[variant] ?? 'exclamation-triangle';

  this.builder.updateElement(el.id, {
    settings: { ...el.settings, variant, icon },
    styles: { ...el.styles, ...styles }
  });
}
```

**Step 2: Commit**

```bash
git add src/app/components/properties-panel/settings-tab/settings-tab.ts
git commit -m "feat(alert): add variant change handler with auto-styling"
```

---

### Task 7: Build and verify

**Step 1: Run the build**

```bash
npx ng build
```

Expected: Build succeeds with no errors.

**Step 2: Manual verification**

- Open the app in browser
- Click "Alert" in the palette → a yellow warning banner appears on canvas
- Double-click to inline-edit the text
- In Settings tab: change variant dropdown → colors and icon update
- Toggle i18n → Arabic text field appears
- Toggle show/hide icon
- Customize icon via icon picker

**Step 3: Final commit if any fixes needed**

```bash
git add -A
git commit -m "feat(alert): complete alert element implementation"
```
