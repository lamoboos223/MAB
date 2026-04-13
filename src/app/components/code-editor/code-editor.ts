import { Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import hljs from 'highlight.js/lib/core';
import jsonLang from 'highlight.js/lib/languages/json';
import xmlLang from 'highlight.js/lib/languages/xml';
import cssLang from 'highlight.js/lib/languages/css';
import jsLang from 'highlight.js/lib/languages/javascript';
import { BuilderService } from '../../services/builder.service';
import { CodeGeneratorService } from '../../services/code-generator.service';
import { BuilderElement } from '../../models/element.model';

hljs.registerLanguage('json', jsonLang);
hljs.registerLanguage('xml', xmlLang);
hljs.registerLanguage('css', cssLang);
hljs.registerLanguage('javascript', jsLang);

interface PageShape {
  name: string;
  elements: BuilderElement[];
}

type EditorTab = 'json' | 'html' | 'css' | 'js';

@Component({
  selector: 'app-code-editor',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './code-editor.html',
  styleUrl: './code-editor.scss',
})
export class CodeEditor {
  builder = inject(BuilderService);
  private generator = inject(CodeGeneratorService);

  activeTab = signal<EditorTab>('json');
  codeText = signal<string>('');
  parseError = signal<string | null>(null);

  generatedHtml = computed(() => {
    const page = this.builder.activePage();
    const pages = this.builder.pages();
    if (!page) return '';
    const all = this.generator.generatePages(pages);
    const idx = pages.findIndex(p => p.id === page.id);
    return all[idx]?.html ?? '';
  });

  generatedCss = computed(() => {
    return this.generator.generateCss(this.builder.pages(), this.builder.appThemeMode());
  });

  generatedJs = computed(() => {
    return this.generator.generateJs(
      this.builder.pages(),
      this.builder.appThemeMode(),
      this.builder.secretKey(),
      this.builder.debugMode(),
      'preview'
    );
  });

  highlightedJson = computed(() => this.highlight(this.codeText(), 'json'));
  highlightedHtml = computed(() => this.highlight(this.generatedHtml(), 'xml'));
  highlightedCss = computed(() => this.highlight(this.generatedCss(), 'css'));
  highlightedJs = computed(() => this.highlight(this.generatedJs(), 'javascript'));

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

  private highlight(code: string, lang: string): string {
    if (!code) return '';
    try {
      return hljs.highlight(code, { language: lang, ignoreIllegals: true }).value;
    } catch {
      return this.escape(code);
    }
  }

  private escape(s: string): string {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  setTab(tab: EditorTab): void {
    this.activeTab.set(tab);
  }

  onCodeInput(value: string): void {
    this.codeText.set(value);
    if (this.parseTimer) clearTimeout(this.parseTimer);
    this.parseTimer = setTimeout(() => this.tryApply(value), 500);
  }

  onEditorScroll(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const pre = textarea.previousElementSibling as HTMLElement | null;
    if (pre) {
      pre.scrollTop = textarea.scrollTop;
      pre.scrollLeft = textarea.scrollLeft;
    }
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

  copyReadonly(): void {
    const text = this.readonlyText();
    if (!text) return;
    navigator.clipboard?.writeText(text).catch(() => {});
  }

  readonlyText(): string {
    switch (this.activeTab()) {
      case 'html': return this.generatedHtml();
      case 'css': return this.generatedCss();
      case 'js': return this.generatedJs();
      default: return '';
    }
  }

  readonlyHighlighted(): string {
    switch (this.activeTab()) {
      case 'html': return this.highlightedHtml();
      case 'css': return this.highlightedCss();
      case 'js': return this.highlightedJs();
      default: return '';
    }
  }
}
