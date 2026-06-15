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
  /** Force this field to span both columns. Textareas default to true; all others default to false. */
  fullWidth?: boolean;
}

export interface FormComponentProps {
  title: string;
  subtitle: string;
  submitLabel: string;
  fields: FormField[];
  onSubmit: (data: Record<string, string>) => void;
  submitDisabled?: boolean;
}