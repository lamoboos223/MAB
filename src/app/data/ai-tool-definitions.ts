export const TOOL_DEFINITIONS = [
  {
    name: 'getCanvasState',
    description: 'Get the current state of all pages and elements on the canvas. Returns IDs, types, positions, labels, and key settings. Call this FIRST before modifying existing elements to learn their IDs.',
    input_schema: {
      type: 'object' as const,
      properties: {},
      required: [],
    },
  },
  {
    name: 'addPage',
    description: 'Add a new page to the app. Optionally provide a name.',
    input_schema: {
      type: 'object' as const,
      properties: {
        name: { type: 'string', description: 'Optional page name (e.g., "Login", "Dashboard")' },
      },
      required: [],
    },
  },
  {
    name: 'renamePage',
    description: 'Rename an existing page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pageId: { type: 'string', description: 'ID of the page to rename' },
        name: { type: 'string', description: 'New name for the page' },
      },
      required: ['pageId', 'name'],
    },
  },
  {
    name: 'switchPage',
    description: 'Switch the active page being edited.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pageId: { type: 'string', description: 'ID of the page to switch to' },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'deletePage',
    description: 'Delete a page. Cannot delete the last remaining page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        pageId: { type: 'string', description: 'ID of the page to delete' },
      },
      required: ['pageId'],
    },
  },
  {
    name: 'addElement',
    description: 'Add a UI element to the active page. Returns the new element ID. You can set position, size, styles, settings, content, and options all in one call to reduce round-trips.',
    input_schema: {
      type: 'object' as const,
      properties: {
        type: {
          type: 'string',
          enum: ['text', 'button', 'image', 'input', 'dropdown', 'radio', 'checkbox', 'map', 'date-picker', 'media-select', 'divider', 'alert', 'table', 'container'],
          description: 'Element type to add',
        },
        label: { type: 'string', description: 'Display label for the element' },
        x: { type: 'number', description: 'X position on canvas (px)' },
        y: { type: 'number', description: 'Y position on canvas (px)' },
        width: { type: 'number', description: 'Width in px or as string like "100%"' },
        height: { type: 'number', description: 'Height in px' },
        styles: {
          type: 'object',
          description: 'CSS styles to apply immediately (fontSize, fontWeight, color, backgroundColor, textAlign, padding, margin, borderRadius, border, etc.)',
        },
        settings: {
          type: 'object',
          description: 'Component-specific settings (placeholder, inputType, required, icon, variant, groupName, etc.)',
        },
        staticContent: { type: 'string', description: 'Static text content for the element' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['label', 'value'],
          },
          description: 'Options for dropdown, radio, checkbox, or media-select elements',
        },
      },
      required: ['type'],
    },
  },
  {
    name: 'deleteElement',
    description: 'Remove an element from the active page.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element to delete' },
      },
      required: ['elementId'],
    },
  },
  {
    name: 'selectElement',
    description: 'Select/highlight an element on the canvas.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element to select' },
      },
      required: ['elementId'],
    },
  },
  {
    name: 'updateElementStyles',
    description: 'Update CSS styles on an element. Merges with existing styles.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element' },
        styles: {
          type: 'object',
          description: 'CSS styles to apply. Keys: fontSize, fontWeight, color, backgroundColor, textAlign, padding, margin, borderRadius, border, width, height',
        },
      },
      required: ['elementId', 'styles'],
    },
  },
  {
    name: 'updateDarkStyles',
    description: 'Update dark-mode style overrides for an element.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element' },
        styles: {
          type: 'object',
          description: 'Dark mode CSS styles to apply.',
        },
      },
      required: ['elementId', 'styles'],
    },
  },
  {
    name: 'updateElementSettings',
    description: 'Update component-specific settings. Keys vary by element type: label, placeholder, inputType (for input), variant/icon/showIcon (for alert), alt/width (for image), headingLevel (for text), rows/columns/headerRow (for table), etc.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element' },
        settings: {
          type: 'object',
          description: 'Settings key-value pairs to merge.',
        },
      },
      required: ['elementId', 'settings'],
    },
  },
  {
    name: 'updateElementOptions',
    description: 'Set options for dropdown, radio, checkbox, or media-select elements. Replaces existing options.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element' },
        options: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              label: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['label', 'value'],
          },
          description: 'Array of {label, value} option objects.',
        },
      },
      required: ['elementId', 'options'],
    },
  },
  {
    name: 'updateTableData',
    description: 'Set cell data for a table element. Provide a 2D array of strings.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the table element' },
        data: {
          type: 'array',
          items: { type: 'array', items: { type: 'string' } },
          description: '2D array of cell values. First row is header if headerRow setting is enabled.',
        },
      },
      required: ['elementId', 'data'],
    },
  },
  {
    name: 'setStaticContent',
    description: 'Set static text content for an element (text, button, alert, etc.).',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element' },
        content: { type: 'string', description: 'The static text content' },
      },
      required: ['elementId', 'content'],
    },
  },
  {
    name: 'setDynamicBinding',
    description: 'Bind an element to a TWK government API function for dynamic data.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element' },
        functionName: { type: 'string', description: 'TWK function name (e.g., "getUserFullName")' },
        params: {
          type: 'object',
          description: 'Optional parameters for the function call.',
        },
      },
      required: ['elementId', 'functionName'],
    },
  },
  {
    name: 'moveElement',
    description: 'Move an element to an absolute position on the canvas.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element' },
        x: { type: 'number', description: 'X position in pixels' },
        y: { type: 'number', description: 'Y position in pixels' },
      },
      required: ['elementId', 'x', 'y'],
    },
  },
  {
    name: 'resizeElement',
    description: 'Resize an element by setting width and height.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element' },
        width: { type: 'number', description: 'Width in pixels' },
        height: { type: 'number', description: 'Height in pixels' },
      },
      required: ['elementId', 'width', 'height'],
    },
  },
  {
    name: 'setButtonAction',
    description: 'Set the action for a button element. Use "__navigate__" to navigate to a page, "__submit__" to submit form data to an API endpoint, or a TWK function name to call that function on click.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the button element' },
        action: { type: 'string', description: 'Action type: "__navigate__" for page navigation, "__submit__" for API form submission, or a TWK function name (e.g., "shareScreenShot")' },
      },
      required: ['elementId', 'action'],
    },
  },
  {
    name: 'setPageNavigateTo',
    description: 'Set which page a button navigates to. Must call setButtonAction with "__navigate__" first.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the button element' },
        pageId: { type: 'string', description: 'ID of the target page to navigate to' },
      },
      required: ['elementId', 'pageId'],
    },
  },
  {
    name: 'configureSubmitAction',
    description: 'Configure the submit-to-API action on a button. Must call setButtonAction with "__submit__" first. Sets API URL, HTTP method, headers, success page, error message, and payload template.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the button element' },
        apiUrl: { type: 'string', description: 'API endpoint URL (e.g., "https://api.example.com/submit")' },
        method: { type: 'string', enum: ['GET', 'POST', 'PUT', 'PATCH'], description: 'HTTP method. Default: POST' },
        headers: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              key: { type: 'string' },
              value: { type: 'string' },
            },
            required: ['key', 'value'],
          },
          description: 'Custom request headers. Content-Type: application/json is always included.',
        },
        successPage: { type: 'string', description: 'Page ID to navigate to on success' },
        errorMessage: { type: 'string', description: 'Error message to show on failure' },
        payloadTemplate: { type: 'string', description: 'JSON template with {{field_name}} placeholders for form field values' },
      },
      required: ['elementId'],
    },
  },
  {
    name: 'setVisibilityCondition',
    description: 'Add a visibility condition on an element. Multiple conditions can be added (AND logic). Each condition has a behavior: "show_hide" (element hidden when condition fails) or "enable_disable" (element disabled when condition fails). Call multiple times to add multiple conditions. Set replace=true to replace all existing conditions.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element to add the condition to' },
        source: { type: 'string', enum: ['element', 'function', 'geofence'], description: 'Condition source type' },
        behavior: { type: 'string', enum: ['show_hide', 'enable_disable'], description: 'What happens when condition fails. Default: enable_disable for geofence, show_hide for others.' },
        replace: { type: 'boolean', description: 'If true, replace all existing conditions with this one. Default false (append).' },
        // Element-based
        conditionElementId: { type: 'string', description: 'For source="element": ID of the element to watch' },
        operator: {
          type: 'string',
          enum: ['equals', 'not_equals', 'contains', 'empty', 'not_empty', 'greater_than', 'less_than', 'button_active', 'button_not_active'],
          description: 'Comparison operator. Use button_active/button_not_active when watching a button element.',
        },
        value: { type: 'string', description: 'Value to compare against (not needed for empty/not_empty/button_active/button_not_active)' },
        // Function-based
        functionName: { type: 'string', description: 'For source="function": TWK function name' },
        functionParams: { type: 'object', description: 'For source="function": optional function parameters' },
        // Geofence-based
        geofenceLat: { type: 'string', description: 'For source="geofence": latitude' },
        geofenceLng: { type: 'string', description: 'For source="geofence": longitude' },
        geofenceRadius: { type: 'string', description: 'For source="geofence": radius in meters' },
      },
      required: ['elementId', 'source'],
    },
  },
  {
    name: 'removeVisibilityCondition',
    description: 'Remove all visibility conditions from an element so it is always visible and enabled.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element' },
      },
      required: ['elementId'],
    },
  },
  {
    name: 'updateI18n',
    description: 'Enable multi-language (EN/AR) on an element and set Arabic translations. Supports Arabic content, label, placeholder, and option labels.',
    input_schema: {
      type: 'object' as const,
      properties: {
        elementId: { type: 'string', description: 'ID of the element' },
        enabled: { type: 'boolean', description: 'Enable or disable multi-language' },
        arStaticContent: { type: 'string', description: 'Arabic text for static content (text, button, alert)' },
        arLabel: { type: 'string', description: 'Arabic label (input, dropdown, radio, checkbox, date-picker, media-select)' },
        arPlaceholder: { type: 'string', description: 'Arabic placeholder (input)' },
        arOptions: {
          type: 'array',
          items: { type: 'object', properties: { label: { type: 'string' } }, required: ['label'] },
          description: 'Arabic option labels for dropdown/radio/checkbox/media-select (same order as English options)',
        },
      },
      required: ['elementId', 'enabled'],
    },
  },
];
