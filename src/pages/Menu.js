import React, { useState, useEffect, useMemo } from "react";
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

const API = process.env.REACT_APP_API;

function MenuPage() {
  const { hotelId, tableNumber } = useParams();

  const [hotel, setHotel] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFoodCategory, setSelectedFoodCategory] = useState("all");
  const [selectedVegType, setSelectedVegType] = useState("all");

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  const [showOrders, setShowOrders] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]); // ALWAYS ARRAY
  const [orderMessage, setOrderMessage] = useState("");

  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [, setPreviousCount] = useState(0);

  /* ================= LOAD HOTEL + FOOD ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const hotelRes = await fetch(`${API}/api/hotels/${hotelId}`);
        const hotelData = await hotelRes.json();
        if (hotelData.success) {
          setHotel(hotelData.data);
        }

        const foodRes = await fetch(`${API}/api/food/hotel/${hotelId}`);
        const foodData = await foodRes.json();
        if (foodData.success && Array.isArray(foodData.data)) {
          setFoods(foodData.data.filter(f => f.available));
        }
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hotelId]);


  /* ================= UNLOCK AUDIO ================= */
  useEffect(() => {
    const unlockAudio = () => {
      setAudioUnlocked(true);
      document.removeEventListener("click", unlockAudio);
    };
    document.addEventListener("click", unlockAudio);
    return () => document.removeEventListener("click", unlockAudio);
  }, []);

  /* ================= FETCH & MERGE ACTIVE ORDERS ================= */
  useEffect(() => {
    let interval;

    const loadOrders = async () => {
      try {
        const res = await fetch(`${API}/api/bookings/${hotelId}`);
        const data = await res.json();

        if (!data.success || !Array.isArray(data.data)) {
          setActiveOrders([]);
          return;
        }

        // Filter only this table & active bookings
        const tableBookings = data.data.filter(
          b =>
            Number(b.tableNumber) === Number(tableNumber) &&
            b.status === "active"
        );

        const mergedOrders = [];

        tableBookings.forEach(booking => {
          booking.orders?.forEach(item => {
            const existing = mergedOrders.find(
              o => o.foodId === item.foodId
            );

            if (existing) {
              existing.quantity += item.quantity;
              existing.deliveredQty += item.delivered
                ? item.quantity
                : 0;
              existing.pendingQty += item.delivered
                ? 0
                : item.quantity;
            } else {
              mergedOrders.push({
                foodId: item.foodId,
                title: item.title,
                price: item.price,
                quantity: item.quantity,
                deliveredQty: item.delivered
                  ? item.quantity
                  : 0,
                pendingQty: item.delivered
                  ? 0
                  : item.quantity
              });
            }
          });
        });

        // 🔔 Play notification for new items
        const totalItems = mergedOrders.reduce(
          (sum, o) => sum + o.quantity,
          0
        );

        setPreviousCount(prev => {
          if (totalItems > prev && audioUnlocked) {
            const sound = new Audio("/notification.mp3");
            sound.play().catch(() => { });
          }
          return totalItems;
        });

        setActiveOrders(mergedOrders);

      } catch (err) {
        console.error("Order fetch error:", err);
        setActiveOrders([]);
      }
    };

    loadOrders();
    interval = setInterval(loadOrders, 3000);

    return () => clearInterval(interval);
  }, [hotelId, tableNumber, audioUnlocked]);

  /* ================= ORDER COUNTS ================= */
  const pendingCount = useMemo(() => {
    return activeOrders.reduce(
      (sum, o) => sum + (o.pendingQty || 0),
      0
    );
  }, [activeOrders]);

  // const deliveredCount = useMemo(() => {
  //   return activeOrders.reduce(
  //     (sum, o) => sum + (o.deliveredQty || 0),
  //     0
  //   );
  // }, [activeOrders]);
  /* ================= FOOD CATEGORY LIST ================= */
  const foodCategories = useMemo(() => {
    const categories = foods.map(f => f.foodCategory);
    return ["all", ...new Set(categories)];
  }, [foods]);

  /* ================= FILTER FOODS ================= */
  const filteredFoods = useMemo(() => {
    return foods
      .filter(f =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(f =>
        selectedFoodCategory === "all"
          ? true
          : f.foodCategory === selectedFoodCategory
      )
      .filter(f =>
        selectedVegType === "all"
          ? true
          : f.category === selectedVegType
      );
  }, [foods, searchTerm, selectedFoodCategory, selectedVegType]);

  /* ================= CART ================= */
  const getQty = id =>
    cart.find(c => c._id === id)?.quantity || 0;

  const increase = food => {
    setCart(prev => {
      const exist = prev.find(c => c._id === food._id);
      if (exist) {
        return prev.map(c =>
          c._id === food._id
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { ...food, quantity: 1 }];
    });
  };

  const decrease = food => {
    setCart(prev => {
      const exist = prev.find(c => c._id === food._id);
      if (!exist) return prev;
      if (exist.quantity === 1) {
        return prev.filter(c => c._id !== food._id);
      }
      return prev.map(c =>
        c._id === food._id
          ? { ...c, quantity: c.quantity - 1 }
          : c
      );
    });
  };

  const cartTotal = useMemo(() => {
    return cart.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [cart]);

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
        setOrderMessage("Order placed successfully!");
      } else {
        setOrderMessage("Failed to place order");
      }

      setTimeout(() => setOrderMessage(""), 3000);
    } catch (err) {
      setOrderMessage("Server error");
      setTimeout(() => setOrderMessage(""), 3000);
    }
  };

  const totalAmount = activeOrders.reduce(
    (sum, i) => sum + i.price * i.quantity,
    0
  );

  if (loading) return <div>Loading...</div>;
  if (!hotel) return <div>Hotel not found</div>;

  /* ================= UI ================= */
  return (
    <div className="menu-container">

      {/* HEADER */}
      <div className="hotel-header">
        <h1>{hotel.hotelName}</h1>
        <p><MapPin size={14} /> {hotel.city}, {hotel.state}</p>
        <p>Table {tableNumber}</p>
      </div>

      {/* SEARCH */}
      <div className="search-container">
        <Search size={16} />
        <input
          placeholder="Search food..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <select
          value={selectedVegType}
          onChange={e => setSelectedVegType(e.target.value)}
        >
          <option value="all">All</option>
          <option value="veg">Veg</option>
          <option value="non-veg">Non-Veg</option>
        </select>

        <select
          value={selectedFoodCategory}
          onChange={e => setSelectedFoodCategory(e.target.value)}
        >
          {foodCategories.map(cat => (
            <option key={cat} value={cat}>
              {cat.toUpperCase()}
            </option>
          ))}
        </select>
      </div>

      {/* FOOD GRID */}
      <div className="food-grid">
        {filteredFoods.map(food => {
          const qty = getQty(food._id);

          return (
            <div key={food._id} className="food-card">
              <img
                src={
                  food.image?.startsWith("http")
                    ? food.image
                    : `${API}/${food.image}`
                }
                alt={food.title}
              />

              <div className="food-top">
                <h3>{food.title}</h3>

                <span className={`food-type ${food.category}`}>
                  {food.category === "veg" ? "🥬 Veg" : "🍗 Non-Veg"}
                </span>
              </div>

              <p className="food-desc">{food.desc}</p>

              <div className="food-details">
                <span className="food-price">₹{food.price}</span>

                <span className="food-category-badge">
                  {food.foodCategory}
                </span>
              </div>

              {qty === 0 ? (
                <button onClick={() => increase(food)}>
                  Add
                </button>
              ) : (
                <div className="qty-control">
                  <button onClick={() => decrease(food)}>
                    <Minus size={14} />
                  </button>
                  <span>{qty}</span>
                  <button onClick={() => increase(food)}>
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* SUCCESS MESSAGE */}
      {orderMessage && (
        <div className="order-message">
          {orderMessage}
        </div>
      )}

      {/* FLOATING CART */}
      {cart.length > 0 && (
        <button
          className="floating-cart"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart size={18} />
          {cart.reduce((s, i) => s + i.quantity, 0)}
        </button>
      )}

      {/* FLOATING ORDER BUTTON */}
      <button
        className="floating-orders"
        onClick={() => setShowOrders(true)}
      >
        <ClipboardList size={18} />
        {pendingCount}
      </button>

      {/* CART SIDEBAR */}
      {showCart && (
        <div className="cart-sidebar">
          <h2>Your Cart</h2>
          {cart.map(i => (
            <div key={i._id}>
              {i.title} × {i.quantity}
            </div>
          ))}
          <h3>Total ₹{cartTotal}</h3>
          <button onClick={placeOrder}>Place Order</button>
          <button onClick={() => setShowCart(false)}>Close</button>
        </div>
      )}

      {/* ORDER SLIDER */}
      {showOrders && (
        <div className="order-slider">
          <div className="order-header">
            <h2>Your Orders</h2>
            <button onClick={() => setShowOrders(false)}>Close</button>
          </div>

          <div className="order-summary">
            {/* <p>🟡 Pending: {pendingCount}</p>
            <p>🟢 Delivered: {deliveredCount}</p> */}
          </div>

          {activeOrders.length === 0 ? (
            <p>No orders yet</p>
          ) : (
            activeOrders.map(order => (
              <div key={order.foodId} className="order-card">
                <p>
                  <strong>{order.title}</strong> × {order.quantity}
                </p>

                {order.deliveredQty > 0 && (
                  <p className="delivered">
                    ✔ Delivered: {order.deliveredQty}
                  </p>
                )}

                {order.pendingQty > 0 && (
                  <p className="pending">
                    ⏳ Pending: {order.pendingQty}
                  </p>
                )}
              </div>
            ))
          )}
          <h3>Total ₹{totalAmount}</h3>
        </div>
      )}
    </div>
  );
}

export default MenuPage;