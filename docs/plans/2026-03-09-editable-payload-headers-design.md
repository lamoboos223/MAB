# Editable Request Payload & Custom Headers

## Problem

The Submit-to-API feature has a read-only request preview and hardcoded headers. Users need to:
1. Edit the JSON payload structure (nest fields, rename keys, add static values)
2. Add custom HTTP headers (API keys, authorization tokens, etc.)

## Solution

### Data Model

Add `payloadTemplate`, `headers`, and `method` to `SubmitConfig`:

```typescript
export interface SubmitHeader {
  key: string;
  value: string; // supports {{variable}} placeholders
}

export interface SubmitConfig {
  apiUrl: string;
  method: string;             // 'POST' | 'PUT' | 'PATCH'
  fieldMappings: FieldMapping[];
  payloadTemplate: string;    // editable JSON with {{field_name}} variables
  headers: SubmitHeader[];    // custom header key-value pairs
  successPage: string;
  errorMessage: string;
}
```

### UI (Data Tab)

- **Method selector:** Dropdown for POST/PUT/PATCH, placed below API URL.
- **Editable payload textarea:** Replaces the read-only `<pre>` preview. Auto-generated initially from field mappings using `{{key_name}}` placeholders. User edits are preserved when mappings change. A "Reset" button regenerates the template from current mappings.
- **Headers section:** Key-value input rows with "+" to add and "x" to remove. Values support `{{variable}}` placeholders. `Content-Type: application/json` is always sent and not shown in custom headers.

### Code Generator

- Embeds the payload template string and replaces `{{variable}}` with runtime form values.
- Iterates custom headers and adds them to the fetch headers object.
- Replaces `{{variable}}` in header values with runtime form values.
- Uses configured HTTP method instead of hardcoded POST.
- TWK token and HMAC signing remain unchanged (appended after custom headers).

## Files to Modify

1. `src/app/models/element.model.ts` - Add `SubmitHeader`, update `SubmitConfig`
2. `src/app/components/properties-panel/data-tab/data-tab.ts` - Add header/payload management methods
3. `src/app/components/properties-panel/data-tab/data-tab.html` - Add textarea, method selector, header rows
4. `src/app/components/properties-panel/data-tab/data-tab.scss` - Style new UI elements
5. `src/app/services/code-generator.service.ts` - Update submit handler generation
