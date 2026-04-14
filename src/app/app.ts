import { Component, HostListener, signal } from '@angular/core';
import { ElementPalette } from './components/element-palette/element-palette';
import { Canvas } from './components/canvas/canvas';
import { PropertiesPanel } from './components/properties-panel/properties-panel';
import { AiChat } from './components/ai-chat/ai-chat';
import { CodeEditor } from './components/code-editor/code-editor';
import { Toolbar } from './components/toolbar/toolbar';
import { PageTabs } from './components/page-tabs/page-tabs';

type ResizeTarget = 'palette' | 'properties' | 'editor';
type RightTab = 'code' | 'ai';

@Component({
  selector: 'app-root',
  imports: [ElementPalette, Canvas, PropertiesPanel, AiChat, CodeEditor, Toolbar, PageTabs],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  paletteWidth = 160;
  propertiesWidth = 300;
  editorWidth = 480;

  activeRightTab = signal<RightTab>('code');

  private resizing: ResizeTarget | null = null;

  onResizeStart(event: MouseEvent, target: ResizeTarget) {
    event.preventDefault();
    this.resizing = target;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent) {
    if (!this.resizing) return;

    if (this.resizing === 'palette') {
      this.paletteWidth = Math.min(260, Math.max(120, event.clientX));
    } else if (this.resizing === 'properties') {
      const next = event.clientX - this.paletteWidth;
      this.propertiesWidth = Math.min(500, Math.max(220, next));
    } else if (this.resizing === 'editor') {
      const next = window.innerWidth - event.clientX;
      this.editorWidth = Math.min(window.innerWidth * 0.6, Math.max(280, next));
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
