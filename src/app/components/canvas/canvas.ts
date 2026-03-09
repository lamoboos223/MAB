import { Component, inject } from '@angular/core';
import { BuilderService } from '../../services/builder.service';
import { BuilderElement } from '../../models/element.model';
import { CanvasElement } from '../canvas-element/canvas-element';

@Component({
  selector: 'app-canvas',
  imports: [CanvasElement],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss',
})
export class Canvas {
  builder = inject(BuilderService);

  deselectAll(): void {
    this.builder.selectElement(null);
  }

  onDragStart(event: MouseEvent, element: BuilderElement): void {
    const target = event.target as HTMLElement;
    if (target.closest('.resize-handle')) return;
    event.preventDefault();
    event.stopPropagation();
    this.builder.selectElement(element.id);
    const startX = event.clientX;
    const startY = event.clientY;
    const origX = element.position?.x ?? 0;
    const origY = element.position?.y ?? 0;

    const onMove = (e: MouseEvent) => {
      const x = Math.max(0, origX + e.clientX - startX);
      const y = Math.max(0, origY + e.clientY - startY);
      this.builder.updateElementPosition(element.id, x, y);
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  onResizeStart(event: MouseEvent, element: BuilderElement, handle: string, wrapperEl: HTMLElement): void {
    event.preventDefault();
    event.stopPropagation();

    const startX = event.clientX;
    const startY = event.clientY;
    const startW = wrapperEl.offsetWidth;
    const startH = wrapperEl.offsetHeight;
    const origX = element.position?.x ?? 0;
    const origY = element.position?.y ?? 0;
    const styles = { ...element.styles };
    const startWidth = parseInt(styles.width || '', 10) || startW;
    const startHeight = parseInt(styles.height || '', 10) || startH;

    const onMove = (e: MouseEvent) => {
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const updates: Record<string, string> = {};
      let newX = origX;
      let newY = origY;

      if (handle.includes('e')) {
        updates['width'] = Math.max(40, startWidth + dx) + 'px';
      }
      if (handle.includes('w')) {
        const newW = Math.max(40, startWidth - dx);
        updates['width'] = newW + 'px';
        newX = origX + (startWidth - newW);
      }
      if (handle.includes('s')) {
        updates['height'] = Math.max(20, startHeight + dy) + 'px';
      }
      if (handle.includes('n')) {
        const newH = Math.max(20, startHeight - dy);
        updates['height'] = newH + 'px';
        newY = origY + (startHeight - newH);
      }

      this.builder.updateElement(element.id, {
        styles: { ...element.styles, ...updates },
        position: { x: newX, y: newY }
      });
    };

    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }
}
