import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import "./KOT.css";

const API = process.env.REACT_APP_API;

function KOTPage() {
    const { hotelId } = useParams();
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [lastOrderCount, setLastOrderCount] = useState(0);

    const audioRef = useRef(null);

    useEffect(() => {
        audioRef.current = new Audio("/notification.mp3");
    }, []);
    
    const fetchOrders = useCallback(async () => {
        try {
            const res = await fetch(`${API}/api/bookings/kot/${hotelId}`);
            const data = await res.json();
    
            if (data.success) {
                const tableOrders = data.data.sort(
                    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
                );
    
                setOrders(tableOrders);
            }
        } catch (error) {
            console.error("Error fetching orders:", error);
        } finally {
            setLoading(false);
        }
    }, [hotelId]);

    const markDelivered = async (bookingId, orderItemId) => {
        try {
            const res = await fetch(`${API}/api/bookings/deliver-item/${bookingId}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderItemId })
            });

            const data = await res.json();

            if (data.success) {
                fetchOrders();
            }
        } catch (error) {
            console.error("Error marking as delivered:", error);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, [fetchOrders]);

    // Calculate total orders
    const totalOrders = orders.reduce((acc, booking) =>
        acc + booking.orders.filter(item => !item.delivered).length, 0
    );

    if (loading) {
        return (
            <div className="kot-container">
                <div className="kot-header">
                    <h1>🍳 Kitchen Orders</h1>
                </div>
                <div className="kot-grid">
                    {[1, 2, 3].map(n => (
                        <div key={n} className="skeleton-card">
                            <div className="skeleton-line" style={{ width: '60%' }}></div>
                            <div className="skeleton-line"></div>
                            <div className="skeleton-line" style={{ width: '80%' }}></div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="kot-container">
            <div className="kot-header">
                <h1>
                    <span role="img" aria-label="kitchen">🍳</span>
                    Kitchen Orders
                </h1>
                <div className="kitchen-stats">
                    <div className="stat-item">
                        <span>Active Tables</span>
                        <span>{orders.length}</span>
                    </div>
                    <div className="stat-item">
                        <span>Pending Items</span>
                        <span>{totalOrders}</span>
                    </div>
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="no-orders">
                    <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🍽️</div>
                    <h3>No Active Orders</h3>
                    <p>Kitchen is ready for new orders!</p>
                </div>
            ) : (
                <div className="kot-grid">
                    {orders.map((booking) => {
                        const pendingOrders = booking.orders.filter(item => !item.delivered);

                        return (
                            <div key={booking._id} className="kot-card">
                                <div className="kot-table">
                                    <span className="table-info">
                                        🍽️ Table {booking.tableNumber}
                                        <span className="table-badge">
                                            {pendingOrders.length} item{pendingOrders.length !== 1 ? 's' : ''}
                                        </span>
                                    </span>
                                </div>

                                <div className="orders-container">
                                    {pendingOrders.map((item) => {
                                        const orderTime = new Date(item.orderedAt);
                                        const timeDiff = (new Date() - orderTime) / (1000 * 60); // minutes

                                        return (
                                            <div
                                                key={item._id}
                                                className={`kot-item ${timeDiff > 15 ? 'urgent' : ''} ${item.priority === 'high' ? 'high-priority' : ''
                                                    }`}
                                            >
                                                <h3>{item.title}</h3>

                                                <div className="item-details">
                                                    <span className="item-quantity">
                                                        🔢 Qty: {item.quantity}
                                                    </span>
                                                    <span className="item-time">
                                                        ⏰ {orderTime.toLocaleTimeString([], {
                                                            hour: "numeric",
                                                            minute: "2-digit",
                                                            hour12: true
                                                        })}
                                                        {timeDiff > 10 && (
                                                            <span style={{ color: timeDiff > 15 ? 'var(--danger-color)' : 'var(--warning-color)' }}>
                                                                {' '}({Math.round(timeDiff)} min)
                                                            </span>
                                                        )}
                                                    </span>
                                                </div>

                                                {item.instructions && (
                                                    <div className="item-instructions">
                                                        📝 Note: {item.instructions}
                                                    </div>
                                                )}

                                                <button
                                                    className="serve-btn"
                                                    onClick={() => markDelivered(booking._id, item._id)}
                                                    title="Mark as served"
                                                >
                                                    ✔ Serve
                                                </button>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default KOTPage;