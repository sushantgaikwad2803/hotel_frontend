import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./bookings.css";

const API = process.env.REACT_APP_API;

function RoomsPage() {

    const navigate = useNavigate();

    const [hotel, setHotel] = useState(null);
    const [roomOrders, setRoomOrders] = useState([]);
    const [foods, setFoods] = useState([]);

    const [loading, setLoading] = useState(true);

    const [openRoom, setOpenRoom] = useState(null);

    const [showManual, setShowManual] = useState(false);
    const [searchFood, setSearchFood] = useState("");
    const [selectedFood, setSelectedFood] = useState(null);
    const [quantity, setQuantity] = useState(1);
    const [cartItems, setCartItems] = useState([]);
    const [showBillPopup, setShowBillPopup] = useState(false);
    const [billData, setBillData] = useState(null);
    const [selectedPayment, setSelectedPayment] = useState("cash");
    const [showLoginPopup, setShowLoginPopup] = useState(false);

    const [customerName, setCustomerName] = useState("");
    const [age, setAge] = useState("");
    const [personCount, setPersonCount] = useState("");

    /* ================= AUTH CHECK ================= */

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



    /* ================= LOAD FOODS ================= */

    useEffect(() => {

        if (!hotel?._id) return;

        fetch(`${API}/api/food/hotel/${hotel._id}`)
            .then(res => res.json())
            .then(data => {
                if (data.success) setFoods(data.data);
            });

    }, [hotel]);



    /* ================= FETCH ROOM ORDERS ================= */

    const fetchRoomOrders = useCallback(async () => {

        if (!hotel?._id) return;

        try {

            const res = await fetch(
                `${API}/api/bookings/hotel/${hotel._id}?type=room`
            );

            const data = await res.json();

            if (data.success) {
                setRoomOrders(data.data);
            }

        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }

    }, [hotel]);



    useEffect(() => {

        if (!hotel?._id) return;

        fetchRoomOrders();

        const interval = setInterval(fetchRoomOrders, 5000);

        return () => clearInterval(interval);

    }, [hotel, fetchRoomOrders]);



    /* ================= FOOD SEARCH ================= */

    const filteredFoods = foods.filter(food => {
        const search = searchFood.trim().toLowerCase();
        return food.title.toLowerCase().startsWith(search);
    });

    const generateBill = (bill) => {

        const items = bill?.foodItems || [];

        const billHTML = `
        
        <html>
        <head>
        
        <style>
        body{font-family:monospace;width:300px;margin:auto;}
        h2,h3{text-align:center;}
        table{width:100%;border-collapse:collapse;}
        td,th{padding:4px;border-bottom:1px dashed #000;}
        
        </style>
        
        </head>
        
        <body>
        
        <h2>${hotel.hotelName}</h2>
        
        <h3>Room Bill</h3>
        
        <p>Bill No : ${bill.billNo}</p>
        
        <p>Room : ${bill.roomNumber}</p>
        
        <p>Customer : ${bill.customerName}</p>
        
        <p>Persons : ${bill.personCount}</p>
        
        <p>CheckIn : ${new Date(bill.checkInTime).toLocaleString()}</p>
        
        <p>CheckOut : ${new Date(bill.checkOutTime).toLocaleString()}</p>
        
        <p>Stay Days : ${bill.stayDays}</p>
        
        <hr>
        
        <h3>Food Items</h3>
        
        <table>
        
        <tr>
        <th>Item</th>
        <th>Qty</th>
        <th>Total</th>
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
        
        <p>Room Rent : ₹${bill.roomTotal}</p>
        
        <p>Food Total : ₹${bill.foodTotal}</p>
        
        <p>GST : ₹${bill.gst}</p>
        
        <h3>Total : ₹${bill.total}</h3>
        
        <p>Payment : ${bill.paymentMethod}</p>
        
        <p style="text-align:center">Thank You Visit Again</p>
        
        </body>
        
        </html>
        
        `;

        const win = window.open("", "", "width=350,height=600");

        win.document.write(billHTML);

        win.document.close();

        win.print();

    };

    const checkoutRoom = async () => {

        const res = await fetch(`${API}/api/bookings/generate-room-bill`, {

            method: "POST",
            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({
                hotelId: hotel._id,
                roomNumber: openRoom
            })

        });

        const data = await res.json();

        if (data.success) {

            setBillData(data.bill);
            setShowBillPopup(true);

        }

    };


    const printBillAndComplete = async () => {

        const res = await fetch(`${API}/api/bookings/room-checkout`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                hotelId: hotel._id,
                roomNumber: openRoom,
                paymentMethod: selectedPayment
            })
        });

        const data = await res.json();

        if (data.success) {

            generateBill(data.bill);

            fetchRoomOrders();

            setShowBillPopup(false);

            setOpenRoom(null);

        }

    };


    /* ================= ADD TO CART ================= */

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



    /* ================= MANUAL ROOM ORDER ================= */

    const submitManualOrder = async () => {

        if (cartItems.length === 0) return;

        const res = await fetch(`${API}/api/bookings/manual-add`, {

            method: "POST",
            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({
                hotelId: hotel._id,
                roomNumber: openRoom,
                orderType: "room",
                items: cartItems
            })

        });

        const data = await res.json();

        if (data.success) {

            fetchRoomOrders();

            setCartItems([]);
            setShowManual(false);

        }

    };



    /* ================= CANCEL ITEM ================= */

    const reduceQuantity = async (bookingId, foodId) => {

        const res = await fetch(`${API}/api/bookings/remove-item/${bookingId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ foodId })
        });

        const data = await res.json();

        if (data.success) fetchRoomOrders();

    };



    /* ================= MARK DELIVERED ================= */

    const markAsDelivered = async (bookingId, orderItemId) => {

        const res = await fetch(`${API}/api/bookings/deliver-item/${bookingId}`, {

            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderItemId })

        });

        const data = await res.json();

        if (data.success) fetchRoomOrders();

    };

    const roomLogin = async () => {

        const res = await fetch(`${API}/api/bookings/room-login`, {

            method: "POST",
            headers: { "Content-Type": "application/json" },

            body: JSON.stringify({

                hotelId: hotel._id,
                roomNumber: openRoom,
                customerName,
                age,
                personCount

            })

        });

        const data = await res.json();

        if (data.success) {

            fetchRoomOrders();

            setShowLoginPopup(false);

            setCustomerName("");
            setAge("");
            setPersonCount("");

        }

    };



    /* ================= SEND TO KITCHEN ================= */

    const sendToKitchen = async () => {

        const roomBookings = roomOrders.filter(
            r => r.number === openRoom && r.status === "active"
        );

        if (roomBookings.length === 0) return;

        try {

            await Promise.all(
                roomBookings.map((booking) =>
                    fetch(`${API}/api/bookings/send-kot/${booking._id}`, {
                        method: "PUT"
                    })
                )
            );

            alert("Order Sent To Kitchen");

            fetchRoomOrders();

        } catch (err) {
            console.error(err);
        }

    };





    if (loading) return <div className="loading">Loading...</div>;
    if (!hotel) return null;



    /* ================= GENERATE ROOMS ================= */

    const rooms = Array.from(
        { length: Number(hotel.roomCount) || 0 },
        (_, i) => `R${i + 1}`
    );

    const isRoomLoggedIn = roomOrders.some(
        r => r.number === openRoom && r.status === "active" && r.checkInTime
    );


    return (

        <div className="bookings-container">

            <h1>{hotel.hotelName} - Rooms</h1>

            <div className="tables-grid">

                {rooms.map(room => {

                    const roomBooking = roomOrders.find(
                        r => r.number === room && r.status === "active"
                    );

                    const isOccupied = !!roomBooking;

                    return (

                        <div
                            key={room}
                            className={`table-card ${isOccupied ? "booked" : "available"}`}
                            onClick={() => setOpenRoom(room)}
                        >

                            <h3>{room}</h3>

                            {isOccupied ? (
                                <strong>🛎 Room Service Active</strong>
                            ) : (
                                <p className="available-text">Available</p>
                            )}

                        </div>

                    );

                })}

            </div>


            {showLoginPopup && (

                <div className="manual-popup">

                    <h3>Room Check In</h3>

                    <input type="text"
                        placeholder="Customer Name"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Age"
                        value={age}
                        onChange={(e) => setAge(e.target.value)}
                    />

                    <input
                        type="number"
                        placeholder="Person Count"
                        value={personCount}
                        onChange={(e) => setPersonCount(e.target.value)}
                    />

                    <button  className="login-btn" onClick={roomLogin}>
                        Check In
                    </button>

                    <button className="login-btn" onClick={() => setShowLoginPopup(false)}>
                        Cancel
                    </button>

                </div>

            )}



            {/* ================= ROOM ORDERS POPUP ================= */}

            {openRoom && (

                <div
                    className="orders-popup"
                    onClick={() => setOpenRoom(null)}
                >

                    <div
                        className="orders-card"
                        onClick={(e) => e.stopPropagation()}
                    >

                        <h2>Room {openRoom}</h2>

                        {(() => {
                            const roomData = roomOrders.find(
                                r => r.number === openRoom && r.status === "active"
                            );

                            if (!roomData) return null;

                            return (
                                <div className="room-info">
                                    <p><strong>Customer:</strong> {roomData.customerName || "N/A"}</p>
                                    <p><strong>Age:</strong> {roomData.age || "N/A"}</p>
                                    <p><strong>Persons:</strong> {roomData.personCount || "N/A"}</p>
                                    <p>
                                        <strong>Check-In:</strong>{" "}
                                        {roomData.checkInTime
                                            ? new Date(roomData.checkInTime).toLocaleString()
                                            : "N/A"}
                                    </p>
                                    <hr />
                                </div>
                            );
                        })()}

                        {roomOrders
                            .filter(
                                r =>
                                    r.number === openRoom &&
                                    r.status === "active"
                            )
                            .map(order =>
                                order.orders?.map(item => (

                                    <div key={item._id} className="order-row">

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

                                            <span>
                                                ₹{item.price * item.quantity}
                                            </span>

                                        </div>

                                        <div className="action-buttons">

                                            <button
                                                className="reduce-btn"
                                                onClick={() =>
                                                    reduceQuantity(order._id, item.foodId)
                                                }
                                            >
                                                Cancel
                                            </button>

                                            <button
                                                className="delete-btn"
                                                disabled={item.delivered}
                                                onClick={() =>
                                                    markAsDelivered(order._id, item._id)
                                                }
                                            >
                                                {item.delivered ? "✔ Delivered" : "🚚 Deliver"}
                                            </button>

                                        </div>

                                    </div>

                                ))
                            )}



                        <div className="BTN">

                            {!isRoomLoggedIn && (
                                <button
                                    className="login-btn"
                                    onClick={() => setShowLoginPopup(true)}
                                >
                                    🔑 Room Login
                                </button>
                            )}

                            <button
                                className="back-btn"
                                disabled={!isRoomLoggedIn}
                                onClick={() => {
                                    if (!isRoomLoggedIn) {
                                        alert("⚠ Please login room first");
                                        return;
                                    }
                                    setShowManual(true);
                                }}
                            >
                                ➕ Add Food
                            </button>

                            <button
                                className="back-btn"
                                disabled={!isRoomLoggedIn}
                                onClick={sendToKitchen}
                            >
                                🍳 Send To Kitchen
                            </button>

                            <button
                                className="complete-btn"
                                onClick={checkoutRoom}
                            >
                                🚪 Room Logout
                            </button>

                            <button
                                className="back-btn"
                                onClick={() => setOpenRoom(null)}
                            >
                                Close
                            </button>

                        </div>

                    </div>

                </div>

            )}


            {showBillPopup && billData && (

                <div className="manual-popup">

                    <h3>Room Bill</h3>

                    <p>Room : {billData.roomNumber}</p>
                    <p>Customer : {billData.customerName}</p>
                    <p>Persons : {billData.personCount}</p>

                    <p>Stay Days : {billData.stayDays}</p>

                    <hr />

                    <h3>Food Items</h3>

                    <table>

                        <tr>
                            <th>Item</th>
                            <th>Qty</th>
                            <th>Total</th>
                        </tr>

                        {billData.foodItems?.map((item, index) => (
                            <tr key={index}>
                                <td>{item.title}</td>
                                <td>{item.quantity}</td>
                                <td>₹{item.price * item.quantity}</td>
                            </tr>
                        ))}

                    </table>

                    <hr />

                    <p>Room Rent : ₹{billData.roomTotal}</p>
                    <p>Food Total : ₹{billData.foodTotal}</p>
                    <p>GST : ₹{billData.gst}</p>

                    <h3>Total : ₹{billData.total}</h3>

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



            {/* ================= MANUAL FOOD POPUP ================= */}

            {showManual && (

                <div className="manual-popup">

                    <h3>Add Food to {openRoom}</h3>

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



            <button
                className="back-btn"
                onClick={() => navigate("/admin")}
            >
                Back to Dashboard
            </button>

        </div>

    );

}

export default RoomsPage;