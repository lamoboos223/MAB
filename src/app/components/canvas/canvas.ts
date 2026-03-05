import { Component, inject } from '@angular/core';
import { CdkDropList, CdkDrag, CdkDragDrop } from '@angular/cdk/drag-drop';
import { BuilderService } from '../../services/builder.service';
import { CanvasElement } from '../canvas-element/canvas-element';

@Component({
  selector: 'app-canvas',
  imports: [CdkDropList, CdkDrag, CanvasElement],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss',
})
export class Canvas {
  builder = inject(BuilderService);

  onDrop(event: CdkDragDrop<any>): void {
    this.builder.reorderElements(event.previousIndex, event.currentIndex);
  }

  deselectAll(): void {
    this.builder.selectElement(null);
  }
}
