import { Component, inject } from '@angular/core';
import { ExportService } from '../../services/export.service';
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
  private builder = inject(BuilderService);
  private codeGen = inject(CodeGeneratorService);
  themeService = inject(ThemeService);

  showPreview = false;
  previewPages: Record<string, string> = {};

  preview(): void {
    const pages = this.builder.pages();
    const htmlPages = this.codeGen.generatePages(pages);
    const css = this.codeGen.generateCss(pages);
    const js = this.codeGen.generateJs(pages);
    const mockTwk = this.generateMockTwk();

    const inlinedPages: Record<string, string> = {};
    for (const page of htmlPages) {
      inlinedPages[page.fileName] = page.html
        .replace('<link rel="stylesheet" href="css/style.css">', `<style>${css}</style>`)
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

  toggleTheme(): void { this.themeService.toggle(); }

  private generateMockTwk(): string {
    return `getUserFullName: function() { return Promise.resolve({ result: { full_name: 'Test User' }}); },
      getUserId: function() { return Promise.resolve({ result: { user_id: '1234567890' }}); },
      getUserMobileNumber: function() { return Promise.resolve({ result: { mobile_number: '0501234567' }}); },
      getUserNationality: function() { return Promise.resolve({ result: { nationality_name: 'Saudi Arabia' }}); },
      getUserLocation: function() { return Promise.resolve({ result: { latitude: 24.7136, longitude: 46.6753 }}); },
      getCameraPhoto: function() { return Promise.resolve({ result: '' }); },
      getGallerySingle: function() { return Promise.resolve({ result: '' }); },
      scanCode: function() { return Promise.resolve({ result: 'mock-qr-code' }); }`;
  }
}
