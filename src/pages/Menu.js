import React, { useState, useEffect } from "react";
import {
  Search,
  Star,
  Clock,
  X,
  ChevronLeft,
  ShoppingCart,
  Info,
  MapPin,
  ChefHat,
  UtensilsCrossed,
  AlertCircle,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import "./MenuPage.css";

function MenuPage() {
  const navigate = useNavigate();
  const { hotelId, tableNumber } = useParams();

  const [hotel, setHotel] = useState(null);
  const [foods, setFoods] = useState([]);
  const [filteredFoods, setFilteredFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  /* ===============================
     FETCH HOTEL + FOODS FROM API
  =============================== */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch hotel
        const hotelRes = await fetch(
          `http://localhost:1000/api/hotels/${hotelId}`
        );
        const hotelData = await hotelRes.json();

        if (!hotelData.success) {
          setHotel(null);
          setLoading(false);
          return;
        }

        setHotel(hotelData.data);

        // Fetch foods
        const foodRes = await fetch(
          `http://localhost:1000/api/food/hotel/${hotelId}`
        );
        const foodData = await foodRes.json();

        if (foodData.success) {
          const availableFoods = foodData.foods.filter(
            (f) => f.available === true
          );
          setFoods(availableFoods);
          setFilteredFoods(availableFoods);
        }

        setLoading(false);
      } catch (error) {
        console.error("Error loading menu:", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [hotelId]);

  /* ===============================
        FILTER LOGIC
  =============================== */

  useEffect(() => {
    let filtered = foods;

    if (searchTerm) {
      filtered = filtered.filter(
        (food) =>
          food.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          food.desc.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(
        (food) => food.category === selectedCategory
      );
    }

    setFilteredFoods(filtered);
  }, [searchTerm, selectedCategory, foods]);

  /* ===============================
        CART LOGIC
  =============================== */

  const addToCart = (food) => {
    const existingItem = cart.find((item) => item._id === food._id);

    if (existingItem) {
      setCart(
        cart.map((item) =>
          item._id === food._id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { ...food, quantity: 1 }]);
    }
  };

  const updateQuantity = (_id, qty) => {
    if (qty < 1) {
      setCart(cart.filter((item) => item._id !== _id));
    } else {
      setCart(
        cart.map((item) =>
          item._id === _id ? { ...item, quantity: qty } : item
        )
      );
    }
  };

  const cartTotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const cartItemCount = cart.reduce(
    (sum, item) => sum + item.quantity,
    0
  );

  /* ===============================
        UI STATES
  =============================== */

  if (loading) {
    return (
      <div className="menu-loading">
        <div className="loading-spinner-large"></div>
        <p>Loading delicious menu...</p>
      </div>
    );
  }

  if (!hotel) {
    return (
      <div className="menu-error">
        <AlertCircle size={64} />
        <h2>Hotel Not Found</h2>
        <button onClick={() => navigate("/")}>
          <ChevronLeft size={18} />
          Go Back
        </button>
      </div>
    );
  }

  /* ===============================
        MAIN UI
  =============================== */

  return (
    <div className="menu-page">
      {/* HERO */}
      <div
        className="menu-hero"
        style={{
          backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url(${hotel.hotelImage})`,
        }}
      >
        <div className="hero-content">
          <h1>{hotel.hotelName}</h1>
          <p>
            <MapPin size={16} /> {hotel.city}, {hotel.state}
          </p>
          <p>Table No: {tableNumber}</p>
          <p>
            <ChefHat size={18} /> {foods.length} Items Available
          </p>
        </div>
      </div>

      {/* SEARCH */}
      <div className="menu-controls">
        <input
          type="text"
          placeholder="Search dishes..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="all">All</option>
          <option value="veg">Veg</option>
          <option value="non-veg">Non-Veg</option>
        </select>
      </div>

      {/* MENU GRID */}
      <div className="menu-grid">
        {filteredFoods.length === 0 ? (
          <div className="no-items">
            <UtensilsCrossed size={60} />
            <p>No items found</p>
          </div>
        ) : (
          filteredFoods.map((food) => (
            <div key={food._id} className="menu-card">
              <img src={food.image} alt={food.title} />
              <h3>{food.title}</h3>
              <p>{food.desc}</p>
              <h4>₹{food.price}</h4>

              <button onClick={() => addToCart(food)}>
                Add to Cart
              </button>
            </div>
          ))
        )}
      </div>

      {/* CART BUTTON */}
      {cartItemCount > 0 && (
        <button
          className="floating-cart"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart size={22} />
          {cartItemCount}
        </button>
      )}

      {/* CART SIDEBAR */}
      {showCart && (
        <div className="cart-sidebar">
          <h2>Your Cart</h2>

          {cart.map((item) => (
            <div key={item._id} className="cart-item">
              <h4>{item.title}</h4>
              <p>₹{item.price}</p>

              <button onClick={() => updateQuantity(item._id, item.quantity - 1)}>
                -
              </button>
              {item.quantity}
              <button onClick={() => updateQuantity(item._id, item.quantity + 1)}>
                +
              </button>
            </div>
          ))}

          <h3>Total: ₹{cartTotal}</h3>

          <button
            onClick={async () => {
              await fetch("http://localhost:1000/api/cart", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  table: tableNumber,
                  items: cart,
                }),
              });

              alert("Order placed successfully!");
              setCart([]);
              setShowCart(false);
            }}
          >
            Place Order
          </button>
        </div>
      )}
    </div>
  );
}

export default MenuPage;
