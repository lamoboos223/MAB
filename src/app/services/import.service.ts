import { Injectable, inject } from '@angular/core';
import { BuilderService } from './builder.service';
import { BuilderElement, ElementType, ElementOption, TwkBinding, SubmitConfig, FieldMapping } from '../models/element.model';
import { Page } from '../models/page.model';
import JSZip from 'jszip';

@Injectable({ providedIn: 'root' })
export class ImportService {
  private builder = inject(BuilderService);

  async importZip(file: File): Promise<void> {
    const zip = await JSZip.loadAsync(file);

    const htmlFiles: { fileName: string; content: string }[] = [];
    for (const [name, entry] of Object.entries(zip.files)) {
      if (name.endsWith('.html') && !entry.dir) {
        htmlFiles.push({ fileName: name, content: await entry.async('string') });
      }
    }

    htmlFiles.sort((a, b) => {
      if (a.fileName === 'index.html') return -1;
      if (b.fileName === 'index.html') return 1;
      return a.fileName.localeCompare(b.fileName);
    });

    let jsContent = '';
    const jsFile = zip.file('js/app.js');
    if (jsFile) {
      jsContent = await jsFile.async('string');
    }

    let cssContent = '';
    const cssFile = zip.file('css/style.css');
    if (cssFile) {
      cssContent = await cssFile.async('string');
    }

    const pages: Page[] = [];
    const pageFileMap: Record<string, string> = {};

    for (const hf of htmlFiles) {
      const page = this.parseHtmlToPage(hf.content, hf.fileName);
      pages.push(page);
      pageFileMap[hf.fileName] = page.id;
    }

    this.parseJsBindings(jsContent, pages, pageFileMap, htmlFiles.map(h => h.fileName));
    this.parseCssStyles(cssContent, pages);

    this.builder.pages.set(pages);
    this.builder.activePageId.set(pages[0]?.id || '');
    this.builder.selectedElementId.set(null);
  }

  private parseHtmlToPage(html: string, fileName: string): Page {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const title = doc.querySelector('title')?.textContent || fileName.replace('.html', '');
    const page: Page = {
      id: this.generateId(),
      name: title,
      elements: []
    };

    const body = doc.body;
    if (!body) return page;

    const children = Array.from(body.children).filter(
      el => el.tagName !== 'SCRIPT' && el.tagName !== 'LINK'
    );

    const skip = new Set<Element>();
    for (let i = 0; i < children.length; i++) {
      const child = children[i] as HTMLElement;
      if (skip.has(child)) continue;

      // Positioned wrapper div: extract position and parse inner element
      if (child.tagName === 'DIV' && child.style.position === 'absolute') {
        const position = this.parsePosition(child);
        const innerChildren = Array.from(child.children).filter(
          el => el.tagName !== 'SCRIPT'
        ) as HTMLElement[];
        const parsed = this.parseChildren(innerChildren, page, skip);
        for (const el of parsed) {
          if (position) el.position = position;
          page.elements.push(el);
        }
        continue;
      }

      // Label + input/select pair
      if (child.tagName === 'LABEL' && child.classList.contains('el-label')) {
        const next = children[i + 1] as HTMLElement | undefined;
        if (next) {
          const nextTag = next.tagName.toLowerCase();
          if (nextTag === 'input' || nextTag === 'select' || nextTag === 'textarea') {
            skip.add(next);
            let element;
            if (nextTag === 'input' && (next as HTMLInputElement).type === 'date') {
              element = this.parseDatePicker(next, next.id || this.generateId());
            } else if (nextTag === 'textarea') {
              element = this.parseTextarea(next, next.id || this.generateId());
            } else if (nextTag === 'input') {
              element = this.parseInput(next, next.id || this.generateId());
            } else {
              element = this.parseSelect(next, next.id || this.generateId());
            }
            element.settings['label'] = child.textContent?.trim() || '';
            page.elements.push(element);
            continue;
          }
          if (next.classList.contains('custom-dropdown')) {
            skip.add(next);
            const element = this.parseCustomDropdown(next, next.id || this.generateId());
            element.settings['label'] = child.textContent?.trim() || '';
            page.elements.push(element);
            continue;
          }
          if (next.classList.contains('img-picker')) {
            skip.add(next);
            const element = this.parseMediaSelect(next, next.id || this.generateId());
            element.settings['label'] = child.textContent?.trim() || '';
            page.elements.push(element);
            continue;
          }
        }
        continue;
      }

      const element = this.parseElement(child);
      if (element) {
        page.elements.push(element);
      }
    }

    return page;
  }

  private parseElement(el: HTMLElement): BuilderElement | null {
    const tag = el.tagName.toLowerCase();
    const id = el.id || this.generateId();

    if (tag === 'hr') {
      return this.createBase(id, 'divider');
    }

    if (tag === 'button') {
      const element = this.createBase(id, 'button');
      const icon = this.parseIcon(el);
      if (icon) element.settings['icon'] = icon;
      // Remove icon element text from content
      const iEl = el.querySelector('i.pi');
      if (iEl) iEl.remove();
      element.staticContent = el.textContent?.trim() || 'Button';
      return element;
    }

    if (tag === 'img') {
      const element = this.createBase(id, 'image');
      element.staticContent = el.getAttribute('src') || '';
      element.settings = {
        alt: el.getAttribute('alt') || '',
        width: el.style.width || el.getAttribute('width') || '100%'
      };
      return element;
    }

    if (tag === 'select') {
      return this.parseSelect(el, id);
    }

    if (tag === 'button' && el.classList.contains('date-picker-trigger')) {
      return this.parseDatePicker(el, id);
    }

    // Legacy: input[type="date"]
    if (tag === 'input' && (el as HTMLInputElement).type === 'date') {
      return this.parseDatePicker(el, id);
    }

    if (tag === 'input') {
      return this.parseInput(el, id);
    }

    if (tag === 'textarea') {
      return this.parseTextarea(el, id);
    }

    if (tag === 'label' && el.classList.contains('el-label')) {
      // Labels are parsed together with their sibling input/select
      // They'll be handled when we find the input/select after them
      return null;
    }

    if (el.classList.contains('img-picker')) {
      return this.parseMediaSelect(el, id);
    }

    if (el.classList.contains('map-container')) {
      return this.parseMap(el, id);
    }

    if (el.classList.contains('radio-group')) {
      return this.parseRadioGroup(el, id);
    }

    if (el.classList.contains('checkbox-group')) {
      return this.parseCheckboxGroup(el, id);
    }

    if (el.classList.contains('custom-dropdown')) {
      return this.parseCustomDropdown(el, id);
    }


    // Text elements: p, h1-h6, span, div (without special classes)
    if (['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      const element = this.createBase(id, 'text');
      const icon = this.parseIcon(el);
      if (icon) element.settings['icon'] = icon;
      const iEl = el.querySelector('i.pi');
      if (iEl) iEl.remove();
      const content = el.textContent?.trim() || '';
      element.staticContent = content === 'Loading...' ? '' : content;
      element.dataSource = content === 'Loading...' ? 'dynamic' : 'static';
      element.settings = { ...element.settings, headingLevel: tag };
      return element;
    }

    // Check if this is a label + input/select pair at body level
    if (tag === 'label') {
      const next = el.nextElementSibling as HTMLElement | null;
      if (next) {
        const nextTag = next.tagName.toLowerCase();
        if (nextTag === 'input') {
          return null; // Will be parsed when we reach the input
        }
        if (nextTag === 'select') {
          return null; // Will be parsed when we reach the select
        }
      }
    }

    return null;
  }

  private parseCustomDropdown(el: HTMLElement, id: string): BuilderElement {
    const element = this.createBase(id, 'dropdown');
    const prev = el.previousElementSibling as HTMLElement | null;
    if (prev?.tagName === 'LABEL' && prev.classList.contains('el-label')) {
      element.settings = { label: prev.textContent?.trim() || '' };
    }
    const items = el.querySelectorAll('.custom-dropdown__item');
    element.options = Array.from(items).map(item => {
      const span = item.querySelector('span');
      const icon = this.parseIcon(item as HTMLElement);
      const opt: any = {
        label: span?.textContent?.trim() || '',
        value: (item as HTMLElement).getAttribute('data-value') || ''
      };
      if (icon) opt.icon = icon;
      return opt;
    });
    return element;
  }

  private parseDatePicker(el: HTMLElement, id: string): BuilderElement {
    const element = this.createBase(id, 'date-picker');
    const prev = el.previousElementSibling as HTMLElement | null;
    element.settings = {
      label: prev?.tagName === 'LABEL' && prev.classList.contains('el-label')
        ? prev.textContent?.trim() || ''
        : '',
      dateFormat: el.getAttribute('data-format') || 'yyyy-MM-dd',
      minDate: el.getAttribute('data-min') || el.getAttribute('min') || '',
      maxDate: el.getAttribute('data-max') || el.getAttribute('max') || ''
    };
    return element;
  }

  private parseSelect(el: HTMLElement, id: string): BuilderElement {
    const element = this.createBase(id, 'dropdown');
    const prev = el.previousElementSibling as HTMLElement | null;
    if (prev?.tagName === 'LABEL' && prev.classList.contains('el-label')) {
      element.settings = { label: prev.textContent?.trim() || '' };
    }
    element.options = Array.from(el.querySelectorAll('option')).map(opt => ({
      label: opt.textContent?.trim() || '',
      value: (opt as HTMLOptionElement).value || ''
    }));
    return element;
  }

  private parseInput(el: HTMLElement, id: string): BuilderElement {
    const inputEl = el as HTMLInputElement;
    const element = this.createBase(id, 'input');
    const prev = el.previousElementSibling as HTMLElement | null;
    element.settings = {
      inputType: inputEl.type || 'text',
      placeholder: inputEl.placeholder || '',
      label: prev?.tagName === 'LABEL' && prev.classList.contains('el-label')
        ? prev.textContent?.trim().replace(/\s*\*$/, '') || ''
        : ''
    };
    if (inputEl.hasAttribute('required')) {
      element.settings['required'] = 'true';
    }
    const pattern = inputEl.getAttribute('data-pattern');
    if (pattern) {
      element.settings['regexPattern'] = pattern;
      element.settings['regexError'] = inputEl.getAttribute('data-pattern-error') || 'Invalid format';
    }
    return element;
  }

  private parseTextarea(el: HTMLElement, id: string): BuilderElement {
    const element = this.createBase(id, 'input');
    const textareaEl = el as HTMLTextAreaElement;
    const prev = el.previousElementSibling as HTMLElement | null;
    const h = el.style.height;
    element.settings = {
      inputType: 'text',
      placeholder: textareaEl.placeholder || '',
      label: prev?.tagName === 'LABEL' && prev.classList.contains('el-label')
        ? prev.textContent?.trim().replace(/\s*\*$/, '') || ''
        : '',
      inputHeight: h ? String(parseInt(h, 10)) : '80'
    };
    if (textareaEl.hasAttribute('required')) {
      element.settings['required'] = 'true';
    }
    const pattern = textareaEl.getAttribute('data-pattern');
    if (pattern) {
      element.settings['regexPattern'] = pattern;
      element.settings['regexError'] = textareaEl.getAttribute('data-pattern-error') || 'Invalid format';
    }
    return element;
  }

  private parseMediaSelect(el: HTMLElement, id: string): BuilderElement {
    const element = this.createBase(id, 'media-select');
    const prev = el.previousElementSibling as HTMLElement | null;
    const triggerText = el.querySelector('.img-picker__text')?.textContent?.trim() || 'Tap to add media';
    element.settings = {
      label: prev?.tagName === 'LABEL' && prev.classList.contains('el-label')
        ? prev.textContent?.trim() || ''
        : 'Select Media',
      triggerText
    };
    const optBtns = el.querySelectorAll('.img-picker__option');
    element.options = Array.from(optBtns).map((btn: any) => {
      const icon = this.parseIcon(btn);
      const iEl = btn.querySelector('i.pi');
      if (iEl) iEl.remove();
      const opt: any = {
        label: btn.textContent?.trim() || '',
        value: btn.getAttribute('data-value') || ''
      };
      if (icon) opt.icon = icon;
      const fnName = btn.getAttribute('data-fn');
      if (fnName) {
        opt.action = { functionName: fnName, params: {}, resultPath: '' };
      }
      return opt;
    });
    return element;
  }

  private parseRadioGroup(el: HTMLElement, id: string): BuilderElement {
    const element = this.createBase(id, 'radio');
    const labelEl = el.querySelector('label.el-label');
    element.settings = { label: labelEl?.textContent?.trim() || '' };

    const radios = el.querySelectorAll('input[type="radio"]');
    const groupName = (radios[0] as HTMLInputElement)?.name || id;
    element.settings['groupName'] = groupName;

    element.options = Array.from(radios).map(radio => {
      const r = radio as HTMLInputElement;
      const parent = r.closest('label');
      const icon = parent ? this.parseIcon(parent as HTMLElement) : '';
      const iEl = parent?.querySelector('i.pi');
      if (iEl) iEl.remove();
      const text = parent?.textContent?.trim() || '';
      const opt: any = { label: text, value: r.value || '' };
      if (icon) opt.icon = icon;
      return opt;
    });
    return element;
  }

  private parseCheckboxGroup(el: HTMLElement, id: string): BuilderElement {
    const element = this.createBase(id, 'checkbox');
    const labelEl = el.querySelector('label.el-label');
    element.settings = { label: labelEl?.textContent?.trim() || '' };

    const checkboxes = el.querySelectorAll('input[type="checkbox"]');
    element.options = Array.from(checkboxes).map(cb => {
      const c = cb as HTMLInputElement;
      const parent = c.closest('label');
      const icon = parent ? this.parseIcon(parent as HTMLElement) : '';
      const iEl = parent?.querySelector('i.pi');
      if (iEl) iEl.remove();
      const text = parent?.textContent?.trim() || '';
      const opt: any = { label: text, value: c.value || '' };
      if (icon) opt.icon = icon;
      return opt;
    });
    return element;
  }

  private parseMap(el: HTMLElement, id: string): BuilderElement {
    const element = this.createBase(id, 'map');
    const iframe = el.querySelector('iframe');
    if (iframe) {
      const src = iframe.getAttribute('src') || '';
      const qMatch = src.match(/q=([-\d.]+),([-\d.]+)/);
      const zMatch = src.match(/z=(\d+)/);
      element.settings = {
        lat: qMatch?.[1] || '24.7136',
        lng: qMatch?.[2] || '46.6753',
        zoom: zMatch?.[1] || '13'
      };
    }
    return element;
  }

  private parseJsBindings(
    js: string,
    pages: Page[],
    pageFileMap: Record<string, string>,
    fileNames: string[]
  ): void {
    // Parse dynamic bindings: TWK.functionName(params).then(function(data) {
    //   document.getElementById('el-id').textContent = data.result.path;
    const dynamicPattern = /TWK\.(\w+)\(([^)]*)\)\.then\(function\(data\)\s*\{\s*(?:var \w+ = )?document\.getElementById\('([^']+)'\)(?:\.\w+)?\s*=\s*data\.([\w.]+)/g;
    let match;
    while ((match = dynamicPattern.exec(js)) !== null) {
      const [, funcName, paramsStr, elId, resultPath] = match;
      const binding = this.parseBinding(funcName, paramsStr, resultPath);
      this.applyToElement(pages, elId, { dataSource: 'dynamic', dynamicBinding: binding });
    }

    // Parse button click -> navigate: window.location.href = 'pageN.html'
    const navPattern = /getElementById\('([^']+)'\)\.addEventListener\('click',\s*function\(\)\s*\{\s*window\.location\.href\s*=\s*'([^']+)'/g;
    while ((match = navPattern.exec(js)) !== null) {
      const [, elId, targetFile] = match;
      const targetPageId = pageFileMap[targetFile];
      if (targetPageId) {
        this.applyToElement(pages, elId, { pageNavigateTo: targetPageId });
      }
    }

    // Parse button click -> TWK function
    const btnTwkPattern = /getElementById\('([^']+)'\)\.addEventListener\('click',\s*function\(\)\s*\{\s*TWK\.(\w+)\(([^)]*)\)/g;
    while ((match = btnTwkPattern.exec(js)) !== null) {
      const [, elId, funcName, paramsStr] = match;
      // Skip if already has navigation
      const el = this.findElement(pages, elId);
      if (el && !el.pageNavigateTo) {
        const binding = this.parseBinding(funcName, paramsStr, '');
        this.applyToElement(pages, elId, { dynamicBinding: binding });
      }
    }

    // Parse submit buttons: async click -> hashRequest -> fetch
    const submitPattern = /getElementById\('([^']+)'\)\.addEventListener\('click',\s*async function\(\)\s*\{[\s\S]*?fetch\('([^']+)'[\s\S]*?\n\s*\}\);/g;
    while ((match = submitPattern.exec(js)) !== null) {
      const [fullMatch, elId, apiUrl] = match;
      // Extract field mappings from bodyObj assignments
      const mappings: FieldMapping[] = [];
      const inputFieldPattern = /getElementById\('([^']+)'\)[\s\S]*?bodyObj\['([^']+)'\]\s*=\s*f_/g;
      let fMatch: RegExpExecArray | null;
      while ((fMatch = inputFieldPattern.exec(fullMatch)) !== null) {
        const elId = fMatch[1];
        const keyName = fMatch[2];
        const srcEl = this.findElement(pages, elId);
        const srcPage = pages.find(p => p.elements.some(e => e.id === elId));
        mappings.push({
          elementId: elId,
          elementLabel: srcEl?.settings['label'] || elId,
          pageName: srcPage?.name || '',
          keyName,
          source: 'input'
        });
      }
      // Extract success page
      const successMatch = fullMatch.match(/window\.location\.href\s*=\s*'([^']+)'/);
      const successFile = successMatch?.[1] || '';
      const successPageId = pageFileMap[successFile] || '';
      // Extract error message
      const errorMatch = fullMatch.match(/showToast\(["']([^"']+)["']\)/);
      const errorMessage = errorMatch?.[1] || 'Submission failed. Please try again.';

      this.applyToElement(pages, elId, {
        submitConfig: { apiUrl, method: 'POST', fieldMappings: mappings, payloadTemplate: '', headers: [], successPage: successPageId, errorMessage }
      });
    }

    // Parse secret key
    const secretMatch = js.match(/var SECRET_KEY = '([^']*)'/);
    if (secretMatch?.[1]) {
      this.builder.secretKey.set(secretMatch[1]);
    }

    // Parse dropdown per-option actions
    const optionActionsPattern = /getElementById\('([^']+)'\)\.addEventListener\('change',[\s\S]*?var actions = \{([\s\S]*?)\};/g;
    while ((match = optionActionsPattern.exec(js)) !== null) {
      const [, elId, actionsBlock] = match;
      const optActionPattern = /'([^']+)':\s*function\(\)\s*\{\s*return TWK\.(\w+)\(([^)]*)\)/g;
      let optMatch;
      const el = this.findElement(pages, elId);
      if (el) {
        while ((optMatch = optActionPattern.exec(actionsBlock)) !== null) {
          const [, optValue, funcName, paramsStr] = optMatch;
          const opt = el.options.find(o => o.value === optValue);
          if (opt) {
            opt.action = this.parseBinding(funcName, paramsStr, '');
          }
        }
      }
    }
  }

  private parseCssStyles(css: string, pages: Page[]): void {
    const rulePattern = /#(el-[a-z0-9]+)\s*\{([^}]+)\}/g;
    let match;
    while ((match = rulePattern.exec(css)) !== null) {
      const [, elId, rulesStr] = match;
      const styles = this.parseCssProperties(rulesStr);
      if (Object.keys(styles).length > 0) {
        this.applyToElement(pages, elId, { styles });
      }
    }
  }

  private parseCssProperties(rulesStr: string): Record<string, string> {
    const cssToJs: Record<string, string> = {
      'font-size': 'fontSize',
      'font-weight': 'fontWeight',
      'color': 'color',
      'background-color': 'backgroundColor',
      'text-align': 'textAlign',
      'padding': 'padding',
      'margin': 'margin',
      'border-radius': 'borderRadius',
      'border': 'border',
      'width': 'width',
      'height': 'height'
    };

    const vwProps = new Set(['width', 'height', 'fontSize', 'padding', 'margin', 'borderRadius']);
    const styles: Record<string, string> = {};
    const parts = rulesStr.split(';').map(s => s.trim()).filter(Boolean);
    for (const part of parts) {
      const colonIdx = part.indexOf(':');
      if (colonIdx === -1) continue;
      const prop = part.substring(0, colonIdx).trim();
      let val = part.substring(colonIdx + 1).trim();
      const jsKey = cssToJs[prop];
      if (jsKey && val) {
        if (vwProps.has(jsKey)) val = this.vwToPx(val);
        styles[jsKey] = val;
      }
    }
    return styles;
  }

  private parseBinding(funcName: string, paramsStr: string, resultPath: string): TwkBinding {
    const params: Record<string, string> = {};
    const paramMatches = paramsStr.match(/'([^']*)'/g);
    if (paramMatches) {
      paramMatches.forEach((p, i) => {
        params[`param${i}`] = p.replace(/'/g, '');
      });
    }
    return { functionName: funcName, params, resultPath };
  }

  private findElement(pages: Page[], elId: string): BuilderElement | undefined {
    for (const page of pages) {
      const el = page.elements.find(e => e.id === elId);
      if (el) return el;
    }
    return undefined;
  }

  private applyToElement(pages: Page[], elId: string, updates: Partial<BuilderElement>): void {
    for (const page of pages) {
      const el = page.elements.find(e => e.id === elId);
      if (el) {
        Object.assign(el, updates);
        return;
      }
    }
  }

  private parseIcon(el: HTMLElement): string {
    const i = el.querySelector('i.pi');
    if (!i) return '';
    const cls = Array.from(i.classList).find(c => c.startsWith('pi-') && c !== 'pi');
    return cls ? cls.replace('pi-', '') : '';
  }

  private static readonly CANVAS_WIDTH = 375;

  private parsePosition(wrapper: HTMLElement): { x: number; y: number } | undefined {
    const left = wrapper.style.left;
    const top = wrapper.style.top;
    if (!left && !top) return undefined;
    return {
      x: this.cssValueToPx(left),
      y: this.cssValueToPx(top)
    };
  }

  private cssValueToPx(val: string): number {
    if (!val) return 0;
    const vwMatch = val.match(/^([\d.]+)vw$/);
    if (vwMatch) return Math.round(parseFloat(vwMatch[1]) / 100 * ImportService.CANVAS_WIDTH);
    return parseInt(val, 10) || 0;
  }

  private vwToPx(val: string): string {
    const vwMatch = val.match(/^([\d.]+)vw$/);
    if (vwMatch) return Math.round(parseFloat(vwMatch[1]) / 100 * ImportService.CANVAS_WIDTH) + 'px';
    return val;
  }

  private parseChildren(children: HTMLElement[], page: Page, skip: Set<Element>): BuilderElement[] {
    const elements: BuilderElement[] = [];
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (skip.has(child)) continue;

      if (child.tagName === 'LABEL' && child.classList.contains('el-label')) {
        const next = children[i + 1] as HTMLElement | undefined;
        if (next) {
          const nextTag = next.tagName.toLowerCase();
          if (nextTag === 'input' || nextTag === 'select' || nextTag === 'textarea') {
            skip.add(next);
            let element;
            if (nextTag === 'input' && (next as HTMLInputElement).type === 'date') {
              element = this.parseDatePicker(next, next.id || this.generateId());
            } else if (nextTag === 'textarea') {
              element = this.parseTextarea(next, next.id || this.generateId());
            } else if (nextTag === 'input') {
              element = this.parseInput(next, next.id || this.generateId());
            } else {
              element = this.parseSelect(next, next.id || this.generateId());
            }
            element.settings['label'] = child.textContent?.trim() || '';
            elements.push(element);
            continue;
          }
          if (next.classList.contains('custom-dropdown')) {
            skip.add(next);
            const element = this.parseCustomDropdown(next, next.id || this.generateId());
            element.settings['label'] = child.textContent?.trim() || '';
            elements.push(element);
            continue;
          }
          if (next.classList.contains('img-picker')) {
            skip.add(next);
            const element = this.parseMediaSelect(next, next.id || this.generateId());
            element.settings['label'] = child.textContent?.trim() || '';
            elements.push(element);
            continue;
          }
        }
        continue;
      }

      const element = this.parseElement(child);
      if (element) elements.push(element);
    }
    return elements;
  }

  private createBase(id: string, type: ElementType): BuilderElement {
    return {
      id,
      type,
      label: type.charAt(0).toUpperCase() + type.slice(1),
      styles: {},
      dataSource: 'static',
      staticContent: '',
      options: [],
      settings: {}
    };
  }

  private generateId(): string {
    return 'el-' + Math.random().toString(36).substring(2, 9);
  }
}
