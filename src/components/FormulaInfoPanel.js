import React, { useState } from 'react';
import '../styles/components.css';

const FormulaInfoPanel = ({
  title,
  formula,
  description,
  parameters,
  source,
  children,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className='formula-panel'>
      <div
        className='formula-header'
        onClick={() => setIsExpanded(!isExpanded)}
        style={{ cursor: 'pointer' }}
      >
        <h3 className='formula-title'>{title}</h3>
        <span className='formula-toggle'>{isExpanded ? '▼' : '►'}</span>
      </div>

      {isExpanded && (
        <div className='formula-content'>
          <div className='formula-display'>
            <code className='formula-text'>{formula}</code>
          </div>

          {description && (
            <div className='formula-description'>
              <p>{description}</p>
            </div>
          )}

          {parameters && parameters.length > 0 && (
            <div className='formula-parameters'>
              <h4>Parameters:</h4>
              <ul>
                {parameters.map((param, index) => (
                  <li key={index}>
                    <strong>{param.name}:</strong> {param.description}
                    {param.units && <span> ({param.units})</span>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {source && (
            <div className='formula-source'>
              <small>Source: {source}</small>
            </div>
          )}

          {children}
        </div>
      )}
    </div>
  );
};

export default FormulaInfoPanel;
