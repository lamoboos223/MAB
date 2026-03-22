import { Component, HostListener } from '@angular/core';
import { ElementPalette } from './components/element-palette/element-palette';
import { Canvas } from './components/canvas/canvas';
import { RightPanel } from './components/right-panel/right-panel';
import { Toolbar } from './components/toolbar/toolbar';
import { PageTabs } from './components/page-tabs/page-tabs';

@Component({
  selector: 'app-root',
  imports: [ElementPalette, Canvas, RightPanel, Toolbar, PageTabs],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  paletteWidth = 220;
  propertiesWidth = 300;

  private resizing: 'palette' | 'properties' | null = null;

  onResizeStart(event: MouseEvent, panel: 'palette' | 'properties') {
    event.preventDefault();
    this.resizing = panel;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.resizing) return;

    if (this.resizing === 'palette') {
      this.paletteWidth = Math.min(400, Math.max(160, event.clientX));
    } else {
      this.propertiesWidth = Math.min(500, Math.max(200, window.innerWidth - event.clientX));
    }
  }

  @HostListener('document:mouseup')
  onMouseUp() {
    if (this.resizing) {
      this.resizing = null;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }
  }
}
