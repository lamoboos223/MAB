import { Component, inject, signal, ElementRef, viewChild, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AiAgentService } from '../../services/ai-agent.service';

@Component({
  selector: 'app-ai-chat',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './ai-chat.html',
  styleUrl: './ai-chat.scss',
})
export class AiChat {
  agent = inject(AiAgentService);
  apiKeyInput = signal('');
  messageInput = signal('');
  pendingImages = signal<string[]>([]);
  private messagesContainer = viewChild<ElementRef>('messagesContainer');

  constructor() {
    effect(() => {
      this.agent.messages();
      setTimeout(() => this.scrollToBottom(), 0);
    });
  }

  saveApiKey(): void {
    const key = this.apiKeyInput().trim();
    if (key) {
      this.agent.setApiKey(key);
      this.apiKeyInput.set('');
    }
  }

  removeApiKey(): void {
    this.agent.setApiKey('');
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const files = Array.from(input.files);
    for (const file of files) {
      if (!file.type.startsWith('image/')) continue;
      this.compressImage(file).then(dataUrl => {
        this.pendingImages.update(imgs => [...imgs, dataUrl]);
      });
    }
    input.value = '';
  }

  removeImage(index: number): void {
    this.pendingImages.update(imgs => imgs.filter((_, i) => i !== index));
  }

  async send(): Promise<void> {
    const msg = this.messageInput().trim();
    const images = this.pendingImages();
    if ((!msg && !images.length) || this.agent.isStreaming()) return;
    this.messageInput.set('');
    this.pendingImages.set([]);
    await this.agent.sendMessage(msg, images.length ? images : undefined);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        event.preventDefault();
        const file = items[i].getAsFile();
        if (!file) continue;
        this.compressImage(file).then(dataUrl => {
          this.pendingImages.update(imgs => [...imgs, dataUrl]);
        });
      }
    }
  }

  /** Resize image to max 1024px and compress as JPEG to reduce API token cost */
  private compressImage(file: File): Promise<string> {
    return new Promise(resolve => {
      const img = new Image();
      img.onload = () => {
        const MAX = 1024;
        let w = img.width, h = img.height;
        if (w > MAX || h > MAX) {
          if (w > h) { h = Math.round(h * MAX / w); w = MAX; }
          else { w = Math.round(w * MAX / h); h = MAX; }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d')!.drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  private scrollToBottom(): void {
    const container = this.messagesContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
