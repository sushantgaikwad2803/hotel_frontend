import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./bookings.css";

const API = process.env.REACT_APP_API;

function BookingsPage() {

  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState("");
  const [openTable, setOpenTable] = useState(null);
  const [foods, setFoods] = useState([]);
  const [showManual, setShowManual] = useState(false);
  const [searchFood, setSearchFood] = useState("");
  const [selectedFood, setSelectedFood] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartItems, setCartItems] = useState([]);
  const [showShiftPopup, setShowShiftPopup] = useState(false);
  const [newTable, setNewTable] = useState("");

  useEffect(() => {

    const storedHotel = localStorage.getItem("hotelUser");

    if (!storedHotel) {
      navigate("/login");
      return;
    }

    try {
      setHotel(JSON.parse(storedHotel));
    } catch {
      navigate("/login");
    }

  }, [navigate]);

  useEffect(() => {

    if (!hotel?._id) return;

    fetch(`${API}/api/food/hotel/${hotel._id}`)
      .then(res => res.json())
      .then(data => {
        if (data.success) setFoods(data.data);
      });

  }, [hotel]);

  const filteredFoods = foods.filter(food =>
    food.title.toLowerCase().includes(searchFood.toLowerCase())
  );

  const addToCart = () => {

    if (!selectedFood) return;

    const newItem = {
      foodId: selectedFood._id,
      title: selectedFood.title,
      price: selectedFood.price,
      quantity: Number(quantity)
    };

    setCartItems(prev => [...prev, newItem]);

    setSelectedFood(null);
    setSearchFood("");
    setQuantity(1);
  };

  const submitManualOrder = async () => {

    if (cartItems.length === 0) return;

    const res = await fetch(`${API}/api/bookings/manual-add`, {

      method: "POST",
      headers: { "Content-Type": "application/json" },

      body: JSON.stringify({
        hotelId: hotel._id,
        tableNumber: openTable,
        items: cartItems
      })

    });

    const data = await res.json();

    if (data.success) {

      fetchBookings();
      setCartItems([]);
      setShowManual(false);

    }

  };

  const fetchBookings = useCallback(async () => {

    if (!hotel?._id) return;

    try {

      const res = await fetch(`${API}/api/bookings/${hotel._id}`);
      const data = await res.json();

      if (data.success) {

        const sortedBookings = data.data.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        );

        setBookings(sortedBookings);

      } else {

        setError("Failed to load bookings.");

      }

    } catch (err) {

      console.error(err);
      setError("Server error.");

    } finally {

      setLoading(false);

    }

  }, [hotel]);

  useEffect(() => {

    if (!hotel?._id) return;

    fetchBookings();

    const interval = setInterval(fetchBookings, 3000);

    return () => clearInterval(interval);

  }, [hotel, fetchBookings]);

  const reduceQuantity = async (bookingId, foodId) => {

    const res = await fetch(`${API}/api/bookings/remove-item/${bookingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foodId })
    });

    const data = await res.json();

    if (data.success) updateBookingState(bookingId, data.data);

  };

  const markAsDelivered = async (bookingId, foodId) => {

    const res = await fetch(`${API}/api/bookings/deliver-item/${bookingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ foodId })
    });

    const data = await res.json();

    if (data.success) updateBookingState(bookingId, data.data);

  };

  const shiftTableOrders = async () => {

    if (!newTable) return;

    const res = await fetch(`${API}/api/bookings/shift-table`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId: hotel._id,
        fromTable: openTable,
        toTable: newTable
      })
    });

    const data = await res.json();

    if (data.success) {

      fetchBookings();
      setShowShiftPopup(false);
      setNewTable("");
      setOpenTable(null);

    } else {

      alert(data.message || "Table not available");

    }

  };

  const completeTableOrders = async (tableBookings) => {

    if (!window.confirm("Complete all orders for this table?")) return;

    await Promise.all(
      tableBookings.map((booking) =>
        fetch(`${API}/api/bookings/complete/${booking._id}`, {
          method: "PUT"
        })
      )
    );

    fetchBookings();

    setOpenTable(null);

  };

  const updateBookingState = (bookingId, updatedBooking) => {

    setBookings(prev =>
      prev.map(b => b._id === bookingId ? updatedBooking : b)
    );

  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!hotel) return null;

  return (

    <div className="bookings-container">

      <h1>{hotel.hotelName} - Tables</h1>

      {(hotel?.sections || []).map((section, sectionIndex) => {

        const sectionTables = Array.from(
          { length: Number(section.tableCount) || 0 },
          (_, i) => ({
            section: section.sectionName,
            tableNumber: `${section.sectionName}-T${i + 1}`
          })
        );

        return (

          <div key={sectionIndex} className="section-block">

            <h2 className="section-title">{section.sectionName} Section</h2>

            <div className="tables-grid">

              {sectionTables.map((table) => {

                const tableNumber = table.tableNumber;

                const tableBookings = bookings.filter(
                  b =>
                    b.tableNumber === tableNumber &&
                    b.status === "active"
                );

                const isBooked = tableBookings.length > 0;

                return (

                  <div
                    key={tableNumber}
                    className={`table-card ${isBooked ? "booked" : "available"}`}
                    onClick={() => setOpenTable(tableNumber)}
                  >

                    <h3>{tableNumber}</h3>

                    {isBooked ? (

                      <div className="booking-box">
                        <strong>🍽 Active Orders</strong>
                      </div>

                    ) : (

                      <p className="available-text">Available</p>

                    )}

                  </div>

                );

              })}

            </div>

          </div>

        );

      })}


      {showManual && (

        <div className="manual-popup">

          <h3>Add Food to {openTable}</h3>

          <input
            type="text"
            placeholder="Search food..."
            value={searchFood}
            onChange={(e) => setSearchFood(e.target.value)}
          />

          {searchFood && (
            <div className="search-results">

              {filteredFoods.map(food => (

                <div
                  key={food._id}
                  className="search-item"
                  onClick={() => {
                    setSelectedFood(food);
                    setSearchFood(food.title);
                  }}
                >

                  {food.title} - ₹{food.price}

                </div>

              ))}

            </div>
          )}

          {selectedFood && (

            <div className="selected-food">

              <p>{selectedFood.title}</p>
              <p>Price: ₹{selectedFood.price}</p>

              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />

              <button onClick={addToCart}>
                Add
              </button>

            </div>

          )}

          {/* CART */}

          <div className="cart-list">

            {cartItems.map((item, index) => (
              <div key={index}>

                {item.title} x {item.quantity} = ₹{item.price * item.quantity}

              </div>
            ))}

          </div>

          <button onClick={submitManualOrder}>
            Submit Order
          </button>

          <button onClick={() => setShowManual(false)}>
            Close
          </button>

        </div>

      )}

      {showShiftPopup && (

        <div className="manual-popup">

          <h3>Shift Table {openTable}</h3>

          <input
            type="text"
            placeholder="Enter new table (ex: G1-T5)"
            value={newTable}
            onChange={(e) => setNewTable(e.target.value)}
          />

          <button onClick={shiftTableOrders}>
            Shift
          </button>

          <button onClick={() => setShowShiftPopup(false)}>
            Cancel
          </button>

        </div>

      )}

      {/* ⭐ CENTER POPUP */}

      {openTable && (

        <div
          className="orders-popup"
          onClick={() => setOpenTable(null)}
        >

          <div
            className="orders-card"
            onClick={(e) => e.stopPropagation()}
          >

            <h2>Table {openTable}</h2>

            {bookings
              .filter(
                b =>
                  b.tableNumber === openTable &&
                  b.status === "active"
              )
              .map((booking) =>
                booking.orders.map((item) => {

                  const key = `${booking._id}-${item.foodId}`;
                  const isDelivered = item.delivered;

                  return (

                    <div key={key} className="order-row">

                      <div className="order-details">

                        <strong>{item.title}</strong>

                        <span>Qty: {item.quantity}</span>

                        <span className="item-time">
                          {new Date(item.orderedAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true
                          })}
                        </span>

                        <span className={isDelivered ? "price-delivered" : "price-pending"}>
                          ₹{item.price * item.quantity}
                        </span>

                      </div>

                      <div className="action-buttons">

                        {/* CANCEL */}
                        <button
                          className="reduce-btn"
                          onClick={() =>
                            reduceQuantity(booking._id, item.foodId)
                          }
                        >
                          Cancel
                        </button>

                        {/* DELIVER */}
                        <button
                          className="delete-btn"
                          disabled={isDelivered}
                          onClick={() =>
                            markAsDelivered(booking._id, item.foodId)
                          }
                        >
                          {isDelivered ? "✔ Delivered" : "🚚 Deliver"}
                        </button>

                      </div>

                    </div>

                  );

                })
              )}
            <div className="BTN">
              <button
                className="complete-btn"
                onClick={() =>
                  completeTableOrders(
                    bookings.filter(
                      b => b.tableNumber === openTable
                    )
                  )
                }
              >
                Dinner Completed
              </button>

              <button
                className="back-btn"
                onClick={() => setShowManual(true)}
              >
                ➕ Add Food
              </button>

              <button
                className="back-btn"
                onClick={() => setShowShiftPopup(true)}
              >
                🔄 Shift Table
              </button>

              <button
                className="back-btn"
                onClick={() => setOpenTable(null)}
              >
                Close
              </button>

            </div>

          </div>

        </div>

      )}

      <button
        className="back-btn"
        onClick={() => navigate("/admin")}
      >
        Back to Dashboard
      </button>

    </div>

  );

}

export default BookingsPage;