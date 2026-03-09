import { Component, Input, inject, HostListener, ElementRef } from '@angular/core';
import { BuilderElement, ElementOption, ElementStyle } from '../../models/element.model';
import { BuilderService } from '../../services/builder.service';
import { ThemeService } from '../../services/theme.service';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-canvas-element',
  imports: [NgStyle],
  templateUrl: './canvas-element.html',
  styleUrl: './canvas-element.scss',
})
export class CanvasElement {
  @Input({ required: true }) element!: BuilderElement;
  builder = inject(BuilderService);
  themeService = inject(ThemeService);
  private elRef = inject(ElementRef);

  editing = false;
  editValue = '';
  customDropdownOpen = false;
  selectedDropdownValue = '';
  private resizing = false;
  private resizeStartY = 0;
  private resizeStartHeight = 0;

  get isSelected(): boolean {
    return this.builder.selectedElementId() === this.element.id;
  }

  /** Read live element from the signal so we always get fresh darkStyles/styles */
  private get liveElement(): BuilderElement {
    const page = this.builder.activePage();
    return page?.elements.find(e => e.id === this.element.id) ?? this.element;
  }

  getActiveStyles(): ElementStyle {
    const el = this.liveElement;
    const isDark = this.themeService.theme() === 'dark';
    const isAuto = this.builder.appThemeMode() === 'auto';
    if (isAuto && isDark) {
      return { ...el.styles, ...(el.darkStyles ?? {}) };
    }
    return el.styles;
  }

  get isAr(): boolean {
    return this.builder.activeLang() === 'ar' && !!this.element.i18nEnabled;
  }

  get displayContent(): string {
    if (this.isAr && this.element.i18n?.ar?.staticContent) {
      return this.element.i18n.ar.staticContent;
    }
    return this.element.staticContent;
  }

  get displayLabel(): string {
    if (this.isAr && this.element.i18n?.ar?.settings?.['label']) {
      return this.element.i18n.ar.settings['label'];
    }
    return this.element.settings['label'] || '';
  }

  get displayPlaceholder(): string {
    if (this.isAr && this.element.i18n?.ar?.settings?.['placeholder']) {
      return this.element.i18n.ar.settings['placeholder'];
    }
    return this.element.settings['placeholder'] || '';
  }

  displayOptionLabel(index: number): string {
    if (this.isAr && this.element.i18n?.ar?.options?.[index]?.label) {
      return this.element.i18n.ar.options[index].label;
    }
    return this.element.options[index]?.label || '';
  }

  get editableText(): string | null {
    if (this.element.type === 'text' && this.element.dataSource !== 'dynamic') {
      return this.element.staticContent;
    }
    if (this.element.type === 'button') {
      return this.element.staticContent;
    }
    if (['input', 'dropdown', 'radio', 'checkbox', 'date-picker', 'media-select'].includes(this.element.type)) {
      return this.element.settings['label'] || '';
    }
    return null;
  }

  select(event: Event): void {
    event.stopPropagation();
    this.builder.selectElement(this.element.id);
  }

  remove(event: Event): void {
    event.stopPropagation();
    this.builder.removeElement(this.element.id);
  }

  startEdit(event: Event): void {
    event.stopPropagation();
    if (this.editableText === null) return;
    this.editing = true;
    this.editValue = this.editableText;
  }

  finishEdit(): void {
    if (!this.editing) return;
    this.editing = false;
    const type = this.element.type;
    if (type === 'text' || type === 'button') {
      this.builder.updateElement(this.element.id, { staticContent: this.editValue });
    } else if (['input', 'dropdown', 'radio', 'checkbox', 'date-picker', 'media-select'].includes(type)) {
      this.builder.updateElement(this.element.id, {
        settings: { ...this.element.settings, label: this.editValue }
      });
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.editing) return;
    if (!this.isSelected) return;
    const tag = (event.target as HTMLElement).tagName;
    if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

    if (event.key === 'Delete' || event.key === 'Backspace') {
      event.preventDefault();
      this.builder.removeElement(this.element.id);
    }
    if ((event.metaKey || event.ctrlKey) && event.key === 'c') {
      event.preventDefault();
      this.builder.copyElement(this.element.id);
    }
    if ((event.metaKey || event.ctrlKey) && event.key === 'v') {
      event.preventDefault();
      this.builder.pasteElement();
    }
  }

  get selectedDropdownLabel(): string {
    if (this.selectedDropdownValue) {
      const idx = this.element.options.findIndex(o => o.value === this.selectedDropdownValue);
      if (idx >= 0) return this.displayOptionLabel(idx);
    }
    return this.element.options.length ? this.displayOptionLabel(0) : '';
  }

  get selectedDropdownIcon(): string {
    if (this.selectedDropdownValue) {
      const opt = this.element.options.find(o => o.value === this.selectedDropdownValue);
      return opt?.icon || '';
    }
    return this.element.options[0]?.icon || '';
  }

  toggleCustomDropdown(event: Event): void {
    event.stopPropagation();
    this.customDropdownOpen = !this.customDropdownOpen;
  }

  selectDropdownOption(event: Event, option: ElementOption): void {
    event.stopPropagation();
    this.selectedDropdownValue = option.value;
    this.customDropdownOpen = false;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.customDropdownOpen = false;
    }
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.finishEdit();
    } else if (event.key === 'Escape') {
      this.editing = false;
    }
  }

  get isMultiLine(): boolean {
    const h = parseInt(this.element.settings['inputHeight'] || '0', 10);
    return h > 40;
  }

  getTextAreaStyle(): Record<string, string> {
    const h = this.element.settings['inputHeight'];
    if (h && parseInt(h, 10) > 40) {
      return { height: h + 'px' };
    }
    return {};
  }

  startResize(event: MouseEvent | TouchEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.resizing = true;
    const clientY = event instanceof MouseEvent ? event.clientY : event.touches[0].clientY;
    this.resizeStartY = clientY;
    const inputEl = this.elRef.nativeElement.querySelector('.el-input');
    this.resizeStartHeight = parseInt(this.element.settings['inputHeight'] || '0', 10) || inputEl?.offsetHeight || 36;

    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!this.resizing) return;
      const y = e instanceof MouseEvent ? e.clientY : e.touches[0].clientY;
      const newHeight = Math.max(36, this.resizeStartHeight + (y - this.resizeStartY));
      this.builder.updateElement(this.element.id, {
        settings: { ...this.element.settings, inputHeight: String(newHeight) }
      });
    };

    const onUp = () => {
      this.resizing = false;
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove);
    document.addEventListener('touchend', onUp);
  }
}
