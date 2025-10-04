import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../../styles/auth.css';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleRegister = async e => {
    e.preventDefault();
    setError('');

    // Basic validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // In a real app, this would be an API call to register the user
      // For demo purposes, we'll simulate a successful registration
      console.log('Registration attempt with:', email);

      // Simulate successful registration
      setSuccess(
        'Registration successful! An OTP has been sent to your email for verification.'
      );

      // In a real app, redirect to login or OTP verification
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      setError('Registration failed. Please try again.');
      console.error('Registration error:', error);
    }
  };

  return (
    <div className='auth-container'>
      <div className='auth-card'>
        <div className='auth-header'>
          <h2>Create Account</h2>
          <p>Join Meteor Madness for advanced solar system simulations</p>
        </div>

        <form onSubmit={handleRegister} className='auth-form'>
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
              placeholder='Create a password'
              required
            />
          </div>

          <div className='form-group'>
            <label htmlFor='confirmPassword'>Confirm Password</label>
            <input
              type='password'
              id='confirmPassword'
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder='Confirm your password'
              required
            />
          </div>

          {error && <div className='auth-error'>{error}</div>}
          {success && <div className='auth-success'>{success}</div>}

          <button type='submit' className='auth-button'>
            Register
          </button>

          <div className='auth-links'>
            <a href='/login'>Already have an account? Login</a>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
