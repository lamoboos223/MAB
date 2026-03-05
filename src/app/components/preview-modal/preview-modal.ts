import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-preview-modal',
  standalone: true,
  templateUrl: './preview-modal.html',
  styleUrl: './preview-modal.scss'
})
export class PreviewModal implements AfterViewInit {
  @Input({ required: true }) html!: string;
  @Output() close = new EventEmitter<void>();
  @ViewChild('previewFrame') previewFrame!: ElementRef<HTMLIFrameElement>;

  ngAfterViewInit(): void {
    const iframe = this.previewFrame.nativeElement;
    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(this.html);
      doc.close();
    }
  }
}
