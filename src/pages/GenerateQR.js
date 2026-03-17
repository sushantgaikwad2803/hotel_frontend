import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "./generateqr.css";

function GenerateQR() {

  const navigate = useNavigate();

  const FRONTEND_URL = window.location.origin;

  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [savedUser, setSavedUser] = useState(null);

  // ✅ Auth Check
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("hotelUser"));

    if (!user) {
      navigate("/login");
    } else {
      setSavedUser(user);
    }
  }, [navigate]);

  if (!savedUser) return null;

  const { _id, sections = [], hotelName, roomCount = 0 } = savedUser;

  const rooms = Array.from({ length: Number(roomCount) || 0 }, (_, i) => ({
    roomNumber: `R${i + 1}`
  }));

  // ✅ Generate tables using sections
  const tables = sections.flatMap(section =>
    Array.from({ length: Number(section.tableCount) || 0 }, (_, i) => ({
      section: section.sectionName,
      tableNumber: `${section.sectionName}-T${i + 1}`
    }))
  );

  // ✅ Total tables
  const totalTables = tables.length;

  const handleCopyLink = (text, index) => {
    navigator.clipboard.writeText(text);

    setCopiedIndex(index);
    setShowToast(true);

    setTimeout(() => {
      setCopiedIndex(null);
      setShowToast(false);
    }, 2000);
  };

  const handleDownloadQR = (tableNumber) => {

    const canvas = document.getElementById(`qr-${tableNumber}`);
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.download = `${hotelName}-Table-${tableNumber}-QR.png`;
    link.href = url;
    link.click();
  };

  return (

    <div className="generate-qr-container">

      <div className="qr-header">

        <h2>Table QR Codes</h2>

        <button
          className="back-btn"
          onClick={() => navigate(-1)}
        >
          Back to Dashboard
        </button>

      </div>

      <div className="hotel-info-badge">
        <strong>{hotelName}</strong> • {totalTables} Tables • {rooms.length} Rooms
      </div>

      {totalTables > 0 || rooms.length > 0 ? (

        <>

          <div className="qr-stats">

            <div className="stat-item">
              <span className="stat-value">{totalTables}</span>
              <span className="stat-label">Total Tables</span>
            </div>

            <div className="stat-item">
              <span className="stat-value">{tables.length}</span>
              <span className="stat-label">QR Codes Ready</span>
            </div>

          </div>

          {sections.map((section, sectionIndex) => {

            const sectionTables = Array.from(
              { length: Number(section.tableCount) || 0 },
              (_, i) => ({
                section: section.sectionName,
                tableNumber: `${section.sectionName}-T${i + 1}`
              })
            );

            return (
              <div key={sectionIndex} className="section-block">

                <h3 className="section-title">
                  {section.sectionName} Section
                </h3>

                <div className="qr-grid">

                  {sectionTables.map((table, index) => {

                    const qrValue =
                      `${FRONTEND_URL}/menu/${_id}/${table.tableNumber}`;

                    return (
                      <div key={table.tableNumber} className="qr-card">

                        <div className="table-number">
                          {table.tableNumber}
                          <span>QR</span>
                        </div>

                        <div className="qr-code-container">

                          <QRCodeCanvas
                            id={`qr-${table.tableNumber}`}
                            value={qrValue}
                            size={200}
                            level="H"
                            includeMargin={true}
                          />

                        </div>

                        <div
                          className="qr-link"
                          onClick={() =>
                            handleCopyLink(qrValue, `${sectionIndex}-${index}`)
                          }
                        >
                          {copiedIndex === `${sectionIndex}-${index}`
                            ? "✓ Copied!"
                            : qrValue}
                        </div>

                        <button
                          className="download-btn"
                          onClick={() =>
                            handleDownloadQR(table.tableNumber)
                          }
                        >
                          Download QR
                        </button>

                      </div>
                    );

                  })}

                </div>

              </div>
            );

          })}

          {rooms.length > 0 && (

            <div className="section-block">

              <h3 className="section-title">Rooms</h3>

              <div className="qr-grid">

                {rooms.map((room, index) => {

                  const qrValue =
                    `${FRONTEND_URL}/menu/${_id}/${room.roomNumber}`;

                  return (

                    <div key={room.roomNumber} className="qr-card">

                      <div className="table-number">
                        {room.roomNumber}
                        <span>QR</span>
                      </div>

                      <div className="qr-code-container">

                        <QRCodeCanvas
                          id={`qr-room-${room.roomNumber}`}
                          value={qrValue}
                          size={200}
                          level="H"
                          includeMargin={true}
                        />

                      </div>

                      <div
                        className="qr-link"
                        onClick={() =>
                          handleCopyLink(qrValue, `room-${index}`)
                        }
                      >
                        {copiedIndex === `room-${index}`
                          ? "✓ Copied!"
                          : qrValue}
                      </div>

                      <button
                        className="download-btn"
                        onClick={() => {

                          const canvas = document.getElementById(
                            `qr-room-${room.roomNumber}`
                          );

                          const url = canvas.toDataURL("image/png");

                          const link = document.createElement("a");

                          link.download =
                            `${hotelName}-Room-${room.roomNumber}-QR.png`;

                          link.href = url;

                          link.click();

                        }}
                      >
                        Download QR
                      </button>

                    </div>

                  );

                })}

              </div>

            </div>

          )}

        </>

      ) : (

        <div className="no-tables">

          <div>📋</div>

          <h3>No Tables Added</h3>

          <p>
            Please add table count in your hotel settings
          </p>

          <button
            onClick={() => navigate("/admin")}
          >
            Go to Dashboard
          </button>

        </div>

      )}

      {showToast && (
        <div className="toast-message">
          Link copied to clipboard!
        </div>
      )}

    </div>

  );

}

export default GenerateQR;