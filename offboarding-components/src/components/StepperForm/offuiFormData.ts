export interface FormOption {
  label: string;
  value: string;
}

export interface FormField {
  name: string;
  label: string;
  type: 'text' | 'date' | 'select' | 'textarea';
  placeholder?: string;
  value?: string | null;
  options?: FormOption[];
}

export interface FormComponentProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => void;
}