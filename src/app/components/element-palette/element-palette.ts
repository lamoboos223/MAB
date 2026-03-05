import { Component, inject } from '@angular/core';
import { BuilderService } from '../../services/builder.service';
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
