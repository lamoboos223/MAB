# Mini Apps Builder Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build an Angular drag-and-drop website builder that produces Tawakkalna mini apps (HTML/CSS/JS).

**Architecture:** 3-panel layout (element palette, canvas, properties panel) using Angular CDK drag-drop. Single BuilderService manages state. Code generator service produces clean HTML/CSS/JS. JSZip for export.

**Tech Stack:** Angular 19+, @angular/cdk, jszip, file-saver

---

### Task 1: Scaffold Angular Project

**Files:**
- Create: Angular project via CLI at `/Users/dorah/Desktop/miniapps_builder`

**Step 1: Generate Angular project**

Run: `ng new miniapps-builder --directory . --skip-git --style=scss --routing=false --ssr=false`

If Angular CLI is not installed:
Run: `npm install -g @angular/cli`

**Step 2: Install dependencies**

Run: `npm install @angular/cdk jszip file-saver`
Run: `npm install -D @types/file-saver`

**Step 3: Verify the project builds**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: scaffold Angular project with CDK, jszip, file-saver"
```

---

### Task 2: Create Data Models

**Files:**
- Create: `src/app/models/element.model.ts`
- Create: `src/app/models/page.model.ts`

**Step 1: Create element model**

```typescript
// src/app/models/element.model.ts

export type ElementType =
  | 'text'
  | 'button'
  | 'image'
  | 'input'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'map'
  | 'divider';

export interface ElementStyle {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  width?: string;
  height?: string;
}

export interface TwkBinding {
  functionName: string;
  params: Record<string, string>;
  resultPath: string;
}

export interface ElementOption {
  label: string;
  value: string;
  action?: TwkBinding;
}

export interface BuilderElement {
  id: string;
  type: ElementType;
  label: string;
  styles: ElementStyle;
  dataSource: 'static' | 'dynamic';
  staticContent: string;
  dynamicBinding?: TwkBinding;
  options: ElementOption[];
  settings: Record<string, string>;
  pageNavigateTo?: string;
}
```

**Step 2: Create page model**

```typescript
// src/app/models/page.model.ts

import { BuilderElement } from './element.model';

export interface Page {
  id: string;
  name: string;
  elements: BuilderElement[];
}
```

**Step 3: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 4: Commit**

```bash
git add src/app/models/
git commit -m "feat: add element and page data models"
```

---

### Task 3: Create TWK Function Registry

**Files:**
- Create: `src/app/data/twk-registry.ts`

**Step 1: Create the registry**

```typescript
// src/app/data/twk-registry.ts

export interface TwkFunctionDef {
  name: string;
  category: 'User Data' | 'Permissions' | 'Media' | 'Interactive' | 'Other';
  params: { name: string; type: string; required: boolean }[];
  returns: { path: string; type: string };
  description: string;
}

export const TWK_FUNCTIONS: TwkFunctionDef[] = [
  // User Data
  {
    name: 'getUserId',
    category: 'User Data',
    params: [],
    returns: { path: 'result.user_id', type: 'string' },
    description: 'Returns the user national/iqama ID'
  },
  {
    name: 'getUserType',
    category: 'User Data',
    params: [],
    returns: { path: 'result.user_type', type: 'string' },
    description: 'Returns the user type (citizen, resident, etc.)'
  },
  {
    name: 'getUserFullName',
    category: 'User Data',
    params: [],
    returns: { path: 'result.full_name', type: 'string' },
    description: 'Returns the user full name'
  },
  {
    name: 'getUserBirthDate',
    category: 'User Data',
    params: [],
    returns: { path: 'result.birth_date', type: 'string' },
    description: 'Returns the user birth date'
  },
  {
    name: 'getUserMobileNumber',
    category: 'User Data',
    params: [],
    returns: { path: 'result.mobile_number', type: 'string' },
    description: 'Returns the user mobile number'
  },
  {
    name: 'getUserGender',
    category: 'User Data',
    params: [],
    returns: { path: 'result.gender', type: 'string' },
    description: 'Returns the user gender'
  },
  {
    name: 'getUserLocation',
    category: 'User Data',
    params: [],
    returns: { path: 'result', type: 'object' },
    description: 'Returns user location (lat, lng)'
  },
  {
    name: 'getUserNationality',
    category: 'User Data',
    params: [],
    returns: { path: 'result.nationality_name', type: 'string' },
    description: 'Returns the user nationality name'
  },
  {
    name: 'getUserNationalityISO',
    category: 'User Data',
    params: [],
    returns: { path: 'result.nationality_iso', type: 'string' },
    description: 'Returns the user nationality ISO code'
  },
  {
    name: 'getUserMaritalStatus',
    category: 'User Data',
    params: [],
    returns: { path: 'result.marital_status', type: 'string' },
    description: 'Returns the user marital status'
  },
  {
    name: 'getUserHealthStatus',
    category: 'User Data',
    params: [],
    returns: { path: 'result.health_status', type: 'string' },
    description: 'Returns the user health status'
  },
  {
    name: 'getUserDisabilityType',
    category: 'User Data',
    params: [],
    returns: { path: 'result.disability_type', type: 'string' },
    description: 'Returns the user disability type'
  },
  {
    name: 'getUserBloodType',
    category: 'User Data',
    params: [],
    returns: { path: 'result.blood_type', type: 'string' },
    description: 'Returns the user blood type'
  },
  {
    name: 'getUserNationalAddress',
    category: 'User Data',
    params: [],
    returns: { path: 'result.national_address', type: 'object' },
    description: 'Returns the user national address'
  },
  {
    name: 'getUserDegreeType',
    category: 'User Data',
    params: [],
    returns: { path: 'result.degree_type', type: 'string' },
    description: 'Returns the user degree type'
  },
  {
    name: 'getUserOccupation',
    category: 'User Data',
    params: [],
    returns: { path: 'result.occupation', type: 'string' },
    description: 'Returns the user occupation'
  },
  {
    name: 'getUserFamilyMembers',
    category: 'User Data',
    params: [
      { name: 'minage', type: 'number', required: false },
      { name: 'maxage', type: 'number', required: false },
      { name: 'gender', type: 'string', required: false }
    ],
    returns: { path: 'result', type: 'array' },
    description: 'Returns list of family members, optionally filtered by age and gender'
  },
  {
    name: 'getUserSponsors',
    category: 'User Data',
    params: [
      { name: 'minage', type: 'number', required: false },
      { name: 'maxage', type: 'number', required: false },
      { name: 'gender', type: 'string', required: false }
    ],
    returns: { path: 'result', type: 'array' },
    description: 'Returns list of sponsors'
  },
  {
    name: 'getUserUnPaidViolations',
    category: 'User Data',
    params: [],
    returns: { path: 'result', type: 'array' },
    description: 'Returns unpaid violations'
  },
  {
    name: 'getUserPaidViolations',
    category: 'User Data',
    params: [],
    returns: { path: 'result', type: 'array' },
    description: 'Returns paid violations'
  },
  {
    name: 'getUserVehicles',
    category: 'User Data',
    params: [],
    returns: { path: 'result', type: 'array' },
    description: 'Returns user vehicles'
  },
  {
    name: 'getUserProfilePhoto',
    category: 'User Data',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Returns user profile photo as base64'
  },
  {
    name: 'getUserPassports',
    category: 'User Data',
    params: [],
    returns: { path: 'result', type: 'array' },
    description: 'Returns user passports'
  },
  {
    name: 'getUserIdExpiryDate',
    category: 'User Data',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Returns user ID expiry date'
  },
  {
    name: 'getUserDocumentNumber',
    category: 'User Data',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Returns user document number'
  },
  {
    name: 'getUserBirthCity',
    category: 'User Data',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Returns user birth city'
  },
  {
    name: 'getUserEmail',
    category: 'User Data',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Returns user email'
  },
  {
    name: 'getUserIqamaType',
    category: 'User Data',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Returns user iqama type'
  },
  {
    name: 'getUserVehicleInsurance',
    category: 'User Data',
    params: [
      { name: 'vehicleSerialNumber', type: 'string', required: true }
    ],
    returns: { path: 'result', type: 'object' },
    description: 'Returns vehicle insurance info'
  },
  {
    name: 'getDeviceInfo',
    category: 'Other',
    params: [],
    returns: { path: 'result', type: 'object' },
    description: 'Returns device capabilities info'
  },
  {
    name: 'getRawData',
    category: 'Other',
    params: [
      { name: 'file', type: 'string', required: true }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Returns raw data from a gallery file'
  },

  // Media
  {
    name: 'getGallerySingle',
    category: 'Media',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Pick a single image from gallery'
  },
  {
    name: 'getGalleryMulti',
    category: 'Media',
    params: [],
    returns: { path: 'result', type: 'array' },
    description: 'Pick multiple images from gallery'
  },
  {
    name: 'getGallerySingleVideo',
    category: 'Media',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Pick a single video from gallery'
  },
  {
    name: 'getGalleryMultiVideo',
    category: 'Media',
    params: [],
    returns: { path: 'result', type: 'array' },
    description: 'Pick multiple videos from gallery'
  },
  {
    name: 'getCameraPhoto',
    category: 'Media',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Take a photo with camera'
  },
  {
    name: 'getCameraVideo',
    category: 'Media',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Record a video with camera'
  },
  {
    name: 'getFileBase64',
    category: 'Media',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Pick a file and return as base64'
  },
  {
    name: 'getFileId',
    category: 'Media',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Pick a file and return its ID'
  },
  {
    name: 'getImage',
    category: 'Media',
    params: [
      { name: 'nationalId', type: 'string', required: true }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Get image for a given national ID'
  },
  {
    name: 'getPlainUserProfilePhoto',
    category: 'Media',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Returns plain user profile photo'
  },
  {
    name: 'getPlainImage',
    category: 'Media',
    params: [
      { name: 'nationalId', type: 'string', required: true }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Get plain image for a given national ID'
  },

  // Permissions
  {
    name: 'askUserLocationPermission',
    category: 'Permissions',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Request location permission from user'
  },
  {
    name: 'askUserPreciseLocationPermission',
    category: 'Permissions',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Request precise location permission'
  },
  {
    name: 'askCameraPermission',
    category: 'Permissions',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Request camera permission'
  },
  {
    name: 'askGalleryPermission',
    category: 'Permissions',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Request gallery permission'
  },
  {
    name: 'askPushNotificationPermission',
    category: 'Permissions',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Request push notification permission'
  },

  // Interactive
  {
    name: 'authenticateBiometric',
    category: 'Interactive',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Trigger biometric authentication'
  },
  {
    name: 'shareScreenShot',
    category: 'Interactive',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Share a screenshot of the current screen'
  },
  {
    name: 'share',
    category: 'Interactive',
    params: [
      { name: 'fileName', type: 'string', required: true },
      { name: 'content', type: 'string', required: true },
      { name: 'mimetype', type: 'string', required: true }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Share a file with given content and mime type'
  },
  {
    name: 'scanCode',
    category: 'Interactive',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Open QR/barcode scanner'
  },
  {
    name: 'openScreen',
    category: 'Interactive',
    params: [
      { name: 'screenType', type: 'string', required: true },
      { name: 'valuesParam', type: 'object', required: false }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Open a native screen by type'
  },
  {
    name: 'openService',
    category: 'Interactive',
    params: [
      { name: 'serviceId', type: 'string', required: true },
      { name: 'valuesParam', type: 'object', required: false }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Open another Tawakkalna service by ID'
  },
  {
    name: 'openUrl',
    category: 'Interactive',
    params: [
      { name: 'url', type: 'string', required: true },
      { name: 'urlType', type: 'string', required: true }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Open a URL (in-app or external browser)'
  },
  {
    name: 'postCard',
    category: 'Interactive',
    params: [
      { name: 'actionType', type: 'string', required: true },
      { name: 'payload', type: 'object', required: true }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Post a card action'
  },
  {
    name: 'generateToken',
    category: 'Interactive',
    params: [],
    returns: { path: 'result', type: 'string' },
    description: 'Generate an authentication token'
  },
  {
    name: 'sendPaymentData',
    category: 'Interactive',
    params: [
      { name: 'paymentAmount', type: 'number', required: true },
      { name: 'currencyCode', type: 'string', required: true }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Send payment data for in-app payment'
  },
  {
    name: 'addCalendarEvent',
    category: 'Interactive',
    params: [
      { name: 'eventTitle', type: 'string', required: true },
      { name: 'eventStartDateTime', type: 'string', required: false },
      { name: 'eventEndDateTime', type: 'string', required: false },
      { name: 'eventRecurringType', type: 'string', required: false },
      { name: 'eventReminderType', type: 'string', required: false },
      { name: 'eventReminderBeforeType', type: 'string', required: false },
      { name: 'eventLocationLatitude', type: 'number', required: false },
      { name: 'eventLocationLongitude', type: 'number', required: false },
      { name: 'eventQr', type: 'string', required: false },
      { name: 'eventDescription', type: 'string', required: false }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Add an event to the device calendar'
  },
  {
    name: 'addDocument',
    category: 'Interactive',
    params: [
      { name: 'various', type: 'object', required: true }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Add a document to Tawakkalna'
  },
  {
    name: 'updateDocument',
    category: 'Interactive',
    params: [
      { name: 'various', type: 'object', required: true }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Update an existing document'
  },
  {
    name: 'deleteDocument',
    category: 'Interactive',
    params: [
      { name: 'referenceNumber', type: 'string', required: true },
      { name: 'categoryId', type: 'string', required: true }
    ],
    returns: { path: 'result', type: 'string' },
    description: 'Delete a document by reference number'
  },
  {
    name: 'livenessCheckCamera',
    category: 'Interactive',
    params: [
      { name: 'configurations', type: 'array', required: false }
    ],
    returns: { path: 'result', type: 'object' },
    description: 'Perform liveness check using camera'
  },
  {
    name: 'livenessCheckImageFromGallery',
    category: 'Interactive',
    params: [
      { name: 'configurations', type: 'array', required: false }
    ],
    returns: { path: 'result', type: 'object' },
    description: 'Perform liveness check using gallery image'
  },
  {
    name: 'livenessCheckImageFromFiles',
    category: 'Interactive',
    params: [
      { name: 'configurations', type: 'array', required: false }
    ],
    returns: { path: 'result', type: 'object' },
    description: 'Perform liveness check using file image'
  }
];
```

**Step 2: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add src/app/data/
git commit -m "feat: add TWK function registry with all data and interactive functions"
```

---

### Task 4: Create BuilderService (Central State)

**Files:**
- Create: `src/app/services/builder.service.ts`

**Step 1: Create the service**

```typescript
// src/app/services/builder.service.ts

import { Injectable, signal, computed } from '@angular/core';
import { BuilderElement, ElementType, ElementStyle } from '../models/element.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class BuilderService {
  pages = signal<Page[]>([
    { id: this.generateId(), name: 'Page 1', elements: [] }
  ]);

  activePageId = signal<string>('');
  selectedElementId = signal<string | null>(null);

  activePage = computed(() => {
    const pages = this.pages();
    const id = this.activePageId();
    return pages.find(p => p.id === id) ?? pages[0];
  });

  selectedElement = computed(() => {
    const page = this.activePage();
    const id = this.selectedElementId();
    if (!page || !id) return null;
    return page.elements.find(e => e.id === id) ?? null;
  });

  constructor() {
    const firstPage = this.pages()[0];
    if (firstPage) {
      this.activePageId.set(firstPage.id);
    }
  }

  addPage(): void {
    const pages = this.pages();
    const newPage: Page = {
      id: this.generateId(),
      name: `Page ${pages.length + 1}`,
      elements: []
    };
    this.pages.set([...pages, newPage]);
    this.activePageId.set(newPage.id);
  }

  removePage(pageId: string): void {
    const pages = this.pages().filter(p => p.id !== pageId);
    if (pages.length === 0) return;
    this.pages.set(pages);
    if (this.activePageId() === pageId) {
      this.activePageId.set(pages[0].id);
    }
  }

  setActivePage(pageId: string): void {
    this.activePageId.set(pageId);
    this.selectedElementId.set(null);
  }

  addElement(type: ElementType): void {
    const element = this.createDefaultElement(type);
    const pages = this.pages().map(p => {
      if (p.id === this.activePageId()) {
        return { ...p, elements: [...p.elements, element] };
      }
      return p;
    });
    this.pages.set(pages);
    this.selectedElementId.set(element.id);
  }

  removeElement(elementId: string): void {
    const pages = this.pages().map(p => {
      if (p.id === this.activePageId()) {
        return { ...p, elements: p.elements.filter(e => e.id !== elementId) };
      }
      return p;
    });
    this.pages.set(pages);
    if (this.selectedElementId() === elementId) {
      this.selectedElementId.set(null);
    }
  }

  selectElement(elementId: string | null): void {
    this.selectedElementId.set(elementId);
  }

  updateElement(elementId: string, updates: Partial<BuilderElement>): void {
    const pages = this.pages().map(p => {
      if (p.id === this.activePageId()) {
        return {
          ...p,
          elements: p.elements.map(e =>
            e.id === elementId ? { ...e, ...updates } : e
          )
        };
      }
      return p;
    });
    this.pages.set(pages);
  }

  reorderElements(previousIndex: number, currentIndex: number): void {
    const page = this.activePage();
    if (!page) return;
    const elements = [...page.elements];
    const [moved] = elements.splice(previousIndex, 1);
    elements.splice(currentIndex, 0, moved);
    const pages = this.pages().map(p =>
      p.id === page.id ? { ...p, elements } : p
    );
    this.pages.set(pages);
  }

  private createDefaultElement(type: ElementType): BuilderElement {
    const base: BuilderElement = {
      id: this.generateId(),
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      styles: {},
      dataSource: 'static',
      staticContent: '',
      options: [],
      settings: {}
    };

    switch (type) {
      case 'text':
        base.staticContent = 'Text content';
        base.settings = { headingLevel: 'p' };
        break;
      case 'button':
        base.staticContent = 'Button';
        break;
      case 'image':
        base.settings = { alt: 'Image', width: '100%' };
        break;
      case 'input':
        base.settings = { inputType: 'text', placeholder: 'Enter value...', label: 'Label' };
        break;
      case 'dropdown':
        base.settings = { label: 'Select an option' };
        base.options = [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' }
        ];
        break;
      case 'radio':
        base.settings = { label: 'Choose one', groupName: `radio_${base.id}` };
        base.options = [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' }
        ];
        break;
      case 'checkbox':
        base.settings = { label: 'Select options' };
        base.options = [
          { label: 'Option 1', value: 'option1' },
          { label: 'Option 2', value: 'option2' }
        ];
        break;
      case 'map':
        base.settings = { lat: '24.7136', lng: '46.6753', zoom: '13' };
        break;
      case 'divider':
        base.styles = { border: '1px solid #333' };
        break;
    }

    return base;
  }

  private generateId(): string {
    return 'el-' + Math.random().toString(36).substring(2, 9);
  }
}
```

**Step 2: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add src/app/services/builder.service.ts
git commit -m "feat: add BuilderService with page and element state management"
```

---

### Task 5: Create TWK Functions Service

**Files:**
- Create: `src/app/services/twk-functions.service.ts`

**Step 1: Create the service**

```typescript
// src/app/services/twk-functions.service.ts

import { Injectable } from '@angular/core';
import { TWK_FUNCTIONS, TwkFunctionDef } from '../data/twk-registry';

@Injectable({ providedIn: 'root' })
export class TwkFunctionsService {
  private functions = TWK_FUNCTIONS;

  getAll(): TwkFunctionDef[] {
    return this.functions;
  }

  getByCategory(category: string): TwkFunctionDef[] {
    return this.functions.filter(f => f.category === category);
  }

  getCategories(): string[] {
    return [...new Set(this.functions.map(f => f.category))];
  }

  getByName(name: string): TwkFunctionDef | undefined {
    return this.functions.find(f => f.name === name);
  }

  search(query: string): TwkFunctionDef[] {
    const lower = query.toLowerCase();
    return this.functions.filter(
      f => f.name.toLowerCase().includes(lower) ||
           f.description.toLowerCase().includes(lower)
    );
  }
}
```

**Step 2: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add src/app/services/twk-functions.service.ts
git commit -m "feat: add TwkFunctionsService for querying function registry"
```

---

### Task 6: Build the App Shell (3-Panel Layout)

**Files:**
- Modify: `src/app/app.component.ts`
- Modify: `src/app/app.component.html`
- Modify: `src/app/app.component.scss`
- Modify: `src/styles.scss`

**Step 1: Set up global styles**

```scss
// src/styles.scss

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  height: 100%;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  background-color: #1a1a2e;
  color: #eee;
}

::-webkit-scrollbar {
  width: 6px;
}

::-webkit-scrollbar-track {
  background: #16213e;
}

::-webkit-scrollbar-thumb {
  background: #0f3460;
  border-radius: 3px;
}
```

**Step 2: Create the shell layout**

```typescript
// src/app/app.component.ts

import { Component } from '@angular/core';
import { ElementPaletteComponent } from './components/element-palette/element-palette.component';
import { CanvasComponent } from './components/canvas/canvas.component';
import { PropertiesPanelComponent } from './components/properties-panel/properties-panel.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { PageTabsComponent } from './components/page-tabs/page-tabs.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    ElementPaletteComponent,
    CanvasComponent,
    PropertiesPanelComponent,
    ToolbarComponent,
    PageTabsComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {}
```

```html
<!-- src/app/app.component.html -->

<div class="builder-layout">
  <app-toolbar class="toolbar"></app-toolbar>
  <div class="main-content">
    <app-element-palette class="palette"></app-element-palette>
    <app-canvas class="canvas"></app-canvas>
    <app-properties-panel class="properties"></app-properties-panel>
  </div>
  <app-page-tabs class="page-tabs"></app-page-tabs>
</div>
```

```scss
// src/app/app.component.scss

.builder-layout {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

.toolbar {
  height: 50px;
  border-bottom: 1px solid #0f3460;
}

.main-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.palette {
  width: 220px;
  border-right: 1px solid #0f3460;
  overflow-y: auto;
}

.canvas {
  flex: 1;
  overflow: auto;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 20px;
  background-color: #16213e;
}

.properties {
  width: 300px;
  border-left: 1px solid #0f3460;
  overflow-y: auto;
}

.page-tabs {
  height: 40px;
  border-top: 1px solid #0f3460;
}
```

**Step 3: Create placeholder components**

Generate the 5 child components as empty placeholders so the build passes:

Run:
```bash
ng generate component components/element-palette --standalone --skip-tests
ng generate component components/canvas --standalone --skip-tests
ng generate component components/properties-panel --standalone --skip-tests
ng generate component components/toolbar --standalone --skip-tests
ng generate component components/page-tabs --standalone --skip-tests
```

**Step 4: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: create 3-panel builder layout with placeholder components"
```

---

### Task 7: Build Element Palette (Left Panel)

**Files:**
- Modify: `src/app/components/element-palette/element-palette.component.ts`
- Modify: `src/app/components/element-palette/element-palette.component.html`
- Modify: `src/app/components/element-palette/element-palette.component.scss`

**Step 1: Implement the palette**

```typescript
// src/app/components/element-palette/element-palette.component.ts

import { Component, inject } from '@angular/core';
import { CdkDrag } from '@angular/cdk/drag-drop';
import { BuilderService } from '../../services/builder.service';
import { ElementType } from '../../models/element.model';

interface PaletteItem {
  type: ElementType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-element-palette',
  standalone: true,
  imports: [CdkDrag],
  templateUrl: './element-palette.component.html',
  styleUrl: './element-palette.component.scss'
})
export class ElementPaletteComponent {
  private builder = inject(BuilderService);

  elements: PaletteItem[] = [
    { type: 'text', label: 'Text', icon: 'T' },
    { type: 'button', label: 'Button', icon: 'B' },
    { type: 'image', label: 'Image', icon: 'I' },
    { type: 'input', label: 'Input', icon: 'In' },
    { type: 'dropdown', label: 'Dropdown', icon: 'D' },
    { type: 'radio', label: 'Radio', icon: 'R' },
    { type: 'checkbox', label: 'Checkbox', icon: 'C' },
    { type: 'map', label: 'Map', icon: 'M' },
    { type: 'divider', label: 'Divider', icon: '--' }
  ];

  addElement(type: ElementType): void {
    this.builder.addElement(type);
  }
}
```

```html
<!-- src/app/components/element-palette/element-palette.component.html -->

<div class="palette-container">
  <h3 class="palette-title">Elements</h3>
  <div class="palette-grid">
    @for (item of elements; track item.type) {
      <div class="palette-item" (click)="addElement(item.type)">
        <span class="palette-icon">{{ item.icon }}</span>
        <span class="palette-label">{{ item.label }}</span>
      </div>
    }
  </div>
</div>
```

```scss
// src/app/components/element-palette/element-palette.component.scss

.palette-container {
  padding: 16px;
}

.palette-title {
  font-size: 14px;
  color: #aaa;
  text-transform: uppercase;
  letter-spacing: 1px;
  margin-bottom: 16px;
}

.palette-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.palette-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  padding: 12px 8px;
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #0f3460;
  }
}

.palette-icon {
  font-size: 18px;
  font-weight: bold;
  color: #e94560;
}

.palette-label {
  font-size: 11px;
  color: #ccc;
}
```

**Step 2: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add src/app/components/element-palette/
git commit -m "feat: implement element palette with clickable element grid"
```

---

### Task 8: Build Canvas Component (Center Panel)

**Files:**
- Modify: `src/app/components/canvas/canvas.component.ts`
- Modify: `src/app/components/canvas/canvas.component.html`
- Modify: `src/app/components/canvas/canvas.component.scss`
- Create: `src/app/components/canvas-element/canvas-element.component.ts`
- Create: `src/app/components/canvas-element/canvas-element.component.html`
- Create: `src/app/components/canvas-element/canvas-element.component.scss`

**Step 1: Generate canvas-element component**

Run: `ng generate component components/canvas-element --standalone --skip-tests`

**Step 2: Implement canvas-element (renders each element visually)**

```typescript
// src/app/components/canvas-element/canvas-element.component.ts

import { Component, Input, inject } from '@angular/core';
import { BuilderElement } from '../../models/element.model';
import { BuilderService } from '../../services/builder.service';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-canvas-element',
  standalone: true,
  imports: [NgStyle],
  templateUrl: './canvas-element.component.html',
  styleUrl: './canvas-element.component.scss'
})
export class CanvasElementComponent {
  @Input({ required: true }) element!: BuilderElement;

  private builder = inject(BuilderService);

  get isSelected(): boolean {
    return this.builder.selectedElementId() === this.element.id;
  }

  select(event: Event): void {
    event.stopPropagation();
    this.builder.selectElement(this.element.id);
  }

  remove(event: Event): void {
    event.stopPropagation();
    this.builder.removeElement(this.element.id);
  }
}
```

```html
<!-- src/app/components/canvas-element/canvas-element.component.html -->

<div
  class="canvas-el"
  [class.selected]="isSelected"
  [ngStyle]="element.styles"
  (click)="select($event)"
>
  <div class="el-actions" *ngIf="isSelected">
    <button class="el-delete" (click)="remove($event)">x</button>
  </div>

  @switch (element.type) {
    @case ('text') {
      <div class="el-text">
        @if (element.dataSource === 'dynamic' && element.dynamicBinding) {
          <span class="binding-badge">{{ element.dynamicBinding.functionName }}()</span>
        } @else {
          {{ element.staticContent }}
        }
      </div>
    }
    @case ('button') {
      <button class="el-button">{{ element.staticContent }}</button>
    }
    @case ('image') {
      @if (element.dataSource === 'dynamic') {
        <div class="el-image-placeholder">Image: {{ element.dynamicBinding?.functionName }}()</div>
      } @else {
        <div class="el-image-placeholder">Image</div>
      }
    }
    @case ('input') {
      <label class="el-label">{{ element.settings['label'] }}</label>
      <input
        class="el-input"
        [type]="element.settings['inputType'] || 'text'"
        [placeholder]="element.settings['placeholder'] || ''"
        disabled
      />
    }
    @case ('dropdown') {
      <label class="el-label">{{ element.settings['label'] }}</label>
      <select class="el-select" disabled>
        @for (opt of element.options; track opt.value) {
          <option>{{ opt.label }}</option>
        }
      </select>
    }
    @case ('radio') {
      <label class="el-label">{{ element.settings['label'] }}</label>
      @for (opt of element.options; track opt.value) {
        <label class="el-radio">
          <input type="radio" disabled [name]="element.settings['groupName']" />
          {{ opt.label }}
        </label>
      }
    }
    @case ('checkbox') {
      <label class="el-label">{{ element.settings['label'] }}</label>
      @for (opt of element.options; track opt.value) {
        <label class="el-checkbox">
          <input type="checkbox" disabled />
          {{ opt.label }}
        </label>
      }
    }
    @case ('map') {
      <div class="el-map-placeholder">Map ({{ element.settings['lat'] }}, {{ element.settings['lng'] }})</div>
    }
    @case ('divider') {
      <hr class="el-divider" />
    }
  }
</div>
```

```scss
// src/app/components/canvas-element/canvas-element.component.scss

.canvas-el {
  position: relative;
  padding: 8px;
  border: 2px solid transparent;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.2s;

  &:hover {
    border-color: #0f3460;
  }

  &.selected {
    border-color: #e94560;
  }
}

.el-actions {
  position: absolute;
  top: -10px;
  right: -10px;
  z-index: 10;
}

.el-delete {
  background: #e94560;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  font-size: 12px;
  line-height: 1;
}

.el-label {
  display: block;
  font-size: 12px;
  color: #aaa;
  margin-bottom: 4px;
}

.el-button {
  padding: 8px 16px;
  background: #e94560;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: default;
}

.el-input, .el-select {
  width: 100%;
  padding: 8px;
  background: #16213e;
  border: 1px solid #0f3460;
  color: #eee;
  border-radius: 4px;
}

.el-radio, .el-checkbox {
  display: block;
  font-size: 13px;
  color: #ccc;
  margin: 4px 0;
}

.el-image-placeholder, .el-map-placeholder {
  background: #0f3460;
  padding: 30px;
  text-align: center;
  color: #aaa;
  border-radius: 4px;
}

.el-divider {
  border: none;
  border-top: 1px solid #333;
  margin: 8px 0;
}

.binding-badge {
  background: #0f3460;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  color: #e94560;
}
```

**Step 3: Implement canvas component with CDK drag-drop**

```typescript
// src/app/components/canvas/canvas.component.ts

import { Component, inject } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { BuilderService } from '../../services/builder.service';
import { CanvasElementComponent } from '../canvas-element/canvas-element.component';

@Component({
  selector: 'app-canvas',
  standalone: true,
  imports: [CdkDropList, CdkDrag, CanvasElementComponent],
  templateUrl: './canvas.component.html',
  styleUrl: './canvas.component.scss'
})
export class CanvasComponent {
  builder = inject(BuilderService);

  onDrop(event: CdkDragDrop<any>): void {
    this.builder.reorderElements(event.previousIndex, event.currentIndex);
  }

  deselectAll(): void {
    this.builder.selectElement(null);
  }
}
```

```html
<!-- src/app/components/canvas/canvas.component.html -->

<div class="canvas-frame" (click)="deselectAll()">
  <div class="phone-frame">
    <div class="phone-header">
      <span>{{ builder.activePage()?.name }}</span>
    </div>
    <div
      class="phone-body"
      cdkDropList
      (cdkDropListDropped)="onDrop($event)"
    >
      @for (element of builder.activePage()?.elements; track element.id) {
        <div cdkDrag>
          <app-canvas-element [element]="element"></app-canvas-element>
        </div>
      }
      @empty {
        <div class="empty-state">
          Click elements from the left panel to add them here
        </div>
      }
    </div>
  </div>
</div>
```

```scss
// src/app/components/canvas/canvas.component.scss

.canvas-frame {
  width: 100%;
  display: flex;
  justify-content: center;
  padding-top: 10px;
}

.phone-frame {
  width: 375px;
  min-height: 667px;
  background: #1a1a2e;
  border: 2px solid #0f3460;
  border-radius: 20px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.phone-header {
  padding: 12px 16px;
  background: #16213e;
  text-align: center;
  font-size: 14px;
  font-weight: 600;
  border-bottom: 1px solid #0f3460;
}

.phone-body {
  flex: 1;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 200px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #555;
  font-size: 14px;
  text-align: center;
  padding: 40px;
}

.cdk-drag-preview {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.cdk-drag-placeholder {
  opacity: 0.3;
}
```

**Step 4: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 5: Commit**

```bash
git add src/app/components/canvas/ src/app/components/canvas-element/
git commit -m "feat: implement canvas with phone frame and draggable elements"
```

---

### Task 9: Build Properties Panel - Style Tab

**Files:**
- Modify: `src/app/components/properties-panel/properties-panel.component.ts`
- Modify: `src/app/components/properties-panel/properties-panel.component.html`
- Modify: `src/app/components/properties-panel/properties-panel.component.scss`
- Create: `src/app/components/properties-panel/style-tab/style-tab.component.ts`
- Create: `src/app/components/properties-panel/style-tab/style-tab.component.html`
- Create: `src/app/components/properties-panel/style-tab/style-tab.component.scss`

**Step 1: Generate style-tab component**

Run: `ng generate component components/properties-panel/style-tab --standalone --skip-tests`

**Step 2: Implement style-tab**

```typescript
// src/app/components/properties-panel/style-tab/style-tab.component.ts

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../../../services/builder.service';

@Component({
  selector: 'app-style-tab',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './style-tab.component.html',
  styleUrl: './style-tab.component.scss'
})
export class StyleTabComponent {
  builder = inject(BuilderService);

  get element() {
    return this.builder.selectedElement();
  }

  updateStyle(property: string, value: string): void {
    const el = this.element;
    if (!el) return;
    this.builder.updateElement(el.id, {
      styles: { ...el.styles, [property]: value }
    });
  }
}
```

```html
<!-- src/app/components/properties-panel/style-tab/style-tab.component.html -->

@if (element; as el) {
  <div class="style-group">
    <label>Font Size</label>
    <input
      type="text"
      [ngModel]="el.styles.fontSize || ''"
      (ngModelChange)="updateStyle('fontSize', $event)"
      placeholder="e.g. 16px"
    />
  </div>

  <div class="style-group">
    <label>Font Weight</label>
    <select
      [ngModel]="el.styles.fontWeight || ''"
      (ngModelChange)="updateStyle('fontWeight', $event)"
    >
      <option value="">Normal</option>
      <option value="bold">Bold</option>
      <option value="600">Semi-Bold</option>
      <option value="300">Light</option>
    </select>
  </div>

  <div class="style-group">
    <label>Text Color</label>
    <input
      type="color"
      [ngModel]="el.styles.color || '#eeeeee'"
      (ngModelChange)="updateStyle('color', $event)"
    />
  </div>

  <div class="style-group">
    <label>Background</label>
    <input
      type="color"
      [ngModel]="el.styles.backgroundColor || '#1a1a2e'"
      (ngModelChange)="updateStyle('backgroundColor', $event)"
    />
  </div>

  <div class="style-group">
    <label>Text Align</label>
    <select
      [ngModel]="el.styles.textAlign || ''"
      (ngModelChange)="updateStyle('textAlign', $event)"
    >
      <option value="">Left</option>
      <option value="center">Center</option>
      <option value="right">Right</option>
    </select>
  </div>

  <div class="style-group">
    <label>Padding</label>
    <input
      type="text"
      [ngModel]="el.styles.padding || ''"
      (ngModelChange)="updateStyle('padding', $event)"
      placeholder="e.g. 8px"
    />
  </div>

  <div class="style-group">
    <label>Margin</label>
    <input
      type="text"
      [ngModel]="el.styles.margin || ''"
      (ngModelChange)="updateStyle('margin', $event)"
      placeholder="e.g. 4px 0"
    />
  </div>

  <div class="style-group">
    <label>Border Radius</label>
    <input
      type="text"
      [ngModel]="el.styles.borderRadius || ''"
      (ngModelChange)="updateStyle('borderRadius', $event)"
      placeholder="e.g. 8px"
    />
  </div>

  <div class="style-group">
    <label>Border</label>
    <input
      type="text"
      [ngModel]="el.styles.border || ''"
      (ngModelChange)="updateStyle('border', $event)"
      placeholder="e.g. 1px solid #333"
    />
  </div>

  <div class="style-group">
    <label>Width</label>
    <input
      type="text"
      [ngModel]="el.styles.width || ''"
      (ngModelChange)="updateStyle('width', $event)"
      placeholder="e.g. 100%"
    />
  </div>

  <div class="style-group">
    <label>Height</label>
    <input
      type="text"
      [ngModel]="el.styles.height || ''"
      (ngModelChange)="updateStyle('height', $event)"
      placeholder="e.g. auto"
    />
  </div>
}
```

```scss
// src/app/components/properties-panel/style-tab/style-tab.component.scss

.style-group {
  margin-bottom: 12px;

  label {
    display: block;
    font-size: 11px;
    color: #aaa;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  input, select {
    width: 100%;
    padding: 6px 8px;
    background: #16213e;
    border: 1px solid #0f3460;
    color: #eee;
    border-radius: 4px;
    font-size: 13px;
  }

  input[type="color"] {
    height: 32px;
    padding: 2px;
    cursor: pointer;
  }
}
```

**Step 3: Implement properties panel with tab switching**

```typescript
// src/app/components/properties-panel/properties-panel.component.ts

import { Component, inject } from '@angular/core';
import { BuilderService } from '../../services/builder.service';
import { StyleTabComponent } from './style-tab/style-tab.component';

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [StyleTabComponent],
  templateUrl: './properties-panel.component.html',
  styleUrl: './properties-panel.component.scss'
})
export class PropertiesPanelComponent {
  builder = inject(BuilderService);
  activeTab: 'style' | 'data' | 'settings' = 'style';
}
```

```html
<!-- src/app/components/properties-panel/properties-panel.component.html -->

<div class="panel-container">
  @if (builder.selectedElement(); as el) {
    <div class="panel-header">
      <span class="el-type">{{ el.type | uppercase }}</span>
    </div>
    <div class="tabs">
      <button
        [class.active]="activeTab === 'style'"
        (click)="activeTab = 'style'"
      >Style</button>
      <button
        [class.active]="activeTab === 'data'"
        (click)="activeTab = 'data'"
      >Data</button>
      <button
        [class.active]="activeTab === 'settings'"
        (click)="activeTab = 'settings'"
      >Settings</button>
    </div>
    <div class="tab-content">
      @switch (activeTab) {
        @case ('style') {
          <app-style-tab></app-style-tab>
        }
        @case ('data') {
          <p class="placeholder">Data tab (Task 10)</p>
        }
        @case ('settings') {
          <p class="placeholder">Settings tab (Task 11)</p>
        }
      }
    </div>
  } @else {
    <div class="no-selection">
      Select an element to edit its properties
    </div>
  }
</div>
```

```scss
// src/app/components/properties-panel/properties-panel.component.scss

.panel-container {
  padding: 16px;
  height: 100%;
}

.panel-header {
  margin-bottom: 12px;
}

.el-type {
  font-size: 12px;
  font-weight: 600;
  color: #e94560;
  letter-spacing: 1px;
}

.tabs {
  display: flex;
  gap: 0;
  margin-bottom: 16px;
  border-bottom: 1px solid #0f3460;

  button {
    flex: 1;
    padding: 8px;
    background: none;
    border: none;
    color: #888;
    cursor: pointer;
    font-size: 12px;
    border-bottom: 2px solid transparent;

    &.active {
      color: #e94560;
      border-bottom-color: #e94560;
    }

    &:hover {
      color: #ccc;
    }
  }
}

.tab-content {
  padding-top: 4px;
}

.no-selection {
  color: #555;
  text-align: center;
  padding: 40px 20px;
  font-size: 14px;
}

.placeholder {
  color: #555;
  text-align: center;
  padding: 20px;
}
```

**Step 4: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 5: Commit**

```bash
git add src/app/components/properties-panel/
git commit -m "feat: implement properties panel with style tab"
```

---

### Task 10: Build Properties Panel - Data Tab

**Files:**
- Create: `src/app/components/properties-panel/data-tab/data-tab.component.ts`
- Create: `src/app/components/properties-panel/data-tab/data-tab.component.html`
- Create: `src/app/components/properties-panel/data-tab/data-tab.component.scss`
- Modify: `src/app/components/properties-panel/properties-panel.component.ts` (add import)

**Step 1: Generate data-tab component**

Run: `ng generate component components/properties-panel/data-tab --standalone --skip-tests`

**Step 2: Implement data-tab**

```typescript
// src/app/components/properties-panel/data-tab/data-tab.component.ts

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../../../services/builder.service';
import { TwkFunctionsService } from '../../../services/twk-functions.service';
import { TwkBinding, ElementOption } from '../../../models/element.model';

@Component({
  selector: 'app-data-tab',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './data-tab.component.html',
  styleUrl: './data-tab.component.scss'
})
export class DataTabComponent {
  builder = inject(BuilderService);
  twkService = inject(TwkFunctionsService);

  categories = this.twkService.getCategories();

  get element() {
    return this.builder.selectedElement();
  }

  get supportsDataSource(): boolean {
    const type = this.element?.type;
    return ['text', 'image', 'dropdown', 'radio', 'checkbox', 'map'].includes(type ?? '');
  }

  get supportsItemActions(): boolean {
    const type = this.element?.type;
    return ['dropdown', 'radio', 'checkbox'].includes(type ?? '');
  }

  get supportsButtonAction(): boolean {
    return this.element?.type === 'button';
  }

  getFunctionsForCategory(category: string) {
    return this.twkService.getByCategory(category);
  }

  setDataSource(source: 'static' | 'dynamic'): void {
    const el = this.element;
    if (!el) return;
    this.builder.updateElement(el.id, { dataSource: source });
  }

  setDynamicFunction(functionName: string): void {
    const el = this.element;
    if (!el) return;
    const fn = this.twkService.getByName(functionName);
    if (!fn) return;
    const binding: TwkBinding = {
      functionName: fn.name,
      params: {},
      resultPath: fn.returns.path
    };
    this.builder.updateElement(el.id, { dynamicBinding: binding });
  }

  setFunctionParam(paramName: string, value: string): void {
    const el = this.element;
    if (!el || !el.dynamicBinding) return;
    const params = { ...el.dynamicBinding.params, [paramName]: value };
    this.builder.updateElement(el.id, {
      dynamicBinding: { ...el.dynamicBinding, params }
    });
  }

  setButtonAction(functionName: string): void {
    const el = this.element;
    if (!el) return;
    if (functionName === '__navigate__') {
      this.builder.updateElement(el.id, {
        dynamicBinding: undefined,
        pageNavigateTo: ''
      });
      return;
    }
    const fn = this.twkService.getByName(functionName);
    if (!fn) return;
    this.builder.updateElement(el.id, {
      dynamicBinding: {
        functionName: fn.name,
        params: {},
        resultPath: fn.returns.path
      },
      pageNavigateTo: undefined
    });
  }

  setPageNavigateTo(pageId: string): void {
    const el = this.element;
    if (!el) return;
    this.builder.updateElement(el.id, { pageNavigateTo: pageId });
  }

  setOptionAction(index: number, functionName: string): void {
    const el = this.element;
    if (!el) return;
    const options = [...el.options];
    if (functionName === '') {
      options[index] = { ...options[index], action: undefined };
    } else {
      const fn = this.twkService.getByName(functionName);
      if (!fn) return;
      options[index] = {
        ...options[index],
        action: { functionName: fn.name, params: {}, resultPath: fn.returns.path }
      };
    }
    this.builder.updateElement(el.id, { options });
  }
}
```

```html
<!-- src/app/components/properties-panel/data-tab/data-tab.component.html -->

@if (element; as el) {
  <!-- Data Source for display elements -->
  @if (supportsDataSource) {
    <div class="section">
      <h4>Data Source</h4>
      <div class="radio-row">
        <label>
          <input
            type="radio"
            name="dataSource"
            value="static"
            [checked]="el.dataSource === 'static'"
            (change)="setDataSource('static')"
          /> Static
        </label>
        <label>
          <input
            type="radio"
            name="dataSource"
            value="dynamic"
            [checked]="el.dataSource === 'dynamic'"
            (change)="setDataSource('dynamic')"
          /> Dynamic (TWK)
        </label>
      </div>

      @if (el.dataSource === 'dynamic') {
        <div class="field">
          <label>TWK Function</label>
          <select
            [ngModel]="el.dynamicBinding?.functionName || ''"
            (ngModelChange)="setDynamicFunction($event)"
          >
            <option value="">-- Select function --</option>
            @for (cat of categories; track cat) {
              <optgroup [label]="cat">
                @for (fn of getFunctionsForCategory(cat); track fn.name) {
                  <option [value]="fn.name">{{ fn.name }} - {{ fn.description }}</option>
                }
              </optgroup>
            }
          </select>
        </div>

        @if (el.dynamicBinding; as binding) {
          @for (param of twkService.getByName(binding.functionName)?.params || []; track param.name) {
            <div class="field">
              <label>{{ param.name }} ({{ param.type }})</label>
              <input
                type="text"
                [ngModel]="binding.params[param.name] || ''"
                (ngModelChange)="setFunctionParam(param.name, $event)"
                [placeholder]="param.required ? 'Required' : 'Optional'"
              />
            </div>
          }
          <div class="result-path">
            Returns: <code>{{ binding.resultPath }}</code>
          </div>
        }
      }
    </div>
  }

  <!-- Button action -->
  @if (supportsButtonAction) {
    <div class="section">
      <h4>Button Action</h4>
      <div class="field">
        <label>Action Type</label>
        <select
          [ngModel]="el.pageNavigateTo !== undefined ? '__navigate__' : (el.dynamicBinding?.functionName || '')"
          (ngModelChange)="setButtonAction($event)"
        >
          <option value="">-- Select action --</option>
          <option value="__navigate__">Navigate to Page</option>
          @for (cat of categories; track cat) {
            <optgroup [label]="cat">
              @for (fn of getFunctionsForCategory(cat); track fn.name) {
                <option [value]="fn.name">{{ fn.name }}</option>
              }
            </optgroup>
          }
        </select>
      </div>

      @if (el.pageNavigateTo !== undefined) {
        <div class="field">
          <label>Target Page</label>
          <select
            [ngModel]="el.pageNavigateTo"
            (ngModelChange)="setPageNavigateTo($event)"
          >
            <option value="">-- Select page --</option>
            @for (page of builder.pages(); track page.id) {
              <option [value]="page.id">{{ page.name }}</option>
            }
          </select>
        </div>
      }

      @if (el.dynamicBinding; as binding) {
        @for (param of twkService.getByName(binding.functionName)?.params || []; track param.name) {
          <div class="field">
            <label>{{ param.name }}</label>
            <input
              type="text"
              [ngModel]="binding.params[param.name] || ''"
              (ngModelChange)="setFunctionParam(param.name, $event)"
            />
          </div>
        }
      }
    </div>
  }

  <!-- Per-option actions -->
  @if (supportsItemActions && el.dataSource === 'static') {
    <div class="section">
      <h4>Option Actions</h4>
      @for (opt of el.options; track opt.value; let i = $index) {
        <div class="option-action">
          <span class="option-label">{{ opt.label }}</span>
          <select
            [ngModel]="opt.action?.functionName || ''"
            (ngModelChange)="setOptionAction(i, $event)"
          >
            <option value="">No action</option>
            @for (cat of categories; track cat) {
              <optgroup [label]="cat">
                @for (fn of getFunctionsForCategory(cat); track fn.name) {
                  <option [value]="fn.name">{{ fn.name }}</option>
                }
              </optgroup>
            }
          </select>
        </div>
      }
    </div>
  }
}
```

```scss
// src/app/components/properties-panel/data-tab/data-tab.component.scss

.section {
  margin-bottom: 20px;

  h4 {
    font-size: 12px;
    color: #e94560;
    text-transform: uppercase;
    margin-bottom: 8px;
  }
}

.radio-row {
  display: flex;
  gap: 16px;
  margin-bottom: 8px;

  label {
    font-size: 13px;
    color: #ccc;
    cursor: pointer;

    input {
      margin-right: 4px;
    }
  }
}

.field {
  margin-bottom: 8px;

  label {
    display: block;
    font-size: 11px;
    color: #aaa;
    margin-bottom: 4px;
  }

  select, input {
    width: 100%;
    padding: 6px 8px;
    background: #16213e;
    border: 1px solid #0f3460;
    color: #eee;
    border-radius: 4px;
    font-size: 12px;
  }
}

.result-path {
  font-size: 11px;
  color: #888;
  margin-top: 4px;

  code {
    color: #e94560;
  }
}

.option-action {
  margin-bottom: 8px;

  .option-label {
    display: block;
    font-size: 12px;
    color: #ccc;
    margin-bottom: 4px;
  }

  select {
    width: 100%;
    padding: 6px 8px;
    background: #16213e;
    border: 1px solid #0f3460;
    color: #eee;
    border-radius: 4px;
    font-size: 12px;
  }
}
```

**Step 3: Add DataTabComponent to properties panel imports**

In `properties-panel.component.ts`, add `DataTabComponent` to imports and update the template to use `<app-data-tab>` instead of the placeholder.

**Step 4: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 5: Commit**

```bash
git add src/app/components/properties-panel/
git commit -m "feat: implement data tab with TWK function binding and per-option actions"
```

---

### Task 11: Build Properties Panel - Settings Tab

**Files:**
- Create: `src/app/components/properties-panel/settings-tab/settings-tab.component.ts`
- Create: `src/app/components/properties-panel/settings-tab/settings-tab.component.html`
- Create: `src/app/components/properties-panel/settings-tab/settings-tab.component.scss`
- Modify: `src/app/components/properties-panel/properties-panel.component.ts` (add import)

**Step 1: Generate settings-tab component**

Run: `ng generate component components/properties-panel/settings-tab --standalone --skip-tests`

**Step 2: Implement settings-tab**

```typescript
// src/app/components/properties-panel/settings-tab/settings-tab.component.ts

import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../../../services/builder.service';
import { ElementOption } from '../../../models/element.model';

@Component({
  selector: 'app-settings-tab',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './settings-tab.component.html',
  styleUrl: './settings-tab.component.scss'
})
export class SettingsTabComponent {
  builder = inject(BuilderService);

  get element() {
    return this.builder.selectedElement();
  }

  updateContent(value: string): void {
    const el = this.element;
    if (!el) return;
    this.builder.updateElement(el.id, { staticContent: value });
  }

  updateSetting(key: string, value: string): void {
    const el = this.element;
    if (!el) return;
    this.builder.updateElement(el.id, {
      settings: { ...el.settings, [key]: value }
    });
  }

  updateOptionLabel(index: number, label: string): void {
    const el = this.element;
    if (!el) return;
    const options = [...el.options];
    options[index] = { ...options[index], label, value: label.toLowerCase().replace(/\s+/g, '_') };
    this.builder.updateElement(el.id, { options });
  }

  addOption(): void {
    const el = this.element;
    if (!el) return;
    const newOption: ElementOption = {
      label: `Option ${el.options.length + 1}`,
      value: `option${el.options.length + 1}`
    };
    this.builder.updateElement(el.id, { options: [...el.options, newOption] });
  }

  removeOption(index: number): void {
    const el = this.element;
    if (!el) return;
    const options = el.options.filter((_, i) => i !== index);
    this.builder.updateElement(el.id, { options });
  }
}
```

```html
<!-- src/app/components/properties-panel/settings-tab/settings-tab.component.html -->

@if (element; as el) {
  @switch (el.type) {
    @case ('text') {
      <div class="field">
        <label>Content</label>
        <textarea
          rows="3"
          [ngModel]="el.staticContent"
          (ngModelChange)="updateContent($event)"
        ></textarea>
      </div>
      <div class="field">
        <label>Heading Level</label>
        <select
          [ngModel]="el.settings['headingLevel'] || 'p'"
          (ngModelChange)="updateSetting('headingLevel', $event)"
        >
          <option value="h1">H1</option>
          <option value="h2">H2</option>
          <option value="h3">H3</option>
          <option value="h4">H4</option>
          <option value="h5">H5</option>
          <option value="h6">H6</option>
          <option value="p">Paragraph</option>
        </select>
      </div>
    }
    @case ('button') {
      <div class="field">
        <label>Button Label</label>
        <input
          type="text"
          [ngModel]="el.staticContent"
          (ngModelChange)="updateContent($event)"
        />
      </div>
    }
    @case ('image') {
      <div class="field">
        <label>Image URL (static)</label>
        <input
          type="text"
          [ngModel]="el.staticContent"
          (ngModelChange)="updateContent($event)"
          placeholder="https://..."
        />
      </div>
      <div class="field">
        <label>Alt Text</label>
        <input
          type="text"
          [ngModel]="el.settings['alt'] || ''"
          (ngModelChange)="updateSetting('alt', $event)"
        />
      </div>
      <div class="field">
        <label>Width</label>
        <input
          type="text"
          [ngModel]="el.settings['width'] || '100%'"
          (ngModelChange)="updateSetting('width', $event)"
        />
      </div>
    }
    @case ('input') {
      <div class="field">
        <label>Input Label</label>
        <input
          type="text"
          [ngModel]="el.settings['label'] || ''"
          (ngModelChange)="updateSetting('label', $event)"
        />
      </div>
      <div class="field">
        <label>Input Type</label>
        <select
          [ngModel]="el.settings['inputType'] || 'text'"
          (ngModelChange)="updateSetting('inputType', $event)"
        >
          <option value="text">Text</option>
          <option value="number">Number</option>
          <option value="email">Email</option>
          <option value="tel">Phone</option>
        </select>
      </div>
      <div class="field">
        <label>Placeholder</label>
        <input
          type="text"
          [ngModel]="el.settings['placeholder'] || ''"
          (ngModelChange)="updateSetting('placeholder', $event)"
        />
      </div>
    }
    @case ('dropdown') {
      <div class="field">
        <label>Label</label>
        <input
          type="text"
          [ngModel]="el.settings['label'] || ''"
          (ngModelChange)="updateSetting('label', $event)"
        />
      </div>
      <div class="options-section">
        <h4>Options</h4>
        @for (opt of el.options; track opt.value; let i = $index) {
          <div class="option-row">
            <input
              type="text"
              [ngModel]="opt.label"
              (ngModelChange)="updateOptionLabel(i, $event)"
            />
            <button class="remove-btn" (click)="removeOption(i)">x</button>
          </div>
        }
        <button class="add-btn" (click)="addOption()">+ Add Option</button>
      </div>
    }
    @case ('radio') {
      <div class="field">
        <label>Label</label>
        <input
          type="text"
          [ngModel]="el.settings['label'] || ''"
          (ngModelChange)="updateSetting('label', $event)"
        />
      </div>
      <div class="options-section">
        <h4>Options</h4>
        @for (opt of el.options; track opt.value; let i = $index) {
          <div class="option-row">
            <input
              type="text"
              [ngModel]="opt.label"
              (ngModelChange)="updateOptionLabel(i, $event)"
            />
            <button class="remove-btn" (click)="removeOption(i)">x</button>
          </div>
        }
        <button class="add-btn" (click)="addOption()">+ Add Option</button>
      </div>
    }
    @case ('checkbox') {
      <div class="field">
        <label>Label</label>
        <input
          type="text"
          [ngModel]="el.settings['label'] || ''"
          (ngModelChange)="updateSetting('label', $event)"
        />
      </div>
      <div class="options-section">
        <h4>Options</h4>
        @for (opt of el.options; track opt.value; let i = $index) {
          <div class="option-row">
            <input
              type="text"
              [ngModel]="opt.label"
              (ngModelChange)="updateOptionLabel(i, $event)"
            />
            <button class="remove-btn" (click)="removeOption(i)">x</button>
          </div>
        }
        <button class="add-btn" (click)="addOption()">+ Add Option</button>
      </div>
    }
    @case ('map') {
      <div class="field">
        <label>Latitude</label>
        <input
          type="text"
          [ngModel]="el.settings['lat'] || ''"
          (ngModelChange)="updateSetting('lat', $event)"
        />
      </div>
      <div class="field">
        <label>Longitude</label>
        <input
          type="text"
          [ngModel]="el.settings['lng'] || ''"
          (ngModelChange)="updateSetting('lng', $event)"
        />
      </div>
      <div class="field">
        <label>Zoom</label>
        <input
          type="text"
          [ngModel]="el.settings['zoom'] || '13'"
          (ngModelChange)="updateSetting('zoom', $event)"
        />
      </div>
    }
    @case ('divider') {
      <p class="hint">Use the Style tab to customize the divider appearance.</p>
    }
  }
}
```

```scss
// src/app/components/properties-panel/settings-tab/settings-tab.component.scss

.field {
  margin-bottom: 12px;

  label {
    display: block;
    font-size: 11px;
    color: #aaa;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  input, select, textarea {
    width: 100%;
    padding: 6px 8px;
    background: #16213e;
    border: 1px solid #0f3460;
    color: #eee;
    border-radius: 4px;
    font-size: 13px;
    resize: vertical;
  }
}

.options-section {
  margin-top: 12px;

  h4 {
    font-size: 12px;
    color: #e94560;
    margin-bottom: 8px;
  }
}

.option-row {
  display: flex;
  gap: 4px;
  margin-bottom: 4px;

  input {
    flex: 1;
    padding: 6px 8px;
    background: #16213e;
    border: 1px solid #0f3460;
    color: #eee;
    border-radius: 4px;
    font-size: 13px;
  }
}

.remove-btn {
  background: #e94560;
  color: white;
  border: none;
  border-radius: 4px;
  width: 28px;
  cursor: pointer;
}

.add-btn {
  margin-top: 8px;
  padding: 6px 12px;
  background: #0f3460;
  color: #ccc;
  border: 1px solid #0f3460;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;

  &:hover {
    background: #16213e;
  }
}

.hint {
  color: #666;
  font-size: 13px;
}
```

**Step 3: Update properties panel to import SettingsTabComponent, replace placeholder**

**Step 4: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 5: Commit**

```bash
git add src/app/components/properties-panel/
git commit -m "feat: implement settings tab with per-element configuration"
```

---

### Task 12: Build Page Tabs Component

**Files:**
- Modify: `src/app/components/page-tabs/page-tabs.component.ts`
- Modify: `src/app/components/page-tabs/page-tabs.component.html`
- Modify: `src/app/components/page-tabs/page-tabs.component.scss`

**Step 1: Implement page tabs**

```typescript
// src/app/components/page-tabs/page-tabs.component.ts

import { Component, inject } from '@angular/core';
import { BuilderService } from '../../services/builder.service';

@Component({
  selector: 'app-page-tabs',
  standalone: true,
  templateUrl: './page-tabs.component.html',
  styleUrl: './page-tabs.component.scss'
})
export class PageTabsComponent {
  builder = inject(BuilderService);

  addPage(): void {
    this.builder.addPage();
  }

  selectPage(pageId: string): void {
    this.builder.setActivePage(pageId);
  }

  removePage(event: Event, pageId: string): void {
    event.stopPropagation();
    if (this.builder.pages().length > 1) {
      this.builder.removePage(pageId);
    }
  }
}
```

```html
<!-- src/app/components/page-tabs/page-tabs.component.html -->

<div class="tabs-container">
  @for (page of builder.pages(); track page.id) {
    <div
      class="tab"
      [class.active]="builder.activePageId() === page.id"
      (click)="selectPage(page.id)"
    >
      <span>{{ page.name }}</span>
      @if (builder.pages().length > 1) {
        <button class="tab-close" (click)="removePage($event, page.id)">x</button>
      }
    </div>
  }
  <button class="add-tab" (click)="addPage()">+</button>
</div>
```

```scss
// src/app/components/page-tabs/page-tabs.component.scss

.tabs-container {
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 12px;
  gap: 4px;
  background: #1a1a2e;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 12px;
  background: #16213e;
  border: 1px solid #0f3460;
  border-radius: 4px;
  color: #888;
  font-size: 12px;
  cursor: pointer;

  &.active {
    background: #0f3460;
    color: #eee;
  }
}

.tab-close {
  background: none;
  border: none;
  color: #666;
  cursor: pointer;
  font-size: 10px;
  padding: 0 2px;

  &:hover {
    color: #e94560;
  }
}

.add-tab {
  padding: 4px 10px;
  background: none;
  border: 1px dashed #0f3460;
  color: #666;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;

  &:hover {
    color: #e94560;
    border-color: #e94560;
  }
}
```

**Step 2: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add src/app/components/page-tabs/
git commit -m "feat: implement page tabs with add/remove/switch"
```

---

### Task 13: Build Code Generator Service

**Files:**
- Create: `src/app/services/code-generator.service.ts`

**Step 1: Implement the code generator**

```typescript
// src/app/services/code-generator.service.ts

import { Injectable } from '@angular/core';
import { Page } from '../models/page.model';
import { BuilderElement, ElementStyle } from '../models/element.model';

@Injectable({ providedIn: 'root' })
export class CodeGeneratorService {

  generatePages(pages: Page[]): { fileName: string; html: string }[] {
    return pages.map((page, index) => ({
      fileName: index === 0 ? 'index.html' : `page${index + 1}.html`,
      html: this.generateHtml(page, pages)
    }));
  }

  generateCss(pages: Page[]): string {
    let css = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: 'Segoe UI', Tahoma, sans-serif; background: #1a1a2e; color: #eee; padding: 16px; }
.el-label { font-size: 12px; color: #aaa; margin-bottom: 4px; display: block; }
select, input[type="text"], input[type="number"], input[type="email"], input[type="tel"] {
  width: 100%; padding: 10px; background: #16213e; border: 1px solid #0f3460; color: #eee; border-radius: 6px; font-size: 14px;
}
button { padding: 10px 20px; background: #e94560; color: white; border: none; border-radius: 6px; font-size: 14px; cursor: pointer; }
img { max-width: 100%; border-radius: 8px; }
hr { border: none; border-top: 1px solid #333; margin: 12px 0; }
.radio-group label, .checkbox-group label { display: block; padding: 6px 0; color: #ccc; font-size: 14px; }
.map-container { width: 100%; border-radius: 8px; overflow: hidden; }
.map-container iframe { width: 100%; height: 250px; border: 0; }
`;

    for (const page of pages) {
      for (const el of page.elements) {
        const styles = this.styleObjectToCss(el.styles);
        if (styles) {
          css += `#${el.id} { ${styles} }\n`;
        }
      }
    }

    return css;
  }

  generateJs(pages: Page[]): string {
    let js = `document.addEventListener('DOMContentLoaded', function() {\n`;

    for (const page of pages) {
      for (const el of page.elements) {
        // Auto-load dynamic bindings for display elements
        if (el.dataSource === 'dynamic' && el.dynamicBinding) {
          const b = el.dynamicBinding;
          const params = Object.values(b.params).filter(v => v).map(v => `'${v}'`).join(', ');
          const call = `TWK.${b.functionName}(${params})`;

          if (el.type === 'text') {
            js += `  ${call}.then(function(data) {\n`;
            js += `    var val = data.${b.resultPath};\n`;
            js += `    document.getElementById('${el.id}').textContent = val;\n`;
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          } else if (el.type === 'image') {
            js += `  ${call}.then(function(data) {\n`;
            js += `    document.getElementById('${el.id}').src = data.${b.resultPath};\n`;
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          } else if (el.type === 'map') {
            js += `  ${call}.then(function(data) {\n`;
            js += `    var loc = data.${b.resultPath};\n`;
            js += `    document.getElementById('${el.id}-iframe').src = \n`;
            js += `      'https://maps.google.com/maps?q=' + loc.latitude + ',' + loc.longitude + '&output=embed';\n`;
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          } else if (['dropdown', 'radio', 'checkbox'].includes(el.type)) {
            js += `  ${call}.then(function(data) {\n`;
            js += `    var items = data.${b.resultPath};\n`;
            js += `    var container = document.getElementById('${el.id}');\n`;
            if (el.type === 'dropdown') {
              js += `    container.innerHTML = '';\n`;
              js += `    items.forEach(function(item) {\n`;
              js += `      var opt = document.createElement('option');\n`;
              js += `      opt.textContent = JSON.stringify(item);\n`;
              js += `      container.appendChild(opt);\n`;
              js += `    });\n`;
            }
            js += `  }).catch(function(err) { console.error('${b.functionName}:', err); });\n\n`;
          }
        }

        // Button click handlers
        if (el.type === 'button') {
          if (el.pageNavigateTo) {
            const pages_ = pages;
            const targetIndex = pages_.findIndex(p => p.id === el.pageNavigateTo);
            if (targetIndex >= 0) {
              const targetFile = targetIndex === 0 ? 'index.html' : `page${targetIndex + 1}.html`;
              js += `  document.getElementById('${el.id}').addEventListener('click', function() {\n`;
              js += `    window.location.href = '${targetFile}';\n`;
              js += `  });\n\n`;
            }
          } else if (el.dynamicBinding) {
            const b = el.dynamicBinding;
            const params = Object.values(b.params).filter(v => v).map(v => `'${v}'`).join(', ');
            js += `  document.getElementById('${el.id}').addEventListener('click', function() {\n`;
            js += `    TWK.${b.functionName}(${params}).then(function(data) {\n`;
            js += `      console.log('${b.functionName} result:', data);\n`;
            js += `    }).catch(function(err) { console.error('${b.functionName}:', err); });\n`;
            js += `  });\n\n`;
          }
        }

        // Per-option actions for dropdown/radio/checkbox
        if (['dropdown', 'radio', 'checkbox'].includes(el.type) && el.dataSource === 'static') {
          const hasActions = el.options.some(o => o.action);
          if (hasActions) {
            if (el.type === 'dropdown') {
              js += `  document.getElementById('${el.id}').addEventListener('change', function() {\n`;
              js += `    var actions = {\n`;
              for (const opt of el.options) {
                if (opt.action) {
                  const params = Object.values(opt.action.params).filter(v => v).map(v => `'${v}'`).join(', ');
                  js += `      '${opt.value}': function() { return TWK.${opt.action.functionName}(${params}); },\n`;
                }
              }
              js += `    };\n`;
              js += `    var fn = actions[this.value];\n`;
              js += `    if (fn) fn().then(function(data) { console.log('Result:', data); }).catch(function(err) { console.error(err); });\n`;
              js += `  });\n\n`;
            }
          }
        }
      }
    }

    js += `});\n`;
    return js;
  }

  private generateHtml(page: Page, allPages: Page[]): string {
    const pageIndex = allPages.indexOf(page);
    const cssFile = 'css/style.css';
    const jsFiles = ['js/twkhelper.js', 'js/app.js'];

    let body = '';
    for (const el of page.elements) {
      body += this.elementToHtml(el) + '\n';
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.name}</title>
  <link rel="stylesheet" href="${cssFile}">
</head>
<body>
${body}
${jsFiles.map(f => `  <script src="${f}"></script>`).join('\n')}
</body>
</html>`;
  }

  private elementToHtml(el: BuilderElement): string {
    switch (el.type) {
      case 'text': {
        const tag = el.settings['headingLevel'] || 'p';
        return `  <${tag} id="${el.id}">${el.dataSource === 'dynamic' ? 'Loading...' : el.staticContent}</${tag}>`;
      }
      case 'button':
        return `  <button id="${el.id}">${el.staticContent}</button>`;
      case 'image':
        return `  <img id="${el.id}" src="${el.staticContent || ''}" alt="${el.settings['alt'] || ''}" style="width:${el.settings['width'] || '100%'}">`;
      case 'input':
        return `  <label class="el-label">${el.settings['label'] || ''}</label>\n  <input id="${el.id}" type="${el.settings['inputType'] || 'text'}" placeholder="${el.settings['placeholder'] || ''}">`;
      case 'dropdown': {
        let html = `  <label class="el-label">${el.settings['label'] || ''}</label>\n  <select id="${el.id}">`;
        for (const opt of el.options) {
          html += `\n    <option value="${opt.value}">${opt.label}</option>`;
        }
        html += `\n  </select>`;
        return html;
      }
      case 'radio': {
        let html = `  <div class="radio-group" id="${el.id}">\n    <label class="el-label">${el.settings['label'] || ''}</label>`;
        for (const opt of el.options) {
          html += `\n    <label><input type="radio" name="${el.settings['groupName'] || el.id}" value="${opt.value}"> ${opt.label}</label>`;
        }
        html += `\n  </div>`;
        return html;
      }
      case 'checkbox': {
        let html = `  <div class="checkbox-group" id="${el.id}">\n    <label class="el-label">${el.settings['label'] || ''}</label>`;
        for (const opt of el.options) {
          html += `\n    <label><input type="checkbox" value="${opt.value}"> ${opt.label}</label>`;
        }
        html += `\n  </div>`;
        return html;
      }
      case 'map': {
        const lat = el.settings['lat'] || '24.7136';
        const lng = el.settings['lng'] || '46.6753';
        const zoom = el.settings['zoom'] || '13';
        return `  <div class="map-container" id="${el.id}">\n    <iframe id="${el.id}-iframe" src="https://maps.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed"></iframe>\n  </div>`;
      }
      case 'divider':
        return `  <hr id="${el.id}">`;
      default:
        return '';
    }
  }

  private styleObjectToCss(styles: ElementStyle): string {
    const map: Record<string, string> = {
      fontSize: 'font-size',
      fontWeight: 'font-weight',
      color: 'color',
      backgroundColor: 'background-color',
      textAlign: 'text-align',
      padding: 'padding',
      margin: 'margin',
      borderRadius: 'border-radius',
      border: 'border',
      width: 'width',
      height: 'height'
    };

    const parts: string[] = [];
    for (const [key, cssKey] of Object.entries(map)) {
      const val = (styles as any)[key];
      if (val) {
        parts.push(`${cssKey}: ${val}`);
      }
    }
    return parts.join('; ');
  }
}
```

**Step 2: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add src/app/services/code-generator.service.ts
git commit -m "feat: implement code generator service for HTML/CSS/JS output"
```

---

### Task 14: Build Export Service

**Files:**
- Create: `src/app/services/export.service.ts`

**Step 1: Implement the export service**

```typescript
// src/app/services/export.service.ts

import { Injectable, inject } from '@angular/core';
import { BuilderService } from './builder.service';
import { CodeGeneratorService } from './code-generator.service';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private builder = inject(BuilderService);
  private codeGen = inject(CodeGeneratorService);

  async exportZip(): Promise<void> {
    const pages = this.builder.pages();
    const zip = new JSZip();

    // Generate HTML pages at root
    const htmlPages = this.codeGen.generatePages(pages);
    for (const page of htmlPages) {
      zip.file(page.fileName, page.html);
    }

    // Generate CSS
    const css = this.codeGen.generateCss(pages);
    zip.file('css/style.css', css);

    // Generate JS
    const js = this.codeGen.generateJs(pages);
    zip.file('js/app.js', js);

    // Copy twkhelper.js
    const twkHelperContent = await this.loadTwkHelper();
    zip.file('js/twkhelper.js', twkHelperContent);

    // Generate and download ZIP
    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'miniapp.zip');
  }

  private async loadTwkHelper(): Promise<string> {
    const response = await fetch('assets/js/twkhelper.js');
    return response.text();
  }
}
```

**Step 2: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 3: Commit**

```bash
git add src/app/services/export.service.ts
git commit -m "feat: implement export service with flat-root ZIP generation"
```

---

### Task 15: Build Toolbar with Preview and Export

**Files:**
- Modify: `src/app/components/toolbar/toolbar.component.ts`
- Modify: `src/app/components/toolbar/toolbar.component.html`
- Modify: `src/app/components/toolbar/toolbar.component.scss`
- Create: `src/app/components/preview-modal/preview-modal.component.ts`
- Create: `src/app/components/preview-modal/preview-modal.component.html`
- Create: `src/app/components/preview-modal/preview-modal.component.scss`

**Step 1: Generate preview-modal component**

Run: `ng generate component components/preview-modal --standalone --skip-tests`

**Step 2: Implement toolbar**

```typescript
// src/app/components/toolbar/toolbar.component.ts

import { Component, inject } from '@angular/core';
import { ExportService } from '../../services/export.service';
import { BuilderService } from '../../services/builder.service';
import { CodeGeneratorService } from '../../services/code-generator.service';
import { PreviewModalComponent } from '../preview-modal/preview-modal.component';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [PreviewModalComponent],
  templateUrl: './toolbar.component.html',
  styleUrl: './toolbar.component.scss'
})
export class ToolbarComponent {
  private exportService = inject(ExportService);
  private builder = inject(BuilderService);
  private codeGen = inject(CodeGeneratorService);

  showPreview = false;
  previewHtml = '';

  preview(): void {
    const pages = this.builder.pages();
    const htmlPages = this.codeGen.generatePages(pages);
    const css = this.codeGen.generateCss(pages);
    const js = this.codeGen.generateJs(pages);

    // Build a single preview HTML with inline CSS and JS
    const firstPage = htmlPages[0]?.html || '';
    this.previewHtml = firstPage
      .replace('<link rel="stylesheet" href="css/style.css">', `<style>${css}</style>`)
      .replace('  <script src="js/twkhelper.js"></script>\n  <script src="js/app.js"></script>',
        `<script>\n// TWK functions are mocked in preview\nvar TWK = { ${this.generateMockTwk()} };\n</script>\n<script>${js}</script>`);

    this.showPreview = true;
  }

  closePreview(): void {
    this.showPreview = false;
  }

  async export(): Promise<void> {
    await this.exportService.exportZip();
  }

  private generateMockTwk(): string {
    return `getUserFullName: function() { return Promise.resolve({ result: { full_name: 'Test User' }}); },
      getUserId: function() { return Promise.resolve({ result: { user_id: '1234567890' }}); },
      getUserMobileNumber: function() { return Promise.resolve({ result: { mobile_number: '0501234567' }}); },
      getUserNationality: function() { return Promise.resolve({ result: { nationality_name: 'Saudi Arabia' }}); },
      getUserLocation: function() { return Promise.resolve({ result: { latitude: 24.7136, longitude: 46.6753 }}); },
      getCameraPhoto: function() { return Promise.resolve({ result: '' }); },
      getGallerySingle: function() { return Promise.resolve({ result: '' }); },
      scanCode: function() { return Promise.resolve({ result: 'mock-qr-code' }); }`;
  }
}
```

```html
<!-- src/app/components/toolbar/toolbar.component.html -->

<div class="toolbar-container">
  <div class="toolbar-left">
    <span class="app-title">Mini Apps Builder</span>
  </div>
  <div class="toolbar-right">
    <button class="toolbar-btn preview-btn" (click)="preview()">Preview</button>
    <button class="toolbar-btn export-btn" (click)="export()">Export ZIP</button>
  </div>
</div>

@if (showPreview) {
  <app-preview-modal
    [html]="previewHtml"
    (close)="closePreview()"
  ></app-preview-modal>
}
```

```scss
// src/app/components/toolbar/toolbar.component.scss

.toolbar-container {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 100%;
  padding: 0 16px;
  background: #1a1a2e;
}

.app-title {
  font-size: 16px;
  font-weight: 700;
  color: #e94560;
}

.toolbar-right {
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  padding: 6px 16px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
}

.preview-btn {
  background: #0f3460;
  color: #eee;
}

.export-btn {
  background: #e94560;
  color: white;
}
```

**Step 3: Implement preview-modal**

```typescript
// src/app/components/preview-modal/preview-modal.component.ts

import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-preview-modal',
  standalone: true,
  templateUrl: './preview-modal.component.html',
  styleUrl: './preview-modal.component.scss'
})
export class PreviewModalComponent implements AfterViewInit {
  @Input({ required: true }) html!: string;
  @Output() close = new EventEmitter<void>();
  @ViewChild('previewFrame') previewFrame!: ElementRef<HTMLIFrameElement>;

  ngAfterViewInit(): void {
    const iframe = this.previewFrame.nativeElement;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(this.html);
      doc.close();
    }
  }
}
```

```html
<!-- src/app/components/preview-modal/preview-modal.component.html -->

<div class="modal-backdrop" (click)="close.emit()">
  <div class="modal-content" (click)="$event.stopPropagation()">
    <div class="modal-header">
      <span>Preview</span>
      <button class="close-btn" (click)="close.emit()">x</button>
    </div>
    <div class="phone-preview">
      <iframe #previewFrame class="preview-iframe"></iframe>
    </div>
  </div>
</div>
```

```scss
// src/app/components/preview-modal/preview-modal.component.scss

.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: #1a1a2e;
  border-radius: 12px;
  border: 1px solid #0f3460;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid #0f3460;
  color: #eee;
  font-size: 14px;
}

.close-btn {
  background: none;
  border: none;
  color: #888;
  font-size: 18px;
  cursor: pointer;
}

.phone-preview {
  padding: 16px;
  display: flex;
  justify-content: center;
}

.preview-iframe {
  width: 375px;
  height: 667px;
  border: 2px solid #0f3460;
  border-radius: 16px;
  background: #1a1a2e;
}
```

**Step 4: Verify build**

Run: `ng build`
Expected: BUILD SUCCESSFUL

**Step 5: Commit**

```bash
git add src/app/components/toolbar/ src/app/components/preview-modal/
git commit -m "feat: implement toolbar with preview modal and export button"
```

---

### Task 16: Integration Test - Full Workflow

**Step 1: Start the dev server**

Run: `ng serve`
Expected: Server running at http://localhost:4200

**Step 2: Manual testing checklist**

1. Open http://localhost:4200
2. Verify 3-panel layout renders (palette, canvas, properties)
3. Click "Text" in palette — element appears in canvas
4. Click the text element — properties panel shows Style/Data/Settings tabs
5. In Style tab: change font size to "20px", change color
6. In Settings tab: change content to "Hello World", set heading to H2
7. In Data tab: switch to Dynamic, select getUserFullName
8. Click "Button" in palette — button appears below text
9. Select button — in Data tab, select "Navigate to Page"
10. Click "+" on page tabs — Page 2 appears, canvas clears
11. Switch back to Page 1 — elements still there
12. Add a Dropdown — add options, assign TWK functions per option
13. Click "Preview" — modal shows phone-frame preview
14. Click "Export ZIP" — downloads miniapp.zip
15. Unzip — verify files are at root (index.html, page2.html, css/, js/)
16. Open index.html — verify structure matches builder layout

**Step 3: Fix any issues found during testing**

**Step 4: Commit any fixes**

```bash
git add -A
git commit -m "fix: integration test fixes"
```

---

### Task 17: Copy twkhelper.js to Angular Assets

**Step 1: Ensure twkhelper.js is in Angular's assets path**

The file already exists at `assets/js/twkhelper.js`. Verify `angular.json` has `"assets": ["src/assets"]` (default).

Copy the file:
Run: `cp assets/js/twkhelper.js src/assets/js/twkhelper.js` (create dir first: `mkdir -p src/assets/js`)

**Step 2: Verify the export service can load it**

Run: `ng serve`, click Export, verify twkhelper.js is in the ZIP.

**Step 3: Commit**

```bash
git add src/assets/js/twkhelper.js
git commit -m "feat: copy twkhelper.js to Angular assets for export bundling"
```
