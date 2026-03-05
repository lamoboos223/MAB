import { Component, inject } from '@angular/core';
import { BuilderService } from '../../services/builder.service';

@Component({
  selector: 'app-page-tabs',
  standalone: true,
  imports: [],
  templateUrl: './page-tabs.html',
  styleUrl: './page-tabs.scss'
})
export class PageTabs {
  builder = inject(BuilderService);

  addPage(): void {
    this.builder.addPage();
  }

  selectPage(pageId: string): void {
    this.builder.setActivePage(pageId);
  }

  removePage(event: Event, pageId: string): void {
    event.stopPropagation();
    if (this.builder.pages().length > 1) {
      this.builder.removePage(pageId);
    }
  }
}
