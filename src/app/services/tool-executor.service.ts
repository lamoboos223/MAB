import { Injectable, inject } from '@angular/core';
import { BuilderService } from './builder.service';
import { ElementType } from '../models/element.model';
import { TWK_FUNCTIONS } from '../data/twk-registry';

export interface ToolCall {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResult {
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

const VALID_ELEMENT_TYPES: ElementType[] = [
  'text', 'button', 'image', 'input', 'dropdown', 'radio',
  'checkbox', 'map', 'date-picker', 'media-select', 'divider',
  'alert', 'table', 'container'
];

@Injectable({ providedIn: 'root' })
export class ToolExecutorService {
  private builder = inject(BuilderService);

  execute(toolCall: ToolCall): ToolResult {
    try {
      const result = this.dispatch(toolCall.name, toolCall.input);
      return { tool_use_id: toolCall.id, content: result };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { tool_use_id: toolCall.id, content: `Error: ${msg}`, is_error: true };
    }
  }

  private dispatch(name: string, input: Record<string, unknown>): string {
    switch (name) {
      case 'getCanvasState':
        return this.getCanvasState();
      case 'addPage':
        return this.addPage(input['name'] as string | undefined);
      case 'renamePage':
        return this.renamePage(input['pageId'] as string, input['name'] as string);
      case 'switchPage':
        return this.switchPage(input['pageId'] as string);
      case 'deletePage':
        return this.deletePage(input['pageId'] as string);
      case 'addElement':
        return this.addElement(input);
      case 'deleteElement':
        return this.deleteElement(input['elementId'] as string);
      case 'selectElement':
        return this.selectElement(input['elementId'] as string);
      case 'updateElementStyles':
        return this.updateElementStyles(input['elementId'] as string, input['styles'] as Record<string, string>);
      case 'updateDarkStyles':
        return this.updateDarkStyles(input['elementId'] as string, input['styles'] as Record<string, string>);
      case 'updateElementSettings':
        return this.updateElementSettings(input['elementId'] as string, input['settings'] as Record<string, string>);
      case 'updateElementOptions':
        return this.updateElementOptions(input['elementId'] as string, input['options'] as Array<{ label: string; value: string }>);
      case 'updateTableData':
        return this.updateTableData(input['elementId'] as string, input['data'] as string[][]);
      case 'setStaticContent':
        return this.setStaticContent(input['elementId'] as string, input['content'] as string);
      case 'setDynamicBinding':
        return this.setDynamicBinding(input['elementId'] as string, input['functionName'] as string, input['params'] as Record<string, string> | undefined);
      case 'moveElement':
        return this.moveElement(input['elementId'] as string, input['x'] as number, input['y'] as number);
      case 'resizeElement':
        return this.resizeElement(input['elementId'] as string, input['width'] as number, input['height'] as number);
      case 'setButtonAction':
        return this.setButtonAction(input['elementId'] as string, input['action'] as string);
      case 'setPageNavigateTo':
        return this.setPageNavigateTo(input['elementId'] as string, input['pageId'] as string);
      case 'configureSubmitAction':
        return this.configureSubmitAction(input);
      case 'setVisibilityCondition':
        return this.setVisibilityCondition(input);
      case 'removeVisibilityCondition':
        return this.removeVisibilityCondition(input['elementId'] as string);
      case 'updateI18n':
        return this.updateI18n(input);
      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  }

  private getCanvasState(): string {
    const pages = this.builder.pages();
    const summary = pages.map(p => ({
      id: p.id,
      name: p.name,
      isActive: p.id === this.builder.activePageId(),
      elements: p.elements.map(e => {
        const el: Record<string, unknown> = {
          id: e.id,
          type: e.type,
          label: e.label,
          position: e.position,
          styles: e.styles,
          settings: e.settings,
          dataSource: e.dataSource,
        };
        if (e.staticContent) el['staticContent'] = e.staticContent.substring(0, 200);
        if (e.dynamicBinding) el['dynamicBinding'] = e.dynamicBinding;
        if (e.darkStyles && Object.keys(e.darkStyles).length) el['darkStyles'] = e.darkStyles;
        if (e.options?.length) el['options'] = e.options;
        if (e.pageNavigateTo) el['pageNavigateTo'] = e.pageNavigateTo;
        if (e.submitConfig) el['submitConfig'] = { apiUrl: e.submitConfig.apiUrl, method: e.submitConfig.method };
        const conds = e.visibilityConditions?.length ? e.visibilityConditions : e.visibilityCondition ? [e.visibilityCondition] : [];
        if (conds.length) el['visibilityConditions'] = conds;
        if (e.tableData?.length) el['tableRows'] = e.tableData.length;
        if (e.i18nEnabled) el['i18nEnabled'] = true;
        if (e.i18n) el['i18n'] = e.i18n;
        return el;
      })
    }));
    return JSON.stringify(summary, null, 2);
  }

  private addPage(name?: string): string {
    this.builder.addPage();
    const newPageId = this.builder.activePageId();
    if (name) {
      const pages = this.builder.pages().map(p =>
        p.id === newPageId ? { ...p, name } : p
      );
      this.builder.pages.set(pages);
    }
    const page = this.builder.pages().find(p => p.id === newPageId);
    return JSON.stringify({ id: newPageId, name: page?.name });
  }

  private renamePage(pageId: string, name: string): string {
    const pages = this.builder.pages().map(p =>
      p.id === pageId ? { ...p, name } : p
    );
    this.builder.pages.set(pages);
    return `Page renamed to "${name}"`;
  }

  private switchPage(pageId: string): string {
    this.builder.setActivePage(pageId);
    return `Switched to page ${pageId}`;
  }

  private deletePage(pageId: string): string {
    this.builder.removePage(pageId);
    return `Page ${pageId} deleted`;
  }

  private addElement(input: Record<string, unknown>): string {
    const type = input['type'] as string;
    if (!VALID_ELEMENT_TYPES.includes(type as ElementType)) {
      throw new Error(`Invalid element type: ${type}. Valid types: ${VALID_ELEMENT_TYPES.join(', ')}`);
    }
    this.builder.addElement(type as ElementType);
    const elementId = this.builder.selectedElementId()!;

    const updates: Record<string, unknown> = {};
    if (input['label']) updates['label'] = input['label'];
    if (input['x'] !== undefined && input['y'] !== undefined) {
      updates['position'] = { x: input['x'], y: input['y'] };
    }
    // Merge explicit styles object with width/height shorthand
    const baseStyles = this.findElement(elementId)?.styles || {};
    const incomingStyles = (input['styles'] as Record<string, string>) || {};
    const styles: Record<string, string> = { ...incomingStyles };
    if (input['width']) styles['width'] = String(input['width']) + (String(input['width']).includes('%') || String(input['width']).includes('px') ? '' : 'px');
    if (input['height']) styles['height'] = String(input['height']) + (String(input['height']).includes('%') || String(input['height']).includes('px') ? '' : 'px');
    if (Object.keys(styles).length) updates['styles'] = { ...baseStyles, ...styles };

    // Settings, staticContent, options
    if (input['settings']) {
      const el = this.findElement(elementId);
      updates['settings'] = { ...el?.settings, ...(input['settings'] as Record<string, string>) };
    }
    if (input['staticContent']) {
      updates['staticContent'] = input['staticContent'];
      updates['dataSource'] = 'static';
    }
    if (input['options']) {
      updates['options'] = input['options'];
    }

    if (Object.keys(updates).length) {
      this.builder.updateElement(elementId, updates);
    }

    return JSON.stringify({ id: elementId, type });
  }

  private deleteElement(elementId: string): string {
    this.builder.removeElement(elementId);
    return `Element ${elementId} deleted`;
  }

  private selectElement(elementId: string): string {
    this.builder.selectElement(elementId);
    return `Element ${elementId} selected`;
  }

  private updateElementStyles(elementId: string, styles: Record<string, string>): string {
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    this.builder.updateElement(elementId, { styles: { ...el.styles, ...styles } });
    return `Styles updated on ${elementId}`;
  }

  private updateDarkStyles(elementId: string, styles: Record<string, string>): string {
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    this.builder.updateElement(elementId, { darkStyles: { ...el.darkStyles, ...styles } });
    return `Dark styles updated on ${elementId}`;
  }

  private updateElementSettings(elementId: string, settings: Record<string, string>): string {
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    this.builder.updateElement(elementId, { settings: { ...el.settings, ...settings } });
    return `Settings updated on ${elementId}`;
  }

  private updateElementOptions(elementId: string, options: Array<{ label: string; value: string }>): string {
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    this.builder.updateElement(elementId, { options });
    return `Options updated on ${elementId} (${options.length} options)`;
  }

  private updateTableData(elementId: string, data: string[][]): string {
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    this.builder.updateElement(elementId, { tableData: data });
    return `Table data updated on ${elementId}`;
  }

  private setStaticContent(elementId: string, content: string): string {
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    this.builder.updateElement(elementId, { staticContent: content, dataSource: 'static' });
    return `Static content set on ${elementId}`;
  }

  private setDynamicBinding(elementId: string, functionName: string, params?: Record<string, string>): string {
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);

    const twkFunc = TWK_FUNCTIONS.find(f => f.name === functionName);
    const resultPath = twkFunc?.returns?.path || 'result';

    this.builder.updateElement(elementId, {
      dataSource: 'dynamic',
      dynamicBinding: {
        functionName,
        params: params || {},
        resultPath,
      }
    });
    return `Dynamic binding set on ${elementId}: ${functionName}()`;
  }

  private moveElement(elementId: string, x: number, y: number): string {
    this.builder.updateElementPosition(elementId, x, y);
    return `Element ${elementId} moved to (${x}, ${y})`;
  }

  private resizeElement(elementId: string, width: number, height: number): string {
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    const w = String(width) + (String(width).includes('%') || String(width).includes('px') ? '' : 'px');
    const h = String(height) + (String(height).includes('%') || String(height).includes('px') ? '' : 'px');
    this.builder.updateElement(elementId, { styles: { ...el.styles, width: w, height: h } });
    return `Element ${elementId} resized to ${w} x ${h}`;
  }

  private setButtonAction(elementId: string, action: string): string {
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    if (el.type !== 'button') throw new Error(`Element ${elementId} is not a button`);

    if (action === '__navigate__') {
      this.builder.updateElement(elementId, {
        dynamicBinding: undefined,
        pageNavigateTo: '',
        submitConfig: undefined,
      });
      return `Button ${elementId} set to navigate mode. Use setPageNavigateTo to set the target page.`;
    }

    if (action === '__submit__') {
      const fields = this.builder.getAllMappableFields();
      const payloadObj: Record<string, string> = {};
      for (const f of fields) {
        payloadObj[f.keyName || f.elementLabel] = `{{${f.keyName || f.elementLabel}}}`;
      }
      this.builder.updateElement(elementId, {
        dynamicBinding: undefined,
        pageNavigateTo: undefined,
        submitConfig: {
          apiUrl: '',
          method: 'POST',
          fieldMappings: fields.map(f => ({ ...f })),
          payloadTemplate: JSON.stringify(payloadObj, null, 2),
          headers: [],
          successPage: '',
          errorMessage: 'Submission failed. Please try again.',
        },
      });
      return `Button ${elementId} set to submit mode (POST). Use configureSubmitAction to set apiUrl, method, headers, etc. Current fields: ${fields.map(f => f.keyName).join(', ') || 'none'}`;
    }

    // TWK function action
    const twkFunc = TWK_FUNCTIONS.find(f => f.name === action);
    if (!twkFunc) throw new Error(`Unknown action: ${action}. Use "__navigate__", "__submit__", or a valid TWK function name.`);

    this.builder.updateElement(elementId, {
      dynamicBinding: { functionName: twkFunc.name, params: {}, resultPath: twkFunc.returns.path },
      pageNavigateTo: undefined,
      submitConfig: undefined,
    });
    return `Button ${elementId} set to call ${twkFunc.name}()`;
  }

  private setPageNavigateTo(elementId: string, pageId: string): string {
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    this.builder.updateElement(elementId, { pageNavigateTo: pageId });
    return `Button ${elementId} will navigate to page ${pageId}`;
  }

  private configureSubmitAction(input: Record<string, unknown>): string {
    const elementId = input['elementId'] as string;
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    if (!el.submitConfig) throw new Error(`Element ${elementId} does not have submit action. Call setButtonAction with "__submit__" first.`);

    const updates: Record<string, unknown> = { ...el.submitConfig };
    if (input['apiUrl'] !== undefined) updates['apiUrl'] = input['apiUrl'];
    if (input['method'] !== undefined) updates['method'] = input['method'];
    if (input['successPage'] !== undefined) updates['successPage'] = input['successPage'];
    if (input['errorMessage'] !== undefined) updates['errorMessage'] = input['errorMessage'];
    if (input['payloadTemplate'] !== undefined) updates['payloadTemplate'] = input['payloadTemplate'];
    if (input['headers'] !== undefined) updates['headers'] = input['headers'];

    this.builder.updateElement(elementId, { submitConfig: updates as any });
    return `Submit config updated on ${elementId}: ${updates['method']} ${updates['apiUrl']}`;
  }

  private setVisibilityCondition(input: Record<string, unknown>): string {
    const elementId = input['elementId'] as string;
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);

    const source = input['source'] as 'element' | 'function' | 'geofence';
    const operator = (input['operator'] as string) || 'equals';
    const behavior = (input['behavior'] as string) || (source === 'geofence' ? 'enable_disable' : 'show_hide');

    const condition: any = { source, operator, behavior };

    if (source === 'element') {
      condition.elementId = input['conditionElementId'] || '';
      condition.value = input['value'] || '';
    } else if (source === 'function') {
      const functionName = input['functionName'] as string;
      const twkFunc = TWK_FUNCTIONS.find(f => f.name === functionName);
      condition.functionBinding = {
        functionName: functionName || '',
        params: input['functionParams'] || {},
        resultPath: twkFunc?.returns?.path || 'result',
      };
      condition.value = input['value'] || '';
    } else if (source === 'geofence') {
      condition.geofenceLat = input['geofenceLat'] || '24.7136';
      condition.geofenceLng = input['geofenceLng'] || '46.6753';
      condition.geofenceRadius = input['geofenceRadius'] || '500';
    }

    // Append to existing conditions (or replace if replace=true)
    const replace = input['replace'] === true;
    const existing = el.visibilityConditions?.length ? [...el.visibilityConditions] : el.visibilityCondition ? [el.visibilityCondition] : [];
    const conditions = replace ? [condition] : [...existing, condition];

    this.builder.updateElement(elementId, { visibilityConditions: conditions, visibilityCondition: undefined } as any);
    return `Visibility condition added on ${elementId}: ${source} ${operator} (${behavior}). Total conditions: ${conditions.length}`;
  }

  private removeVisibilityCondition(elementId: string): string {
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);
    this.builder.updateElement(elementId, { visibilityConditions: undefined, visibilityCondition: undefined } as any);
    return `All visibility conditions removed from ${elementId}`;
  }

  private updateI18n(input: Record<string, unknown>): string {
    const elementId = input['elementId'] as string;
    const el = this.findElement(elementId);
    if (!el) throw new Error(`Element ${elementId} not found`);

    const enabled = input['enabled'] as boolean;
    if (!enabled) {
      this.builder.updateElement(elementId, { i18nEnabled: false, i18n: undefined } as any);
      return `Multi-language disabled on ${elementId}`;
    }

    const ar: Record<string, unknown> = el.i18n?.ar ? { ...el.i18n.ar } : {};
    if (input['arStaticContent'] !== undefined) ar['staticContent'] = input['arStaticContent'];
    if (input['arLabel'] !== undefined || input['arPlaceholder'] !== undefined) {
      const settings: Record<string, string> = { ...(ar['settings'] as Record<string, string> || {}) };
      if (input['arLabel'] !== undefined) settings['label'] = input['arLabel'] as string;
      if (input['arPlaceholder'] !== undefined) settings['placeholder'] = input['arPlaceholder'] as string;
      ar['settings'] = settings;
    }
    if (input['arOptions'] !== undefined) ar['options'] = input['arOptions'];

    this.builder.updateElement(elementId, { i18nEnabled: true, i18n: { ar } } as any);
    return `Multi-language enabled on ${elementId} with Arabic translations`;
  }

  private findElement(elementId: string) {
    for (const page of this.builder.pages()) {
      const el = page.elements.find(e => e.id === elementId);
      if (el) return el;
    }
    return null;
  }
}
