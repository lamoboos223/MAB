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
    this.setTheme(this.theme() === 'dark' ? 'light' : 'dark');
  }

  setTheme(theme: Theme): void {
    this.theme.set(theme);
    this.applyTheme();
    localStorage.setItem('theme', theme);
  }

  private applyTheme(): void {
    document.documentElement.setAttribute('data-theme', this.theme());
  }
}
