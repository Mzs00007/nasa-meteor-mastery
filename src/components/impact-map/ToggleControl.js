import React from 'react';

const ToggleControl = ({ label, checked, onChange, description }) => {
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onChange(!checked);
    }
  };

  return (
    <div className='control-group'>
      <div 
        className='toggle-control' 
        onClick={() => onChange(!checked)}
        onKeyDown={handleKeyPress}
        role="button"
        tabIndex={0}
        aria-pressed={checked}
        aria-label={`Toggle ${label}`}
      >
        <input
          type='checkbox'
          className='glass-toggle'
          checked={checked}
          onChange={() => onChange(!checked)}
          tabIndex={-1}
        />
        <div className='toggle-slider' />
        <span className='toggle-label'>{label}</span>
      </div>
      {description && <div className='control-description'>{description}</div>}
    </div>
  );
};

export default ToggleControl;
