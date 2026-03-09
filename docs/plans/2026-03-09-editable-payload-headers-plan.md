# Editable Request Payload & Custom Headers Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the Submit-to-API request payload editable with `{{variable}}` template syntax, add custom HTTP headers with key-value UI, and add HTTP method selection.

**Architecture:** Extend `SubmitConfig` model with `payloadTemplate`, `headers[]`, and `method`. Replace the read-only `<pre>` preview with an editable `<textarea>`. Add header key-value rows below the payload. Update the code generator to use the template string and custom headers.

**Tech Stack:** Angular 21, TypeScript, Angular CDK

---

### Task 1: Update Data Model

**Files:**
- Modify: `src/app/models/element.model.ts:56-61`

**Step 1: Add SubmitHeader interface and update SubmitConfig**

In `src/app/models/element.model.ts`, add `SubmitHeader` before `SubmitConfig` and update `SubmitConfig`:

```typescript
export interface SubmitHeader {
  key: string;
  value: string;
}

export interface SubmitConfig {
  apiUrl: string;
  method: string;
  fieldMappings: FieldMapping[];
  payloadTemplate: string;
  headers: SubmitHeader[];
  successPage: string;
  errorMessage: string;
}
```

**Step 2: Build to verify**

Run: `npx ng build`
Expected: Build succeeds (existing code still references old fields but TypeScript won't error since we added fields, not removed)

**Step 3: Commit**

```bash
git add src/app/models/element.model.ts
git commit -m "feat: add SubmitHeader, method, payloadTemplate, headers to SubmitConfig"
```

---

### Task 2: Update Default SubmitConfig Creation & Data Tab Methods

**Files:**
- Modify: `src/app/components/properties-panel/data-tab/data-tab.ts:5,59-69,78-148`

**Step 1: Update import to include SubmitHeader**

At line 5, add `SubmitHeader` to the import:

```typescript
import { TwkBinding, ElementOption, SubmitConfig, FieldMapping, SubmitHeader } from '../../../models/element.model';
```

**Step 2: Update setButtonAction to initialize new fields**

In `setButtonAction`, when creating the default `submitConfig` (lines 64-69), add the new fields:

```typescript
submitConfig: {
  apiUrl: '',
  method: 'POST',
  fieldMappings: fields.map(f => ({ ...f })),
  payloadTemplate: this.generateDefaultPayloadTemplate(fields),
  headers: [],
  successPage: '',
  errorMessage: 'Submission failed. Please try again.'
}
```

**Step 3: Add helper method to generate default payload template**

Add this method to the `DataTab` class:

```typescript
generateDefaultPayloadTemplate(fields: FieldMapping[]): string {
  const obj: Record<string, string> = {};
  for (const f of fields) {
    obj[f.keyName || f.elementLabel] = `{{${f.keyName || f.elementLabel}}}`;
  }
  return JSON.stringify(obj, null, 2);
}
```

**Step 4: Add method to update the HTTP method**

```typescript
updateMethod(method: string): void {
  const el = this.element; if (!el?.submitConfig) return;
  this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, method } });
}
```

**Step 5: Add method to update payload template**

```typescript
updatePayloadTemplate(template: string): void {
  const el = this.element; if (!el?.submitConfig) return;
  this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, payloadTemplate: template } });
}
```

**Step 6: Add method to reset payload template from current mappings**

```typescript
resetPayloadTemplate(): void {
  const el = this.element; if (!el?.submitConfig) return;
  const template = this.generateDefaultPayloadTemplate(el.submitConfig.fieldMappings);
  this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, payloadTemplate: template } });
}
```

**Step 7: Add header management methods**

```typescript
addHeader(): void {
  const el = this.element; if (!el?.submitConfig) return;
  const headers = [...(el.submitConfig.headers || []), { key: '', value: '' }];
  this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, headers } });
}

updateHeader(index: number, field: 'key' | 'value', val: string): void {
  const el = this.element; if (!el?.submitConfig) return;
  const headers = [...(el.submitConfig.headers || [])];
  headers[index] = { ...headers[index], [field]: val };
  this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, headers } });
}

removeHeader(index: number): void {
  const el = this.element; if (!el?.submitConfig) return;
  const headers = (el.submitConfig.headers || []).filter((_, i) => i !== index);
  this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, headers } });
}
```

**Step 8: Remove the old `requestPreview` getter**

Delete the `get requestPreview()` method (lines 133-148) entirely — it's replaced by the editable textarea.

**Step 9: Build to verify**

Run: `npx ng build`
Expected: May fail due to template still referencing `requestPreview` — that's expected, we fix it in Task 3.

**Step 10: Commit**

```bash
git add src/app/components/properties-panel/data-tab/data-tab.ts
git commit -m "feat: add payload template, headers, and method management to data tab"
```

---

### Task 3: Update Data Tab Template

**Files:**
- Modify: `src/app/components/properties-panel/data-tab/data-tab.html:81-132`

**Step 1: Replace the submit config section**

Replace lines 81-132 (everything inside `@if (el.submitConfig; as cfg) { ... }`) with:

```html
@if (el.submitConfig; as cfg) {
  <div class="field">
    <label>API URL</label>
    <input type="text" [ngModel]="cfg.apiUrl" (ngModelChange)="updateApiUrl($event)" placeholder="https://api.example.com/endpoint">
  </div>

  <div class="field">
    <label>Method</label>
    <select [ngModel]="cfg.method || 'POST'" (ngModelChange)="updateMethod($event)">
      <option value="POST">POST</option>
      <option value="PUT">PUT</option>
      <option value="PATCH">PATCH</option>
    </select>
  </div>

  <div class="submit-section">
    <label class="submit-section__title">Request Body Mapping</label>
    <div class="mapping-list">
      @for (field of availableFields; track field.elementId) {
        <div class="mapping-row">
          <label class="mapping-check">
            <input type="checkbox" [checked]="isFieldIncluded(field.elementId)" (change)="toggleFieldMapping($index, $any($event.target).checked)">
          </label>
          <div class="mapping-info">
            <span class="mapping-label">{{ field.elementLabel }}</span>
            <span class="mapping-meta">
              <span class="mapping-type">{{ getFieldTypeBadge(field.source) }}</span>
              <span class="mapping-page">{{ field.pageName }}</span>
            </span>
          </div>
          @if (isFieldIncluded(field.elementId)) {
            <input class="mapping-key" type="text"
              [ngModel]="getFieldKeyName(field.elementId)"
              (ngModelChange)="updateFieldKeyName(field.elementId, $event)"
              placeholder="key_name">
          }
        </div>
      }
    </div>

    <div class="payload-header">
      <label class="submit-section__title">Request Payload</label>
      <button class="reset-btn" (click)="resetPayloadTemplate()" title="Regenerate from field mappings">&#8635; Reset</button>
    </div>
    <textarea class="payload-editor"
      [ngModel]="cfg.payloadTemplate || '{}'"
      (ngModelChange)="updatePayloadTemplate($event)"
      spellcheck="false"
      rows="8"
    ></textarea>
    <p class="payload-hint">Use <code>{<!-- -->{field_name}}</code> for dynamic values</p>
  </div>

  <div class="submit-section">
    <div class="header-section-title">
      <label class="submit-section__title">Request Headers</label>
      <button class="add-header-btn" (click)="addHeader()">+ Add</button>
    </div>
    @for (h of cfg.headers || []; track $index) {
      <div class="header-row">
        <input class="header-key" type="text" [ngModel]="h.key" (ngModelChange)="updateHeader($index, 'key', $event)" placeholder="Header-Name">
        <input class="header-value" type="text" [ngModel]="h.value" (ngModelChange)="updateHeader($index, 'value', $event)" placeholder="value or {{var}}">
        <button class="header-remove" (click)="removeHeader($index)">&times;</button>
      </div>
    }
    @empty {
      <p class="empty-headers">No custom headers. Content-Type: application/json is always sent.</p>
    }
  </div>

  <div class="field">
    <label>On Success - Go to Page</label>
    <select [ngModel]="cfg.successPage" (ngModelChange)="updateSuccessPage($event)">
      <option value="">-- Select Page --</option>
      @for (page of builder.pages(); track page.id) {
        <option [value]="page.id">{{ page.name }}</option>
      }
    </select>
  </div>

  <div class="field">
    <label>Error Message</label>
    <input type="text" [ngModel]="cfg.errorMessage" (ngModelChange)="updateErrorMessage($event)">
  </div>
}
```

**Step 2: Build to verify**

Run: `npx ng build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/components/properties-panel/data-tab/data-tab.html
git commit -m "feat: add editable payload textarea, method selector, and header rows to data tab UI"
```

---

### Task 4: Update Data Tab Styles

**Files:**
- Modify: `src/app/components/properties-panel/data-tab/data-tab.scss`

**Step 1: Replace `.request-preview` and add new styles**

Replace the `.request-preview` block (lines 163-175) with:

```scss
.payload-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
}

.reset-btn {
  background: none;
  border: 1px solid var(--border-subtle);
  color: var(--text-tertiary);
  font-size: 11px;
  padding: 2px 8px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--accent);
    color: var(--accent-text);
  }
}

.payload-editor {
  width: 100%;
  min-height: 120px;
  padding: 10px 12px;
  background: var(--bg-primary, #0d0d0f);
  border: 1px solid var(--border-subtle);
  border-radius: var(--radius-sm);
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  color: var(--accent-text);
  line-height: 1.6;
  resize: vertical;
  tab-size: 2;

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
}

.payload-hint {
  font-size: 10px;
  color: var(--text-muted);
  margin: 4px 0 0 0;

  code {
    background: var(--bg-secondary);
    padding: 1px 4px;
    border-radius: 3px;
    font-family: 'SF Mono', 'Fira Code', monospace;
  }
}

.header-section-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;

  .submit-section__title {
    margin-bottom: 0;
  }
}

.add-header-btn {
  background: none;
  border: 1px solid var(--border-subtle);
  color: var(--accent-text);
  font-size: 11px;
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;

  &:hover {
    border-color: var(--accent);
    background: var(--accent-subtle);
  }
}

.header-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.header-key, .header-value {
  flex: 1;
  padding: 6px 8px;
  font-size: 11px;
  font-family: 'SF Mono', 'Fira Code', monospace;
  background: var(--input-bg);
  border: 1px solid var(--input-border);
  color: var(--input-text);
  border-radius: var(--radius-sm);

  &:focus {
    outline: none;
    border-color: var(--accent);
  }
}

.header-key {
  max-width: 40%;
}

.header-remove {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 16px;
  cursor: pointer;
  padding: 0 4px;
  line-height: 1;
  flex-shrink: 0;

  &:hover {
    color: var(--danger, #ef4444);
  }
}

.empty-headers {
  font-size: 11px;
  color: var(--text-muted);
  margin: 0;
  padding: 8px 0;
}
```

**Step 2: Build to verify**

Run: `npx ng build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/components/properties-panel/data-tab/data-tab.scss
git commit -m "feat: style payload editor, headers UI, and reset button"
```

---

### Task 5: Update Code Generator

**Files:**
- Modify: `src/app/services/code-generator.service.ts:340-438`

**Step 1: Replace the submit body and headers generation**

In the submit handler section (starting at line 340 `if (hasSubmit && el.submitConfig)`), replace the body/headers construction. The key changes:

1. Instead of building `bodyObj` key-by-key (lines 362-397), generate code that:
   - Extracts all field values into variables (same DOM extraction logic)
   - Creates a template string from `cfg.payloadTemplate`
   - Replaces `{{key}}` patterns with actual field values

2. Instead of hardcoded headers (lines 400-414), generate code that:
   - Starts with `Content-Type: application/json`
   - Adds each custom header from `cfg.headers`
   - Replaces `{{key}}` in header values with field values
   - Then adds TWK token and HMAC signing as before

3. Use `cfg.method` instead of hardcoded `'POST'` at line 417

Replace lines 361-420 with:

```typescript
// Build field values for template substitution
js += `      var __fields = {};\n`;
for (const m of cfg.fieldMappings) {
  const varName = m.elementId.replace(/-/g, '_');
  if (m.source === 'input') {
    js += `      var f_${varName} = document.getElementById('${m.elementId}');\n`;
    js += `      __fields['${m.keyName}'] = f_${varName} ? f_${varName}.value : '';\n`;
  } else if (m.source === 'dropdown') {
    js += `      var f_${varName} = document.querySelector('#${m.elementId} .custom-dropdown__value');\n`;
    js += `      __fields['${m.keyName}'] = f_${varName} ? (f_${varName}.value || '') : '';\n`;
  } else if (m.source === 'radio') {
    const srcEl = pages.flatMap(p => p.elements).find(e => e.id === m.elementId);
    const radioName = srcEl?.settings['groupName'] || m.elementId;
    js += `      var f_${varName} = document.querySelector('input[name="${radioName}"]:checked');\n`;
    js += `      __fields['${m.keyName}'] = f_${varName} ? f_${varName}.value : '';\n`;
  } else if (m.source === 'checkbox') {
    js += `      var f_${varName} = document.querySelectorAll('#${m.elementId} input[type="checkbox"]:checked');\n`;
    js += `      __fields['${m.keyName}'] = JSON.stringify(Array.from(f_${varName}).map(function(c) { return c.value; }));\n`;
  } else if (m.source === 'date-picker') {
    js += `      var f_${varName} = document.querySelector('#${m.elementId} .date-picker-trigger__text');\n`;
    js += `      __fields['${m.keyName}'] = f_${varName} && !f_${varName}.classList.contains('date-picker-trigger__text--placeholder') ? f_${varName}.textContent : '';\n`;
  } else if (m.source === 'media-select') {
    js += `      var f_${varName} = document.querySelectorAll('#${m.elementId} .img-picker__item img, #${m.elementId} .img-picker__item video');\n`;
    js += `      __fields['${m.keyName}'] = JSON.stringify(Array.from(f_${varName}).map(function(m) { return m.src; }));\n`;
  } else if (m.source === 'map') {
    js += `      var f_${varName} = document.querySelector('#${m.elementId} iframe');\n`;
    js += `      if (f_${varName}) { var src = f_${varName}.getAttribute('src') || ''; var match = src.match(/q=([\\d.-]+),([\\d.-]+)/); __fields['${m.keyName}'] = match ? JSON.stringify({ lat: parseFloat(match[1]), lng: parseFloat(match[2]) }) : 'null'; }\n`;
    js += `      else { __fields['${m.keyName}'] = 'null'; }\n`;
  } else if (m.source === 'dynamic') {
    const srcEl = pages.flatMap(p => p.elements).find(e => e.id === m.elementId);
    if (srcEl?.dynamicBinding) {
      const b = srcEl.dynamicBinding;
      const params = Object.values(b.params).filter(v => v).map(v => `'${v}'`).join(', ');
      js += `      var dyn_${varName} = await TWK.${b.functionName}(${params});\n`;
      js += `      __fields['${m.keyName}'] = typeof dyn_${varName}.${b.resultPath} === 'string' ? dyn_${varName}.${b.resultPath} : JSON.stringify(dyn_${varName}.${b.resultPath});\n`;
    }
  }
}

// Apply template substitution
const escapedTemplate = JSON.stringify(cfg.payloadTemplate || '{}');
js += `      var bodyTemplate = ${escapedTemplate};\n`;
js += `      var body = bodyTemplate.replace(/\\{\\{(\\w+)\\}\\}/g, function(_, key) {\n`;
js += `        var val = __fields[key];\n`;
js += `        if (val === undefined) return '{{' + key + '}}';\n`;
js += `        // If value looks like JSON (array/object), remove surrounding quotes from template\n`;
js += `        if ((val.startsWith('[') || val.startsWith('{')) && bodyTemplate.indexOf('"{{' + key + '}}"') >= 0) {\n`;
js += `          return val;\n`;
js += `        }\n`;
js += `        return val;\n`;
js += `      });\n`;
js += `      // Fix JSON: remove quotes around array/object values\n`;
js += `      body = body.replace(/"(\\[.*?\\]|\\{.*?\\})"/g, function(_, inner) {\n`;
js += `        try { JSON.parse(inner); return inner; } catch(e) { return '"' + inner + '"'; }\n`;
js += `      });\n`;
js += `      console.error('[Submit] body:', body);\n`;

// Build headers
js += `      var headers = { 'Content-Type': 'application/json' };\n`;
if (cfg.headers && cfg.headers.length > 0) {
  for (const h of cfg.headers) {
    if (!h.key) continue;
    const escapedVal = JSON.stringify(h.value || '');
    if (h.value.includes('{{')) {
      js += `      headers[${JSON.stringify(h.key)}] = ${escapedVal}.replace(/\\{\\{(\\w+)\\}\\}/g, function(_, key) { return __fields[key] || ''; });\n`;
    } else {
      js += `      headers[${JSON.stringify(h.key)}] = ${escapedVal};\n`;
    }
  }
}
// TWK token (keep existing)
js += `      try {\n`;
js += `        console.error('[Submit] getting token...');\n`;
js += `        var tokenData = await withTimeout(TWK.generateToken(), 10000, 'generateToken');\n`;
js += `        var token = tokenData.result && tokenData.result.token ? tokenData.result.token : '';\n`;
js += `        if (token) headers['Authorization'] = 'Bearer ' + token;\n`;
js += `        console.error('[Submit] token ok');\n`;
js += `      } catch(tokenErr) { console.error('[Submit] Token error (continuing):', tokenErr); }\n`;
// HMAC signing (keep existing)
js += `      if (SECRET_KEY) {\n`;
js += `        console.error('[Submit] signing...');\n`;
js += `        var signed = await withTimeout(hashRequest(body), 5000, 'hashRequest');\n`;
js += `        headers['signature'] = signed.signature;\n`;
js += `        headers['timestamp'] = signed.timestamp;\n`;
js += `        headers['nonce'] = signed.nonce;\n`;
js += `      }\n`;
// Fetch with configurable method
const method = cfg.method || 'POST';
js += `      console.error('[Submit] fetching ${cfg.apiUrl}...');\n`;
js += `      var resp = await withTimeout(fetch('${cfg.apiUrl}', {\n`;
js += `        method: '${method}',\n`;
js += `        headers: headers,\n`;
js += `        body: body\n`;
js += `      }), 30000, 'fetch');\n`;
```

Everything after (response handling, error handling) stays the same.

**Step 2: Build to verify**

Run: `npx ng build`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add src/app/services/code-generator.service.ts
git commit -m "feat: code generator uses payload template and custom headers"
```

---

### Task 6: Final Verification

**Step 1: Full build**

Run: `npx ng build`
Expected: Clean build, no errors

**Step 2: Serve and manually test**

Run: `npx ng serve`
Test checklist:
- Add a button element, select "Submit to API" action
- Verify method dropdown appears with POST/PUT/PATCH
- Verify editable payload textarea appears with auto-generated template
- Edit the template JSON (restructure, add nesting, add static values)
- Click "Reset" — template regenerates from field mappings
- Add a header row with "+ Add", fill key and value
- Add a header with `{{variable}}` in value
- Remove a header with ✕
- Export ZIP and verify generated JS uses template and custom headers

**Step 3: Commit all remaining changes**

```bash
git add -A
git commit -m "feat: editable request payload with template variables and custom HTTP headers"
```
