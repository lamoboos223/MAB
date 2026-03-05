import { Injectable, signal } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  theme = signal<Theme>('dark');

  constructor() {
    const saved = localStorage.getItem('theme') as Theme;
    if (saved) {
      this.theme.set(saved);
    }
    this.applyTheme();
  }

  toggle(): void {
    this.theme.set(this.theme() === 'dark' ? 'light' : 'dark');
    this.applyTheme();
    localStorage.setItem('theme', this.theme());
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.theme());
  }
}
