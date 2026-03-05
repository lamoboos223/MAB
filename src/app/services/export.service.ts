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
    const zip = new JSZip();

    const htmlPages = this.codeGen.generatePages(pages);
    for (const page of htmlPages) {
      zip.file(page.fileName, page.html);
    }

    const css = this.codeGen.generateCss(pages);
    zip.file('css/style.css', css);

    const js = this.codeGen.generateJs(pages);
    zip.file('js/app.js', js);

    const twkHelperContent = await this.loadTwkHelper();
    zip.file('js/twkhelper.js', twkHelperContent);

    const blob = await zip.generateAsync({ type: 'blob' });
    saveAs(blob, 'miniapp.zip');
  }

  private async loadTwkHelper(): Promise<string> {
    const response = await fetch('assets/js/twkhelper.js');
    return response.text();
  }
}
