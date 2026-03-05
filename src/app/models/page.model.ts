import { BuilderElement } from './element.model';

export interface Page {
  id: string;
  name: string;
  elements: BuilderElement[];
}
