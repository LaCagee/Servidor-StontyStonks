export default function Input({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  placeholder, 
  error, 
  disabled = false,
  autoComplete,
  min,
  max,
  step,
  ...props 
}) {
  return (
    <div className="input-group">
      {label && (
        <label htmlFor={name}>
          {label}
        </label>
      )}
      <div className="input-wrapper">
        <input
          type={type}
          id={name}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
          className={error ? 'error' : ''}
          {...props}
        />
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
}