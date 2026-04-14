import { BuilderElement } from './element.model';

export interface Block {
  id: string;
  name: string;
  icon: string;
  createdAt: number;
  element: Omit<BuilderElement, 'id' | 'position'>;
}
