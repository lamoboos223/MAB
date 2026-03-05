import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BuilderService } from '../../../services/builder.service';
import { TwkFunctionsService } from '../../../services/twk-functions.service';
import { TwkBinding, ElementOption } from '../../../models/element.model';

@Component({
  selector: 'app-data-tab',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './data-tab.html',
  styleUrl: './data-tab.scss'
})
export class DataTab {
  builder = inject(BuilderService);
  twkService = inject(TwkFunctionsService);
  categories = this.twkService.getCategories();

  get element() { return this.builder.selectedElement(); }
  get supportsDataSource(): boolean { return ['text', 'image', 'dropdown', 'radio', 'checkbox', 'map'].includes(this.element?.type ?? ''); }
  get supportsItemActions(): boolean { return ['dropdown', 'radio', 'checkbox'].includes(this.element?.type ?? ''); }
  get supportsButtonAction(): boolean { return this.element?.type === 'button'; }

  getFunctionsForCategory(category: string) { return this.twkService.getByCategory(category); }

  setDataSource(source: 'static' | 'dynamic'): void {
    const el = this.element; if (!el) return;
    this.builder.updateElement(el.id, { dataSource: source });
  }

  setDynamicFunction(functionName: string): void {
    const el = this.element; if (!el) return;
    const fn = this.twkService.getByName(functionName);
    if (!fn) return;
    this.builder.updateElement(el.id, { dynamicBinding: { functionName: fn.name, params: {}, resultPath: fn.returns.path } });
  }

  setFunctionParam(paramName: string, value: string): void {
    const el = this.element; if (!el || !el.dynamicBinding) return;
    const params = { ...el.dynamicBinding.params, [paramName]: value };
    this.builder.updateElement(el.id, { dynamicBinding: { ...el.dynamicBinding, params } });
  }

  setButtonAction(functionName: string): void {
    const el = this.element; if (!el) return;
    if (functionName === '__navigate__') {
      this.builder.updateElement(el.id, { dynamicBinding: undefined, pageNavigateTo: '' });
      return;
    }
    const fn = this.twkService.getByName(functionName);
    if (!fn) return;
    this.builder.updateElement(el.id, { dynamicBinding: { functionName: fn.name, params: {}, resultPath: fn.returns.path }, pageNavigateTo: undefined });
  }

  setPageNavigateTo(pageId: string): void {
    const el = this.element; if (!el) return;
    this.builder.updateElement(el.id, { pageNavigateTo: pageId });
  }

  setOptionAction(index: number, functionName: string): void {
    const el = this.element; if (!el) return;
    const options = [...el.options];
    if (functionName === '') {
      options[index] = { ...options[index], action: undefined };
    } else {
      const fn = this.twkService.getByName(functionName);
      if (!fn) return;
      options[index] = { ...options[index], action: { functionName: fn.name, params: {}, resultPath: fn.returns.path } };
    }
    this.builder.updateElement(el.id, { options });
  }
}
