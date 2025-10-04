import React from 'react';

const SliderControl = ({
  label,
  value,
  min,
  max,
  step,
  unit,
  onChange,
  description,
  formatValue,
}) => {
  const displayValue = formatValue ? formatValue(value) : value;

  return (
    <div className='control-group'>
      <div className='control-label'>
        <span>{label}</span>
        <span className='control-value'>
          {displayValue} {unit}
        </span>
      </div>
      <input
        type='range'
        className='glass-slider'
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
      />
      {description && <div className='control-description'>{description}</div>}
    </div>
  );
};

export default SliderControl;
