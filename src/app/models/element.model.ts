export type ElementType =
  | 'text'
  | 'button'
  | 'image'
  | 'input'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'map'
  | 'divider';

export interface ElementStyle {
  fontSize?: string;
  fontWeight?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  width?: string;
  height?: string;
}

export interface TwkBinding {
  functionName: string;
  params: Record<string, string>;
  resultPath: string;
}

export interface ElementOption {
  label: string;
  value: string;
  action?: TwkBinding;
}

export interface BuilderElement {
  id: string;
  type: ElementType;
  label: string;
  styles: ElementStyle;
  dataSource: 'static' | 'dynamic';
  staticContent: string;
  dynamicBinding?: TwkBinding;
  options: ElementOption[];
  settings: Record<string, string>;
  pageNavigateTo?: string;
}
