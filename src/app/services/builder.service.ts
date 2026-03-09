import { Injectable, signal, computed } from '@angular/core';
import { BuilderElement, ElementType, ElementStyle, FieldMapping } from '../models/element.model';
import { Page } from '../models/page.model';

@Injectable({ providedIn: 'root' })
export class BuilderService {
  pages = signal<Page[]>([
    { id: this.generateId(), name: 'Page 1', elements: [] }
  ]);

  activePageId = signal<string>('');
  activeLang = signal<'en' | 'ar'>('en');
  appThemeMode = signal<'light' | 'dark' | 'auto'>('auto');
  selectedElementId = signal<string | null>(null);
  secretKey = signal<string>('MY_HMAC_SECRET_2025');
  debugMode = signal<boolean>(false);

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
      case 'date-picker':
        base.settings = { label: 'Select Date', dateFormat: 'yyyy-MM-dd', minDate: '', maxDate: '' };
        break;
      case 'media-select':
        base.settings = { label: 'Select Media', triggerText: 'Tap to add media' };
        base.options = [
          { label: 'Take Photo', value: 'take_photo' },
          { label: 'From Gallery', value: 'from_gallery' }
        ];
        break;
      case 'map':
        base.settings = { lat: '24.7136', lng: '46.6753', zoom: '13' };
        break;
      case 'divider':
        base.styles = { border: '1px solid #3f3f46' };
        break;
    }

    return base;
  }

  getAllMappableFields(): FieldMapping[] {
    const fields: FieldMapping[] = [];
    const toKey = (s: string) => (s || 'field').toLowerCase().replace(/\s+/g, '_');
    for (const page of this.pages()) {
      for (const el of page.elements) {
        const label = el.settings['label'] || el.staticContent || '';
        switch (el.type) {
          case 'input':
            fields.push({ elementId: el.id, elementLabel: label || 'Untitled', pageName: page.name, keyName: toKey(label), source: 'input' });
            break;
          case 'dropdown':
            if (el.dataSource !== 'dynamic') {
              fields.push({ elementId: el.id, elementLabel: label || 'Dropdown', pageName: page.name, keyName: toKey(label || 'dropdown'), source: 'dropdown' });
            }
            break;
          case 'radio':
            fields.push({ elementId: el.id, elementLabel: label || 'Radio', pageName: page.name, keyName: toKey(label || 'radio'), source: 'radio' });
            break;
          case 'checkbox':
            fields.push({ elementId: el.id, elementLabel: label || 'Checkbox', pageName: page.name, keyName: toKey(label || 'checkbox'), source: 'checkbox' });
            break;
          case 'date-picker':
            fields.push({ elementId: el.id, elementLabel: label || 'Date', pageName: page.name, keyName: toKey(label || 'date'), source: 'date-picker' });
            break;
          case 'media-select':
            fields.push({ elementId: el.id, elementLabel: label || 'Media', pageName: page.name, keyName: toKey(label || 'media'), source: 'media-select' });
            break;
          case 'map':
            fields.push({ elementId: el.id, elementLabel: 'Map Coordinates', pageName: page.name, keyName: 'coordinates', source: 'map' });
            break;
        }
        if (el.dataSource === 'dynamic' && el.dynamicBinding) {
          fields.push({
            elementId: el.id,
            elementLabel: `${el.dynamicBinding.functionName}()`,
            pageName: page.name,
            keyName: el.dynamicBinding.functionName.replace(/^get/, '').replace(/([A-Z])/g, '_$1').toLowerCase().replace(/^_/, ''),
            source: 'dynamic'
          });
        }
      }
    }
    return fields;
  }

  clipboard: BuilderElement | null = null;

  copyElement(elementId: string): void {
    const page = this.activePage();
    if (!page) return;
    const el = page.elements.find(e => e.id === elementId);
    if (el) this.clipboard = structuredClone(el);
  }

  pasteElement(): void {
    if (!this.clipboard) return;
    const clone = structuredClone(this.clipboard);
    clone.id = this.generateId();
    const pages = this.pages().map(p => {
      if (p.id === this.activePageId()) {
        return { ...p, elements: [...p.elements, clone] };
      }
      return p;
    });
    this.pages.set(pages);
    this.selectedElementId.set(clone.id);
  }

  private generateId(): string {
    return 'el-' + Math.random().toString(36).substring(2, 9);
  }
}
