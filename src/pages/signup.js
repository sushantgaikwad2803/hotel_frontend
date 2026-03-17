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
    hotelType: '',
    roomCount: '',
    orderCount: '',
    sections: [
      { sectionName: '', tableCount: 0 }
    ],
    hotelImage: null
  });

  const API = process.env.REACT_APP_API;

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  const addSection = () => {
    setFormData(prev => ({
      ...prev,
      sections: [...prev.sections, { sectionName: '', tableCount: 0 }]
    }));
  };

  const handleSectionChange = (index, field, value) => {
    const updatedSections = [...formData.sections];
    updatedSections[index][field] = value;

    setFormData(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

  const removeSection = (index) => {
    const updatedSections = formData.sections.filter((_, i) => i !== index);

    setFormData(prev => ({
      ...prev,
      sections: updatedSections
    }));
  };

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

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      processImage(file);
    }
  };

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

  const processImage = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

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

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
      setFormData(prev => ({
        ...prev,
        hotelImage: file
      }));
    };
    reader.readAsDataURL(file);

    if (errors.images) {
      setErrors(prev => ({
        ...prev,
        images: ''
      }));
    }

    setTimeout(() => {
      setUploadProgress(0);
    }, 1000);
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData(prev => ({
      ...prev,
      hotelImage: null
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.hotelName.trim()) {
      newErrors.hotelName = 'Hotel name is required';
    } else if (formData.hotelName.length < 3) {
      newErrors.hotelName = 'Hotel name must be at least 3 characters';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (formData.hotelType === "hotel_with_lodging") {
      if (!formData.roomCount || formData.roomCount < 1) {
        newErrors.roomCount = "Room count must be at least 1";
      }
    }

    if (formData.orderCount && formData.orderCount < 0) {
      newErrors.orderCount = "Order count cannot be negative";
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain at least one uppercase letter, one lowercase letter, and one number';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.confirmPassword !== formData.password) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length < 5) {
      newErrors.address = 'Please enter a valid address';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    } else if (formData.city.length < 2) {
      newErrors.city = 'Please enter a valid city name';
    }

    if (!formData.state.trim()) {
      newErrors.state = 'State is required';
    } else if (formData.state.length < 2) {
      newErrors.state = 'Please enter a valid state name';
    }

    if (!formData.hotelType) {
      newErrors.hotelType = "Please select hotel type";
    }

    formData.sections.forEach((section, index) => {
      if (!section.sectionName.trim()) {
        newErrors[`sectionName${index}`] = "Section name required";
      }

      if (!section.tableCount || section.tableCount < 1) {
        newErrors[`tableCount${index}`] = "Table count must be at least 1";
      }
    });

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

      const data = new FormData();
      data.append('hotelName', formData.hotelName);
      data.append('email', formData.email);
      data.append('password', formData.password);
      data.append('address', formData.address);
      data.append('city', formData.city);
      data.append('state', formData.state);
      data.append('hotelType', formData.hotelType);
      data.append('sections', JSON.stringify(formData.sections));


      if (formData.hotelType === "hotel_with_lodging") {
        data.append("roomCount", formData.roomCount);
      }

      if (formData.orderCount) {
        data.append("orderCount", formData.orderCount);
      }

      if (formData.hotelImage) {
        data.append('hotelImage', formData.hotelImage);
      }

      try {
        const response = await fetch(`${API}/api/hotel/signup`, {
          method: 'POST',
          body: data,
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
      <div className="signup-container">
        {/* SIGNUP CARD */}
        <div className="signup-card">
          <div className="hotel-icon">
            <Hotel size={48} />
          </div>

          <h1 className="hotel-name">Create Hotel Account</h1>

          <form onSubmit={handleSubmit} className="signup-form">
            {/* Hotel Name Field */}
            <div className="input-groupE">
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
            <div className="input-groupE">
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
            <div className="input-groupE">
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
            <div className="input-groupE">
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


            {/* Hotel Type */}
            <div className="input-groupE">
              <label htmlFor="hotelType">
                <Hotel size={18} />
                <span>Hotel Type</span>
              </label>

              <select
                id="hotelType"
                name="hotelType"
                value={formData.hotelType}
                onChange={handleChange}
                className={errors.hotelType ? "error" : ""}
              >
                <option value="">Select Hotel Type</option>
                <option value="hotel_only">Hotel Only (Restaurant)</option>
                <option value="hotel_with_lodging">Hotel With Lodging</option>
              </select>

              {errors.hotelType && (
                <span className="error-message">{errors.hotelType}</span>
              )}
            </div>

            {formData.hotelType === "hotel_with_lodging" && (
              <div className="input-groupE">
                <label htmlFor="roomCount">
                  <Building size={18} />
                  <span>Room Count</span>
                </label>

                <input
                  type="number"
                  id="roomCount"
                  name="roomCount"
                  min="1"
                  value={formData.roomCount}
                  onChange={handleChange}
                  placeholder="Enter total rooms"
                  className={errors.roomCount ? "error" : ""}
                />

                {errors.roomCount && (
                  <span className="error-message">{errors.roomCount}</span>
                )}
              </div>
            )}

            <div className="input-groupE">
              <label htmlFor="orderCount">
                <Users size={18} />
                <span>Order Count</span>
              </label>

              <input
                type="number"
                id="orderCount"
                name="orderCount"
                min="0"
                value={formData.orderCount}
                onChange={handleChange}
                placeholder="Enter starting order count"
                className={errors.orderCount ? "error" : ""}
              />

              {errors.orderCount && (
                <span className="error-message">{errors.orderCount}</span>
              )}
            </div>

            {/* Table Count Field */}
            <div className="input-groupE">
              <label>
                <Users size={18} />
                <span>Hotel Sections</span>
              </label>

              {formData.sections.map((section, index) => (
                <div key={index} className="section-row">

                  <input
                    type="text"
                    placeholder="Section Name (F1 / Garden / Rooftop)"
                    value={section.sectionName}
                    onChange={(e) =>
                      handleSectionChange(index, "sectionName", e.target.value)
                    }
                  />

                  <input
                    type="number"
                    placeholder="Table Count"
                    min="1"
                    value={section.tableCount}
                    onChange={(e) =>
                      handleSectionChange(index, "tableCount", e.target.value)
                    }
                  />

                  <button
                    type="button"
                    onClick={() => removeSection(index)}
                  >
                    <X size={16} />
                  </button>

                </div>
              ))}

              <button
                type="button"
                className="add-section-btn"
                onClick={addSection}
              >
                + Add Section
              </button>
            </div>

            {/* Address Field */}
            <div className="input-groupE">
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
              <div className="input-groupE half">
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

              <div className="input-groupE half">
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

            {/* Hotel Image Upload Section */}
            <div className="image-upload-section">
              <label className="image-upload-label">
                <Camera size={18} />
                <span>Hotel Image</span>
              </label>

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

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="upload-progress">
                      <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                      <span className="progress-text">{uploadProgress}%</span>
                    </div>
                  )}
                </div>
              ) : (
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
                    </button>
                  </div>
                </div>
              )}

              {errors.images && <span className="error-message image-error">{errors.images}</span>}
            </div>

            {/* Summary Section */}
            {formData.sections.length > 0 && (
              <div className="signup-summary">
                <h4>Sections Summary</h4>

                {formData.sections.map((s, i) => (
                  <div key={i} className="summary-item">
                    <Users size={16} />
                    <span>
                      {s.sectionName || "Section"} : <strong>{s.tableCount || 0}</strong> tables
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Server Error */}
            {errors.server && (
              <span className="error-message" style={{ textAlign: 'center' }}>
                {errors.server}
              </span>
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