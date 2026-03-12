
import React, { useState, useEffect, useMemo } from "react";
import {
  ShoppingCart,
  MapPin,
  Plus,
  Minus,
  Search
} from "lucide-react";
import { ClipboardList } from "lucide-react";
import { useParams } from "react-router-dom";
import "./MenuPage.css";

const API = process.env.REACT_APP_API;

function MenuPage() {
  const { hotelId, tableNumber } = useParams();

  const [hotel, setHotel] = useState(null);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedVegType, setSelectedVegType] = useState("all");

  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);


  const [showOrders, setShowOrders] = useState(false);
  const [activeOrders, setActiveOrders] = useState([]);
  const [orderMessage, setOrderMessage] = useState("");
  const [orderTime, setOrderTime] = useState(null);
  const [description, setDescription] = useState("");

  /* ================= LOAD HOTEL + FOOD ================= */
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        const hotelRes = await fetch(`${API}/api/hotels/${hotelId}`);
        const hotelData = await hotelRes.json();
        if (hotelData.success) setHotel(hotelData.data);

        const foodRes = await fetch(`${API}/api/food/hotel/${hotelId}`);
        const foodData = await foodRes.json();
        if (foodData.success && Array.isArray(foodData.data)) {
          setFoods(foodData.data.filter(f => f.available));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [hotelId]);

  /* ================= FETCH ORDERS ================= */
  useEffect(() => {
    const loadOrders = async () => {
      try {
        const res = await fetch(`${API}/api/bookings/${hotelId}`);
        const data = await res.json();

        if (!data.success) return;

        const tableBookings = data.data.filter(
          b =>
            b.tableNumber === tableNumber &&
            b.status === "active"
        );

        const merged = [];

        tableBookings.forEach(b => {
          b.orders?.forEach(item => {
            merged.push({
              bookingId: b._id,
              foodId: item.foodId,
              title: item.title,
              price: item.price,
              quantity: item.quantity,
              delivered: item.delivered,
              orderedAt: item.orderedAt
            });
          });
        });

        setActiveOrders(merged);
      } catch (err) {
        console.error(err);
      }
    };

    loadOrders();
    const interval = setInterval(loadOrders, 3000);
    return () => clearInterval(interval);
  }, [hotelId, tableNumber]);

  const pendingCount = useMemo(() => {
    return activeOrders.reduce(
      (sum, o) => sum + (o.pendingQty || o.quantity || 0),
      0
    );
  }, [activeOrders]);

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveOrders(prev => [...prev]);
    }, 1000); // update every 1 second for countdown
    return () => clearInterval(interval);
  }, []);

  /* ================= FILTERS ================= */

  const filteredFoods = useMemo(() => {
    return foods
      .filter(f =>
        f.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      .filter(f =>
        selectedVegType === "all"
          ? true
          : f.category === selectedVegType
      );
  }, [foods, searchTerm, selectedVegType]);


  const showVegFilter = useMemo(() => {
    const hasVeg = foods.some(f => f.category === "veg");
    const hasNonVeg = foods.some(f => f.category === "non-veg");

    return hasVeg && hasNonVeg;
  }, [foods]);

  /* ================= SPECIAL SECTIONS ================= */

  const starterFoods = useMemo(() => {
    return filteredFoods.filter(
      f => f.foodCategory?.toLowerCase() === "starter"
    );
  }, [filteredFoods]);

  const rotiRiceDrinksFoods = useMemo(() => {
    return filteredFoods.filter(f =>
      ["roti", "rice", "drinks"].includes(
        f.foodCategory?.toLowerCase()
      )
    );
  }, [filteredFoods]);

  const mainCourseFoods = useMemo(() => {
    return filteredFoods.filter(f =>
      !["starter", "roti", "rice", "drinks"].includes(
        f.foodCategory?.toLowerCase()
      )
    );
  }, [filteredFoods]);

  const rotiRiceDrinksTitle = useMemo(() => {
    const categoryMap = {
      roti: "Roti",
      rice: "Rice",
      drinks: "Drinks",
    };

    const availableCategories = Array.from(
      new Set(
        rotiRiceDrinksFoods.map(f => f.foodCategory?.toLowerCase())
      )
    );

    return availableCategories
      .map(cat => categoryMap[cat])
      .filter(Boolean)
      .join(" • ");
  }, [rotiRiceDrinksFoods]);

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

  const orderTotal = useMemo(() => {
    return activeOrders.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
  }, [activeOrders]);

  /* ================= PLACE ORDER ================= */

  const placeOrder = async () => {
    if (!cart.length) return alert("Cart empty");

    try {
      const res = await fetch(`${API}/api/bookings/place-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hotelId,
          tableNumber: tableNumber,
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
        setOrderTime(new Date());
      } else {
        setOrderMessage("Failed to place order");
      }

      setTimeout(() => setOrderMessage(""), 3000);
    } catch {
      setOrderMessage("Server error");
      setTimeout(() => setOrderMessage(""), 3000);
    }
  };
  /* ================= CANCEL ORDER ================= */
  const cancelOrder = async (bookingId, foodId) => {
    try {
      const res = await fetch(
        `${API}/api/bookings/remove-item/${bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodId }),
        }
      );

      const data = await res.json();

      if (data.success) {
        // remove from UI
        setActiveOrders(prev =>
          prev.filter(
            o =>
              !(
                o.bookingId === bookingId &&
                o.foodId === foodId
              )
          )
        );
      }
    } catch (err) {
      console.error("Cancel error:", err);
    }
  };
  /* ================= FOOD CARD ================= */

  const renderFoodCard = (food) => {
    const qty = getQty(food._id);

    const imageUrl = food.image
      ? (food.image.startsWith("http")
        ? food.image
        : `${API}/${food.image.replace(/^\/+/, "")}`)
      : "/placeholder-food.jpg";

    return (
      <div key={food._id} className="food-card-overlay">
        <div className="image-wrapper">

          <img
            src={imageUrl}
            alt={food.title}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = "/placeholder-food.jpg";
            }}
          />

          {/* Gradient Overlay */}
          <div className="image-gradient"></div>

          {/* Veg Icon */}
          <div className={`veg-icon category-badge ${food.category}`}>
            {food.category === "veg" ? "🥬 Veg" : "🍗 Non-Veg"}
          </div>

          {/* Title + Description */}
          <div className="food-info">
            <h3>{food.title}</h3>
            <p>
              {food.desc || food.description || "Delicious food item"}
            </p>
          </div>

          {/* Bottom Bar */}
          <div className="bottom-bar">
            <div className="price-section">
              <span className="price">₹{food.price}</span>
            </div>

            {qty === 0 ? (
              <button
                className="add-btn"
                onClick={() => increase(food)}
              >
                Add +
              </button>
            ) : (
              <div className="qty-control-overlay">
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

        </div>
      </div>
    );
  };

  if (loading) return <div>Loading...</div>;
  if (!hotel) return <div>Hotel not found</div>;

  return (
    <div className="menu-container">

      <div className="hotel-header">
        <h1>{hotel.hotelName}</h1>
        <p><MapPin size={14} /> {hotel.city}, {hotel.state}</p>
        <p>Table {tableNumber}</p>
      </div>

      <div className="search-container">
        <Search size={16} />
        <input
          placeholder="Search food..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {showVegFilter && (
        <div className="veg-filter">
          <button
            className={selectedVegType === "all" ? "active" : ""}
            onClick={() => setSelectedVegType("all")}
          >
            All
          </button>

          <button
            className={selectedVegType === "veg" ? "active" : ""}
            onClick={() => setSelectedVegType("veg")}
          >
            Veg
          </button>

          <button
            className={selectedVegType === "non-veg" ? "active" : ""}
            onClick={() => setSelectedVegType("non-veg")}
          >
            Non-Veg
          </button>
        </div>
      )}

      {/* STARTER */}
      {starterFoods.length > 0 && (
        <>
          <h2 className="section-title">Starter</h2>
          <div className="horizontal-slider">
            {starterFoods.map(renderFoodCard)}
          </div>
        </>
      )}

      {/* ROTI RICE DRINKS */}
      {rotiRiceDrinksFoods.length > 0 && (
        <>
          <h2 className="section-title">{rotiRiceDrinksTitle}</h2>
          <div className="horizontal-slider">
            {rotiRiceDrinksFoods.map(renderFoodCard)}
          </div>
        </>
      )}

      {/* ALL FOODS */}
      <h2 className="section-title" id="color">All Items</h2>
      <div className="food-grid">
        {mainCourseFoods.map(renderFoodCard)}
      </div>

      {orderMessage && (
        <div className="order-message">{orderMessage}</div>
      )}

      {cart.length > 0 && (
        <button
          className="floating-cart"
          onClick={() => setShowCart(true)}
        >
          <ShoppingCart size={18} />
          {cart.reduce((s, i) => s + i.quantity, 0)}
        </button>
      )}

      <button
        className="floating-orders"
        onClick={() => setShowOrders(true)}
      >
        <ClipboardList size={18} />
        {pendingCount}
      </button>

      {showCart && (
        <div className="cart-sidebar">
          <h2>Your Cart</h2>
          {cart.map(i => (
            <div key={i._id}>
              {i.title} × {i.quantity} = {i.price * i.quantity}
            </div>
          ))}
          <h3>Total ₹{cartTotal}</h3>
          <div className="form-group">
            <label>Spice Level</label>
            <select
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description"
            />
          </div>
          <button onClick={placeOrder}>Place Order</button>
          <button onClick={() => setShowCart(false)}>Close</button>
        </div>
      )}

      {showOrders && (
        <div className="order-slider">
          <div className="order-header">
            <h2>Your Orders</h2>
            <button onClick={() => setShowOrders(false)}>Close</button>
            {orderTime && (
              <div className="order-time">
                🕒 Ordered at: {orderTime.toLocaleTimeString([], {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true
                })}
              </div>
            )}
          </div>

          {activeOrders.length === 0 ? (
            <p>No orders yet</p>
          ) : (
            activeOrders.map(order => {
              const orderedTime = order.orderedAt
                ? new Date(order.orderedAt).getTime()
                : Date.now();
              const now = Date.now();

              const cancelDuration = 5 * 60 * 1000; // 5 minutes in ms
              const timePassed = now - orderedTime;
              const timeLeft = cancelDuration - timePassed;

              const canDelete = timeLeft > 0 && !order.delivered;

              const minutes = Math.floor((timeLeft / 1000 / 60) % 60);
              const seconds = Math.floor((timeLeft / 1000) % 60);

              const formattedTime =
                timeLeft > 0
                  ? `${minutes.toString().padStart(2, "0")}:${seconds
                    .toString()
                    .padStart(2, "0")}`
                  : "00:00";
              return (
                <div key={order.foodId} className="order-card">

                  <div className="order-row">
                    <div>
                      <strong>{order.title}</strong> × {order.quantity}
                    </div>

                    <div className="order-item-amount">
                      ₹{order.price * order.quantity}
                    </div>
                  </div>

                  <div className="order-meta">
                    🕒 Ordered at: {new Date(order.orderedAt).toLocaleTimeString([], {
                      hour: "numeric",
                      minute: "2-digit",
                      hour12: true
                    })}

                    {!order.delivered && (
                      <div className="countdown-timer">
                        ⏳ Cancel in: {formattedTime}
                      </div>
                    )}
                  </div>

                  <div className="order-status">
                    {order.delivered ? (
                      <span className="delivered-badge">✅ Delivered</span>
                    ) : (
                      <span className="pending-badge">⏳ Pending</span>
                    )}
                  </div>

                  {canDelete ? (
                    <button
                      className="delete-order-btn"
                      onClick={() =>
                        cancelOrder(order.bookingId, order.foodId)
                      }
                    >
                      🗑 Cancel Order
                    </button>
                  ) : !order.delivered ? (
                    <div className="expired-text">
                      ❌ Cancel time expired
                    </div>
                  ) : null}

                </div>
              );
            })
          )}

          {activeOrders.length > 0 && (
            <div className="order-total-box">
              <h3>Total Amount: ₹{orderTotal}</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MenuPage;