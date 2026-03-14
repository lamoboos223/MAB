import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { BuilderService } from '../../services/builder.service';
import { inject } from '@angular/core';

@Component({
  selector: 'app-preview-modal',
  standalone: true,
  templateUrl: './preview-modal.html',
  styleUrl: './preview-modal.scss'
})
export class PreviewModal implements AfterViewInit, OnDestroy {
  @Input({ required: true }) pages!: Record<string, string>;
  @Output() close = new EventEmitter<void>();
  @ViewChild('previewFrame') previewFrame!: ElementRef<HTMLIFrameElement>;

  private builder = inject(BuilderService);
  private messageListener: ((event: MessageEvent) => void) | null = null;

  debugLogs: { time: string; message: string; error: string }[] = [];

  get debugMode(): boolean {
    return this.builder.debugMode();
  }

  ngAfterViewInit(): void {
    this.loadPage('index.html');

    this.messageListener = (event: MessageEvent) => {
      if (!event.data?.type) return;

      if (event.data.type === 'navigate' && event.data.page) {
        this.loadPage(event.data.page);
      } else if (event.data.type === 'debug-log') {
        this.addLog(event.data.message, event.data.error);
      } else if (event.data.type === 'fetch-request') {
        this.proxyFetch(event.data);
      }
    };
    window.addEventListener('message', this.messageListener);
  }

  ngOnDestroy(): void {
    if (this.messageListener) {
      window.removeEventListener('message', this.messageListener);
    }
  }

  clearLogs(): void {
    this.debugLogs = [];
  }

  private addLog(message: string, error: string): void {
    const time = new Date().toLocaleTimeString();
    this.debugLogs.unshift({ time, message, error });
  }

  private async proxyFetch(req: { id: number; url: string; method: string; headers: Record<string, string>; body: string | null }): Promise<void> {
    const iframe = this.previewFrame.nativeElement;
    try {
      // Route through local CORS proxy to avoid browser CORS restrictions
      const proxyUrl = `http://localhost:4201/${encodeURIComponent(req.url)}`;
      const resp = await fetch(proxyUrl, {
        method: req.method,
        headers: req.headers,
        body: req.body
      });
      const body = await resp.text();
      iframe.contentWindow?.postMessage({
        type: 'fetch-response',
        id: req.id,
        ok: resp.ok,
        status: resp.status,
        body
      }, '*');
    } catch (err: any) {
      iframe.contentWindow?.postMessage({
        type: 'fetch-response',
        id: req.id,
        error: err.message || 'Network error'
      }, '*');
    }
  }

  private loadPage(fileName: string): void {
    const html = this.pages[fileName];
    if (!html) return;

    const interceptor = `
<script>
(function() {
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (link && link.href) {
      e.preventDefault();
      var page = link.getAttribute('href');
      window.parent.postMessage({ type: 'navigate', page: page }, '*');
    }
  });
})();

Object.defineProperty(window, '_navigateTo', {
  value: function(page) {
    window.parent.postMessage({ type: 'navigate', page: page }, '*');
  }
});
</script>`;

    const patchedHtml = html
      .replace(/window\.location\.href\s*=\s*'([^']+)'/g, "window.parent.postMessage({ type: 'navigate', page: '$1' }, '*')")
      .replace('</head>', interceptor + '\n</head>');

    const iframe = this.previewFrame.nativeElement;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(patchedHtml);
      doc.close();
    }
  }
}
