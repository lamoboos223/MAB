import { Injectable, inject } from '@angular/core';
import { BuilderService } from './builder.service';
import { CodeGeneratorService } from './code-generator.service';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

@Injectable({ providedIn: 'root' })
export class ExportService {
  private builder = inject(BuilderService);
  private codeGen = inject(CodeGeneratorService);

  async exportZip(): Promise<void> {
    const pages = this.builder.pages();
    const themeMode = this.builder.appThemeMode();
    const zip = new JSZip();

    const htmlPages = this.codeGen.generatePages(pages);
    for (const page of htmlPages) {
      zip.file(page.fileName, page.html);
    }

    const css = this.codeGen.generateCss(pages, themeMode);
    zip.file('css/style.css', css);

    const js = this.codeGen.generateJs(pages, themeMode, this.builder.secretKey(), this.builder.debugMode());
    zip.file('js/app.js', js);

    const twkHelperContent = await this.loadTwkHelper();
    zip.file('js/twkhelper.js', twkHelperContent);

    const hasIcons = pages.some(p => p.elements.some(e =>
      e.settings['icon'] || e.options.some(o => o.icon)
    ));
    if (hasIcons) {
      await this.addPrimeIcons(zip);
    }

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'miniapp.zip');
  }

  private async loadTwkHelper(): Promise<string> {
    const response = await fetch('assets/js/twkhelper.js');
    return response.text();
  }

  private async addPrimeIcons(zip: JSZip): Promise<void> {
    const cssResp = await fetch('assets/primeicons/primeicons.css');
    let css = await cssResp.text();
    // Rewrite font paths from ./fonts/ to ../css/fonts/ since CSS is in css/ folder
    css = css.replace(/url\(["']?\.\/fonts\//g, 'url("fonts/');
    zip.file('css/primeicons.css', css);

    const fontFiles = ['primeicons.woff2', 'primeicons.woff', 'primeicons.ttf', 'primeicons.eot', 'primeicons.svg'];
    for (const f of fontFiles) {
      try {
        const resp = await fetch(`assets/primeicons/fonts/${f}`);
        const blob = await resp.blob();
        zip.file(`css/fonts/${f}`, blob);
      } catch { /* skip missing font formats */ }
    }
  }
}
