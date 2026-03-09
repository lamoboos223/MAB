import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../../../services/builder.service';
import { TwkFunctionsService } from '../../../services/twk-functions.service';
import { TwkBinding, ElementOption, SubmitConfig, FieldMapping, SubmitHeader } from '../../../models/element.model';
import { FunctionPicker } from '../../function-picker/function-picker';

@Component({
  selector: 'app-data-tab',
  standalone: true,
  imports: [FormsModule, FunctionPicker],
  templateUrl: './data-tab.html',
  styleUrl: './data-tab.scss'
})
export class DataTab {
  builder = inject(BuilderService);
  twkService = inject(TwkFunctionsService);
  categories = this.twkService.getCategories();

  get element() { return this.builder.selectedElement(); }
  get supportsDataSource(): boolean { return ['text', 'image', 'dropdown', 'radio', 'checkbox', 'map'].includes(this.element?.type ?? ''); }
  get supportsItemActions(): boolean { return ['dropdown', 'radio', 'checkbox', 'media-select'].includes(this.element?.type ?? ''); }
  get supportsButtonAction(): boolean { return this.element?.type === 'button'; }

  getFunctionsForCategory(category: string) { return this.twkService.getByCategory(category); }

  setDataSource(source: 'static' | 'dynamic'): void {
    const el = this.element; if (!el) return;
    this.builder.updateElement(el.id, { dataSource: source });
  }

  setDynamicFunction(functionName: string): void {
    const el = this.element; if (!el) return;
    const fn = this.twkService.getByName(functionName);
    if (!fn) return;
    this.builder.updateElement(el.id, { dynamicBinding: { functionName: fn.name, params: {}, resultPath: fn.returns.path } });
  }

  setFunctionParam(paramName: string, value: string): void {
    const el = this.element; if (!el || !el.dynamicBinding) return;
    const params = { ...el.dynamicBinding.params, [paramName]: value };
    this.builder.updateElement(el.id, { dynamicBinding: { ...el.dynamicBinding, params } });
  }

  get isSubmitMode(): boolean {
    return this.element?.submitConfig !== undefined;
  }

  get availableFields(): FieldMapping[] {
    return this.builder.getAllMappableFields();
  }

  setButtonAction(functionName: string): void {
    const el = this.element; if (!el) return;
    if (functionName === '__navigate__') {
      this.builder.updateElement(el.id, { dynamicBinding: undefined, pageNavigateTo: '', submitConfig: undefined });
      return;
    }
    if (functionName === '__submit__') {
      const fields = this.builder.getAllMappableFields();
      this.builder.updateElement(el.id, {
        dynamicBinding: undefined,
        pageNavigateTo: undefined,
        submitConfig: {
          apiUrl: '',
          method: 'POST',
          fieldMappings: fields.map(f => ({ ...f })),
          payloadTemplate: this.generateDefaultPayloadTemplate(fields),
          headers: [],
          successPage: '',
          errorMessage: 'Submission failed. Please try again.'
        }
      });
      return;
    }
    const fn = this.twkService.getByName(functionName);
    if (!fn) return;
    this.builder.updateElement(el.id, { dynamicBinding: { functionName: fn.name, params: {}, resultPath: fn.returns.path }, pageNavigateTo: undefined, submitConfig: undefined });
  }

  updateApiUrl(url: string): void {
    const el = this.element; if (!el?.submitConfig) return;
    this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, apiUrl: url } });
  }

  updateSuccessPage(pageId: string): void {
    const el = this.element; if (!el?.submitConfig) return;
    this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, successPage: pageId } });
  }

  updateErrorMessage(msg: string): void {
    const el = this.element; if (!el?.submitConfig) return;
    this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, errorMessage: msg } });
  }

  toggleFieldMapping(index: number, included: boolean): void {
    const el = this.element; if (!el?.submitConfig) return;
    const mappings = [...el.submitConfig.fieldMappings];
    if (included) {
      const available = this.availableFields;
      if (available[index]) {
        mappings.push({ ...available[index] });
      }
    } else {
      const field = this.availableFields[index];
      const idx = mappings.findIndex(m => m.elementId === field.elementId);
      if (idx >= 0) mappings.splice(idx, 1);
    }
    this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, fieldMappings: mappings } });
  }

  isFieldIncluded(elementId: string): boolean {
    return this.element?.submitConfig?.fieldMappings.some(m => m.elementId === elementId) ?? false;
  }

  getFieldKeyName(elementId: string): string {
    return this.element?.submitConfig?.fieldMappings.find(m => m.elementId === elementId)?.keyName ?? '';
  }

  updateFieldKeyName(elementId: string, keyName: string): void {
    const el = this.element; if (!el?.submitConfig) return;
    const mappings = el.submitConfig.fieldMappings.map(m =>
      m.elementId === elementId ? { ...m, keyName } : m
    );
    this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, fieldMappings: mappings } });
  }

  getFieldTypeBadge(source: string): string {
    const map: Record<string, string> = {
      input: 'Input', dynamic: 'TWK', dropdown: 'Dropdown', radio: 'Radio',
      checkbox: 'Checkbox', 'date-picker': 'Date', 'media-select': 'Media', map: 'Map'
    };
    return map[source] || source;
  }

  generateDefaultPayloadTemplate(fields: FieldMapping[]): string {
    const obj: Record<string, string> = {};
    for (const f of fields) {
      obj[f.keyName || f.elementLabel] = `{{${f.keyName || f.elementLabel}}}`;
    }
    return JSON.stringify(obj, null, 2);
  }

  updateMethod(method: string): void {
    const el = this.element; if (!el?.submitConfig) return;
    this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, method } });
  }

  updatePayloadTemplate(template: string): void {
    const el = this.element; if (!el?.submitConfig) return;
    this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, payloadTemplate: template } });
  }

  resetPayloadTemplate(): void {
    const el = this.element; if (!el?.submitConfig) return;
    const template = this.generateDefaultPayloadTemplate(el.submitConfig.fieldMappings);
    this.builder.updateElement(el.id, { submitConfig: { ...el.submitConfig, payloadTemplate: template } });
  }

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

  setPageNavigateTo(pageId: string): void {
    const el = this.element; if (!el) return;
    this.builder.updateElement(el.id, { pageNavigateTo: pageId });
  }

  setOptionAction(index: number, functionName: string): void {
    const el = this.element; if (!el) return;
    const options = [...el.options];
    if (functionName === '') {
      options[index] = { ...options[index], action: undefined };
    } else {
      const fn = this.twkService.getByName(functionName);
      if (!fn) return;
      options[index] = { ...options[index], action: { functionName: fn.name, params: {}, resultPath: fn.returns.path } };
    }
    this.builder.updateElement(el.id, { options });
  }
}
