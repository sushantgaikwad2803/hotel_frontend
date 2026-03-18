import React, { useState, useEffect, useCallback } from 'react';
import {
  Utensils, LogOut, Edit, Trash2, Plus, X,
  Camera, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './admin.css';

function AdminDashboard() {
  const navigate = useNavigate();

  // ✅ CENTRAL BACKEND
  const API = process.env.REACT_APP_API;
  const API_URL = `${API}/api/food`;
  const HOTEL_API = `${API}/api/hotel`;

  const [hotel, setHotel] = useState(null);
  const [foods, setFoods] = useState([]);
  const [showFoodModal, setShowFoodModal] = useState(false);
  const [showEditHotelModal, setShowEditHotelModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [foodForm, setFoodForm] = useState({
    id: '',
    name: '',
    category: 'veg',
    foodCategory: 'food',
    price: '',
    description: '',
    image: '',
    isAvailable: true
  });

  const [foodImagePreview, setFoodImagePreview] = useState(null);
  const [editingFood, setEditingFood] = useState(null);

  const [hotelForm, setHotelForm] = useState({
    hotelName: '',
    email: '',
    address: '',
    city: '',
    state: '',
    hotelImage: ''
  });

  const [hotelImagePreview, setHotelImagePreview] = useState(null);

  useEffect(() => {
    document.body.classList.toggle(
      "modal-open",
      showFoodModal || showEditHotelModal
    );

    return () => {
      document.body.classList.remove("modal-open");
    };
  }, [showFoodModal, showEditHotelModal]);

  // 🔐 Auth Check
  useEffect(() => {
    const savedUser = localStorage.getItem("hotelUser");

    if (!savedUser) {
      navigate("/login");
    } else {
      const currentHotel = JSON.parse(savedUser);
      setHotel(currentHotel);
    }
  }, [navigate]);

  // 📥 Fetch Foods
  const fetchFoods = useCallback(async () => {
    if (!hotel?._id) return;

    try {
      const response = await fetch(`${API_URL}/hotel/${hotel._id}`);
      const data = await response.json();

      if (data.success) {
        setFoods(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching foods:", error);
    }
  }, [hotel, API_URL]);

  useEffect(() => {
    fetchFoods();
  }, [fetchFoods]);

  const handleLogout = () => {
    localStorage.removeItem('hotelUser');
    navigate('/login');
  };

  // 🏨 Update Hotel
  const handleHotelUpdate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`${HOTEL_API}/${hotel._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(hotelForm),
      });

      const result = await response.json();
      if (result.success) {
        setHotel(result.data);
        localStorage.setItem('hotelUser', JSON.stringify(result.data));
        setShowEditHotelModal(false);
        alert('Saved to Database Successfully!');
      }
    } catch (err) {
      alert("Failed to save to server.");
    }
  };

  const handleHotelImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image size should be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setHotelImagePreview(reader.result);
      setHotelForm(prev => ({ ...prev, hotelImage: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleFoodImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB');
      return;
    }

    setFoodForm(prev => ({ ...prev, image: file }));
    setFoodImagePreview(URL.createObjectURL(file));
  };

  const handleFoodSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    if (!hotel?._id) {
      alert("Hotel ID missing. Please login again.");
      return;
    }

    try {
      const formData = new FormData();

      formData.append("hotelId", hotel._id);
      formData.append("title", foodForm.name);
      formData.append("desc", foodForm.description);
      formData.append("price", foodForm.price);
      formData.append("category", foodForm.category);
      formData.append("foodCategory", foodForm.foodCategory);
      formData.append("available", foodForm.isAvailable);

      if (foodForm.image) {
        formData.append("image", foodForm.image);
      }

      const response = await fetch(API_URL, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        alert(editingFood ? "Food updated!" : "Food added!");

        setFoodForm({
          id: '',
          name: '',
          category: 'veg',
          foodCategory: 'food',
          price: '',
          description: '',
          image: '',
          isAvailable: true
        });

        setFoodImagePreview(null);
        setEditingFood(null);
        setShowFoodModal(false);

        fetchFoods();
      } else {
        const errData = await response.json();
        alert(errData.message || "Operation failed");
      }
    } catch (error) {
      alert("Network error. Is your server running?");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteFood = async (foodId) => {
    if (!window.confirm("Delete this item?")) return;

    try {
      const response = await fetch(`${API_URL}/${foodId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        setFoods(foods.filter(f => f._id !== foodId));
      }
    } catch (error) {
      alert("Delete failed");
    }
  };

  const handleToggleAvailability = async (food) => {
    try {
      if (!food._id) return alert("Food ID missing!");

      const response = await fetch(`${API_URL}/${food._id}/toggle`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setFoods(prevFoods =>
          prevFoods.map(f => (f._id === food._id ? result.data : f))
        );
      } else {
        alert(result.message || "Failed to toggle availability");
      }
    } catch (error) {
      alert("Server error while toggling availability");
    }
  };

  const handleEditFood = (food) => {
    setEditingFood(food);

    setFoodForm({
      name: food.title,
      category: food.category,
      foodCategory: food.foodCategory,
      price: food.price,
      description: food.desc,
      image: '',
      isAvailable: food.available
    });

    setFoodImagePreview(food.image);
    setShowFoodModal(true);
  };

  const totalFoods = foods.length;
  const availableFoods = foods.filter(f => f.available).length;
  const vegCount = foods.filter(f => f.category === 'veg').length;
  const nonVegCount = foods.filter(f => f.category === 'non-veg').length;

  if (!hotel) return <div className="loading">Authenticating...</div>;

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <Utensils size={24} color="#e67e22" />
          <h1>{hotel.hotelName} Portal</h1>
        </div>

        <div className="header-right">
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Hotel Profile Section */}
        <div className="hotel-profile-section">
          <div className="hotel-profile-card">
            <div className="hotel-cover-image">
              <img src={hotel.hotelImage || 'https://via.placeholder.com/1200x300'} alt={hotel.hotelName} />
              <button
                className="edit-cover-btn"
                onClick={() => {
                  setHotelForm({
                    hotelName: hotel.hotelName,
                    email: hotel.email,
                    address: hotel.address,
                    city: hotel.city,
                    state: hotel.state,
                    hotelImage: hotel.hotelImage
                  });
                  setHotelImagePreview(hotel.hotelImage);
                  setShowEditHotelModal(true);
                }}
              >
                <Edit size={16} />
                Edit Hotel Details
              </button>
            </div>

            <div className="hotel-info">
              <div className="hotel-name-section">
                <h2>{hotel.hotelName}</h2>
              </div>

              <div className="hotel-details-grid">
                <div className="detail-item">
                  <span className="detail-label">Email:</span>
                  <span className="detail-value">{hotel.email}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Address:</span>
                  {/* Make sure these match the keys in your hotelForm state */}
                  <span className="detail-value">{hotel.address || 'Not Added'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">City:</span>
                  <span className="detail-value">{hotel.city || 'Not Added'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">State:</span>
                  <span className="detail-value">{hotel.state || 'Not Added'}</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Total Tables:</span>
                  <span className="detail-value">
                    {hotel.sections
                      ? hotel.sections.reduce((sum, s) => sum + Number(s.tableCount || 0), 0)
                      : hotel.tableCount || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon total">
                <Utensils size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{totalFoods}</span>
                <span className="stat-label">Total Items</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon available">
                <Check size={24} />
              </div>
              <div className="stat-content">
                <span className="stat-value">{availableFoods}</span>
                <span className="stat-label">Available</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon veg">
                <span>🥬</span>
              </div>
              <div className="stat-content">
                <span className="stat-value">{vegCount}</span>
                <span className="stat-label">Veg Items</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon nonveg">
                <span>🍗</span>
              </div>
              <div className="stat-content">
                <span className="stat-value">{nonVegCount}</span>
                <span className="stat-label">Non-Veg Items</span>
              </div>
            </div>
          </div>
        </div>

        <button
          className="booking-page-btn"
          onClick={() => navigate("/booking")}
        >
          Manage Tables
        </button>
                      
        {hotel.hotelType === "hotel_with_lodging" && (
          <button
            className="booking-page-btn"
            onClick={() => navigate("/rooms")}
          >
            Manage Rooms
          </button>
        )}

        <button
          className="booking-page-btn"
          onClick={() => navigate(`/kot/${hotel._id}/all`)}
        >
          KOT
        </button>

        <button
          className="generate-qr-btn"
          onClick={() => navigate("/generate-qr")}
        >
          Generate Table QR Codes
        </button>


        {/* Food Management Section */}
        <div className="food-management-section">
          <div className="section-header">
            <div className="section-title" id="color">
              <h2>Food Menu</h2>
              <p>Manage your hotel's food items</p>
            </div>
            <button className="add-food-btn" onClick={() => { setEditingFood(null); setShowFoodModal(true); }}>
              <Plus size={20} />
              Add New Food Item
            </button>
          </div>

          {foods.length === 0 ? (
            <div className="empty-state">
              <Utensils size={64} />
              <h3>No Food Items Added</h3>
              <p>Start adding delicious items to your hotel's menu</p>
              <button className="add-first-food-btn" onClick={() => {
                setEditingFood(null);
                setFoodForm({
                  id: '',
                  name: '',
                  category: 'veg',
                  foodCategory: 'food',
                  price: '',
                  description: '',
                  image: '',
                  isAvailable: true
                });
                setFoodImagePreview(null);
                setShowFoodModal(true);
              }}
              >
                <Plus size={18} />
                Add Your First Food Item
              </button>
            </div>
          ) : (
            <div className="food-items-grid">
              {foods.map(food => (
                <div key={food._id} className="food-item-card">
                  <div className="food-item-image">
                    <img
                      src={
                        food.image?.startsWith("http")
                          ? food.image
                          : `${API}/${food.image}`
                      }
                      alt={food.title || food.name}
                    />

                    <div className="food-item-status">
                      <span className={`status-badge ${food.available ? 'available' : 'unavailable'}`}>
                        {food.available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                  </div>

                  <div className="food-item-content">
                    <div className="food-item-header">
                      <h3>{food.title}</h3>
                      <span className={`category-badge ${food.category}`}>
                        {food.category === 'veg' ? '🥬 Veg' : '🍗 Non-Veg'}
                      </span>
                    </div>

                    <p className="food-description">{food.desc}</p>

                    <div className="food-details">
                      <div className="food-price">₹{food.price}</div>
                      {/* <div className="food-time">
                        <Clock size={14} />
                        {food.preparationTime || '15-20 mins'}
                      </div> */}
                      <div className="food-type-badge">
                        {food.foodCategory?.toUpperCase()}
                      </div>
                    </div>

                    <div className="food-item-actions">

                      <button
                        className={`availability-btn ${food.available ? "on" : "off"}`}
                        onClick={() => handleToggleAvailability(food)}
                      >
                        {food.available ? "Mark Unavailable" : "Mark Available"}
                      </button>


                      <button
                        className="edit-food-btn"
                        onClick={() => handleEditFood(food)}
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="delete-food-btn"
                        onClick={() => handleDeleteFood(food._id)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Hotel Modal */}
      {showEditHotelModal && (
        <div className="modal-overlay" onClick={() => setShowEditHotelModal(false)}>
          <div className="edit-hotel-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Edit Hotel Details</h2>
              <button className="close-modal" onClick={() => setShowEditHotelModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleHotelUpdate} className="edit-hotel-form">
              <div className="form-group">
                <label>Hotel Name *</label>
                <input
                  type="text"
                  value={hotelForm.hotelName}
                  onChange={(e) => setHotelForm({ ...hotelForm, hotelName: e.target.value })}
                  required
                  placeholder="Enter hotel name"
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  value={hotelForm.email}
                  onChange={(e) => setHotelForm({ ...hotelForm, email: e.target.value })}
                  required
                  placeholder="Enter hotel email"
                />
              </div>

              <div className="form-group">
                <label>Address *</label>
                <input
                  type="text"
                  value={hotelForm.address}
                  onChange={(e) => setHotelForm({ ...hotelForm, address: e.target.value })}
                  required
                  placeholder="Enter street address"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>City *</label>
                  <input
                    type="text"
                    value={hotelForm.city}
                    onChange={(e) => setHotelForm({ ...hotelForm, city: e.target.value })}
                    required
                    placeholder="City"
                  />
                </div>

                <div className="form-group">
                  <label>State *</label>
                  <input
                    type="text"
                    value={hotelForm.state}
                    onChange={(e) => setHotelForm({ ...hotelForm, state: e.target.value })}
                    required
                    placeholder="State"
                  />
                </div>
              </div>

              {/* <div className="form-group">
                <label>Total Tables</label>
                <input
                  type="number"
                  value={hotelForm.tableCount || 0}
                  onChange={(e) => setHotelForm({ ...hotelForm, tableCount: e.target.value })}
                />
              </div> */}

              <div className="form-group">
                <label>Hotel Image</label>
                <div className="hotel-image-upload">
                  {hotelImagePreview ? (
                    <div className="image-preview">
                      <img src={hotelImagePreview} alt="Hotel preview" />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => {
                          setHotelImagePreview(null);
                          setHotelForm({ ...hotelForm, hotelImage: '' });
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="upload-area"
                      onClick={() => document.getElementById('hotelImage').click()}
                    >
                      <input
                        type="file"
                        id="hotelImage"
                        accept="image/*"
                        onChange={handleHotelImageUpload}
                        style={{ display: 'none' }}
                      />
                      <Camera size={32} />
                      <p>Click to upload hotel image</p>
                      <span>PNG, JPG up to 5MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditHotelModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save">
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Food Modal */}
      {showFoodModal && (
        <div className="modal-overlay" onClick={() => setShowFoodModal(false)}>
          <div className="food-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingFood ? 'Edit Food Item' : 'Add New Food Item'}</h2>
              <button className="close-modal" onClick={() => setShowFoodModal(false)}>
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleFoodSubmit} className="food-form">
              <div className="form-row">
                <div className="form-group">
                  <label>Food Name *</label>
                  <input
                    type="text"
                    value={foodForm.name}
                    onChange={(e) => setFoodForm({ ...foodForm, name: e.target.value })}
                    required
                    placeholder="e.g., Butter Chicken"
                  />
                </div>

                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={foodForm.category}
                    onChange={(e) => setFoodForm({ ...foodForm, category: e.target.value })}
                    required
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input
                    type="number"
                    value={foodForm.price}
                    onChange={(e) => setFoodForm({ ...foodForm, price: e.target.value })}
                    required
                    min="0"
                    placeholder="e.g., 450"
                  />
                </div>

                <div className="form-group">
                  <label>Food Category </label>
                  <select
                    value={foodForm.foodCategory}
                    onChange={(e) =>
                      setFoodForm({ ...foodForm, foodCategory: e.target.value })
                    }
                    required
                  >
                    <option value="food">Food</option>
                    <option value="rice">Rice</option>
                    <option value="roti">Roti</option>
                    <option value="starter">Starter</option>
                    <option value="drinks">Drinks</option>
                    <option value="drinks">Drinks</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Availability</label>
                  <div className="availability-toggle">
                    <label className="toggle-switch">
                      <input
                        type="checkbox"
                        checked={foodForm.isAvailable}
                        onChange={(e) => setFoodForm({ ...foodForm, isAvailable: e.target.checked })}
                      />
                      <span className="toggle-slider"></span>
                    </label>
                    <span>{foodForm.isAvailable ? 'Available' : 'Unavailable'}</span>
                  </div>
                </div>
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  value={foodForm.description}
                  onChange={(e) => setFoodForm({ ...foodForm, description: e.target.value })}
                  required
                  rows="3"
                  placeholder="Food Quantity..."
                />
              </div>

              <div className="form-group">
                <label>Food Image</label>
                <div className="food-image-upload">
                  {foodImagePreview ? (
                    <div className="image-preview">
                      <img src={foodImagePreview} alt="Food preview" />
                      <button
                        type="button"
                        className="remove-image"
                        onClick={() => {
                          setFoodImagePreview(null);
                          setFoodForm({ ...foodForm, image: '' });
                        }}
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="upload-area"
                      onClick={() => document.getElementById('foodImage').click()}
                    >
                      <input
                        type="file"
                        id="foodImage"
                        accept="image/*"
                        onChange={handleFoodImageUpload}
                        style={{ display: 'none' }}
                      />
                      <Camera size={32} />
                      <p>Click to upload food image</p>
                      <span>PNG, JPG up to 2MB</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowFoodModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-save" disabled={isLoading}>
                  {isLoading ? 'Processing...' : (editingFood ? 'Update Food Item' : 'Add Food Item')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;