# Combined Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Implement 5 features: alert element with variants, conditional visibility for all elements, GET method for button API calls, disabled/hidden input settings, and clone-from-panel.

**Architecture:** Each feature follows existing patterns — new types extend the `ElementType` union, new settings are added to `BuilderElement`, UI changes follow the existing switch-case pattern across canvas-element, settings-tab, and code-generator. Conditional visibility adds a new `VisibilityCondition` interface to the model and a new section in the Settings tab for all element types.

**Tech Stack:** Angular 19, TypeScript, SCSS

---

### Task 1: Add `alert` to ElementType and palette

**Files:**
- Modify: `src/app/models/element.model.ts:1-12`
- Modify: `src/app/components/element-palette/element-palette.ts:22-34`
- Modify: `src/app/components/properties-panel/properties-panel.ts:19-31`

**Step 1: Add `'alert'` to the ElementType union**

In `src/app/models/element.model.ts`, change the `ElementType` to:

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

**Step 2: Add `VisibilityCondition` interface to element.model.ts**

After the `TwkBinding` interface (line ~32), add:

```typescript
export interface VisibilityCondition {
  source: 'element' | 'function';
  elementId?: string;
  functionBinding?: TwkBinding;
  operator: 'equals' | 'not_equals' | 'contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
  value?: string;
}
```

**Step 3: Add `visibilityCondition` to BuilderElement interface**

In the `BuilderElement` interface, add after `position`:

```typescript
  visibilityCondition?: VisibilityCondition;
```

**Step 4: Add `alert` to the palette**

In `src/app/components/element-palette/element-palette.ts`, add after the divider entry (line 33):

```typescript
    { type: 'alert', label: 'Alert', icon: '!' }
```

**Step 5: Add icon to properties panel iconMap**

In `src/app/components/properties-panel/properties-panel.ts`, add to `iconMap` (line ~31):

```typescript
    alert: '⚠',
```

**Step 6: Commit**

```bash
git add src/app/models/element.model.ts src/app/components/element-palette/element-palette.ts src/app/components/properties-panel/properties-panel.ts
git commit -m "feat: add alert ElementType, VisibilityCondition model, palette entry"
```

---

### Task 2: Add default alert element creation in BuilderService

**Files:**
- Modify: `src/app/services/builder.service.ts:175-178` (after `case 'divider'`)

**Step 1: Add `case 'alert'` to `createDefaultElement` switch**

After the `case 'divider'` block (ends at line ~177), add before the closing `}` of the switch:

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
git commit -m "feat(alert): add default alert element creation with warning variant"
```

---

### Task 3: Add alert canvas rendering and inline editing

**Files:**
- Modify: `src/app/components/canvas-element/canvas-element.html:148-151`
- Modify: `src/app/components/canvas-element/canvas-element.ts:82-93,112-123`

**Step 1: Add `@case ('alert')` to canvas-element.html**

After the `@case ('divider')` block (line ~150), before the closing `}` of the `@switch`, add:

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

**Step 2: Add `'alert'` to `editableText` getter in canvas-element.ts**

In the `get editableText()` getter (around line ~86), after the `if (this.element.type === 'button')` block, add:

```typescript
    if (this.element.type === 'alert') {
      return this.element.staticContent;
    }
```

**Step 3: Add `'alert'` to `finishEdit()` in canvas-element.ts**

On line ~116, change:

```typescript
      if (type === 'text' || type === 'button') {
```

to:

```typescript
      if (type === 'text' || type === 'button' || type === 'alert') {
```

**Step 4: Commit**

```bash
git add src/app/components/canvas-element/canvas-element.html src/app/components/canvas-element/canvas-element.ts
git commit -m "feat(alert): add canvas rendering and inline editing"
```

---

### Task 4: Add alert SCSS styles

**Files:**
- Modify: `src/app/components/canvas-element/canvas-element.scss` (append at end)

**Step 1: Append `.el-alert` styles at end of file**

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

  &--no-icon .el-alert__text {
    width: 100%;
  }
}
```

**Step 2: Commit**

```bash
git add src/app/components/canvas-element/canvas-element.scss
git commit -m "feat(alert): add alert element styles"
```

---

### Task 5: Add alert settings tab

**Files:**
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.html:3` (i18n list)
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.html:254-258` (after divider case)
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.ts` (add method)

**Step 1: Add `'alert'` to the i18n-eligible list**

On line 3 of `settings-tab.html`, change:

```html
  @if (['text', 'button', 'input', 'dropdown', 'radio', 'checkbox', 'date-picker', 'media-select'].includes(el.type)) {
```

to:

```html
  @if (['text', 'button', 'input', 'dropdown', 'radio', 'checkbox', 'date-picker', 'media-select', 'alert'].includes(el.type)) {
```

**Step 2: Add `@case ('alert')` settings block**

After the `@case ('divider')` block (line ~258), add:

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

**Step 3: Add `onVariantChange` method to settings-tab.ts**

Add this method to the `SettingsTab` class in `src/app/components/properties-panel/settings-tab/settings-tab.ts`:

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

**Step 4: Commit**

```bash
git add src/app/components/properties-panel/settings-tab/settings-tab.html src/app/components/properties-panel/settings-tab/settings-tab.ts
git commit -m "feat(alert): add settings tab with variant selector, icon picker, i18n"
```

---

### Task 6: Add alert to code generator

**Files:**
- Modify: `src/app/services/code-generator.service.ts:906-907` (in `elementToHtml` switch, before `default`)
- Modify: `src/app/services/code-generator.service.ts:787-789` (in `generateHtml`, hasIcons check)

**Step 1: Add `case 'alert'` to `elementToHtml`**

Before the `default:` case in `elementToHtml` (~line 908), add:

```typescript
      case 'alert': {
        const icon = el.settings['icon'] ? `<i class="pi pi-${el.settings['icon']}" style="flex-shrink:0;font-size:18px;opacity:0.85"></i> ` : '';
        const showIcon = el.settings['showIcon'] !== 'false';
        const style = this.styleObjectToCss(el.styles);
        const styleAttr = style ? ` style="${style};display:flex;align-items:center;gap:10px;border-radius:12px"` : ' style="display:flex;align-items:center;gap:10px;border-radius:12px"';
        return `  <div class="alert" id="${el.id}"${styleAttr}>${showIcon ? icon : ''}<span>${this.escapeHtml(el.staticContent)}</span></div>`;
      }
```

**Step 2: Commit**

```bash
git add src/app/services/code-generator.service.ts
git commit -m "feat(alert): add alert HTML generation in code generator"
```

---

### Task 7: Add conditional visibility to Settings tab (all elements)

**Files:**
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.html` (add section at end, before closing `}`)
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.ts` (add methods + imports)

**Step 1: Add visibility condition UI to settings-tab.html**

At the end of `settings-tab.html`, just before the closing `}` on line 260 (after all `@switch` cases and the `optionsList` template), add a visibility condition section that applies to ALL element types. Place it **after** the `@switch` block but **inside** the outer `@if (element; as el)`:

Find the `@switch (el.type) { ... }` block closing brace and add right after it, still inside the `@if (element; as el)`:

```html
  <!-- Visibility Condition (all elements) -->
  <div class="condition-section">
    <label class="section-label">Visibility Condition</label>
    @if (el.visibilityCondition) {
      <div class="field">
        <label>Source</label>
        <select [ngModel]="el.visibilityCondition.source" (ngModelChange)="updateConditionSource($event)">
          <option value="element">Another Element</option>
          <option value="function">TWK Function</option>
        </select>
      </div>
      @if (el.visibilityCondition.source === 'element') {
        <div class="field">
          <label>Element</label>
          <select [ngModel]="el.visibilityCondition.elementId || ''" (ngModelChange)="updateConditionField('elementId', $event)">
            <option value="">-- Select Element --</option>
            @for (other of getOtherElements(); track other.id) {
              <option [value]="other.id">{{ other.settings['label'] || other.staticContent || other.type }} ({{ other.type }})</option>
            }
          </select>
        </div>
      }
      @if (el.visibilityCondition.source === 'function') {
        <div class="field">
          <label>TWK Function</label>
          <app-function-picker
            [value]="el.visibilityCondition.functionBinding?.functionName || ''"
            placeholder="Select function..."
            (valueChange)="setConditionFunction($event)"
          ></app-function-picker>
        </div>
        @if (el.visibilityCondition.functionBinding; as binding) {
          @for (param of twkService.getByName(binding.functionName)?.params ?? []; track param.name) {
            <div class="field">
              <label>{{ param.name }}</label>
              <input type="text" [ngModel]="binding.params[param.name] || ''" (ngModelChange)="setConditionFunctionParam(param.name, $event)">
            </div>
          }
          <div class="field">
            <label>Result Path</label>
            <input type="text" [ngModel]="binding.resultPath" (ngModelChange)="updateConditionBindingField('resultPath', $event)">
          </div>
        }
      }
      <div class="field">
        <label>Operator</label>
        <select [ngModel]="el.visibilityCondition.operator" (ngModelChange)="updateConditionField('operator', $event)">
          <option value="equals">Equals</option>
          <option value="not_equals">Not Equals</option>
          <option value="contains">Contains</option>
          <option value="empty">Is Empty</option>
          <option value="not_empty">Is Not Empty</option>
          <option value="greater_than">Greater Than</option>
          <option value="less_than">Less Than</option>
        </select>
      </div>
      @if (!['empty', 'not_empty'].includes(el.visibilityCondition.operator)) {
        <div class="field">
          <label>Value</label>
          <input type="text" [ngModel]="el.visibilityCondition.value || ''" (ngModelChange)="updateConditionField('value', $event)">
        </div>
      }
      <button class="remove-btn" style="margin-top:4px" (click)="removeCondition()">Remove Condition</button>
    } @else {
      <button class="add-btn" (click)="addCondition()">+ Add Condition</button>
    }
  </div>
```

**Step 2: Add condition methods to settings-tab.ts**

Update the import from `element.model.ts` at top of `settings-tab.ts` to include the new types:

```typescript
import { I18nTranslation, VisibilityCondition, TwkBinding } from '../../../models/element.model';
```

Import `TwkFunctionsService` and `FunctionPicker`, and inject the service:

```typescript
import { TwkFunctionsService } from '../../../services/twk-functions.service';
import { FunctionPicker } from '../../function-picker/function-picker';
```

Add `FunctionPicker` to the `imports` array in the `@Component` decorator:

```typescript
  imports: [FormsModule, NgTemplateOutlet, IconPicker, FunctionPicker],
```

Add these methods to the `SettingsTab` class:

```typescript
  twkService = inject(TwkFunctionsService);

  getOtherElements(): { id: string; type: string; settings: Record<string, string>; staticContent: string }[] {
    const el = this.element;
    if (!el) return [];
    const page = this.builder.activePage();
    return page ? page.elements.filter(e => e.id !== el.id) : [];
  }

  addCondition(): void {
    const el = this.element;
    if (!el) return;
    const condition: VisibilityCondition = {
      source: 'element',
      operator: 'equals',
      value: ''
    };
    this.builder.updateElement(el.id, { visibilityCondition: condition });
  }

  removeCondition(): void {
    const el = this.element;
    if (!el) return;
    this.builder.updateElement(el.id, { visibilityCondition: undefined } as any);
  }

  updateConditionSource(source: 'element' | 'function'): void {
    const el = this.element;
    if (!el || !el.visibilityCondition) return;
    const condition: VisibilityCondition = {
      ...el.visibilityCondition,
      source,
      elementId: source === 'element' ? '' : undefined,
      functionBinding: source === 'function' ? { functionName: '', params: {}, resultPath: 'result' } : undefined
    };
    this.builder.updateElement(el.id, { visibilityCondition: condition });
  }

  updateConditionField(field: string, value: string): void {
    const el = this.element;
    if (!el || !el.visibilityCondition) return;
    this.builder.updateElement(el.id, {
      visibilityCondition: { ...el.visibilityCondition, [field]: value }
    });
  }

  setConditionFunction(functionName: string): void {
    const el = this.element;
    if (!el || !el.visibilityCondition) return;
    const fn = this.twkService.getByName(functionName);
    const binding: TwkBinding = {
      functionName,
      params: {},
      resultPath: fn?.resultPath || 'result'
    };
    this.builder.updateElement(el.id, {
      visibilityCondition: { ...el.visibilityCondition, functionBinding: binding }
    });
  }

  setConditionFunctionParam(paramName: string, value: string): void {
    const el = this.element;
    if (!el || !el.visibilityCondition?.functionBinding) return;
    const binding = {
      ...el.visibilityCondition.functionBinding,
      params: { ...el.visibilityCondition.functionBinding.params, [paramName]: value }
    };
    this.builder.updateElement(el.id, {
      visibilityCondition: { ...el.visibilityCondition, functionBinding: binding }
    });
  }

  updateConditionBindingField(field: string, value: string): void {
    const el = this.element;
    if (!el || !el.visibilityCondition?.functionBinding) return;
    const binding = { ...el.visibilityCondition.functionBinding, [field]: value };
    this.builder.updateElement(el.id, {
      visibilityCondition: { ...el.visibilityCondition, functionBinding: binding }
    });
  }
```

**Step 3: Commit**

```bash
git add src/app/components/properties-panel/settings-tab/settings-tab.html src/app/components/properties-panel/settings-tab/settings-tab.ts
git commit -m "feat(conditions): add visibility condition UI for all elements"
```

---

### Task 8: Add visibility condition badge on canvas

**Files:**
- Modify: `src/app/components/canvas-element/canvas-element.html:10-14` (el-actions area)
- Modify: `src/app/components/canvas-element/canvas-element.scss` (append badge style)

**Step 1: Add condition badge to canvas-element.html**

After the `@if (isSelected)` block with `el-actions` (line ~14), add:

```html
  @if (element.visibilityCondition) {
    <div class="el-condition-badge" title="Has visibility condition">?</div>
  }
```

**Step 2: Add badge styles to canvas-element.scss**

Append to the end of the file:

```scss
.el-condition-badge {
  position: absolute;
  top: -6px;
  left: -6px;
  width: 18px;
  height: 18px;
  background: #f59e0b;
  color: #fff;
  border-radius: 50%;
  font-size: 10px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}
```

**Step 3: Commit**

```bash
git add src/app/components/canvas-element/canvas-element.html src/app/components/canvas-element/canvas-element.scss
git commit -m "feat(conditions): add condition badge indicator on canvas elements"
```

---

### Task 9: Add condition rendering to code generator

**Files:**
- Modify: `src/app/services/code-generator.service.ts:776-782` (in `generateHtml`)
- Modify: `src/app/services/code-generator.service.ts` (in `generateJs`, after DOMContentLoaded)

**Step 1: Update `generateHtml` to add `data-condition` attributes**

In the `generateHtml` method, update the element rendering loop (line ~776). Replace the existing loop:

```typescript
    for (const el of page.elements) {
      const pos = el.position;
      const condAttr = el.visibilityCondition ? ` data-condition="${this.escapeHtml(JSON.stringify(el.visibilityCondition))}" style="display:none"` : '';
      if (pos) {
        const hideStyle = el.visibilityCondition ? 'display:none;' : '';
        body += `  <div style="${hideStyle}position:absolute;left:${pos.x}px;top:${pos.y}px;max-width:calc(100% - ${pos.x}px)"${el.visibilityCondition ? ` data-condition="${this.escapeHtml(JSON.stringify(el.visibilityCondition))}"` : ''}>\n  ${this.elementToHtml(el)}\n  </div>\n`;
      } else {
        if (el.visibilityCondition) {
          body += `  <div data-condition="${this.escapeHtml(JSON.stringify(el.visibilityCondition))}" style="display:none">\n  ${this.elementToHtml(el)}\n  </div>\n`;
        } else {
          body += this.elementToHtml(el) + '\n';
        }
      }
    }
```

**Step 2: Add condition evaluation JS in `generateJs`**

In the `generateJs` method, after the `document.addEventListener('DOMContentLoaded', function() {` line (~line 236), check if any element has a condition and add the evaluation function:

Add a check before the DOMContentLoaded event:

```typescript
    const hasConditions = pages.some(p => p.elements.some(e => e.visibilityCondition));
```

Then inside DOMContentLoaded, after the i18n section, add:

```typescript
    if (hasConditions) {
      js += `  // Visibility condition evaluation\n`;
      js += `  function evalCondition(cond) {\n`;
      js += `    var val = '';\n`;
      js += `    if (cond.source === 'element' && cond.elementId) {\n`;
      js += `      var srcEl = document.getElementById(cond.elementId);\n`;
      js += `      if (srcEl) {\n`;
      js += `        if (srcEl.tagName === 'INPUT' || srcEl.tagName === 'TEXTAREA' || srcEl.tagName === 'SELECT') val = srcEl.value;\n`;
      js += `        else if (srcEl.querySelector('.custom-dropdown__value')) val = srcEl.querySelector('.custom-dropdown__value').value;\n`;
      js += `        else if (srcEl.querySelector('input[type="radio"]:checked')) val = srcEl.querySelector('input[type="radio"]:checked').value;\n`;
      js += `        else if (srcEl.querySelectorAll('input[type="checkbox"]:checked').length) val = Array.from(srcEl.querySelectorAll('input[type="checkbox"]:checked')).map(function(c){return c.value}).join(',');\n`;
      js += `        else val = srcEl.textContent || '';\n`;
      js += `      }\n`;
      js += `    }\n`;
      js += `    var op = cond.operator, cv = cond.value || '';\n`;
      js += `    switch(op) {\n`;
      js += `      case 'equals': return val === cv;\n`;
      js += `      case 'not_equals': return val !== cv;\n`;
      js += `      case 'contains': return val.indexOf(cv) >= 0;\n`;
      js += `      case 'empty': return !val || !val.trim();\n`;
      js += `      case 'not_empty': return !!val && !!val.trim();\n`;
      js += `      case 'greater_than': return parseFloat(val) > parseFloat(cv);\n`;
      js += `      case 'less_than': return parseFloat(val) < parseFloat(cv);\n`;
      js += `      default: return true;\n`;
      js += `    }\n`;
      js += `  }\n`;
      js += `  function checkConditions() {\n`;
      js += `    document.querySelectorAll('[data-condition]').forEach(function(el) {\n`;
      js += `      try {\n`;
      js += `        var cond = JSON.parse(el.getAttribute('data-condition'));\n`;
      js += `        el.style.display = evalCondition(cond) ? '' : 'none';\n`;
      js += `      } catch(e) {}\n`;
      js += `    });\n`;
      js += `  }\n`;
      js += `  // Re-evaluate on any input change\n`;
      js += `  document.addEventListener('input', checkConditions);\n`;
      js += `  document.addEventListener('change', checkConditions);\n`;
      js += `  // Also evaluate TWK function conditions on load\n`;

      // Evaluate function-based conditions on page load
      for (const page of pages) {
        for (const el of page.elements) {
          if (el.visibilityCondition?.source === 'function' && el.visibilityCondition.functionBinding) {
            const b = el.visibilityCondition.functionBinding;
            const params = Object.values(b.params).filter(v => v).map(v => `'${v}'`).join(', ');
            js += `  TWK.${b.functionName}(${params}).then(function(data) {\n`;
            js += `    var val = String(data.${b.resultPath} || '');\n`;
            js += `    var cond = ${JSON.stringify(el.visibilityCondition)};\n`;
            js += `    cond.source = 'resolved'; cond.resolvedValue = val;\n`;
            js += `    document.querySelectorAll('[data-condition]').forEach(function(el) {\n`;
            js += `      try {\n`;
            js += `        var c = JSON.parse(el.getAttribute('data-condition'));\n`;
            js += `        if (c.source === 'function' && c.functionBinding && c.functionBinding.functionName === '${b.functionName}') {\n`;
            js += `          var op = c.operator, cv = c.value || '';\n`;
            js += `          var show = false;\n`;
            js += `          switch(op) {\n`;
            js += `            case 'equals': show = val === cv; break;\n`;
            js += `            case 'not_equals': show = val !== cv; break;\n`;
            js += `            case 'contains': show = val.indexOf(cv) >= 0; break;\n`;
            js += `            case 'empty': show = !val || !val.trim(); break;\n`;
            js += `            case 'not_empty': show = !!val && !!val.trim(); break;\n`;
            js += `            case 'greater_than': show = parseFloat(val) > parseFloat(cv); break;\n`;
            js += `            case 'less_than': show = parseFloat(val) < parseFloat(cv); break;\n`;
            js += `          }\n`;
            js += `          el.style.display = show ? '' : 'none';\n`;
            js += `        }\n`;
            js += `      } catch(e) {}\n`;
            js += `    });\n`;
            js += `  }).catch(function(err) { console.error('Condition ${b.functionName}:', err); });\n`;
          }
        }
      }

      js += `  checkConditions();\n`;
    }
```

**Step 3: Commit**

```bash
git add src/app/services/code-generator.service.ts
git commit -m "feat(conditions): add visibility condition rendering in code generator"
```

---

### Task 10: Add GET method to button API calls

**Files:**
- Modify: `src/app/components/properties-panel/data-tab/data-tab.html:89-93`
- Modify: `src/app/services/code-generator.service.ts:406-413`

**Step 1: Add GET option to method dropdown**

In `data-tab.html`, change lines 89-93:

```html
          <select [ngModel]="cfg.method || 'POST'" (ngModelChange)="updateMethod($event)">
            <option value="GET">GET</option>
            <option value="POST">POST</option>
            <option value="PUT">PUT</option>
            <option value="PATCH">PATCH</option>
          </select>
```

**Step 2: Hide body-related sections when GET is selected**

Wrap the "Request Body Mapping" and "Request Payload" sections (lines 96-131) in a condition. Find this block in `data-tab.html`:

```html
        <div class="submit-section">
          <label class="submit-section__title">Request Body Mapping</label>
```

Wrap everything from the "Request Body Mapping" div through the closing `</div>` of the payload hint (line ~131) with:

```html
        @if (cfg.method !== 'GET') {
          <!-- existing Request Body Mapping + Request Payload sections unchanged -->
        }
```

**Step 3: Update code generator to omit body for GET**

In `code-generator.service.ts`, around line 409-413, change the fetch call generation. Find:

```typescript
            js += `      var resp = await withTimeout(fetch('${cfg.apiUrl}', {\n`;
            js += `        method: '${method}',\n`;
            js += `        headers: headers,\n`;
            js += `        body: body\n`;
            js += `      }), 30000, 'fetch');\n`;
```

Replace with:

```typescript
            if (method === 'GET') {
              js += `      var resp = await withTimeout(fetch('${cfg.apiUrl}', {\n`;
              js += `        method: 'GET',\n`;
              js += `        headers: headers\n`;
              js += `      }), 30000, 'fetch');\n`;
            } else {
              js += `      var resp = await withTimeout(fetch('${cfg.apiUrl}', {\n`;
              js += `        method: '${method}',\n`;
              js += `        headers: headers,\n`;
              js += `        body: body\n`;
              js += `      }), 30000, 'fetch');\n`;
            }
```

Also, for GET, skip the body template building. Wrap the field-value collection and template substitution (lines ~347-391) with a condition:

```typescript
            if (method !== 'GET') {
              // ... existing field collection and template substitution code ...
            }
```

**Step 4: Commit**

```bash
git add src/app/components/properties-panel/data-tab/data-tab.html src/app/services/code-generator.service.ts
git commit -m "feat: add GET method for button API calls, hide body for GET requests"
```

---

### Task 11: Add disabled/hidden settings for input element

**Files:**
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.html:103-145` (input case)
- Modify: `src/app/components/canvas-element/canvas-element.html:44-58` (input case)
- Modify: `src/app/components/canvas-element/canvas-element.scss` (add ghost style)
- Modify: `src/app/services/code-generator.service.ts:823-834` (input case in `elementToHtml`)

**Step 1: Add disabled/hidden toggles to input settings**

In `settings-tab.html`, after the existing "Multi-line" switch-row in the input case (~line 144), add:

```html
      <label class="switch-row">
        <span class="switch-row__label">Disabled</span>
        <span class="switch" [class.switch--on]="el.settings['disabled'] === 'true'" (click)="updateSetting('disabled', el.settings['disabled'] === 'true' ? 'false' : 'true')">
          <span class="switch__knob"></span>
        </span>
      </label>
      <label class="switch-row">
        <span class="switch-row__label">Hidden</span>
        <span class="switch" [class.switch--on]="el.settings['hidden'] === 'true'" (click)="updateSetting('hidden', el.settings['hidden'] === 'true' ? 'false' : 'true')">
          <span class="switch__knob"></span>
        </span>
      </label>
```

**Step 2: Update canvas rendering for input**

In `canvas-element.html`, update the input case. Wrap the entire input case content with a class for hidden/disabled state. Change the opening of the input case:

After `@case ('input') {`, add at the very top:

```html
      @if (element.settings['hidden'] === 'true') {
        <div class="el-hidden-ghost">
          <span class="el-hidden-ghost__label">Hidden: {{ displayLabel }}</span>
        </div>
      } @else {
```

And close the `@else` block just before the closing `}` of the input case. Also add disabled attribute: in the `<input>` and `<textarea>` elements, they are already `disabled` — when the setting `disabled` is `true`, add a visual indicator class `.el-input--disabled`.

Actually, simpler approach — just add a CSS class:

In canvas-element.html for the input case, update the input/textarea elements to include a disabled class. After `@case ('input') {`:

```html
      @if (element.settings['hidden'] === 'true') {
        <div class="el-hidden-ghost">Hidden: {{ displayLabel }}</div>
      } @else {
```

(Include the existing editing/label/input/textarea/resize content unchanged)

```html
      }
```

**Step 3: Add ghost and disabled styles**

Append to `canvas-element.scss`:

```scss
.el-hidden-ghost {
  padding: 8px 12px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(128, 128, 128, 0.05) 5px,
    rgba(128, 128, 128, 0.05) 10px
  );
  border: 1px dashed var(--text-tertiary);
  border-radius: var(--radius-sm);
  color: var(--text-tertiary);
  font-size: 11px;
  font-style: italic;
  opacity: 0.6;
}

.el-input--disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
```

**Step 4: Update code generator for input disabled/hidden**

In `code-generator.service.ts`, in the `case 'input'` of `elementToHtml` (~line 823), add disabled and hidden attributes:

After the existing `reqAttr` line, add:

```typescript
        const disabledAttr = el.settings['disabled'] === 'true' ? ' disabled' : '';
        const hiddenStyle = el.settings['hidden'] === 'true' ? ' style="display:none"' : '';
```

Then wrap the label + input output in a div with `hiddenStyle`, and add `disabledAttr` to the input/textarea tag.

**Step 5: Commit**

```bash
git add src/app/components/properties-panel/settings-tab/settings-tab.html src/app/components/canvas-element/canvas-element.html src/app/components/canvas-element/canvas-element.scss src/app/services/code-generator.service.ts
git commit -m "feat(input): add disabled and hidden settings with canvas preview and code generation"
```

---

### Task 12: Add clone element from right panel

**Files:**
- Modify: `src/app/components/properties-panel/properties-panel.html:21-29` (element list)
- Modify: `src/app/components/properties-panel/properties-panel.ts` (add cloneElement method)
- Modify: `src/app/components/properties-panel/properties-panel.scss` (add clone button style)

**Step 1: Add clone button to element list**

In `properties-panel.html`, update the element list button (line ~22-26). Change:

```html
        <button class="element-list__item" (click)="builder.selectElement(el.id)">
          <span class="element-list__icon">{{ getElementIcon(el.type) }}</span>
          <span class="element-list__name">{{ el.label || el.staticContent || el.type }}</span>
          <span class="element-list__type">{{ el.type }}</span>
        </button>
```

to:

```html
        <div class="element-list__item">
          <button class="element-list__select" (click)="builder.selectElement(el.id)">
            <span class="element-list__icon">{{ getElementIcon(el.type) }}</span>
            <span class="element-list__name">{{ el.label || el.staticContent || el.type }}</span>
            <span class="element-list__type">{{ el.type }}</span>
          </button>
          <button class="element-list__clone" (click)="cloneElement(el.id, $event)" title="Clone element">⧉</button>
        </div>
```

**Step 2: Add `cloneElement` method to properties-panel.ts**

```typescript
  cloneElement(elementId: string, event: Event): void {
    event.stopPropagation();
    this.builder.copyElement(elementId);
    this.builder.pasteElement();
  }
```

**Step 3: Update styles in properties-panel.scss**

The `.element-list__item` is currently a `<button>` with flex styling. We're changing it to a `<div>` wrapper. The existing `.element-list__item` styles (lines 75-94) already have `display: flex`, `gap: 10px`, `padding: 8px 10px`, etc. — these stay on the wrapper div.

Add a new `.element-list__select` class that inherits the clickable button behavior, and add `.element-list__clone`:

```scss
.element-list__select {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  color: var(--text-primary);
  text-align: left;
  padding: 0;
}

.element-list__clone {
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border: 1px solid transparent;
  background: none;
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 13px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s;
  opacity: 0;

  .element-list__item:hover & {
    opacity: 1;
  }

  &:hover {
    background: var(--accent-subtle);
    color: var(--accent-text);
    border-color: var(--accent);
  }
}
```

**Step 4: Commit**

```bash
git add src/app/components/properties-panel/properties-panel.html src/app/components/properties-panel/properties-panel.ts src/app/components/properties-panel/properties-panel.scss
git commit -m "feat: add clone element button in right panel element list"
```

---

### Task 13: Build and verify all features

**Step 1: Run the build**

```bash
npx ng build
```

Expected: Build succeeds with no errors.

**Step 2: Manual verification checklist**

- [ ] Alert: Add from palette → yellow warning banner appears
- [ ] Alert: Double-click to inline-edit text
- [ ] Alert: Change variant in Settings → colors and icon update
- [ ] Alert: Toggle i18n → Arabic text field appears
- [ ] Alert: Toggle show/hide icon
- [ ] Alert: Pick custom icon
- [ ] Conditions: Select any element → Settings tab shows "Visibility Condition" section
- [ ] Conditions: Click "+ Add Condition" → condition form appears
- [ ] Conditions: Select source (element/function), operator, value
- [ ] Conditions: Canvas shows yellow "?" badge on conditioned elements
- [ ] Conditions: Remove condition works
- [ ] GET: Select button → Data tab → Submit action → Method dropdown includes GET
- [ ] GET: Select GET → body mapping and payload sections hidden
- [ ] Input: Disabled toggle → visual feedback on canvas
- [ ] Input: Hidden toggle → ghost preview on canvas
- [ ] Clone: Right panel element list shows clone button next to each element
- [ ] Clone: Click clone → duplicate element created

**Step 3: Fix any issues found during verification**

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete all 5 features - alert, conditions, GET, input states, clone"
```
