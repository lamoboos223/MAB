import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../../services/builder.service';
import { BuilderElement } from '../../models/element.model';

interface PageShape {
  name: string;
  elements: BuilderElement[];
}

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './code-editor.html',
  styleUrl: './code-editor.scss',
})
export class CodeEditor {
  builder = inject(BuilderService);

  codeText = signal<string>('');
  parseError = signal<string | null>(null);
  private lastSerialized = '';
  private parseTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    effect(() => {
      const page = this.builder.activePage();
      if (!page) return;
      const serialized = JSON.stringify(
        { name: page.name, elements: page.elements },
        null,
        2
      );
      if (serialized !== this.lastSerialized) {
        this.lastSerialized = serialized;
        untracked(() => {
          this.codeText.set(serialized);
          this.parseError.set(null);
        });
      }
    });
  }

  onCodeInput(value: string): void {
    this.codeText.set(value);
    if (this.parseTimer) clearTimeout(this.parseTimer);
    this.parseTimer = setTimeout(() => this.tryApply(value), 500);
  }

  private tryApply(raw: string): void {
    let parsed: PageShape;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      this.parseError.set((e as Error).message);
      return;
    }

    if (!parsed || typeof parsed !== 'object') {
      this.parseError.set('Root must be an object with { name, elements }');
      return;
    }
    if (!Array.isArray(parsed.elements)) {
      this.parseError.set('"elements" must be an array');
      return;
    }

    const page = this.builder.activePage();
    if (!page) return;

    const nextSerialized = JSON.stringify(
      { name: parsed.name ?? page.name, elements: parsed.elements },
      null,
      2
    );
    this.lastSerialized = nextSerialized;

    this.builder.pages.update(pages =>
      pages.map(p =>
        p.id === page.id
          ? { ...p, name: parsed.name ?? p.name, elements: parsed.elements }
          : p
      )
    );
    this.parseError.set(null);
  }

  formatCode(): void {
    const raw = this.codeText();
    try {
      const parsed = JSON.parse(raw);
      const pretty = JSON.stringify(parsed, null, 2);
      this.codeText.set(pretty);
      this.tryApply(pretty);
    } catch (e) {
      this.parseError.set((e as Error).message);
    }
  }
}
