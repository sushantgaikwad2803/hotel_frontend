import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import "./generateqr.css";

function GenerateQR() {
  const navigate = useNavigate();
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [showToast, setShowToast] = useState(false);
  
  const savedUser = JSON.parse(localStorage.getItem("hotelUser"));

  if (!savedUser) {
    navigate("/login");
    return null;
  }

  const { _id, tableCount, hotelName } = savedUser;
  const tables = Array.from({ length: tableCount || 0 }, (_, index) => index + 1);

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
    if (canvas) {
      const url = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.download = `Table-${tableNumber}-QR.png`;
      link.href = url;
      link.click();
    }
  };

  const handlePrintAll = () => {
    window.print();
  };

  return (
    <div className="generate-qr-container">
      <div className="qr-header">
        <h2>Table QR Codes</h2>
        <button className="back-btn" onClick={() => navigate(-1)}>
          Back to Dashboard
        </button>
      </div>

      <div className="hotel-info-badge">
        <strong>{hotelName}</strong> • {tableCount} Tables
      </div>

      {tableCount > 0 ? (
        <>
          <div className="qr-stats">
            <div className="stat-item">
              <span className="stat-value">{tableCount}</span>
              <span className="stat-label">Total Tables</span>
            </div>
            <div className="stat-item">
              <span className="stat-value">{tables.length}</span>
              <span className="stat-label">QR Codes Ready</span>
            </div>
          </div>

          <button className="print-all-btn" onClick={handlePrintAll}>
            Print All QR Codes
          </button>

          <div className="qr-grid">
            {tables.map((tableNumber, index) => {
              const qrValue = `http://localhost:3000/menu/${_id}/${tableNumber}`;

              return (
                <div key={tableNumber} className="qr-card">
                  <div className="table-number">
                    Table {tableNumber}
                    <span>QR</span>
                  </div>

                  <div className="qr-code-container">
                    <QRCodeCanvas
                      id={`qr-${tableNumber}`}
                      value={qrValue}
                      size={200}
                      level="H"
                      includeMargin={true}
                    />
                  </div>

                  <div 
                    className="qr-link"
                    onClick={() => handleCopyLink(qrValue, index)}
                  >
                    {copiedIndex === index ? '✓ Copied!' : qrValue}
                  </div>

                  <button 
                    className="download-btn"
                    onClick={() => handleDownloadQR(tableNumber)}
                  >
                    Download QR
                  </button>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="no-tables">
          <div>📋</div>
          <h3>No Tables Added</h3>
          <p>Please add table count in your hotel settings</p>
          <button onClick={() => navigate("/admin")}>
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