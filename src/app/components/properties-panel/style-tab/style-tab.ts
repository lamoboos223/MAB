import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../../../services/builder.service';
import { ThemeService } from '../../../services/theme.service';
import { ElementStyle } from '../../../models/element.model';

@Component({
  selector: 'app-style-tab',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './style-tab.html',
  styleUrl: './style-tab.scss'
})
export class StyleTab {
  builder = inject(BuilderService);
  themeService = inject(ThemeService);

  get element() { return this.builder.selectedElement(); }

  get isAutoTheme(): boolean {
    return this.builder.appThemeMode() === 'auto';
  }

  get styleThemeTab(): 'light' | 'dark' {
    return this.themeService.theme();
  }

  get activeStyles(): ElementStyle {
    const el = this.element;
    if (!el) return {};
    if (this.isAutoTheme && this.styleThemeTab === 'dark') {
      return { ...el.styles, ...(el.darkStyles ?? {}) };
    }
    return el.styles;
  }

  updateStyle(property: string, value: string): void {
    const el = this.element;
    if (!el) return;
    if (this.isAutoTheme && this.styleThemeTab === 'dark') {
      this.builder.updateElement(el.id, { darkStyles: { ...(el.darkStyles ?? {}), [property]: value } });
    } else {
      this.builder.updateElement(el.id, { styles: { ...el.styles, [property]: value } });
    }
  }

}
