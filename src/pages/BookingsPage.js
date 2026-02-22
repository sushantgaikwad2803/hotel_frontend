import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./bookings.css";

const API = "https://hotel-backend-dm5h.onrender.com";

function BookingsPage() {
  const navigate = useNavigate();

  const [hotel, setHotel] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  // const [ ] = useState({});

  /* ==============================
     LOAD HOTEL
  ============================== */
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

  /* ==============================
     FETCH BOOKINGS
  ============================== */
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

  /* ==============================
     REDUCE QUANTITY
  ============================== */
  const reduceQuantity = async (bookingId, foodId) => {
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
        updateBookingState(bookingId, data.data);
      }
    } catch (err) {
      console.error("Reduce error:", err);
    }
  };

  /* ==============================
     DELETE ITEM COMPLETELY
  ============================== */
  const deleteItemCompletely = async (bookingId, foodId) => {
    if (!window.confirm("Delete this item completely?")) return;

    try {
      const res = await fetch(
        `${API}/api/bookings/delete-item/${bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodId }),
        }
      );

      const data = await res.json();

      if (data.success) {
        updateBookingState(bookingId, data.data);
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  /* ==============================
     MARK AS DELIVERED (UI ONLY)
  ============================== */
  const markAsDelivered = async (bookingId, foodId) => {
    try {
      const res = await fetch(
        `${API}/api/bookings/deliver-item/${bookingId}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foodId }),
        }
      );
  
      const data = await res.json();
  
      if (data.success) {
        updateBookingState(bookingId, data.data);
      }
    } catch (err) {
      console.error("Deliver error:", err);
    }
  };

  /* ==============================
     COMPLETE TABLE
  ============================== */
  const completeTableOrders = async (tableBookings) => {
    if (!window.confirm("Complete all orders for this table?")) return;

    try {
      await Promise.all(
        tableBookings.map((booking) =>
          fetch(`${API}/api/bookings/complete/${booking._id}`, {
            method: "PUT",
          })
        )
      );

      fetchBookings();
    } catch (err) {
      console.error("Complete error:", err);
    }
  };

  /* ==============================
     UPDATE LOCAL STATE
  ============================== */
  const updateBookingState = (bookingId, updatedBooking) => {
    setBookings((prev) =>
      prev.map((b) => (b._id === bookingId ? updatedBooking : b))
    );
  };

  /* ==============================
     RENDER
  ============================== */
  if (loading) return <div className="loading">Loading...</div>;
  if (!hotel) return null;

  const totalTables = hotel.tableCount || 0;

  return (
    <div className="bookings-container">
      <h1>{hotel.hotelName} - Tables</h1>
      {error && <p className="error">{error}</p>}

      <div className="tables-grid">
        {[...Array(totalTables)].map((_, index) => {
          const tableNumber = index + 1;

          const tableBookings = bookings.filter(
            (b) =>
              Number(b.tableNumber) === tableNumber &&
              b.status === "active"
          );

          const tableTotal = tableBookings.reduce(
            (sum, booking) => sum + booking.totalAmount,
            0
          );

          const isBooked = tableBookings.length > 0;

          return (
            <div
              key={tableNumber}
              className={`table-card ${
                isBooked ? "booked" : "available"
              }`}
            >
              <h3>Table {tableNumber}</h3>

              {isBooked ? (
                <div className="booking-box">
                  <strong>🍽 Active Orders</strong>

                  <div className="orders-list">
                    {tableBookings.map((booking) =>
                      booking.orders.map((item) => {
                        const key = `${booking._id}-${item.foodId}`;
                        const isDelivered = item.delivered;

                        return (
                          <div key={key} className="order-row">
                            <div className="order-details">
                              <strong>{item.title}</strong>
                              <span>Qty: {item.quantity}</span>

                              <span
                                className={
                                  isDelivered
                                    ? "price-delivered"
                                    : "price-pending"
                                }
                              >
                                ₹{item.price * item.quantity}
                              </span>
                            </div>

                            <div className="action-buttons">
                              <button
                                className="reduce-btn"
                                onClick={() =>
                                  reduceQuantity(
                                    booking._id,
                                    item.foodId
                                  )
                                }
                              >
                                ➖
                              </button>

                              <button
                                className="delete-btn"
                                onClick={() =>
                                  deleteItemCompletely(
                                    booking._id,
                                    item.foodId
                                  )
                                }
                              >
                                🗑
                              </button>

                              <button
                                className="delete-btn"
                                disabled={isDelivered}
                                onClick={() =>
                                  markAsDelivered(
                                    booking._id,
                                    item.foodId
                                  )
                                }
                              >
                                {isDelivered
                                  ? "✔ Delivered"
                                  : "🚚 Deliver"}
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  <h4 className="table-total">
                    Total ₹{tableTotal}
                  </h4>

                  <button
                    className="complete-btn"
                    onClick={() =>
                      completeTableOrders(tableBookings)
                    }
                  >
                    Dinner Completed
                  </button>
                </div>
              ) : (
                <p className="available-text">Available</p>
              )}
            </div>
          );
        })}
      </div>

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