import { Component, Input, inject } from '@angular/core';
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

  get isSelected(): boolean {
    return this.builder.selectedElementId() === this.element.id;
  }

  select(event: Event): void {
    event.stopPropagation();
    this.builder.selectElement(this.element.id);
  }

  remove(event: Event): void {
    event.stopPropagation();
    this.builder.removeElement(this.element.id);
  }
}
