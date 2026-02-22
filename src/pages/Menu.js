import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  ShoppingCart,
  MapPin,
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

  /* ================= STATE ================= */
  const [hotel, setHotel] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [showOrders, setShowOrders] = useState(false);

  const [activeOrders, setActiveOrders] = useState([]);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [, setPreviousCount] = useState(0);
  /* ================= STATE ================= */
  const [orderMessage, setOrderMessage] = useState(""); // Add this state

  /* ================= UNLOCK AUDIO ================= */
  useEffect(() => {
    const unlockAudio = () => {
      setAudioUnlocked(true);
      document.removeEventListener("click", unlockAudio);
    };
    document.addEventListener("click", unlockAudio);
    return () => document.removeEventListener("click", unlockAudio);
  }, []);

  /* ================= INITIAL LOAD ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Fetch hotel info
        const hotelRes = await fetch(`${API}/api/hotels/${hotelId}`);
        const hotelData = await hotelRes.json();
        if (hotelData.success) setHotel(hotelData.data);

        // Fetch all food items for this hotel
        const foodRes = await fetch(`${API}/api/food/hotel/${hotelId}`);
        const foodData = await foodRes.json();
        if (foodData.success) setFoods(foodData.data.filter(f => f.available));
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hotelId]);

  /* ================= FETCH ACTIVE ORDERS ================= */
  const fetchOrders = useCallback(async () => {
    try {
      const res = await fetch(`${API}/api/bookings/${hotelId}`);
      const data = await res.json();
      if (!data.success) return;

      // Filter active bookings for this table
      const tableBookings = data.data.filter(
        b => Number(b.tableNumber) === Number(tableNumber) && b.status === "active"
      );

      // Merge orders with same foodId and count delivered/pending separately
      const mergedOrders = [];

      tableBookings.forEach(booking => {
        booking.orders.forEach(item => {
          const existing = mergedOrders.find(o => o.foodId === item.foodId);
          if (existing) {
            existing.quantity += item.quantity;
            existing.deliveredQty += item.delivered ? item.quantity : 0;
            existing.pendingQty += item.delivered ? 0 : item.quantity;
          } else {
            mergedOrders.push({
              foodId: item.foodId,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              deliveredQty: item.delivered ? item.quantity : 0,
              pendingQty: item.delivered ? 0 : item.quantity
            });
          }
        });
      });

      // 🔔 Play notification if new items arrived
      const totalItems = mergedOrders.reduce((sum, o) => sum + o.quantity, 0);
      setPreviousCount(prev => {
        if (totalItems > prev && audioUnlocked) {
          const sound = new Audio("/notification.mp3");
          sound.play().catch(() => { });
        }
        return totalItems;
      });

      setActiveOrders(mergedOrders);
    } catch (err) {
      console.error("Booking fetch error:", err);
    }
  }, [hotelId, tableNumber, audioUnlocked]);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 3000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  /* ================= FILTER FOODS ================= */
  const filteredFoods = useMemo(() => {
    return foods
      .filter(f => f.title.toLowerCase().includes(searchTerm.toLowerCase()))
      .filter(f =>
        selectedCategory === "all" ? true : f.category?.toLowerCase() === selectedCategory
      );
  }, [foods, searchTerm, selectedCategory]);

  /* ================= CART FUNCTIONS ================= */
  const getQty = id => cart.find(c => c._id === id)?.quantity || 0;

  const increase = food => {
    setCart(prev => {
      const exist = prev.find(c => c._id === food._id);
      if (exist) return prev.map(c => c._id === food._id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { ...food, quantity: 1 }];
    });
  };

  const decrease = food => {
    setCart(prev => {
      const exist = prev.find(c => c._id === food._id);
      if (!exist) return prev;
      if (exist.quantity === 1) return prev.filter(c => c._id !== food._id);
      return prev.map(c => c._id === food._id ? { ...c, quantity: c.quantity - 1 } : c);
    });
  };

  const cartTotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

  /* ================= PLACE ORDER ================= */
  const placeOrder = async () => {
    if (!cart.length) return alert("Cart empty");

    try {
      const res = await fetch(`${API}/api/bookings/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          tableNumber: Number(tableNumber),
          items: cart.map(i => ({
            foodId: i._id,
            title: i.title,
            price: i.price,
            quantity: i.quantity
          }))
        })
      });

      const result = await res.json();
      if (result.success) {
        setCart([]);
        setShowCart(false);
        fetchOrders();

        // ✅ Show success message
        setOrderMessage("Your order has been placed!");
        setTimeout(() => setOrderMessage(""), 3000); // hide after 3s
      } else {
        setOrderMessage("Failed to place order. Try again.");
        setTimeout(() => setOrderMessage(""), 3000);
      }
    } catch (err) {
      console.error("Order error:", err);
      setOrderMessage("Server error. Try again.");
      setTimeout(() => setOrderMessage(""), 3000);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!hotel) return <div>Hotel not found</div>;

  const totalAmount = activeOrders.reduce((sum, i) => sum + i.price * i.quantity, 0);

  /* ================= UI ================= */
  return (
    <div className="menu-container">

      {/* Hotel Info */}
      <div className="hotel-header">
        <h1>{hotel.hotelName}</h1>
        <p><MapPin size={14} /> {hotel.city}, {hotel.state}</p>
        <p>Table {tableNumber}</p>
      </div>

      {/* Search + Category Filter */}
      <div className="search-container">
        <Search size={16} />
        <input
          placeholder="Search food..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
          <option value="all">All</option>
          <option value="veg">Veg</option>
          <option value="non-veg">Non-Veg</option>
        </select>
      </div>

      {/* Food Grid */}
      <div className="food-grid">
        {filteredFoods.map(food => {
          const qty = getQty(food._id);
          return (
            <div key={food._id} className="food-card">
              <img src={food.image} alt={food.title} />
              <h3>{food.title}</h3>
              <h4>₹{food.price}</h4>

              {qty === 0 ? (
                <button onClick={() => increase(food)}>Add</button>
              ) : (
                <div>
                  <button onClick={() => decrease(food)}><Minus size={14} /></button>
                  <span>{qty}</span>
                  <button onClick={() => increase(food)}><Plus size={14} /></button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Order Success Message */}
      {orderMessage && (
        <div className="order-message">
          {orderMessage}
        </div>
      )}

      {/* Floating Buttons */}
      {cart.length > 0 && (
        <button className="floating-cart" onClick={() => setShowCart(true)}>
          <ShoppingCart size={18} /> {cart.reduce((s, i) => s + i.quantity, 0)}
        </button>
      )}

      {activeOrders.length > 0 && (
        <button className="floating-order" onClick={() => setShowOrders(true)}>
          <ClipboardList size={18} />
        </button>
      )}

      {/* Cart Sidebar */}
      {showCart && (
        <div className="cart-sidebar">
          <h2>Your Cart</h2>
          {cart.map(i => <div key={i._id}>{i.title} × {i.quantity}</div>)}
          <h3>Total ₹{cartTotal}</h3>
          <button onClick={placeOrder}>Place Order</button>
          <button onClick={() => setShowCart(false)}>Close</button>
        </div>
      )}

      {/* Active Orders Sidebar */}
      {showOrders && (
        <div className="cart-overlay">
          <div className="cart-sidebar">
            <h2>Table {tableNumber} Orders</h2>
            {activeOrders.map(i => (
              <div key={i.foodId} className="order-row">
                <strong>{i.title}</strong> × {i.quantity} <br />
                {i.deliveredQty > 0 && <span className="delivered">✔ Delivered: {i.deliveredQty} </span>}
                {i.pendingQty > 0 && <span className="pending">⏳ Pending: {i.pendingQty}</span>}
              </div>
            ))}
            <h3>Total ₹{totalAmount}</h3>
            <button onClick={() => setShowOrders(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default MenuPage;