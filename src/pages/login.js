import React, { useState } from 'react';
import { Hotel, Mail, Lock, LogIn, X } from 'lucide-react';
import './login.css';
import { Link, useNavigate } from 'react-router-dom';


function Login({ hotelName = "Grand Horizon Hotel" }) {

  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false); // Add this state

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();

    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
      try {
        const response = await fetch('https://hotel-backend-dm5h.onrender.com/api/hotel/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (result.success) {
          // Store the logged-in hotel's info (name, image, tableCount)
          localStorage.setItem('hotelUser', JSON.stringify(result.data));
          
          // Redirect to the admin page
          navigate('/admin'); 
        } else {
          setErrors({ server: result.message });
        }
      } catch (err) {
        setErrors({ server: "Server error. Please try again." });
      } finally {
        setIsLoading(false);
      }
    }
  };

  // const handleGuestLogin = () => {
  //   alert(`Continuing as guest at ${hotelName}`);
  // };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    alert('Password reset functionality will be implemented soon!');
  };

  // Update this function to show coming soon popup
  // const handleSignUp = (e) => {
  //   e.preventDefault();
  //   setShowComingSoon(true);
  // };

  // Close coming soon modal
  const closeComingSoon = () => {
    setShowComingSoon(false);
  };

  return (
    <div className="login-page">
      <div className="background-slideshow">
        <div className="slide slide1"></div>
        <div className="slide slide2"></div>
        <div className="slide slide3"></div>
      </div>

      <div className="login-container">
        <div className="login-card">
          <div className="hotel-icon">
            <Hotel size={48} />
          </div>

          <p className="welcome-text">Welcome back! Please login to your account.</p>

          <form onSubmit={handleSubmit} className="login-form">
            <div className="input-group">
              <label htmlFor="email">
                <Mail size={18} />
                <span>Email</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className={errors.email ? 'error' : ''}
              />
              {errors.email && <span className="error-message">{errors.email}</span>}
            </div>

            <div className="input-group">
              <label htmlFor="password">
                <Lock size={18} />
                <span>Password</span>
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className={errors.password ? 'error' : ''}
              />
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            <div className="forgot-password">
              <a href="/forgot-password" onClick={handleForgotPassword}>Forgot Password?</a>
            </div>
            {errors.server && <div className="error-banner">{errors.server}</div>}
            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Login</span>
                </>
              )}
            </button>
          </form>

          <div className="signup-link">
            Don't have an account? <Link to="/signup">Sign up</Link>
          </div>

        </div>
      </div>

      {/* Coming Soon Modal */}
      {showComingSoon && (
        <div className="modal-overlay" onClick={closeComingSoon}>
          <div className="coming-soon-modal" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={closeComingSoon}>
              <X size={24} />
            </button>
            <div className="coming-soon-content">
              <Hotel size={64} className="coming-soon-icon" />
              <h2>Coming Soon!</h2>
              <p>We're working hard to bring you the best hotel registration experience.</p>
              <p className="highlight">Sign up feature will be available shortly!</p>
              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
              <button className="notify-button" onClick={closeComingSoon}>
                Notify Me
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Login;