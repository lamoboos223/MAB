import { Component, signal } from '@angular/core';
import { PropertiesPanel } from '../properties-panel/properties-panel';
import { AiChat } from '../ai-chat/ai-chat';

@Component({
  selector: 'app-right-panel',
  standalone: true,
  imports: [PropertiesPanel, AiChat],
  templateUrl: './right-panel.html',
  styleUrl: './right-panel.scss',
})
export class RightPanel {
  activeTab = signal<'properties' | 'ai-chat'>('properties');
}
