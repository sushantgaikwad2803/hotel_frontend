import React from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";

function GenerateQR() {
  const navigate = useNavigate();
  const savedUser = JSON.parse(localStorage.getItem("hotelUser"));

  if (!savedUser) {
    navigate("/login");
    return null;
  }

  const { _id, tableCount, hotelName } = savedUser;

  const tables = Array.from(
    { length: tableCount || 0 },
    (_, index) => index + 1
  );

  return (
    <div style={{ padding: "40px" }}>
      <h2>{hotelName} - Table QR Codes</h2>

      <button onClick={() => navigate(-1)}>
        Back to Dashboard
      </button>

      <div style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "30px",
        marginTop: "30px"
      }}>
        {tables.map((tableNumber) => {
          const qrValue = `http://localhost:3000/menu/${_id}/${tableNumber}`;

          return (
            <div key={tableNumber} style={{
              border: "1px solid #ddd",
              padding: "20px",
              borderRadius: "10px",
              textAlign: "center"
            }}>
              <h3>Table {tableNumber}</h3>

              <QRCodeCanvas
                value={qrValue}
                size={200}
              />

              <p style={{ marginTop: "10px", fontSize: "12px" }}>
                {qrValue}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default GenerateQR;
