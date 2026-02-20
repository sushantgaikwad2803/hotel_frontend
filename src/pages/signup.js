import React, { useState } from 'react';
import { 
  Hotel, Mail, Lock, MapPin, Building, Globe, ArrowRight, 
  Camera, Upload, X, Image as ImageIcon, Users,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './signup.css';

function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hotelName: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    state: '',
    tableCount: 0, // Default table count
    hotelImage: null // Single image field
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // New state for single image
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handle single image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file);
    }
  };

  // Handle drag and drop for single image
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    } else {
      alert('Please drop an image file');
    }
  };

  // Process single image
  const processImage = (file) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    // Show upload progress
    setUploadProgress(0);
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 100);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData(prev => ({
        ...prev,
        hotelImage: file
      }));
    };
    reader.readAsDataURL(file);

    // Clear image error if any
    if (errors.images) {
      setErrors(prev => ({
        ...prev,
        images: ''
      }));
    }

    // Reset progress after upload
    setTimeout(() => {
      setUploadProgress(0);
    }, 1000);
  };

  // Remove image
  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      hotelImage: null
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    // Hotel Name validation
    if (!formData.hotelName.trim()) {
      newErrors.hotelName = 'Hotel name is required';
    } else if (formData.hotelName.length < 3) {
      newErrors.hotelName = 'Hotel name must be at least 3 characters';
    }

    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length < 5) {
      newErrors.address = 'Please enter a valid address';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (formData.city.length < 2) {
      newErrors.city = 'Please enter a valid city name';
    }

    // State validation
    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    } else if (formData.state.length < 2) {
      newErrors.state = 'Please enter a valid state name';
    }

    // Table Count validation
    if (!formData.tableCount) {
      newErrors.tableCount = 'Table count is required';
    } else if (formData.tableCount < 1) {
      newErrors.tableCount = 'Table count must be at least 1';
    } else if (formData.tableCount > 500) {
      newErrors.tableCount = 'Table count cannot exceed 500';
    }

    // Image validation (optional but recommended)
    if (!imagePreview) {
      newErrors.images = 'Please upload a hotel image';
    }

    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
  
    if (Object.keys(newErrors).length === 0) {
      setIsLoading(true);
  
      // Create FormData object
      const data = new FormData();
      data.append('hotelName', formData.hotelName);
      data.append('email', formData.email);
      data.append('password', formData.password);
      data.append('address', formData.address);
      data.append('city', formData.city);
      data.append('state', formData.state);
      data.append('tableCount', formData.tableCount);
      
      // Append the actual File object from formData
      if (formData.hotelImage) {
        data.append('hotelImage', formData.hotelImage);
      }
  
      try {
        const response = await fetch('https://hotel-backend-dm5h.onrender.com/api/hotel/signup', {
          method: 'POST',
          body: data, // No headers needed, browser sets Content-Type for FormData
        });
  
        const result = await response.json();
  
        if (result.success) {
          alert("Registration Successful!");
          navigate('/login');
        } else {
          setErrors({ server: result.message });
        }
      } catch (error) {
        alert("Something went wrong. Please try again.");
      } finally {
        setIsLoading(false);
      }
    } else {
      setErrors(newErrors);
    }
  };

  const handleLoginRedirect = (e) => {
    e.preventDefault();
    navigate('/login');
  };

  return (
    <div className="signup-page">
      <div className="background-slideshow">
        <div className="slide slide1"></div>
        <div className="slide slide2"></div>
        <div className="slide slide3"></div>
      </div>

      <div className="signup-container">
        <div className="signup-card">
          <div className="hotel-icon">
            <Hotel size={48} />
          </div>

          <h1 className="hotel-name">Create Hotel Account</h1>
          <p className="welcome-text">Register your hotel to get started</p>

          <form onSubmit={handleSubmit} className="signup-form">
            {/* Hotel Name Field */}
            <div className="input-group">
              <label htmlFor="hotelName">
                <Building size={18} />
                <span>Hotel Name</span>
              </label>
              <input
                type="text"
                id="hotelName"
                name="hotelName"
                value={formData.hotelName}
                onChange={handleChange}
                placeholder="Enter your hotel name"
                className={errors.hotelName ? 'error' : ''}
              />
              {errors.hotelName && <span className="error-message">{errors.hotelName}</span>}
            </div>

            {/* Email Field */}
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

            {/* Password Field */}
            <div className="input-group">
              <label htmlFor="password">
                <Lock size={18} />
                <span>Password</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Create a password"
                  className={errors.password ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.password && <span className="error-message">{errors.password}</span>}
            </div>

            {/* Confirm Password Field */}
            <div className="input-group">
              <label htmlFor="confirmPassword">
                <Lock size={18} />
                <span>Confirm Password</span>
              </label>
              <div className="password-input-wrapper">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  id="confirmPassword"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  className={errors.confirmPassword ? 'error' : ''}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? "Hide" : "Show"}
                </button>
              </div>
              {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
            </div>

            {/* Table Count Field - New Addition */}
            <div className="input-group">
              <label htmlFor="tableCount">
                {/* <Grid size={18} /> */}
                <span>Number of Tables</span>
              </label>
              <div className="table-count-wrapper">
                <button
                  type="button"
                  className="table-count-btn"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    tableCount: Math.max(1, prev.tableCount - 1) 
                  }))}
                >
                </button>
                <input
                  type="number"
                  id="tableCount"
                  name="tableCount"
                  value={formData.tableCount}
                  onChange={handleChange}
                  min="1"
                  max="500"
                  className={errors.tableCount ? 'error table-count-input' : 'table-count-input'}
                />
                <button
                  type="button"
                  className="table-count-btn"
                  onClick={() => setFormData(prev => ({ 
                    ...prev, 
                    tableCount: Math.min(500, prev.tableCount + 1) 
                  }))}
                >
                </button>
              </div>
              {errors.tableCount && <span className="error-message">{errors.tableCount}</span>}
              {/* <small className="field-hint">Total number of tables available in your restaurant</small> */}
            </div>

            {/* Address Field */}
            <div className="input-group">
              <label htmlFor="address">
                <MapPin size={18} />
                <span>Address</span>
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Enter street address"
                className={errors.address ? 'error' : ''}
              />
              {errors.address && <span className="error-message">{errors.address}</span>}
            </div>

            {/* City and State Row */}
            <div className="row-inputs">
              <div className="input-group half">
                <label htmlFor="city">
                  <Globe size={18} />
                  <span>City</span>
                </label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City"
                  className={errors.city ? 'error' : ''}
                />
                {errors.city && <span className="error-message">{errors.city}</span>}
              </div>

              <div className="input-group half">
                <label htmlFor="state">
                  <Globe size={18} />
                  <span>State</span>
                </label>
                <input
                  type="text"
                  id="state"
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  placeholder="State"
                  className={errors.state ? 'error' : ''}
                />
                {errors.state && <span className="error-message">{errors.state}</span>}
              </div>
            </div>

            {/* Single Hotel Image Upload Section */}
            <div className="image-upload-section">
              <label className="image-upload-label">
                <Camera size={18} />
                <span>Hotel Image</span>
              </label>
              
              {/* Image Upload Area */}
              {!imagePreview ? (
                <div 
                  className={`image-upload-area ${isDragging ? 'dragging' : ''} ${errors.images ? 'error' : ''}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById('hotelImage').click()}
                >
                  <input
                    type="file"
                    id="hotelImage"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input"
                    style={{ display: 'none' }}
                  />
                  
                  <ImageIcon size={32} className="upload-icon" />
                  <p className="upload-text">
                    <span className="upload-link">Click to upload</span> or drag and drop
                  </p>
                  <p className="upload-hint">PNG, JPG, GIF up to 5MB</p>
                  
                  {/* Upload Progress Bar */}
                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="upload-progress">
                      <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                      <span className="progress-text">{uploadProgress}%</span>
                    </div>
                  )}
                </div>
              ) : (
                /* Image Preview */
                <div className="image-preview-single">
                  <img src={imagePreview} alt="Hotel preview" />
                  <div className="image-preview-overlay">
                    <button
                      type="button"
                      className="remove-image"
                      onClick={removeImage}
                    >
                      <X size={20} />
                    </button>
                    <button
                      type="button"
                      className="change-image"
                      onClick={() => document.getElementById('hotelImage').click()}
                    >
                      <Upload size={16} />
                      <span>Change</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {errors.images && <span className="error-message image-error">{errors.images}</span>}
            </div>

            {/* Summary Section */}
            {formData.tableCount > 0 && (
              <div className="signup-summary">
                <h4>Registration Summary</h4>
                <div className="summary-item">
                  <Users size={16} />
                  <span>Hotel will have <strong>{formData.tableCount} tables</strong> available for booking</span>
                </div>
              </div>
            )}

            <button
              type="submit"
              className="signup-button"
              disabled={isLoading}
            >
              {isLoading ? (
                <span className="loading-spinner"></span>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          <div className="login-link">
            Already have an account? <a href="/login" onClick={handleLoginRedirect}>Sign in</a>
          </div>

          <div className="terms">
            By creating an account, you agree to our{' '}
            <a href="/terms">Terms of Service</a> and{' '}
            <a href="/privacy">Privacy Policy</a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;