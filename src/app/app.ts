import { Component } from '@angular/core';
import { ElementPalette } from './components/element-palette/element-palette';
import { Canvas } from './components/canvas/canvas';
import { PropertiesPanel } from './components/properties-panel/properties-panel';
import { Toolbar } from './components/toolbar/toolbar';
import { PageTabs } from './components/page-tabs/page-tabs';

@Component({
  selector: 'app-root',
  imports: [ElementPalette, Canvas, PropertiesPanel, Toolbar, PageTabs],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {}
