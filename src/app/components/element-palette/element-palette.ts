import { Component, inject, signal } from '@angular/core';
import { BuilderService } from '../../services/builder.service';
import { ThemeService } from '../../services/theme.service';
import { ElementType } from '../../models/element.model';

interface PaletteItem {
  type: ElementType;
  label: string;
  icon: string;
}

type PaletteTab = 'elements' | 'blocks';

@Component({
  selector: 'app-element-palette',
  imports: [],
  templateUrl: './element-palette.html',
  styleUrl: './element-palette.scss',
})
export class ElementPalette {
  builder = inject(BuilderService);
  private themeService = inject(ThemeService);

  activeTab = signal<PaletteTab>('elements');

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
    { type: 'alert', label: 'Alert', icon: '!' },
    { type: 'table', label: 'Table', icon: 'T#' },
    { type: 'container', label: 'Div', icon: '[ ]' }
  ];

  addElement(type: ElementType): void {
    this.builder.addElement(type);
  }

  addBlock(blockId: string): void {
    this.builder.addBlockInstance(blockId);
  }

  saveSelectionAsBlock(): void {
    const selected = this.builder.selectedElement();
    if (!selected) {
      alert('Select an element on the canvas first to save as a block.');
      return;
    }
    const name = prompt('Name for this block', selected.label || 'New Block');
    if (name === null) return;
    this.builder.saveAsBlock(selected.id, name);
    this.activeTab.set('blocks');
  }

  deleteBlock(event: MouseEvent, blockId: string): void {
    event.stopPropagation();
    if (confirm('Delete this block?')) {
      this.builder.deleteBlock(blockId);
    }
  }

  setThemeMode(mode: 'light' | 'dark' | 'auto'): void {
    this.builder.appThemeMode.set(mode);
    if (mode === 'light' || mode === 'dark') {
      this.themeService.setTheme(mode);
    }
  }
}
