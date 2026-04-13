import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../../services/builder.service';
import { PartnerTheme } from '../../models/partner-theme.model';

@Component({
  selector: 'app-partner-theme-modal',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './partner-theme-modal.html',
  styleUrl: './partner-theme-modal.scss',
})
export class PartnerThemeModal {
  private builder = inject(BuilderService);

  @Output() closed = new EventEmitter<void>();

  draft = signal<PartnerTheme>(this.initialDraft());

  private initialDraft(): PartnerTheme {
    const existing = this.builder.partnerTheme();
    return existing
      ? { ...existing }
      : {
          name: '',
          accent: '#1b7a5f',
          accentHover: '#114b47',
          fontFamily: '',
          fontUrl: '',
          logoUrl: '',
        };
  }

  update<K extends keyof PartnerTheme>(field: K, value: PartnerTheme[K]): void {
    this.draft.update(d => ({ ...d, [field]: value }));
  }

  save(): void {
    const d = this.draft();
    const theme: PartnerTheme = {
      name: d.name.trim() || 'Partner',
      accent: d.accent || '#1b7a5f',
      accentHover: d.accentHover || d.accent || '#114b47',
      fontFamily: d.fontFamily?.trim() || undefined,
      fontUrl: d.fontUrl?.trim() || undefined,
      logoUrl: d.logoUrl?.trim() || undefined,
    };
    this.builder.partnerTheme.set(theme);
    this.closed.emit();
  }

  clear(): void {
    this.builder.partnerTheme.set(null);
    this.closed.emit();
  }

  cancel(): void {
    this.closed.emit();
  }

  onBackdrop(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.cancel();
  }
}
