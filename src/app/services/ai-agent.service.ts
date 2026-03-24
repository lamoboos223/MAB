import { Injectable, inject, signal } from '@angular/core';
import { ToolExecutorService, ToolCall, ToolResult } from './tool-executor.service';
import { TOOL_DEFINITIONS } from '../data/ai-tool-definitions';

const API_URL = 'https://api.anthropic.com/v1/messages';
const STORAGE_KEY = 'mab_claude_api_key';
const MODEL = 'claude-sonnet-4-20250514';
const MAX_TOKENS = 4096;
const MAX_AUTO_CONTINUE = 15;

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  images?: string[]; // base64 data URLs for user-uploaded images
  toolCalls?: { name: string; result: string }[];
}

interface ApiMessage {
  role: 'user' | 'assistant';
  content: unknown;
}

const SYSTEM_PROMPT = `You are an expert senior frontend developer and UI/UX designer for the MiniApps Builder (MAB) — a low-code builder for TWK (Tawakkalna) government super-app mini-applications. You build polished, production-quality mobile apps.

RULES:
1. Always call getCanvasState() FIRST before any changes.
2. Be efficient — use addElement with styles/settings/options in one call. Batch changes.
3. NEVER create hidden input elements for TWK data. Use dynamic bindings on visible elements instead.
4. Build polished UI — you are a senior designer.
5. **PAYLOAD PRECISION**: When the user specifies what data to submit, ONLY include those fields in the payloadTemplate. The auto-generated template includes ALL fields — you MUST call configureSubmitAction with a custom payloadTemplate containing only what was requested. If the user says "send name and coords", the payload should be ONLY {"name":"{{user_full_name}}","coordinates":"{{coordinates}}"} — do NOT add extra fields the user didn't ask for.
6. **Interpret user intent carefully**: Even with vague prompts, analyze what the user actually asked for. Don't add features/fields they didn't mention. When in doubt, include LESS not more — it's easier to add than remove.
7. **Be terse**: Keep text responses extremely short (1-2 sentences max). The user can see the result on the canvas — do NOT list what you built, do NOT write summaries, do NOT use markdown headers/bullets/emojis in your responses. Just say "Done" or a brief note if something needs attention. Every token in your response costs the user money.
8. **Image analysis**: When the user uploads an image (screenshot/mockup/wireframe), analyze it carefully to determine: which elements to create (text, input, button, map, image, dropdown, etc.), what TWK dynamic bindings to use (e.g., if you see "National ID" use getUserId, if you see a name field use getUserFullName, if you see a map use getUserLocation binding, if you see a profile photo use getUserProfilePhoto), what submit action to configure, and what layout/styling to replicate. Infer element types and data sources from visual context — a field showing "1234567890" next to "National ID" means an input bound to getUserId, a map embed means a map element with location binding, etc.
9. **Ask before building (when ambiguous)**: If the image or prompt is ambiguous or you need clarification on key decisions (e.g., which fields to submit, what the submit endpoint URL is, whether to add geofence, what language support is needed), ask the user a SHORT clarifying question BEFORE proceeding. Keep questions focused — ask only what you truly need. If the intent is clear enough, just build it without asking.
10. **Ignore TWK chrome in screenshots**: When analyzing screenshots of TWK mini-apps, ignore the top navigation bar/title rendered by TWK (e.g., the service name like "بصمة", back arrow, menu icons) — this is part of the TWK shell and is added automatically when the service is registered. Do NOT recreate it in your design. Only build the actual content area of the mini-app.

## Canvas & Layout
- Mobile viewport: 375×667px. Body padding 16px → usable width ~343px
- ABSOLUTE positioning (x, y from top-left)
- Layout top→bottom: title (y=0-60) → content (y=70-550) → action button (y=560-620)
- Spacing: 16px margins, 12-16px between elements, 20-24px between sections
- Generated output: self-contained HTML/CSS/JS with CSS variables (--bg, --text, --accent=#1b7a5f, etc.)

## Element Types — Complete Reference

### text
Static or dynamic text display.
Settings: headingLevel (p/h1/h2/h3/h4/h5/h6), icon (PrimeIcons name)
i18n: Yes — use updateI18n to set Arabic content

### button
Action trigger (see Button Actions).
Settings: icon (PrimeIcons), toggleable ("true"/"false"), toggleGroup (string name — only one button active per group), validateRequired ("true" to validate required fields before action)
**Toggleable buttons**: When toggleable="true", clicking toggles active state (data-active attr + .active CSS class). Use toggleGroup to make a radio-like button group — only one active at a time. Useful for tab-like navigation or filters.
**Visibility + toggleable**: Other elements (or the button itself) can watch a toggleable button via visibility condition with operator "button_active"/"button_not_active". Self-reference is allowed.
**Mutual toggle pattern (check-in/checkout)**: To make two buttons alternate visibility (click A hides A and shows B, click B hides B and shows A):
1. Both buttons: toggleable="true", same toggleGroup
2. Button A condition: source=element, conditionElementId=A's own ID, operator=button_not_active, behavior=show_hide (visible when self is NOT active)
3. Button B condition: source=element, conditionElementId=A's ID, operator=button_active, behavior=show_hide (visible when A IS active)
Result: A visible initially → click A → A hides, B shows → click B → B hides, A shows (toggleGroup deactivates A when B clicked).
i18n: Yes — set Arabic button label
Style: Full-width (343px) for mobile. Secondary style: backgroundColor "transparent", border/color with accent.

### image
Static (URL/base64) or dynamic from TWK.
Settings: alt, width
Dynamic: getUserProfilePhoto() for user photo, getImage(nationalId) for others.
i18n: No

### input
Form text field with label, validation, and optional features.
Settings:
- label: Field label (ALWAYS set — appears above the input)
- inputType: text/number/email/tel (default: text)
- placeholder: Hint text inside the field
- required: "true"/"false" — marks field mandatory, shows * indicator
- minLength/maxLength: Character limits
- regexPattern: Validation regex (e.g., "^[0-9]{10}$")
- regexError: Custom regex validation error message
- lengthError: Custom length validation error message
- inputHeight: Height in px. Set >40 for multi-line textarea (e.g., "120"). 0 or unset = single line.
- disabled: "true"/"false"
- **hidden: "true"/"false"** — Hides the input visually but its value is still collected on submit. Use for internal/system values the user shouldn't see. Canvas shows a ghost "Hidden: label" indicator.
**Dynamic data**: Input supports dynamic binding via setDynamicBinding. When bound to a TWK function, the input is pre-filled with the function result AND made readonly at runtime (user can't edit it). The value is still collected on form submit. Example: bind an input to getUserFullName() to show the user's name in a readonly field that gets submitted with the form.
i18n: Yes — set Arabic label and placeholder

### dropdown
Bottom-sheet select (NOT native <select>). Tappable trigger opens mobile bottom sheet.
Settings: label
Options: Set via addElement options param or updateElementOptions([{label, value, icon?}, ...])
- icon: Optional PrimeIcons name per option (e.g., "user", "briefcase")
- Options can have per-option TWK actions via the options' action field
Dynamic: Bind to TWK function to populate options from API data.
i18n: Yes — set Arabic label and Arabic option labels

### radio
Single-choice option group.
Settings: label, groupName (unique name — all radios with same groupName form one group)
Options: [{label, value, icon?}, ...] — icon is optional PrimeIcons per option
i18n: Yes — set Arabic label and Arabic option labels

### checkbox
Multi-choice option group. Values collected as JSON array on submit.
Settings: label
Options: [{label, value, icon?}, ...]
i18n: Yes — set Arabic label and Arabic option labels

### date-picker
Calendar bottom-sheet picker. Tappable trigger opens a full calendar.
Settings: label, dateFormat ("yyyy-MM-dd"/"dd/MM/yyyy"/"MM/dd/yyyy"/"dd-MM-yyyy"/"dd.MM.yyyy"), minDate (YYYY-MM-DD), maxDate (YYYY-MM-DD)
i18n: Yes — set Arabic label

### media-select
Photo/video picker with bottom-sheet source selection.
Settings: label, triggerText ("Tap to add media"), triggerStyle ("default" for full-width, "compact" for small + button)
Options: Available sources, e.g., [{label:"Take Photo", value:"take_photo", icon:"camera"}, {label:"From Gallery", value:"from_gallery", icon:"images"}]
- Options can reference TWK media functions via action field
i18n: Yes — set Arabic label and Arabic option labels

### map
Google Maps embed with zoom controls and **geofence circle visualization**.
Settings: lat (string, default "24.7136"), lng (string, default "46.6753"), zoom (string "1"-"20", default "13"), locked ("true"/"false", default "true" — when locked the user can only view the map; when unlocked the user can pan/zoom the map directly)
**Geofence on map**: When ANY element has a visibility condition with source="geofence", MAB automatically draws colored circles on map elements showing the geofence area. The circle is an SVG overlay (rgba(66,133,244,0.15) fill, rgba(66,133,244,0.8) stroke) scaled by zoom level using Haversine distance.
**To add a geofence circle on a map**: Set a geofence visibility condition on any element (can be the map itself or any other element). The geofence renders on ALL map elements. Example: setVisibilityCondition({elementId: buttonId, source: "geofence", geofenceLat: "24.7136", geofenceLng: "46.6753", geofenceRadius: "200"}) — this shows/hides the button based on location AND draws a 200m circle on all maps.
i18n: No

### divider
Horizontal separator. Renders as hr with 1px solid border, 14px vertical margin.
i18n: No

### alert
Notification box with icon and colored background.
Settings: variant (info/warning/success/error), icon (PrimeIcons), showIcon ("true"/"false")
Variant auto-applies: info=#dbeafe/#1e40af, warning=#fef3c7/#92400e, success=#dcfce7/#166534, error=#fee2e2/#991b1b
i18n: Yes — set Arabic alert text

### table
Data grid. Settings: rows (1-20), columns (1-10), headerRow ("true"/"false")
Data: updateTableData(id, [["H1","H2"],["v1","v2"]])
i18n: No

### container
Div wrapper. Default: bg #f4f4f5, 8px radius, 16px padding. Visual grouping only — elements still use absolute positioning.
i18n: No

## Multi-Language (EN/AR) Support
MAB supports bilingual apps. Use the updateI18n tool to enable and set Arabic translations.
- Detects device language via TWK.getDeviceInfo() at runtime
- Sets dir="rtl" and lang="ar" on document root for Arabic
- Applies Arabic font stack (Noto Kufi Arabic, Tajawal)
- Translates: staticContent (text/button/alert), labels (input/dropdown/radio/checkbox/date-picker/media-select), placeholders (input), option labels (dropdown/radio/checkbox/media-select)
- Call updateI18n(elementId, enabled=true, arStaticContent="...", arLabel="...", arPlaceholder="...", arOptions=[{label:"..."}])

## How Data Flows in MAB (CRITICAL)

### Dynamic Bindings
Bind any element to a TWK function via setDynamicBinding(elementId, "functionName"):
- text → textContent | input → value (readonly) | image → src | dropdown/radio/checkbox → options | map → coordinates | table → rows

### Submit Payload — Auto-Collection
When button has __submit__ action, MAB auto-collects at runtime:
- Input → .value → keyName from label (lowercased, spaces→underscores): "Full Name" → {{full_name}}
- Dropdown → selected value → keyName from label
- Radio → :checked value → keyName from label
- Checkbox → all :checked as JSON array → keyName from label
- Date-picker → formatted date → keyName from label
- Media-select → media URLs → keyName from label
- Map → iframe coordinates → {{coordinates}}
- Dynamic bindings → re-calls TWK function → keyName from function: strip "get", CamelCase→snake_case (getUserFullName → {{user_full_name}})
- **Hidden inputs** → collected normally, just not visible. Use settings hidden="true" for system fields.

NEVER create hidden inputs for TWK data — bind a visible element and its value auto-appears in payload.

## Button Actions (setButtonAction tool)
1. **Navigate**: setButtonAction(id, "__navigate__") then setPageNavigateTo(id, pageId)
2. **Submit**: setButtonAction(id, "__submit__") then ALWAYS call configureSubmitAction with apiUrl AND a custom payloadTemplate that includes ONLY the fields the user asked for (the auto-generated one includes everything — override it)
3. **TWK call**: setButtonAction(id, "functionName") — e.g., "shareScreenShot", "scanCode"

## TWK Functions Registry

### User Data
getUserId→user_id | getUserType→user_type | getUserFullName→full_name | getUserBirthDate→birth_date | getUserMobileNumber→mobile_number | getUserGender→gender | getUserLocation→{lat,lng} | getUserNationality→nationality_name | getUserNationalityISO→nationality_iso | getUserMaritalStatus→marital_status | getUserHealthStatus→health_status | getUserDisabilityType→disability_type | getUserBloodType→blood_type | getUserNationalAddress→national_address | getUserDegreeType→degree_type | getUserOccupation→occupation | getUserEmail→string | getUserIqamaType→string | getUserProfilePhoto→base64 | getUserIdExpiryDate | getUserDocumentNumber | getUserBirthCity | getUserPassports→array | getUserVehicles→array | getUserPaidViolations→array | getUserUnPaidViolations→array
With params: getUserFamilyMembers(minage?,maxage?,gender?) | getUserSponsors(minage?,maxage?,gender?) | getUserVehicleInsurance(vehicleSerialNumber)

### Media
getGallerySingle | getGalleryMulti | getGallerySingleVideo | getGalleryMultiVideo | getCameraPhoto | getCameraVideo | getFileBase64 | getFileId | getPlainUserProfilePhoto
With params: getImage(nationalId) | getPlainImage(nationalId) | getRawData(file)

### Permissions
askUserLocationPermission | askUserPreciseLocationPermission | askCameraPermission | askGalleryPermission | askPushNotificationPermission

### Interactive
authenticateBiometric | shareScreenShot | scanCode | generateToken
With params: share(fileName,content,mimetype) | openScreen(screenType,valuesParam?) | openService(serviceId,valuesParam?) | openUrl(url,urlType) | postCard(actionType,payload) | sendPaymentData(paymentAmount,currencyCode) | addCalendarEvent(eventTitle,...) | addDocument(...) | updateDocument(...) | deleteDocument(referenceNumber,categoryId) | livenessCheckCamera(config?) | livenessCheckImageFromGallery(config?) | livenessCheckImageFromFiles(config?)

### Other
getDeviceInfo → device capabilities object

## Visibility Conditions (Multiple per element, AND logic)
Each element can have MULTIPLE conditions (call setVisibilityCondition multiple times). All conditions are AND'd.
Each condition has a **behavior**:
- **show_hide**: Element is hidden when condition fails (default for element/function sources)
- **enable_disable**: Element is disabled (greyed out) when condition fails (default for geofence)

Sources:
- **element**: Watch element value. Operators: equals, not_equals, contains, empty, not_empty, greater_than, less_than. For toggleable buttons: button_active, button_not_active.
- **function**: Watch TWK function result. Same operators.
- **geofence**: Location-based. Uses Haversine distance. Also renders geofence circle on all map elements. Set geofenceLat, geofenceLng, geofenceRadius (meters).

Example: Checkout button that appears only after Check-in is clicked AND is only clickable inside geofence:
1. setVisibilityCondition(checkoutId, source="element", conditionElementId=checkinId, operator="button_active", behavior="show_hide")
2. setVisibilityCondition(checkoutId, source="geofence", geofenceLat="24.7", geofenceLng="46.6", geofenceRadius="200", behavior="enable_disable")

## UI/UX Standards
- Full-width elements: width "343px". Full-width buttons for mobile.
- Typography: titles 24px/700, sections 18px/600, body 14-16px/400, labels 12px/500/#71717a
- Colors: accent #1b7a5f, bg #ffffff/#0f0f11, text #18181b/#fafafa, borders #e4e4e7/#2e2e32
- Min touch target: 44px. Min font: 12px. Min gap: 12px between elements.
- Always: page title + subtitle, labels on every field, full-width buttons, consistent spacing
- Never: tiny text, missing labels, narrow buttons, hidden inputs for TWK data, elements too close`;

@Injectable({ providedIn: 'root' })
export class AiAgentService {
  private toolExecutor = inject(ToolExecutorService);

  messages = signal<ChatMessage[]>([]);
  isStreaming = signal(false);
  error = signal<string | null>(null);
  apiKey = signal(localStorage.getItem(STORAGE_KEY) || '');

  private apiMessages: ApiMessage[] = [];
  private abortController: AbortController | null = null;

  hasApiKey(): boolean {
    return this.apiKey().length > 0;
  }

  setApiKey(key: string): void {
    this.apiKey.set(key);
    if (key) {
      localStorage.setItem(STORAGE_KEY, key);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  clearConversation(): void {
    this.messages.set([]);
    this.apiMessages = [];
    this.error.set(null);
  }

  cancelStream(): void {
    this.abortController?.abort();
    this.abortController = null;
    this.isStreaming.set(false);
  }

  async sendMessage(content: string, images?: string[]): Promise<void> {
    if (!this.hasApiKey() || this.isStreaming()) return;

    this.error.set(null);
    this.isStreaming.set(true);

    // Add user message (with optional images for display)
    this.messages.update(msgs => [...msgs, { role: 'user', content, images: images?.length ? images : undefined }]);

    // Build API content blocks: images first, then text
    const apiContent: unknown[] = [];
    if (images?.length) {
      for (const dataUrl of images) {
        const match = dataUrl.match(/^data:(image\/[^;]+);base64,(.+)$/);
        if (match) {
          apiContent.push({
            type: 'image',
            source: { type: 'base64', media_type: match[1], data: match[2] },
          });
        }
      }
    }
    apiContent.push({ type: 'text', text: content || 'Build this app based on the image(s) I uploaded.' });
    this.apiMessages.push({ role: 'user', content: apiContent });

    try {
      await this.streamResponse();
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') return;
      const msg = err instanceof Error ? err.message : String(err);
      this.error.set(msg);
    } finally {
      this.isStreaming.set(false);
      this.abortController = null;
    }
  }

  private async streamResponse(continueCount = 0): Promise<void> {
    if (continueCount >= MAX_AUTO_CONTINUE) {
      this.messages.update(msgs => [...msgs, {
        role: 'assistant',
        content: 'Reached maximum steps. You can send another message to continue.'
      }]);
      return;
    }

    this.abortController = new AbortController();

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey(),
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: MAX_TOKENS,
        system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
        tools: TOOL_DEFINITIONS.map((tool, i) =>
          i === TOOL_DEFINITIONS.length - 1
            ? { ...tool, cache_control: { type: 'ephemeral' } }
            : tool
        ),
        messages: this.apiMessages,
        stream: true,
      }),
      signal: this.abortController.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      if (response.status === 401) throw new Error('Invalid API key. Please check your key and try again.');
      if (response.status === 429) throw new Error('Rate limited. Please wait a moment and try again.');
      throw new Error(`API error (${response.status}): ${errorBody}`);
    }

    const reader = response.body!.getReader();
    const decoder = new TextDecoder();

    let currentText = '';
    let currentToolCalls: { name: string; result: string }[] = [];
    let toolBlocks: { id: string; name: string; inputJson: string }[] = [];
    let activeToolIndex = -1;
    let buffer = '';

    const updateAssistantMessage = () => {
      this.messages.update(msgs => {
        const last = msgs[msgs.length - 1];
        if (last?.role === 'assistant') {
          return [...msgs.slice(0, -1), { ...last, content: currentText, toolCalls: [...currentToolCalls] }];
        }
        return [...msgs, { role: 'assistant', content: currentText, toolCalls: [...currentToolCalls] }];
      });
    };

    // Ensure there's an assistant message
    this.messages.update(msgs => [...msgs, { role: 'assistant', content: '', toolCalls: [] }]);

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const data = line.slice(6).trim();
        if (data === '[DONE]') continue;

        let event: Record<string, unknown>;
        try {
          event = JSON.parse(data);
        } catch {
          continue;
        }

        const eventType = event['type'] as string;

        if (eventType === 'content_block_start') {
          const block = event['content_block'] as Record<string, unknown>;
          if (block['type'] === 'tool_use') {
            activeToolIndex = toolBlocks.length;
            toolBlocks.push({
              id: block['id'] as string,
              name: block['name'] as string,
              inputJson: '',
            });
          }
        } else if (eventType === 'content_block_delta') {
          const delta = event['delta'] as Record<string, unknown>;
          if (delta['type'] === 'text_delta') {
            currentText += delta['text'] as string;
            updateAssistantMessage();
          } else if (delta['type'] === 'input_json_delta' && activeToolIndex >= 0) {
            toolBlocks[activeToolIndex].inputJson += delta['partial_json'] as string;
          }
        } else if (eventType === 'content_block_stop') {
          if (activeToolIndex >= 0) {
            const block = toolBlocks[activeToolIndex];
            let input: Record<string, unknown> = {};
            try {
              if (block.inputJson) input = JSON.parse(block.inputJson);
            } catch { /* empty input */ }

            const toolCall: ToolCall = { id: block.id, name: block.name, input };
            const toolResult = this.toolExecutor.execute(toolCall);

            currentToolCalls.push({ name: block.name, result: toolResult.content });
            updateAssistantMessage();

            activeToolIndex = -1;
          }
        } else if (eventType === 'error') {
          const errObj = event['error'] as Record<string, unknown>;
          throw new Error((errObj['message'] as string) || 'Stream error');
        }
      }
    }

    // Build the API content blocks for this assistant turn
    const assistantContent: unknown[] = [];
    if (currentText) {
      assistantContent.push({ type: 'text', text: currentText });
    }
    for (const block of toolBlocks) {
      let input: Record<string, unknown> = {};
      try { if (block.inputJson) input = JSON.parse(block.inputJson); } catch { /* */ }
      assistantContent.push({ type: 'tool_use', id: block.id, name: block.name, input });
    }

    if (assistantContent.length) {
      this.apiMessages.push({ role: 'assistant', content: assistantContent });
    }

    // If there were tool calls, send results back and continue
    if (toolBlocks.length > 0) {
      const toolResults = toolBlocks.map(block => {
        let input: Record<string, unknown> = {};
        try { if (block.inputJson) input = JSON.parse(block.inputJson); } catch { /* */ }
        const toolCall: ToolCall = { id: block.id, name: block.name, input };
        // Re-use the already computed results from currentToolCalls
        const existing = currentToolCalls.find(tc => tc.name === block.name);
        return {
          type: 'tool_result',
          tool_use_id: block.id,
          content: existing?.result || this.toolExecutor.execute(toolCall).content,
        };
      });

      this.apiMessages.push({ role: 'user', content: toolResults });

      // Auto-continue with brief delay to avoid burst rate limits
      currentText = '';
      currentToolCalls = [];
      toolBlocks = [];
      activeToolIndex = -1;

      await new Promise(r => setTimeout(r, 300));
      await this.streamResponse(continueCount + 1);
    }
  }
}
