import React, { useState } from "react";
import {
  Hotel,
  X,
  Image as 
  Users,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import "./signup.css";

const API = process.env.REACT_APP_API;

function Signup() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    hotelName: "",
    email: "",
    password: "",
    confirmPassword: "",
    address: "",
    city: "",
    state: "",
    tableCount: 1,
    hotelImage: null,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  // ================= HANDLE INPUT =================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: name === "tableCount" ? Number(value) : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // ================= IMAGE UPLOAD =================
  const handleImageUpload = (e) => {
    const file = e.target.files[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }

    setFormData((prev) => ({
      ...prev,
      hotelImage: file,
    }));

    setImagePreview(URL.createObjectURL(file));

    if (errors.hotelImage) {
      setErrors((prev) => ({ ...prev, hotelImage: "" }));
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setFormData((prev) => ({
      ...prev,
      hotelImage: null,
    }));
  };

  // ================= VALIDATION =================
  const validateForm = () => {
    const newErrors = {};

    if (!formData.hotelName.trim())
      newErrors.hotelName = "Hotel name is required";

    if (!formData.email)
      newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Invalid email format";

    if (!formData.password)
      newErrors.password = "Password is required";
    else if (formData.password.length < 8)
      newErrors.password = "Password must be at least 8 characters";

    if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = "Passwords do not match";

    if (!formData.address.trim())
      newErrors.address = "Address is required";

    if (!formData.city.trim())
      newErrors.city = "City is required";

    if (!formData.state.trim())
      newErrors.state = "State is required";

    if (!formData.tableCount || formData.tableCount < 1)
      newErrors.tableCount = "Table count must be at least 1";

    if (!formData.hotelImage)
      newErrors.hotelImage = "Hotel image is required";

    return newErrors;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = validateForm();

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const data = new FormData();
      Object.keys(formData).forEach((key) => {
        data.append(key, formData[key]);
      });

      const response = await fetch(`${API}/api/hotel/signup`, {
        method: "POST",
        body: data,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Signup failed");
      }

      alert("Registration Successful!");
      navigate("/login");
    } catch (error) {
      setErrors({ server: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  // ================= UI =================
  return (
    <div className="signup-page">
      <div className="signup-container">
        <div className="signup-card">

          <div className="hotel-icon">
            <Hotel size={48} />
          </div>

          <h1>Create Hotel Account</h1>

          {errors.server && (
            <div className="error-message server-error">
              {errors.server}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            <input
              type="text"
              name="hotelName"
              placeholder="Hotel Name"
              value={formData.hotelName}
              onChange={handleChange}
            />
            {errors.hotelName && <span className="error-message">{errors.hotelName}</span>}

            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
              onChange={handleChange}
            />
            {errors.email && <span className="error-message">{errors.email}</span>}

            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
            />
            {errors.password && <span className="error-message">{errors.password}</span>}

            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}

            <input
              type="number"
              name="tableCount"
              min="1"
              max="500"
              value={formData.tableCount}
              onChange={handleChange}
            />
            {errors.tableCount && <span className="error-message">{errors.tableCount}</span>}

            <input
              type="text"
              name="address"
              placeholder="Address"
              value={formData.address}
              onChange={handleChange}
            />
            {errors.address && <span className="error-message">{errors.address}</span>}

            <input
              type="text"
              name="city"
              placeholder="City"
              value={formData.city}
              onChange={handleChange}
            />
            {errors.city && <span className="error-message">{errors.city}</span>}

            <input
              type="text"
              name="state"
              placeholder="State"
              value={formData.state}
              onChange={handleChange}
            />
            {errors.state && <span className="error-message">{errors.state}</span>}

            {/* Image Upload */}
            <div className="image-section">
              <input type="file" accept="image/*" onChange={handleImageUpload} />
              {imagePreview && (
                <div className="image-preview">
                  <img src={imagePreview} alt="Preview" />
                  <button type="button" onClick={removeImage}>
                    <X size={18} />
                  </button>
                </div>
              )}
              {errors.hotelImage && <span className="error-message">{errors.hotelImage}</span>}
            </div>

            <button type="submit" disabled={isLoading}>
              {isLoading ? "Creating..." : "Create Account"}
            </button>
          </form>

          <p>
            Already have an account?{" "}
            <span
              style={{ cursor: "pointer", color: "blue" }}
              onClick={() => navigate("/login")}
            >
              Sign in
            </span>
          </p>

          {formData.tableCount > 0 && (
            <div className="signup-summary">
              <Users size={16} />
              Hotel will have <strong>{formData.tableCount}</strong> tables
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default Signup;