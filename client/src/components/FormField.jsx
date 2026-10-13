import '../styles/components/form-field.css';

export default function FormField({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  placeholder,
  required = false,
  options,
  rows = 3,
  disabled = false,
  ...props
}) {
  const id = `field-${name}`;
  const errorClass = error ? '--error' : '';

  const handleChange = (e) => {
    onChange(name, e.target.value);
  };

  let input;

  if (type === 'select') {
    input = (
      <select
        id={id}
        name={name}
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        className={`form-field__select${errorClass ? ' form-field__select' + errorClass : ''}`}
        {...props}
      >
        <option value="">{placeholder || 'Select...'}</option>
        {options?.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    );
  } else if (type === 'textarea') {
    input = (
      <textarea
        id={id}
        name={name}
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className={`form-field__textarea${errorClass ? ' form-field__textarea' + errorClass : ''}`}
        {...props}
      />
    );
  } else {
    input = (
      <input
        id={id}
        name={name}
        type={type}
        value={value || ''}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`form-field__input${errorClass ? ' form-field__input' + errorClass : ''}`}
        {...props}
      />
    );
  }

  return (
    <div className="form-field">
      {label && (
        <label
          htmlFor={id}
          className={`form-field__label${required ? ' form-field__label--required' : ''}`}
        >
          {label}
        </label>
      )}
      {input}
      {error && <span className="form-field__error">{error}</span>}
    </div>
  );
}
