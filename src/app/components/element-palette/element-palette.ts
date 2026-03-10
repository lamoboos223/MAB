import { Component, inject } from '@angular/core';
import { BuilderService } from '../../services/builder.service';
import { ThemeService } from '../../services/theme.service';
import { ElementType } from '../../models/element.model';

interface PaletteItem {
  type: ElementType;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-element-palette',
  imports: [],
  templateUrl: './element-palette.html',
  styleUrl: './element-palette.scss',
})
export class ElementPalette {
  builder = inject(BuilderService);
  private themeService = inject(ThemeService);

  elements: PaletteItem[] = [
    { type: 'text', label: 'Text', icon: 'T' },
    { type: 'button', label: 'Button', icon: 'B' },
    { type: 'image', label: 'Image', icon: 'I' },
    { type: 'input', label: 'Input', icon: 'In' },
    { type: 'dropdown', label: 'Dropdown', icon: 'D' },
    { type: 'radio', label: 'Radio', icon: 'R' },
    { type: 'checkbox', label: 'Checkbox', icon: 'C' },
    { type: 'date-picker', label: 'Date', icon: 'DP' },
    { type: 'media-select', label: 'Media', icon: 'MS' },
    { type: 'map', label: 'Map', icon: 'M' },
    { type: 'divider', label: 'Divider', icon: '--' },
    { type: 'alert', label: 'Alert', icon: '!' }
  ];

  addElement(type: ElementType): void {
    this.builder.addElement(type);
  }

  setThemeMode(mode: 'light' | 'dark' | 'auto'): void {
    this.builder.appThemeMode.set(mode);
    if (mode === 'light' || mode === 'dark') {
      this.themeService.setTheme(mode);
    }
  }
}
