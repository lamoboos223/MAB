import { Component, Input, inject, HostListener } from '@angular/core';
import { BuilderElement } from '../../models/element.model';
import { BuilderService } from '../../services/builder.service';
import { NgStyle } from '@angular/common';

@Component({
  selector: 'app-canvas-element',
  imports: [NgStyle],
  templateUrl: './canvas-element.html',
  styleUrl: './canvas-element.scss',
})
export class CanvasElement {
  @Input({ required: true }) element!: BuilderElement;
  private builder = inject(BuilderService);

  editing = false;
  editValue = '';

  get isSelected(): boolean {
    return this.builder.selectedElementId() === this.element.id;
  }

  get editableText(): string | null {
    if (this.element.type === 'text' && this.element.dataSource !== 'dynamic') {
      return this.element.staticContent;
    }
    if (this.element.type === 'button') {
      return this.element.staticContent;
    }
    if (['input', 'dropdown', 'radio', 'checkbox'].includes(this.element.type)) {
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
    } else if (['input', 'dropdown', 'radio', 'checkbox'].includes(type)) {
      this.builder.updateElement(this.element.id, {
        settings: { ...this.element.settings, label: this.editValue }
      });
    }
  }

  @HostListener('window:keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (this.editing) return;
    if (!this.isSelected) return;
    if (event.key === 'Delete' || event.key === 'Backspace') {
      const tag = (event.target as HTMLElement).tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      event.preventDefault();
      this.builder.removeElement(this.element.id);
    }
  }

  onEditKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.finishEdit();
    } else if (event.key === 'Escape') {
      this.editing = false;
    }
  }
}
