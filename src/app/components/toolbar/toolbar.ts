import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { ExportService } from '../../services/export.service';
import { ImportService } from '../../services/import.service';
import { BuilderService } from '../../services/builder.service';
import { CodeGeneratorService } from '../../services/code-generator.service';
import { ThemeService } from '../../services/theme.service';
import { PreviewModal } from '../preview-modal/preview-modal';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [PreviewModal],
  templateUrl: './toolbar.html',
  styleUrl: './toolbar.scss'
})
export class Toolbar {
  private exportService = inject(ExportService);
  private importService = inject(ImportService);
  builder = inject(BuilderService);
  private codeGen = inject(CodeGeneratorService);
  themeService = inject(ThemeService);

  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;

  showPreview = false;
  previewPages: Record<string, string> = {};

  preview(): void {
    const pages = this.builder.pages();
    const themeMode = this.builder.appThemeMode();
    const htmlPages = this.codeGen.generatePages(pages);
    const css = this.codeGen.generateCss(pages, themeMode);
    const js = this.codeGen.generateJs(pages, themeMode, this.builder.secretKey(), this.builder.debugMode());
    const mockTwk = this.generateMockTwk();

    const inlinedPages: Record<string, string> = {};
    for (const page of htmlPages) {
      inlinedPages[page.fileName] = page.html
        .replace('<link rel="stylesheet" href="css/style.css">', `<style>${css}</style>`)
        .replace('<link rel="stylesheet" href="css/primeicons.css">', '<link rel="stylesheet" href="https://unpkg.com/primeicons/primeicons.css">')
        .replace(
          '  <script src="js/twkhelper.js"></script>\n  <script src="js/app.js"></script>',
          `<script>\nvar TWK = { ${mockTwk} };\n</script>\n<script>${js}</script>`
        );
    }

    this.previewPages = inlinedPages;
    this.showPreview = true;
  }

  closePreview(): void { this.showPreview = false; }

  async export(): Promise<void> { await this.exportService.exportZip(); }

  triggerImport(): void { this.fileInput.nativeElement.click(); }

  async onFileSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    await this.importService.importZip(file);
    input.value = '';
  }

  toggleTheme(): void { this.themeService.toggle(); }

  get previewLang() { return this.builder.activeLang(); }

  setPreviewLang(lang: 'en' | 'ar'): void { this.builder.activeLang.set(lang); }

  private generateMockTwk(): string {
    const appearance = this.themeService.theme() === 'light' ? '1' : '2';
    const lang = this.previewLang;
    return `getUserFullName: function() { return Promise.resolve({ result: { full_name: 'Test User' }}); },
      getUserId: function() { return Promise.resolve({ result: { user_id: '1234567890' }}); },
      getUserMobileNumber: function() { return Promise.resolve({ result: { mobile_number: '0501234567' }}); },
      getUserNationality: function() { return Promise.resolve({ result: { nationality_name: 'Saudi Arabia' }}); },
      getUserLocation: function() { return Promise.resolve({ result: { latitude: 24.7136, longitude: 46.6753 }}); },
      generateToken: function() { return Promise.resolve({ result: { token: 'mock-jwt-token-for-preview' }}); },
      getCameraPhoto: function() { return Promise.resolve({ result: '' }); },
      getCameraVideo: function() { return Promise.resolve({ result: '' }); },
      getGallerySingle: function() { return Promise.resolve({ result: '' }); },
      getGalleryMulti: function() { return Promise.resolve({ result: [] }); },
      getRawData: function() { return Promise.resolve({ result: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==' }); },
      scanCode: function() { return Promise.resolve({ result: 'mock-qr-code' }); },
      getUserUnPaidViolations: function() { return Promise.resolve({ result: [{ manufacturer: 'فورد', plate_number: '2018 J  U  L', street_speed: '0', total_fine_amount: '150', vehicle_model: 'فوكس', vehicle_speed: '0', vehicle_type: 'PRIVATE', violation_city: 'رياض', violation_date_time: ' 12:30 م', violation_number: '1006651', violation_status: 'PAID VIOLATION', violation_type: 'IMPROPER USE OF THE HORN' }, { manufacturer: 'فورد', plate_number: '2018 J  U  L', street_speed: '0', total_fine_amount: '100', vehicle_model: 'فوكس', vehicle_speed: '0', vehicle_type: 'PRIVATE', violation_city: 'رياض', violation_date_time: ' 12:30 م', violation_number: '1006651', violation_status: 'PAID VIOLATION', violation_type: 'Using Unauthorized Devices or Improper Stickers or Signs' }] }); },
      getDeviceInfo: function() { return Promise.resolve({ result: { device_model: 'Preview', os_version: '1.0', appearance: '${appearance}', app_language: '${lang}' }}); }`;
  }
}
