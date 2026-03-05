import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { BuilderService } from '../../../services/builder.service';

@Component({
  selector: 'app-settings-tab',
  standalone: true,
  imports: [FormsModule, NgTemplateOutlet],
  templateUrl: './settings-tab.html',
  styleUrl: './settings-tab.scss'
})
export class SettingsTab {
  builder = inject(BuilderService);

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
    const options = [...el.options, { label: `Option ${el.options.length + 1}`, value: `option${el.options.length + 1}` }];
    this.builder.updateElement(el.id, { options });
  }

  removeOption(index: number): void {
    const el = this.element;
    if (!el) return;
    const options = el.options.filter((_, i) => i !== index);
    this.builder.updateElement(el.id, { options });
  }
}
