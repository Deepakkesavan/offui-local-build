import React, { useState } from 'react';
import './offuiForms.css';
import { type FormField, type FormComponentProps } from './offuiFormData';


const offuiForms: React.FC<FormComponentProps> = ({
  title,
  subtitle,
  fields,
  submitLabel,
  onSubmit,
}) => {
  const initialValues = fields.reduce<Record<string, string>>(
  (acc, field) => {
    acc[field.name] = field.value ?? '';
    return acc;
  },
  {}
);

  const [formData, setFormData] =
  useState<Record<string, string>>(initialValues);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
          const readOnly =
            field.value !== null &&
            field.value !== undefined &&
            field.value !== '';

          const fullWidth =
            field.type === 'textarea' ||
            field.type === 'select';

          return (
            <div
              key={field.name}
              className={`offui-field ${
                fullWidth ? 'full-width' : ''
              }`}
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
                />
              )}

              {field.type === 'select' && (
                <select
                  name={field.name}
                  value={formData[field.name]}
                  onChange={handleChange}
                >
                  <option value="">
                    {field.placeholder}
                  </option>

                  {field.options?.map(
  (option: { label: string; value: string }) => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
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
        >
          {submitLabel}
        </button>
      </div>
    </form>
  );
};

export default offuiForms;