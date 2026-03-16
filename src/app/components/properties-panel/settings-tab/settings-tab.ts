import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { BuilderService } from '../../../services/builder.service';
import { BuilderElement, I18nTranslation, VisibilityCondition, TwkBinding } from '../../../models/element.model';
import { IconPicker } from '../../icon-picker/icon-picker';
import { TwkFunctionsService } from '../../../services/twk-functions.service';
import { FunctionPicker } from '../../function-picker/function-picker';

@Component({
  selector: 'app-settings-tab',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, IconPicker, FunctionPicker],
  templateUrl: './settings-tab.html',
  styleUrl: './settings-tab.scss'
})
export class SettingsTab {
  builder = inject(BuilderService);
  twkService = inject(TwkFunctionsService);

  optionIconIndex = -1;

  get element() { return this.builder.selectedElement(); }

  updateContent(value: string): void {
    const el = this.element;
    if (!el) return;
    this.builder.updateElement(el.id, { staticContent: value });
  }

  updateSetting(key: string, value: string): void {
    const el = this.element;
    if (!el) return;
    this.builder.updateElement(el.id, { settings: { ...el.settings, [key]: value } });
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
    const newOption: any = { label: `Option ${el.options.length + 1}`, value: `option${el.options.length + 1}` };
    const options = [...el.options, newOption];
    this.builder.updateElement(el.id, { options });

    if (el.i18nEnabled) {
      const ar = el.i18n?.ar ?? {};
      const arOptions = [...(ar.options ?? []), { label: '' }];
      this.builder.updateElement(el.id, { i18n: { ar: { ...ar, options: arOptions } } });
    }
  }

  removeOption(index: number): void {
    const el = this.element;
    if (!el) return;
    const options = el.options.filter((_, i) => i !== index);
    this.builder.updateElement(el.id, { options });

    if (el.i18nEnabled && el.i18n?.ar?.options) {
      const arOptions = el.i18n.ar.options.filter((_, i) => i !== index);
      this.builder.updateElement(el.id, { i18n: { ar: { ...el.i18n.ar, options: arOptions } } });
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    this.readImageFile(file);
    input.value = '';
  }

  onImageDrop(event: DragEvent): void {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file?.type.startsWith('image/')) {
      this.readImageFile(file);
    }
  }

  removeImage(event: Event): void {
    event.stopPropagation();
    this.updateContent('');
  }

  private readImageFile(file: File): void {
    const reader = new FileReader();
    reader.onload = () => {
      this.updateContent(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  updateOptionIcon(index: number, icon: string): void {
    const el = this.element;
    if (!el) return;
    const options = [...el.options];
    options[index] = { ...options[index], icon: icon || undefined };
    this.builder.updateElement(el.id, { options });
  }

  toggleI18n(enabled: boolean): void {
    const el = this.element;
    if (!el) return;
    const updates: any = { i18nEnabled: enabled };
    if (enabled && !el.i18n) {
      const ar: I18nTranslation = {
        staticContent: '',
        settings: {},
        options: el.options.map(() => ({ label: '' }))
      };
      updates.i18n = { ar };
    }
    this.builder.updateElement(el.id, updates);
  }

  updateArContent(value: string): void {
    const el = this.element;
    if (!el) return;
    const ar = { ...(el.i18n?.ar ?? {}), staticContent: value };
    this.builder.updateElement(el.id, { i18n: { ar } });
  }

  updateArSetting(key: string, value: string): void {
    const el = this.element;
    if (!el) return;
    const ar = el.i18n?.ar ?? {};
    const settings = { ...(ar.settings ?? {}), [key]: value };
    this.builder.updateElement(el.id, { i18n: { ar: { ...ar, settings } } });
  }

  onVariantChange(variant: string): void {
    const el = this.element;
    if (!el) return;

    const variantStyles: Record<string, { backgroundColor: string; color: string; border: string }> = {
      info:    { backgroundColor: '#dbeafe', color: '#1e40af', border: '1px solid #93c5fd' },
      warning: { backgroundColor: '#fef3c7', color: '#92400e', border: '1px solid #fcd34d' },
      success: { backgroundColor: '#dcfce7', color: '#166534', border: '1px solid #86efac' },
      error:   { backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }
    };

    const variantIcons: Record<string, string> = {
      info: 'info-circle',
      warning: 'exclamation-triangle',
      success: 'check-circle',
      error: 'times-circle'
    };

    const styles = variantStyles[variant] ?? variantStyles['warning'];
    const icon = variantIcons[variant] ?? 'exclamation-triangle';

    this.builder.updateElement(el.id, {
      settings: { ...el.settings, variant, icon },
      styles: { ...el.styles, ...styles }
    });
  }

  updateArOptionLabel(index: number, label: string): void {
    const el = this.element;
    if (!el) return;
    const ar = el.i18n?.ar ?? {};
    const options = [...(ar.options ?? el.options.map(() => ({ label: '' })))];
    options[index] = { label };
    this.builder.updateElement(el.id, { i18n: { ar: { ...ar, options } } });
  }

  getOtherElements(): { id: string; type: string; settings: Record<string, string>; staticContent: string }[] {
    const el = this.element;
    if (!el) return [];
    const page = this.builder.activePage();
    return page ? page.elements.filter(e => e.id !== el.id) : [];
  }

  addCondition(): void {
    const el = this.element;
    if (!el) return;
    const condition: VisibilityCondition = {
      source: 'element',
      operator: 'equals',
      value: ''
    };
    this.builder.updateElement(el.id, { visibilityCondition: condition });
  }

  removeCondition(): void {
    const el = this.element;
    if (!el) return;
    this.builder.updateElement(el.id, { visibilityCondition: undefined } as any);
  }

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

  updateConditionField(field: string, value: string): void {
    const el = this.element;
    if (!el || !el.visibilityCondition) return;
    const updates: any = { ...el.visibilityCondition, [field]: value };
    // Auto-set operator when selecting a button element
    if (field === 'elementId') {
      const page = this.builder.activePage();
      const target = page?.elements.find(e => e.id === value);
      if (target?.type === 'button') {
        updates.operator = 'button_active';
      } else if (['button_active', 'button_not_active'].includes(el.visibilityCondition.operator)) {
        updates.operator = 'equals';
      }
    }
    this.builder.updateElement(el.id, { visibilityCondition: updates });
  }

  setConditionFunction(functionName: string): void {
    const el = this.element;
    if (!el || !el.visibilityCondition) return;
    const fn = this.twkService.getByName(functionName);
    const binding: TwkBinding = {
      functionName,
      params: {},
      resultPath: fn?.returns?.path || 'result'
    };
    this.builder.updateElement(el.id, {
      visibilityCondition: { ...el.visibilityCondition, functionBinding: binding }
    });
  }

  setConditionFunctionParam(paramName: string, value: string): void {
    const el = this.element;
    if (!el || !el.visibilityCondition?.functionBinding) return;
    const binding = {
      ...el.visibilityCondition.functionBinding,
      params: { ...el.visibilityCondition.functionBinding.params, [paramName]: value }
    };
    this.builder.updateElement(el.id, {
      visibilityCondition: { ...el.visibilityCondition, functionBinding: binding }
    });
  }

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

  isSelectedConditionElementButton(): boolean {
    const el = this.element;
    if (!el?.visibilityCondition?.elementId) return false;
    const page = this.builder.activePage();
    if (!page) return false;
    const target = page.elements.find(e => e.id === el.visibilityCondition!.elementId);
    return target?.type === 'button';
  }

  getDefaultLengthError(el: BuilderElement): string {
    const min = el.settings['minLength'];
    const max = el.settings['maxLength'];
    if (min && max) return `Must be between ${min} and ${max} characters`;
    if (min) return `Must be at least ${min} characters`;
    if (max) return `Must be at most ${max} characters`;
    return '';
  }

  updateConditionBindingField(field: string, value: string): void {
    const el = this.element;
    if (!el || !el.visibilityCondition?.functionBinding) return;
    const binding = { ...el.visibilityCondition.functionBinding, [field]: value };
    this.builder.updateElement(el.id, {
      visibilityCondition: { ...el.visibilityCondition, functionBinding: binding }
    });
  }
}
