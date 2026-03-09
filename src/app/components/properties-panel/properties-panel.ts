import { Component, inject } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { BuilderService } from '../../services/builder.service';
import { StyleTab } from './style-tab/style-tab';
import { DataTab } from './data-tab/data-tab';
import { SettingsTab } from './settings-tab/settings-tab';

@Component({
  selector: 'app-properties-panel',
  standalone: true,
  imports: [UpperCasePipe, StyleTab, DataTab, SettingsTab],
  templateUrl: './properties-panel.html',
  styleUrl: './properties-panel.scss'
})
export class PropertiesPanel {
  builder = inject(BuilderService);
  activeTab: 'style' | 'data' | 'settings' = 'style';

  private iconMap: Record<string, string> = {
    text: 'T',
    button: '▢',
    image: '🖼',
    input: '▤',
    dropdown: '▾',
    radio: '◉',
    checkbox: '☑',
    map: '◎',
    'date-picker': '📅',
    'media-select': '📎',
    divider: '—',
  };

  getElementIcon(type: string): string {
    return this.iconMap[type] || '•';
  }
}
