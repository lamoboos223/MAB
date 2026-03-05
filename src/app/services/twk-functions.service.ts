import { Injectable } from '@angular/core';
import { TWK_FUNCTIONS, TwkFunctionDef } from '../data/twk-registry';

@Injectable({ providedIn: 'root' })
export class TwkFunctionsService {
  private functions = TWK_FUNCTIONS;

  getAll(): TwkFunctionDef[] {
    return this.functions;
  }

  getByCategory(category: string): TwkFunctionDef[] {
    return this.functions.filter(f => f.category === category);
  }

  getCategories(): string[] {
    return [...new Set(this.functions.map(f => f.category))];
  }

  getByName(name: string): TwkFunctionDef | undefined {
    return this.functions.find(f => f.name === name);
  }

  search(query: string): TwkFunctionDef[] {
    const lower = query.toLowerCase();
    return this.functions.filter(
      f => f.name.toLowerCase().includes(lower) ||
           f.description.toLowerCase().includes(lower)
    );
  }
}
