import { Component, Input, Output, EventEmitter, inject, ElementRef, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TwkFunctionsService } from '../../services/twk-functions.service';
import { TwkFunctionDef } from '../../data/twk-registry';

@Component({
  selector: 'app-function-picker',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './function-picker.html',
  styleUrl: './function-picker.scss'
})
export class FunctionPicker {
  @Input() value = '';
  @Input() placeholder = 'Search functions...';
  @Input() showNavigate = false;
  @Input() showSubmit = false;
  @Output() valueChange = new EventEmitter<string>();

  twkService = inject(TwkFunctionsService);
  private elRef = inject(ElementRef);

  open = false;
  search = '';

  get selectedFn(): TwkFunctionDef | null {
    if (!this.value || this.value === '__navigate__' || this.value === '__submit__') return null;
    return this.twkService.getByName(this.value) ?? null;
  }

  get displayText(): string {
    if (this.value === '__navigate__') return 'Navigate to Page';
    if (this.value === '__submit__') return 'Submit to API';
    if (this.selectedFn) return this.selectedFn.name;
    return '';
  }

  get categories(): string[] {
    return this.twkService.getCategories();
  }

  filteredFunctions(category: string): TwkFunctionDef[] {
    const fns = this.twkService.getByCategory(category);
    if (!this.search) return fns;
    const q = this.search.toLowerCase();
    return fns.filter(fn =>
      fn.name.toLowerCase().includes(q) || fn.description.toLowerCase().includes(q)
    );
  }

  get hasResults(): boolean {
    if (this.showNavigate && !this.search) return true;
    if (this.showNavigate && 'navigate to page'.includes(this.search.toLowerCase())) return true;
    if (this.showSubmit && !this.search) return true;
    if (this.showSubmit && 'submit to api'.includes(this.search.toLowerCase())) return true;
    return this.categories.some(c => this.filteredFunctions(c).length > 0);
  }

  toggle(): void {
    this.open = !this.open;
    if (this.open) this.search = '';
  }

  select(functionName: string): void {
    this.value = functionName;
    this.valueChange.emit(functionName);
    this.open = false;
    this.search = '';
  }

  clear(event: Event): void {
    event.stopPropagation();
    this.value = '';
    this.valueChange.emit('');
    this.open = false;
  }

  @HostListener('document:click', ['$event'])
  onClickOutside(event: Event): void {
    if (!this.elRef.nativeElement.contains(event.target)) {
      this.open = false;
    }
  }
}
