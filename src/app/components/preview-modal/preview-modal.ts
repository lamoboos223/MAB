import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';

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

  private navigationListener: ((event: MessageEvent) => void) | null = null;

  ngAfterViewInit(): void {
    this.loadPage('index.html');

    // Listen for navigation messages from the iframe
    this.navigationListener = (event: MessageEvent) => {
      if (event.data?.type === 'navigate' && event.data.page) {
        this.loadPage(event.data.page);
      }
    };
    window.addEventListener('message', this.navigationListener);
  }

  ngOnDestroy(): void {
    if (this.navigationListener) {
      window.removeEventListener('message', this.navigationListener);
    }
  }

  private loadPage(fileName: string): void {
    const html = this.pages[fileName];
    if (!html) return;

    // Inject a navigation interceptor that catches link clicks and location changes
    const interceptor = `
<script>
(function() {
  // Intercept window.location.href assignments
  var originalDescriptor = Object.getOwnPropertyDescriptor(window, 'location');

  // Override link clicks and location changes
  document.addEventListener('click', function(e) {
    var link = e.target.closest('a');
    if (link && link.href) {
      e.preventDefault();
      var page = link.getAttribute('href');
      window.parent.postMessage({ type: 'navigate', page: page }, '*');
    }
  });

  // Patch window.location.href setter for button navigation
  var _origHref = window.location.href;
  setInterval(function() {
    // Can't override location directly, so we intercept via the generated JS
  }, 100);
})();

// Override window.location.href in generated code
var _realLocation = window.location;
Object.defineProperty(window, '_navigateTo', {
  value: function(page) {
    window.parent.postMessage({ type: 'navigate', page: page }, '*');
  }
});
</script>`;

    // Replace window.location.href navigations with postMessage calls
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
