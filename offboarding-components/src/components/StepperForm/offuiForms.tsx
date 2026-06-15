import React, { useState } from 'react';
import './offuiForms.css';
import { type FormComponentProps } from './offuiFormData';

const offuiForms: React.FC<FormComponentProps> = ({
  title,
  subtitle,
  fields,
  submitLabel,
  onSubmit,
  submitDisabled = false,
}) => {
  const initialValues = fields.reduce<Record<string, string>>(
    (acc, field) => {
      acc[field.name] = field.value ?? '';
      return acc;
    },
    {}
  );

  const [formData, setFormData] = useState<Record<string, string>>(initialValues);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const submitForm = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form className="offui-form" onSubmit={submitForm}>
      <div className="offui-form-header">
        <h2>{title}</h2>
        <p>{subtitle}</p>
      </div>

      <div className="offui-form-grid">
        {fields.map((field) => {
          // A field is read-only when a non-empty value prop is explicitly provided
          const readOnly =
            field.value !== null &&
            field.value !== undefined &&
            field.value !== '';

          // fullWidth: honour explicit prop; default true for textarea/select, false otherwise
          const isFullWidth =
            field.fullWidth !== undefined
              ? field.fullWidth
              : field.type === 'textarea' || field.type === 'select';

          return (
            <div
              key={field.name}
              className={`offui-field ${isFullWidth ? 'full-width' : ''}`}
            >
              <label>{field.label}</label>

              {field.type === 'text' && (
                <input
                  type="text"
                  name={field.name}
                  value={formData[field.name]}
                  placeholder={field.placeholder}
                  onChange={handleChange}
                  disabled={readOnly}
                />
              )}

              {field.type === 'date' && (
                <input
                  type="date"
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  disabled={readOnly}
                />
              )}

              {field.type === 'select' && (
                <select
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                  disabled={readOnly}
                >
                  <option value="">{field.placeholder}</option>
                  {field.options?.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}

              {field.type === 'textarea' && (
                <textarea
                  name={field.name}
                  value={formData[field.name]}
                  placeholder={field.placeholder}
                  onChange={handleChange}
                  rows={5}
                  disabled={readOnly}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="offui-actions">
        <button
          type="submit"
          className="offui-submit-btn"
          disabled={submitDisabled}
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default offuiForms;