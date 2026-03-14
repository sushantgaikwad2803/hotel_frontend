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
  const [selectedPayment, setSelectedPayment] = useState("cash");
  const [showBillPopup, setShowBillPopup] = useState(false);
  const [billData, setBillData] = useState(null);

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

      const res = await fetch(
        `${API}/api/bookings/hotel/${hotel._id}`
      );
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

    const interval = setInterval(fetchBookings, 5000);

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

  const markAsDelivered = async (bookingId, orderItemId) => {

    const res = await fetch(`${API}/api/bookings/deliver-item/${bookingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderItemId })
    });
  
    const data = await res.json();
  
    if (data.success) {
      fetchBookings();
    }
  
  };

  const sendToKitchen = async () => {

    const tableBookings = bookings.filter(
      b =>
        b.tableNumber === openTable &&
        b.status === "active"
    );

    if (tableBookings.length === 0) return;

    try {

      await Promise.all(
        tableBookings.map((booking) =>
          fetch(`${API}/api/bookings/send-kot/${booking._id}`, {
            method: "PUT"
          })
        )
      );

      alert("Order Sent To Kitchen");

      fetchBookings();

    } catch (err) {
      console.error(err);
    }

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
  const completeTableOrders = () => {

    const tableBookings = bookings.filter(
      b => b.tableNumber === openTable && b.status === "active"
    );

    if (tableBookings.length === 0) return;

    const items = [];

    tableBookings.forEach(booking => {
      booking.orders.forEach(item => {
        items.push(item);
      });
    });

    const subtotal = items.reduce(
      (sum, i) => sum + (i.price * i.quantity),
      0
    );

    const gst = Number((subtotal * 0.05).toFixed(2));
    const total = Number((subtotal + gst).toFixed(2));

    setBillData({
      items,
      subtotal,
      gst,
      total
    });

    setShowBillPopup(true);
  };

  const printBillAndComplete = async () => {

    const res = await fetch(`${API}/api/orders/complete-table`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        hotelId: hotel._id,
        tableNumber: openTable,
        paymentMethod: selectedPayment
      })
    });

    const data = await res.json();

    if (data.success) {

      generateBill(data.order);

      fetchBookings();

      setShowBillPopup(false);
      setOpenTable(null);

    }

  };

  const generateBill = (order) => {

    const items = order.items;
    const billNo = order.billNo;


    let subtotal = 0;

    items.forEach(item => {
      subtotal += item.price * item.quantity;
    });

    const gst = Number((subtotal * 0.05).toFixed(2));
    const total = Number((subtotal + gst).toFixed(2));


    const billHTML = `
    <html>
    <head>
    <title>Restaurant Bill</title>
    <style>
    body{
      font-family: monospace;
      width:300px;
      margin:auto;
    }
    h2,h3{
      text-align:center;
    }
    table{
      width:100%;
      border-collapse:collapse;
    }
    td,th{
      padding:4px;
      border-bottom:1px dashed #000;
    }
    </style>
    </head>
  
    <body>
  
    <h2>${hotel.hotelName}</h2>
    <h3>${hotel.address || ""}</h3>
  
    <p>Bill No: ${billNo}</p>
    <p>Table: ${openTable}</p>
    <p>Date: ${new Date(order.createdAt).toLocaleString()}</p>
    <p>Payment: ${order.paymentMethod}</p>
  
    <table>
    <tr>
    <th>Item</th>
    <th>Qty</th>
    <th>Price</th>
    </tr>
  
    ${items.map(item => `
    <tr>
    <td>${item.title}</td>
    <td>${item.quantity}</td>
    <td>₹${item.price * item.quantity}</td>
    </tr>
    `).join("")}
  
    </table>
  
    <hr>
  
    <p>Subtotal : ₹${subtotal.toFixed(2)}</p>
    <p>GST (5%) : ₹${gst.toFixed(2)}</p>
  
    <h3>Total : ₹${total.toFixed(2)}</h3>
  
    <p style="text-align:center">Thank You Visit Again</p>
  
    </body>
    </html>
    `;

    const win = window.open("", "", "width=350,height=600");
    win.document.write(billHTML);
    win.document.close();
    win.print();
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

      {(hotel?.sections || [])
        .sort((a, b) => {

          const aHasOrder = bookings.some(
            bk => bk.tableNumber.split("-T")[0] === a.sectionName && !bk.kotSent
          );

          const bHasOrder = bookings.some(
            bk => bk.tableNumber.split("-T")[0] === b.sectionName && !bk.kotSent
          );

          if (aHasOrder && !bHasOrder) return -1;
          if (!aHasOrder && bHasOrder) return 1;

          return 0;

        })
        .map((section, sectionIndex) => {

          const sectionTables = Array.from(
            { length: Number(section.tableCount) || 0 },
            (_, i) => ({
              section: section.sectionName,
              tableNumber: `${section.sectionName}-T${i + 1}`
            })
          ).sort((a, b) => {

            const aBookings = bookings.filter(
              bk => bk.tableNumber === a.tableNumber && bk.status === "active"
            );

            const bBookings = bookings.filter(
              bk => bk.tableNumber === b.tableNumber && bk.status === "active"
            );

            const aNew = aBookings.some(bk => !bk.kotSent);
            const bNew = bBookings.some(bk => !bk.kotSent);

            if (aNew && !bNew) return -1;
            if (!aNew && bNew) return 1;

            return 0;

          });
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
                  const hasNewOrder = tableBookings.some(b => !b.kotSent);

                  return (

                    <div
                      key={tableNumber}
                      className={`table-card ${isBooked ? "booked" : "available"}`}
                      onClick={() => setOpenTable(tableNumber)}
                    >

                      <h3>{tableNumber}</h3>

                      {isBooked ? (
                        <div className="booking-box">

                          {hasNewOrder ? (
                            <strong className="new-order">🔴 New Order</strong>
                          ) : (
                            <strong>🍽 Active Orders</strong>
                          )}

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

      {showBillPopup && billData && (

        <div className="manual-popup">

          <h3>Bill Preview</h3>

          <p>Table: {openTable}</p>

          <table>

            <tr>
              <th>Item</th>
              <th>Qty</th>
              <th>Total</th>
            </tr>

            {billData.items.map((item, index) => (
              <tr key={index}>
                <td>{item.title}</td>
                <td>{item.quantity}</td>
                <td>₹{item.price * item.quantity}</td>
              </tr>
            ))}

          </table>

          <p>Subtotal: ₹{billData.subtotal}</p>
          <p>GST (5%): ₹{billData.gst}</p>

          <h3>Total: ₹{billData.total}</h3>

          <h4>Select Payment</h4>

          <select
            value={selectedPayment}
            onChange={(e) => setSelectedPayment(e.target.value)}
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
          </select>

          <br /><br />

          <button
            className="complete-btn"
            onClick={printBillAndComplete}
          >
            🖨 Print Bill
          </button>

          <button
            className="back-btn"
            onClick={() => setShowBillPopup(false)}
          >
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
            <div id="Main1">
              <button
                className="back-btn"
                onClick={() => setOpenTable(null)}
              >
                Close
              </button>

              <h2>Table {openTable}</h2>
            </div>

            {bookings
              .filter(
                b =>
                  b.tableNumber === openTable &&
                  b.status === "active"
              )
              .map((booking) =>
                booking.orders.map((item) => {

                  const key = item._id;
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
                            markAsDelivered(booking._id, item._id)
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
                onClick={completeTableOrders}
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
                onClick={sendToKitchen}
              >
                🍳 Send To Kitchen
              </button>

              <button
                className="back-btn"
                onClick={() => setShowShiftPopup(true)}
              >
                🔄 Shift Table
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