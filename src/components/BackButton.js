import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../styles/BackButton.css';

const BackButton = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Don't render on the landing page
  if (location.pathname === '/') {
    return null;
  }

  const handleBackClick = () => {
    // Check if there's history to go back to
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      // Fallback to home page if no history
      navigate('/');
    }
  };

  return (
    <button 
      className="back-button glamorous-back-btn"
      onClick={handleBackClick}
      aria-label="Go back to previous page"
      title="Return to previous page"
    >
      <div className="back-button-content">
        <div className="back-icon">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <path 
              d="M19 12H5M12 19L5 12L12 5" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span className="back-text">Back</span>
      </div>
      <div className="back-button-glow"></div>
    </button>
  );
};

export default BackButton;