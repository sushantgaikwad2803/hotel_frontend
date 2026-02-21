import React, { useEffect, useMemo, useState } from "react";
import {
  ShoppingCart,
  MapPin,
  ChefHat,
  Plus,
  Minus,
  ClipboardList,
  Search
} from "lucide-react";
import { useParams } from "react-router-dom";
import "./MenuPage.css";

const API = "https://hotel-backend-dm5h.onrender.com";

function MenuPage() {
  const { hotelId, tableNumber } = useParams();

  /* ===============================
     STATE
  =============================== */
  const [hotel, setHotel] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const [activeBooking, setActiveBooking] = useState(null);
  const [showOrders, setShowOrders] = useState(false);

  /* ===============================
     FETCH DATA
  =============================== */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch hotel
        const hRes = await fetch(`${API}/api/hotels/${hotelId}`);
        const hData = await hRes.json();
        if (hData.success) {
          setHotel(hData.data);
        }

        // Fetch foods
        const fRes = await fetch(`${API}/api/food/hotel/${hotelId}`);
        const fData = await fRes.json();
        if (fData.success) {
          setFoods(fData.data.filter((f) => f.available));
        }

        // Fetch active booking
        const bRes = await fetch(
          `${API}/api/bookings/${hotelId}/${tableNumber}`
        );
        const bData = await bRes.json();
        if (bData.success && bData.data) {
          setActiveBooking(bData.data);
        }

      } catch (error) {
        console.log("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [hotelId, tableNumber]);

  /* ===============================
     SEARCH + CATEGORY FILTER
  =============================== */
  const filteredFoods = useMemo(() => {
    return foods
      .filter((food) =>
        food.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter((food) => {
        if (selectedCategory === "all") return true;
        return food.category?.toLowerCase() === selectedCategory;
      });
  }, [foods, searchTerm, selectedCategory]);

  /* ===============================
     CART FUNCTIONS
  =============================== */

  const getQuantity = (foodId) => {
    const item = cart.find((c) => c._id === foodId);
    return item ? item.quantity : 0;
  };

  const increaseQty = (food) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === food._id);

      if (existing) {
        return prev.map((c) =>
          c._id === food._id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }

      return [...prev, { ...food, quantity: 1 }];
    });
  };

  const decreaseQty = (food) => {
    setCart((prev) => {
      const existing = prev.find((c) => c._id === food._id);
      if (!existing) return prev;

      if (existing.quantity === 1) {
        return prev.filter((c) => c._id !== food._id);
      }

      return prev.map((c) =>
        c._id === food._id
          ? { ...c, quantity: c.quantity - 1 }
          : c
      );
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }, [cart]);

  /* ===============================
     PLACE ORDER
  =============================== */
  const placeOrder = async () => {
    if (cart.length === 0) {
      alert("Cart is empty");
      return;
    }

    try {
      const res = await fetch(`${API}/api/bookings/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          tableNumber: Number(tableNumber),
          items: cart.map((item) => ({
            foodId: item._id,
            title: item.title,
            price: item.price,
            quantity: item.quantity,
          })),
        }),
      });

      const result = await res.json();

      if (result.success) {
        alert("Order placed successfully!");
        setActiveBooking(result.data);
        setCart([]);
        setShowCart(false);
      }
    } catch (error) {
      console.log("Order error:", error);
    }
  };

  /* ===============================
     SAFETY RENDER
  =============================== */
  if (loading) return <div className="loading">Loading...</div>;
  if (!hotel) return <div className="error">Hotel not found</div>;

  /* ===============================
     UI
  =============================== */
  return (
    <div className="menu-container">

      {/* HEADER */}
      <div className="hotel-header">
        <div>
          <h1>{hotel.hotelName}</h1>
          <p><MapPin size={16} /> {hotel.city}, {hotel.state}</p>
          <p>Table {tableNumber}</p>
          <p><ChefHat size={16} /> {foods.length} Items</p>
        </div>
      </div>

      {/* SEARCH + FILTER */}
      <div className="search-container">
        <Search size={18} className="search-icon" />
        <input
          type="text"
          placeholder="Search food..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="category-select"
        >
          <option value="all">All</option>
          <option value="veg">Veg</option>
          <option value="non-veg">Non-Veg</option>
        </select>
      </div>

      {/* FOOD GRID */}
      <div className="food-grid">
        {filteredFoods.length === 0 ? (
          <p className="no-food">No food found</p>
        ) : (
          filteredFoods.map((food) => {
            const qty = getQuantity(food._id);

            return (
              <div key={food._id} className="food-card">
                <img src={food.image} alt={food.title} />
                <h3>{food.title}</h3>
                <h4>₹{food.price}</h4>

                {qty === 0 ? (
                  <button
                    className="add-btn"
                    onClick={() => increaseQty(food)}
                  >
                    Add
                  </button>
                ) : (
                  <div className="qty-control">
                    <button onClick={() => decreaseQty(food)}>
                      <Minus size={16} />
                    </button>
                    <span>{qty}</span>
                    <button onClick={() => increaseQty(food)}>
                      <Plus size={16} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* FLOATING BUTTONS */}
      <div className="floating-buttons">

        {activeBooking && (
          <button
            className="floating-order"
            onClick={() => setShowOrders(true)}
          >
            <ClipboardList size={20} />
          </button>
        )}

        {cart.length > 0 && (
          <button
            className="floating-cart"
            onClick={() => setShowCart(true)}
          >
            <ShoppingCart size={20} />
            {cart.reduce((s, i) => s + i.quantity, 0)}
          </button>
        )}
      </div>

      {/* CART SIDEBAR */}
      {showCart && (
        <div className="cart-sidebar">
          <h2>Your Cart</h2>

          {cart.map((item) => (
            <div key={item._id} className="cart-item">
              <p>{item.title} × {item.quantity}</p>
              <p>₹{item.price * item.quantity}</p>
            </div>
          ))}

          <h3>Total ₹{cartTotal}</h3>

          <button onClick={placeOrder}>Place Order</button>
          <button onClick={() => setShowCart(false)}>Close</button>
        </div>
      )}

      {/* ORDER SIDEBAR */}
      {showOrders && activeBooking && (
        <div className="cart-sidebar">
          <h2>Your Orders</h2>

          {activeBooking.orders.map((item) => (
            <div key={item.foodId} className="cart-item">
              <p>{item.title} × {item.quantity}</p>
              <p>₹{item.price * item.quantity}</p>
            </div>
          ))}

          <h3>Total ₹{activeBooking.totalAmount}</h3>

          <button onClick={() => setShowOrders(false)}>
            Close
          </button>
        </div>
      )}

    </div>
  );
}

export default MenuPage;