# Table, Div Container, and Geofence Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add table element (configurable rows/columns, static or dynamic data), div container element (visual background block), and geofence condition source for visibility conditions.

**Architecture:** Three new ElementTypes (`'table'`, `'container'`) plus a new `'geofence'` source on the existing `VisibilityCondition`. Table uses a new `tableData: string[][]` property on BuilderElement. Container is a simple styled block. Geofence uses `TWK.getUserLocation()` in generated code with haversine distance calculation.

**Tech Stack:** Angular 19, TypeScript, SCSS

---

### Task 1: Add table and container to ElementType, model, and palette

**Files:**
- Modify: `src/app/models/element.model.ts`
- Modify: `src/app/components/element-palette/element-palette.ts`
- Modify: `src/app/components/properties-panel/properties-panel.ts`

**Step 1: Add types to ElementType union**

In `src/app/models/element.model.ts`, add after `| 'alert'`:
```typescript
  | 'table'
  | 'container';
```

**Step 2: Add `tableData` to BuilderElement**

In the `BuilderElement` interface, add after `visibilityCondition`:
```typescript
  tableData?: string[][];
```

**Step 3: Add geofence fields to VisibilityCondition**

Update the `VisibilityCondition` interface:
```typescript
export interface VisibilityCondition {
  source: 'element' | 'function' | 'geofence';
  elementId?: string;
  functionBinding?: TwkBinding;
  operator: 'equals' | 'not_equals' | 'contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than';
  value?: string;
  geofenceLat?: string;
  geofenceLng?: string;
  geofenceRadius?: string;
}
```

**Step 4: Add to palette**

In `element-palette.ts`, add after the alert entry:
```typescript
    { type: 'table', label: 'Table', icon: 'T#' },
    { type: 'container', label: 'Div', icon: '[ ]' }
```

**Step 5: Add icons to properties panel**

In `properties-panel.ts`, add to `iconMap`:
```typescript
    table: '▦',
    container: '▢',
```

**Step 6: Commit**
```bash
git add src/app/models/element.model.ts src/app/components/element-palette/element-palette.ts src/app/components/properties-panel/properties-panel.ts
git commit -m "feat: add table, container types and geofence to VisibilityCondition model"
```

---

### Task 2: Add default element creation for table and container

**Files:**
- Modify: `src/app/services/builder.service.ts`

**Step 1: Add cases in `createDefaultElement` switch**

After the `case 'alert'` block, add:

```typescript
      case 'table':
        base.settings = { rows: '3', columns: '3', headerRow: 'true' };
        base.tableData = [
          ['Header 1', 'Header 2', 'Header 3'],
          ['Row 1', 'Data', 'Data'],
          ['Row 2', 'Data', 'Data']
        ];
        base.styles = { border: '1px solid #e4e4e7', borderRadius: '8px' };
        break;
      case 'container':
        base.staticContent = '';
        base.styles = {
          backgroundColor: '#f4f4f5',
          borderRadius: '8px',
          padding: '16px',
          width: '100%',
          height: '150px'
        };
        break;
```

**Step 2: Commit**
```bash
git add src/app/services/builder.service.ts
git commit -m "feat: add default table and container element creation"
```

---

### Task 3: Add table canvas rendering

**Files:**
- Modify: `src/app/components/canvas-element/canvas-element.html`
- Modify: `src/app/components/canvas-element/canvas-element.scss`

**Step 1: Add `@case ('table')` to canvas-element.html**

After the `@case ('alert')` block (before the closing `}` of `@switch`), add:

```html
    @case ('table') {
      <div class="el-table-wrapper">
        <table class="el-table">
          @for (row of element.tableData || []; track $index; let rowIdx = $index) {
            @if (rowIdx === 0 && element.settings['headerRow'] === 'true') {
              <thead>
                <tr>
                  @for (cell of row; track $index) {
                    <th>{{ cell }}</th>
                  }
                </tr>
              </thead>
            } @else {
              <tr>
                @for (cell of row; track $index) {
                  <td>{{ cell }}</td>
                }
              </tr>
            }
          }
        </table>
      </div>
    }
```

**Step 2: Add `@case ('container')` to canvas-element.html**

After the table case, add:

```html
    @case ('container') {
      <div class="el-container">
        <span class="el-container__label">Container</span>
      </div>
    }
```

**Step 3: Add styles to canvas-element.scss**

Append:

```scss

.el-table-wrapper {
  width: 100%;
  overflow-x: auto;
}

.el-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;

  th, td {
    padding: 6px 10px;
    border: 1px solid var(--border-primary, #e4e4e7);
    text-align: left;
  }

  th {
    background: var(--bg-tertiary, #f4f4f5);
    font-weight: 600;
    font-size: 11px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
}

.el-container {
  width: 100%;
  height: 100%;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;

  &__label {
    font-size: 11px;
    color: var(--text-muted);
    opacity: 0.5;
    font-style: italic;
  }
}
```

**Step 4: Commit**
```bash
git add src/app/components/canvas-element/canvas-element.html src/app/components/canvas-element/canvas-element.scss
git commit -m "feat: add table and container canvas rendering with styles"
```

---

### Task 4: Add table settings tab

**Files:**
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.html`
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.ts`

**Step 1: Add `'table'` to i18n-eligible list (line 3)**

Change the array to include `'table'`:
```
'text', 'button', 'input', 'dropdown', 'radio', 'checkbox', 'date-picker', 'media-select', 'alert', 'table'
```

**Step 2: Add `@case ('table')` in settings-tab.html**

After the `@case ('alert')` block (before the `}` closing the switch), add:

```html
    @case ('table') {
      <div class="field">
        <label>Columns</label>
        <input type="number" min="1" max="10" [ngModel]="el.settings['columns'] || '3'" (ngModelChange)="onTableResize(el.settings['rows'] || '3', $event)">
      </div>
      <div class="field">
        <label>Rows</label>
        <input type="number" min="1" max="20" [ngModel]="el.settings['rows'] || '3'" (ngModelChange)="onTableResize($event, el.settings['columns'] || '3')">
      </div>
      <label class="switch-row">
        <span class="switch-row__label">Header Row</span>
        <span class="switch" [class.switch--on]="el.settings['headerRow'] === 'true'" (click)="updateSetting('headerRow', el.settings['headerRow'] === 'true' ? 'false' : 'true')">
          <span class="switch__knob"></span>
        </span>
      </label>
      <div class="table-editor">
        <label class="section-label">Cell Data</label>
        @for (row of el.tableData || []; track $index; let rowIdx = $index) {
          <div class="table-editor__row">
            <span class="table-editor__row-label">{{ rowIdx === 0 && el.settings['headerRow'] === 'true' ? 'H' : 'R' }}{{ rowIdx + 1 }}</span>
            @for (cell of row; track $index; let colIdx = $index) {
              <input class="table-editor__cell" type="text" [ngModel]="cell" (ngModelChange)="updateTableCell(rowIdx, colIdx, $event)" [placeholder]="'R' + (rowIdx+1) + 'C' + (colIdx+1)">
            }
          </div>
        }
      </div>
    }
```

**Step 3: Add `@case ('container')` in settings-tab.html**

After the table case:

```html
    @case ('container') {
      <div class="hint">
        Use the Style tab to customize background color, padding, border radius, and size.
      </div>
    }
```

**Step 4: Add table methods to settings-tab.ts**

Add these methods to the `SettingsTab` class:

```typescript
  onTableResize(rows: string, columns: string): void {
    const el = this.element;
    if (!el) return;
    const r = Math.max(1, Math.min(20, parseInt(rows, 10) || 3));
    const c = Math.max(1, Math.min(10, parseInt(columns, 10) || 3));
    const oldData = el.tableData || [];
    const newData: string[][] = [];
    for (let i = 0; i < r; i++) {
      const row: string[] = [];
      for (let j = 0; j < c; j++) {
        row.push(oldData[i]?.[j] ?? '');
      }
      newData.push(row);
    }
    this.builder.updateElement(el.id, {
      settings: { ...el.settings, rows: String(r), columns: String(c) },
      tableData: newData
    });
  }

  updateTableCell(rowIdx: number, colIdx: number, value: string): void {
    const el = this.element;
    if (!el || !el.tableData) return;
    const newData = el.tableData.map((row, ri) =>
      ri === rowIdx ? row.map((cell, ci) => ci === colIdx ? value : cell) : [...row]
    );
    this.builder.updateElement(el.id, { tableData: newData });
  }
```

**Step 5: Add table editor styles to settings-tab.scss**

Read `settings-tab.scss` and append:

```scss
.table-editor {
  margin-top: 8px;

  &__row {
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 4px;
  }

  &__row-label {
    width: 24px;
    font-size: 10px;
    color: var(--text-muted);
    text-align: center;
    flex-shrink: 0;
  }

  &__cell {
    flex: 1;
    min-width: 0;
    padding: 4px 6px;
    font-size: 12px;
    background: var(--input-bg);
    border: 1px solid var(--input-border);
    color: var(--input-text);
    border-radius: var(--radius-sm);
  }
}
```

**Step 6: Commit**
```bash
git add src/app/components/properties-panel/settings-tab/settings-tab.html src/app/components/properties-panel/settings-tab/settings-tab.ts src/app/components/properties-panel/settings-tab/settings-tab.scss
git commit -m "feat: add table settings with cell editor and container settings"
```

---

### Task 5: Add table and container to code generator

**Files:**
- Modify: `src/app/services/code-generator.service.ts`

**Step 1: Add `case 'table'` to `elementToHtml`**

Before the `default:` case in `elementToHtml`, add:

```typescript
      case 'table': {
        const hasHeader = el.settings['headerRow'] === 'true';
        const data = el.tableData || [];
        let html = `  <table class="data-table" id="${el.id}">\n`;
        for (let i = 0; i < data.length; i++) {
          if (i === 0 && hasHeader) {
            html += `    <thead><tr>`;
            for (const cell of data[i]) {
              html += `<th>${this.escapeHtml(cell)}</th>`;
            }
            html += `</tr></thead>\n`;
          } else {
            html += `    <tr>`;
            for (const cell of data[i]) {
              html += `<td>${this.escapeHtml(cell)}</td>`;
            }
            html += `</tr>\n`;
          }
        }
        html += `  </table>`;
        return html;
      }
```

**Step 2: Add `case 'container'` to `elementToHtml`**

```typescript
      case 'container': {
        const style = this.styleObjectToCss(el.styles);
        return `  <div class="container-block" id="${el.id}"${style ? ` style="${style}"` : ''}></div>`;
      }
```

**Step 3: Add table CSS to `generateCss`**

In the `generateCss` method, find where general element styles are generated. Add table styles to the CSS output. Find a suitable place (e.g., after the existing `.map-container` styles) and add:

```typescript
    css += `.data-table { width: 100%; border-collapse: collapse; }\n`;
    css += `.data-table th, .data-table td { padding: 8px 12px; border: 1px solid var(--border, #e4e4e7); text-align: left; font-size: 14px; }\n`;
    css += `.data-table th { background: rgba(0,0,0,0.03); font-weight: 600; }\n`;
    css += `.container-block { box-sizing: border-box; }\n`;
```

**Step 4: Add dynamic table data in `generateJs`**

In the `generateJs` method, find where dynamic bindings are processed for each element (the loop at ~line 284 that checks `el.dataSource === 'dynamic' && el.dynamicBinding`). Add table support:

After the existing `else if (['dropdown', 'radio', 'checkbox'].includes(el.type))` block, add:

```typescript
          } else if (el.type === 'table') {
            js += `  ${call}.then(function(data) {\n`;
            js += `    var items = data.${b.resultPath};\n`;
            js += `    var table = document.getElementById('${el.id}');\n`;
            js += `    if (!table || !Array.isArray(items)) return;\n`;
            js += `    var hasHeader = ${el.settings['headerRow'] === 'true'};\n`;
            js += `    var html = '';\n`;
            js += `    items.forEach(function(row, i) {\n`;
            js += `      if (!Array.isArray(row)) row = Object.values(row);\n`;
            js += `      if (i === 0 && hasHeader) {\n`;
            js += `        html += '<thead><tr>' + row.map(function(c) { return '<th>' + c + '</th>'; }).join('') + '</tr></thead>';\n`;
            js += `      } else {\n`;
            js += `        html += '<tr>' + row.map(function(c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';\n`;
            js += `      }\n`;
            js += `    });\n`;
            js += `    table.innerHTML = html;\n`;
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          }
```

**Step 5: Commit**
```bash
git add src/app/services/code-generator.service.ts
git commit -m "feat: add table and container HTML/CSS/JS generation"
```

---

### Task 6: Add geofence condition source to visibility UI

**Files:**
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.html`
- Modify: `src/app/components/properties-panel/settings-tab/settings-tab.ts`

**Step 1: Add 'geofence' option to source dropdown**

In `settings-tab.html`, find the condition source dropdown (line ~310):
```html
          <option value="element">Another Element</option>
          <option value="function">TWK Function</option>
```

Add after the function option:
```html
          <option value="geofence">Geofence (Location)</option>
```

**Step 2: Add geofence UI fields**

After the `@if (el.visibilityCondition.source === 'function')` block (closes around line ~347), add:

```html
      @if (el.visibilityCondition.source === 'geofence') {
        <div class="field">
          <label>Center Latitude</label>
          <input type="text" [ngModel]="el.visibilityCondition.geofenceLat || ''" (ngModelChange)="updateConditionField('geofenceLat', $event)" placeholder="e.g. 24.7136">
        </div>
        <div class="field">
          <label>Center Longitude</label>
          <input type="text" [ngModel]="el.visibilityCondition.geofenceLng || ''" (ngModelChange)="updateConditionField('geofenceLng', $event)" placeholder="e.g. 46.6753">
        </div>
        <div class="field">
          <label>Radius (meters)</label>
          <input type="number" [ngModel]="el.visibilityCondition.geofenceRadius || ''" (ngModelChange)="updateConditionField('geofenceRadius', $event)" placeholder="e.g. 500">
        </div>
      }
```

**Step 3: Replace the operator dropdown for geofence**

The current operator dropdown (line ~348) should show different labels when geofence is active. Replace the operator `<select>` block with:

```html
      <div class="field">
        <label>Operator</label>
        @if (el.visibilityCondition.source === 'geofence') {
          <select [ngModel]="el.visibilityCondition.operator" (ngModelChange)="updateConditionField('operator', $event)">
            <option value="equals">Inside Radius</option>
            <option value="not_equals">Outside Radius</option>
          </select>
        } @else {
          <select [ngModel]="el.visibilityCondition.operator" (ngModelChange)="updateConditionField('operator', $event)">
            <option value="equals">Equals</option>
            <option value="not_equals">Not Equals</option>
            <option value="contains">Contains</option>
            <option value="empty">Is Empty</option>
            <option value="not_empty">Is Not Empty</option>
            <option value="greater_than">Greater Than</option>
            <option value="less_than">Less Than</option>
          </select>
        }
      </div>
```

Also hide the "Value" input when geofence is selected (since radius is the value). Update the value field condition:
```html
      @if (!['empty', 'not_empty'].includes(el.visibilityCondition.operator) && el.visibilityCondition.source !== 'geofence') {
```

**Step 4: Update `updateConditionSource` for geofence**

In `settings-tab.ts`, update the `updateConditionSource` method to handle geofence:

```typescript
  updateConditionSource(source: 'element' | 'function' | 'geofence'): void {
    const el = this.element;
    if (!el || !el.visibilityCondition) return;
    const condition: VisibilityCondition = {
      ...el.visibilityCondition,
      source,
      elementId: source === 'element' ? '' : undefined,
      functionBinding: source === 'function' ? { functionName: '', params: {}, resultPath: 'result' } : undefined,
      geofenceLat: source === 'geofence' ? '24.7136' : undefined,
      geofenceLng: source === 'geofence' ? '46.6753' : undefined,
      geofenceRadius: source === 'geofence' ? '500' : undefined,
      operator: source === 'geofence' ? 'equals' : el.visibilityCondition.operator
    };
    this.builder.updateElement(el.id, { visibilityCondition: condition });
  }
```

Also update the `VisibilityCondition` import if it was imported with only the old source type — should already be fine since it's imported from the model.

**Step 5: Commit**
```bash
git add src/app/components/properties-panel/settings-tab/settings-tab.html src/app/components/properties-panel/settings-tab/settings-tab.ts
git commit -m "feat: add geofence condition source with lat/lng/radius UI"
```

---

### Task 7: Add geofence evaluation to code generator

**Files:**
- Modify: `src/app/services/code-generator.service.ts`

**Step 1: Update condition rendering in `generateHtml`**

No changes needed — the existing `data-condition` attribute serialization already handles the new geofence fields since it uses `JSON.stringify(el.visibilityCondition)`.

**Step 2: Add geofence evaluation to `generateJs`**

In the `generateJs` method, find the `if (hasConditions)` block. Inside the `evalCondition` function, after the `if (cond.source === 'element' && cond.elementId)` block, before the operator switch, add handling for geofence. The geofence is evaluated differently — it's async and sets a global.

Instead, add a separate geofence initialization block after the `checkConditions()` call at the end of the conditions section. Find `js += '  checkConditions();\n';` and after it add:

```typescript
      // Geofence conditions
      const hasGeofence = pages.some(p => p.elements.some(e => e.visibilityCondition?.source === 'geofence'));
      if (hasGeofence) {
        js += `  // Geofence evaluation\n`;
        js += `  function haversineDistance(lat1, lon1, lat2, lon2) {\n`;
        js += `    var R = 6371e3;\n`;
        js += `    var toRad = function(d) { return d * Math.PI / 180; };\n`;
        js += `    var dLat = toRad(lat2 - lat1);\n`;
        js += `    var dLon = toRad(lon2 - lon1);\n`;
        js += `    var a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);\n`;
        js += `    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));\n`;
        js += `  }\n`;
        js += `  if (typeof TWK !== 'undefined' && TWK.getUserLocation) {\n`;
        js += `    TWK.getUserLocation().then(function(data) {\n`;
        js += `      var loc = data.result;\n`;
        js += `      if (!loc || !loc.latitude) return;\n`;
        js += `      var userLat = parseFloat(loc.latitude);\n`;
        js += `      var userLng = parseFloat(loc.longitude);\n`;
        js += `      document.querySelectorAll('[data-condition]').forEach(function(el) {\n`;
        js += `        try {\n`;
        js += `          var c = JSON.parse(el.getAttribute('data-condition'));\n`;
        js += `          if (c.source !== 'geofence') return;\n`;
        js += `          var dist = haversineDistance(userLat, userLng, parseFloat(c.geofenceLat), parseFloat(c.geofenceLng));\n`;
        js += `          var radius = parseFloat(c.geofenceRadius) || 500;\n`;
        js += `          var inside = dist <= radius;\n`;
        js += `          var show = c.operator === 'equals' ? inside : !inside;\n`;
        js += `          el.style.display = show ? '' : 'none';\n`;
        js += `        } catch(e) {}\n`;
        js += `      });\n`;
        js += `    }).catch(function(err) { console.error('getUserLocation:', err); });\n`;
        js += `  }\n`;
      }
```

**Step 3: Commit**
```bash
git add src/app/services/code-generator.service.ts
git commit -m "feat: add geofence evaluation with haversine distance in generated code"
```

---

### Task 8: Build and verify

**Step 1: Run build**
```bash
npx ng build
```
Expected: no errors.

**Step 2: Verification checklist**
- [ ] Table: add from palette → 3x3 table with headers appears
- [ ] Table: change rows/columns in settings → table resizes, data preserved
- [ ] Table: edit cell content in settings grid → canvas updates
- [ ] Table: toggle header row
- [ ] Table: dynamic data source (select TWK function)
- [ ] Container: add from palette → grey rectangle appears
- [ ] Container: change bg color, padding, border radius in Style tab
- [ ] Geofence: select any element → add condition → source dropdown shows "Geofence (Location)"
- [ ] Geofence: select geofence → shows lat/lng/radius fields
- [ ] Geofence: operator shows "Inside Radius" / "Outside Radius"
- [ ] Generated code includes haversine function and getUserLocation call

**Step 3: Final commit**
```bash
git add -A
git commit -m "feat: complete table, container, and geofence features"
```
