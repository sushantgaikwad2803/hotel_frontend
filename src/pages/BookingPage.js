import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./booking.css";

function BookingPage() {
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [tables, setTables] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("hotelUser");

    if (!savedUser) {
      navigate("/login");
      return;
    }

    const hotelData = JSON.parse(savedUser);
    setHotel(hotelData);

    const tableCount = hotelData.tableCount || 0;

    const tableArray = Array.from({ length: tableCount }, (_, i) => i + 1);
    setTables(tableArray);

  }, [navigate]);

  if (!hotel) return <div>Loading...</div>;

  return (
    <div className="booking-container">
      <div className="booking-header">
        <button onClick={() => navigate(-1)}>⬅ Back</button>
        <h1>{hotel.hotelName} - Tables</h1>
      </div>

      {tables.length === 0 ? (
        <p>No tables available.</p>
      ) : (
        <div className="tables-grid">
          {tables.map((table) => (
            <div key={table} className="table-card">
              <h3>Table {table}</h3>
              <span className="status available">Available</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BookingPage;
