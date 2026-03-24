export type ElementType =
  | 'text'
  | 'button'
  | 'image'
  | 'input'
  | 'dropdown'
  | 'radio'
  | 'checkbox'
  | 'map'
  | 'date-picker'
  | 'media-select'
  | 'divider'
  | 'alert'
  | 'table'
  | 'container';

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

export interface VisibilityCondition {
  source: 'element' | 'function' | 'geofence';
  behavior: 'show_hide' | 'enable_disable';
  elementId?: string;
  functionBinding?: TwkBinding;
  operator: 'equals' | 'not_equals' | 'contains' | 'empty' | 'not_empty' | 'greater_than' | 'less_than' | 'button_active' | 'button_not_active';
  value?: string;
  geofenceLat?: string;
  geofenceLng?: string;
  geofenceRadius?: string;
}

export interface ElementOption {
  label: string;
  value: string;
  image?: string;
  icon?: string;
  action?: TwkBinding;
}

export interface I18nTranslation {
  staticContent?: string;
  settings?: Record<string, string>;
  options?: { label: string }[];
}

export interface FieldMapping {
  elementId: string;
  elementLabel: string;
  pageName: string;
  keyName: string;
  source: 'input' | 'dynamic' | 'dropdown' | 'radio' | 'checkbox' | 'date-picker' | 'media-select' | 'map';
}

export interface SubmitHeader {
  key: string;
  value: string;
}

export interface SubmitConfig {
  apiUrl: string;
  method: string;
  fieldMappings: FieldMapping[];
  payloadTemplate: string;
  headers: SubmitHeader[];
  successPage: string;
  errorMessage: string;
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
  i18nEnabled?: boolean;
  i18n?: { ar: I18nTranslation };
  darkStyles?: ElementStyle;
  submitConfig?: SubmitConfig;
  position?: { x: number; y: number };
  visibilityCondition?: VisibilityCondition; // deprecated, kept for migration
  visibilityConditions?: VisibilityCondition[];
  tableData?: string[][];
}
