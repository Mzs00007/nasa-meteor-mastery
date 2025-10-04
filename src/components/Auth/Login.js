import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth.css';

const Login = ({ setIsAuthenticated }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpField, setShowOtpField] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async e => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      // In a real app, this would be an API call
      // For demo purposes, we'll simulate sending an OTP
      console.log('Login attempt with:', email);

      // Simulate OTP being sent
      setShowOtpField(true);
      // In a real app, this would trigger an API call to send OTP to email
    } catch (error) {
      setError('Login failed. Please try again.');
      console.error('Login error:', error);
    }
  };

  const handleOtpSubmit = e => {
    e.preventDefault();

    // Basic validation
    if (!otp || otp.length < 6) {
      setError('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      // In a real app, this would verify the OTP with an API
      // For demo purposes, any 6-digit OTP works
      if (otp.length === 6) {
        // Set authentication state
        setIsAuthenticated(true);
        // Redirect to main app
        navigate('/dashboard');
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch (error) {
      setError('OTP verification failed. Please try again.');
      console.error('OTP verification error:', error);
    }
  };

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <div className='auth-header'>
          <h2>Meteor Madness</h2>
          <p>Advanced Solar System Simulation</p>
        </div>

        {!showOtpField ? (
          <form onSubmit={handleLogin} className='auth-form'>
            <div className='form-group'>
              <label htmlFor='email'>Email</label>
              <input
                type='email'
                id='email'
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder='Enter your email'
                required
              />
            </div>

            <div className='form-group'>
              <label htmlFor='password'>Password</label>
              <input
                type='password'
                id='password'
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder='Enter your password'
                required
              />
            </div>

            {error && <div className='auth-error'>{error}</div>}

            <button type='submit' className='auth-button'>
              Login
            </button>

            <div className='auth-links'>
              <a href='/register'>Create Account</a>
              <a href='/forgot-password'>Forgot Password?</a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleOtpSubmit} className='auth-form'>
            <div className='form-group'>
              <label htmlFor='otp'>Enter OTP sent to your email</label>
              <input
                type='text'
                id='otp'
                value={otp}
                onChange={e => setOtp(e.target.value)}
                placeholder='6-digit OTP'
                maxLength={6}
                required
              />
            </div>

            {error && <div className='auth-error'>{error}</div>}

            <button type='submit' className='auth-button'>
              Verify OTP
            </button>

            <div className='auth-links'>
              <button
                type='button'
                className='text-button'
                onClick={() => setShowOtpField(false)}
              >
                Back to Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default Login;
