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

  numVal(key: keyof ElementStyle): number | null {
    const v = (this.activeStyles as Record<string, string | undefined>)[key as string];
    if (!v) return null;
    const m = /^(-?\d+(?:\.\d+)?)/.exec(v);
    return m ? parseFloat(m[1]) : null;
  }

  setNum(key: keyof ElementStyle, value: number | null, unit: string = 'px'): void {
    if (value === null || value === undefined || Number.isNaN(value)) {
      this.updateStyle(key as string, '');
    } else {
      this.updateStyle(key as string, `${value}${unit}`);
    }
  }

  toggleAlign(value: 'left' | 'center' | 'right' | 'justify'): void {
    const current = this.activeStyles.textAlign;
    this.updateStyle('textAlign', current === value ? '' : value);
  }
}
