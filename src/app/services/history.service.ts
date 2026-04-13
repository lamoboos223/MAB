import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { BuilderService } from './builder.service';
import { Page } from '../models/page.model';

const MAX_HISTORY = 20;
const DEBOUNCE_MS = 600;

@Injectable({ providedIn: 'root' })
export class HistoryService {
  private builder = inject(BuilderService);

  private stack = signal<Page[][]>([]);
  private pointer = signal<number>(-1);
  private isApplying = false;
  private pendingTimer: ReturnType<typeof setTimeout> | null = null;

  canUndo = computed(() => this.pointer() > 0);
  canRedo = computed(() => this.pointer() < this.stack().length - 1);

  constructor() {
    queueMicrotask(() => this.snapshot(this.builder.pages()));

    effect(() => {
      const pages = this.builder.pages();
      if (this.isApplying) return;

      if (this.pendingTimer) clearTimeout(this.pendingTimer);
      this.pendingTimer = setTimeout(() => this.snapshot(pages), DEBOUNCE_MS);
    });
  }

  private snapshot(pages: Page[]): void {
    const serialized = JSON.stringify(pages);
    const current = this.stack()[this.pointer()];
    if (current && JSON.stringify(current) === serialized) return;

    const truncated = this.stack().slice(0, this.pointer() + 1);
    truncated.push(structuredClone(pages));

    while (truncated.length > MAX_HISTORY) {
      truncated.shift();
    }

    this.stack.set(truncated);
    this.pointer.set(truncated.length - 1);
  }

  undo(): void {
    if (!this.canUndo()) return;
    if (this.pendingTimer) {
      clearTimeout(this.pendingTimer);
      this.pendingTimer = null;
      this.snapshot(this.builder.pages());
    }
    this.pointer.update(p => p - 1);
    this.apply();
  }

  redo(): void {
    if (!this.canRedo()) return;
    this.pointer.update(p => p + 1);
    this.apply();
  }

  private apply(): void {
    const snapshot = this.stack()[this.pointer()];
    if (!snapshot) return;
    this.isApplying = true;
    this.builder.pages.set(structuredClone(snapshot));
    queueMicrotask(() => { this.isApplying = false; });
  }
}
