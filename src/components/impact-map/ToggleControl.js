import React from 'react';

const ToggleControl = ({ label, checked, onChange, description }) => {
  return (
    <div className='control-group'>
      <div className='toggle-control' onClick={() => onChange(!checked)}>
        <input
          type='checkbox'
          className='glass-toggle'
          checked={checked}
          onChange={() => onChange(!checked)}
        />
        <div className='toggle-slider' />
        <span className='toggle-label'>{label}</span>
      </div>
      {description && <div className='control-description'>{description}</div>}
    </div>
  );
};

export default ToggleControl;
