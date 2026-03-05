import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../../../services/builder.service';

@Component({
  selector: 'app-style-tab',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './style-tab.html',
  styleUrl: './style-tab.scss'
})
export class StyleTab {
  builder = inject(BuilderService);

  get element() { return this.builder.selectedElement(); }

  updateStyle(property: string, value: string): void {
    const el = this.element;
    if (!el) return;
    this.builder.updateElement(el.id, { styles: { ...el.styles, [property]: value } });
  }
}
