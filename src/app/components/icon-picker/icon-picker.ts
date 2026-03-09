import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

const ICONS = [
  'home', 'user', 'search', 'cog', 'bell', 'envelope', 'heart', 'star', 'check', 'times',
  'plus', 'minus', 'trash', 'pencil', 'eye', 'lock', 'unlock', 'key', 'shield', 'verified',
  'phone', 'mobile', 'camera', 'image', 'images', 'video', 'file', 'folder', 'copy', 'download',
  'upload', 'cloud', 'cloud-upload', 'cloud-download', 'link', 'external-link', 'share-alt',
  'map-marker', 'map', 'globe', 'compass', 'directions', 'car', 'truck', 'send',
  'shopping-cart', 'shopping-bag', 'credit-card', 'wallet', 'money-bill', 'gift', 'tag', 'tags',
  'calendar', 'clock', 'stopwatch', 'hourglass', 'history',
  'chart-bar', 'chart-line', 'chart-pie', 'list', 'th-large', 'table',
  'bolt', 'flag', 'bookmark', 'trophy', 'crown', 'sparkles', 'sun', 'moon',
  'exclamation-triangle', 'exclamation-circle', 'info-circle', 'question-circle',
  'check-circle', 'times-circle', 'ban', 'thumbs-up', 'thumbs-down',
  'arrow-up', 'arrow-down', 'arrow-left', 'arrow-right', 'arrows-alt',
  'chevron-up', 'chevron-down', 'chevron-left', 'chevron-right',
  'sort-up', 'sort-down', 'filter', 'bars', 'ellipsis-h', 'ellipsis-v',
  'comments', 'comment', 'inbox', 'paperclip', 'print', 'save', 'sign-out', 'sign-in',
  'users', 'id-card', 'building', 'briefcase', 'graduation-cap', 'book',
  'palette', 'sliders-h', 'wrench', 'hammer', 'code',
  'wifi', 'power-off', 'desktop', 'tablet', 'qrcode',
  'microphone', 'volume-up', 'volume-off', 'headphones', 'megaphone',
  'language', 'align-left', 'align-center', 'align-right', 'align-justify',
];

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  imports: [FormsModule, NgClass],
  templateUrl: './icon-picker.html',
  styleUrl: './icon-picker.scss'
})
export class IconPicker {
  @Input() value = '';
  @Output() valueChange = new EventEmitter<string>();

  open = false;
  search = '';

  get filteredIcons(): string[] {
    if (!this.search) return ICONS;
    const q = this.search.toLowerCase();
    return ICONS.filter(i => i.includes(q));
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open) this.search = '';
  }

  select(icon: string): void {
    this.value = icon;
    this.valueChange.emit(icon);
    this.open = false;
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.value = '';
    this.valueChange.emit('');
    this.open = false;
  }
}
