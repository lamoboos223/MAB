import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { BuilderService } from '../../../services/builder.service';
import { I18nTranslation } from '../../../models/element.model';
import { IconPicker } from '../../icon-picker/icon-picker';

@Component({
  selector: 'app-settings-tab',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet, IconPicker],
  templateUrl: './settings-tab.html',
  styleUrl: './settings-tab.scss'
})
export class SettingsTab {
  builder = inject(BuilderService);

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

  updateArOptionLabel(index: number, label: string): void {
    const el = this.element;
    if (!el) return;
    const ar = el.i18n?.ar ?? {};
    const options = [...(ar.options ?? el.options.map(() => ({ label: '' })))];
    options[index] = { label };
    this.builder.updateElement(el.id, { i18n: { ar: { ...ar, options } } });
  }
}
