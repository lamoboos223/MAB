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
  private messagesContainer = viewChild<ElementRef>('messagesContainer');

  constructor() {
    effect(() => {
      // Track messages changes to auto-scroll
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

  async send(): Promise<void> {
    const msg = this.messageInput().trim();
    if (!msg || this.agent.isStreaming()) return;
    this.messageInput.set('');
    await this.agent.sendMessage(msg);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send();
    }
  }

  private scrollToBottom(): void {
    const container = this.messagesContainer()?.nativeElement;
    if (container) {
      container.scrollTop = container.scrollHeight;
    }
  }
}
