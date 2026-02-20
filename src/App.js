import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login';
import Signup from './pages/signup'; 
import './App.css';
import Home from './pages/admin';
import Menu from './pages/Menu';
import BookingPage from "./pages/BookingPage";
import GenerateQR from "./pages/GenerateQR";



function App() {
  const hotelName = "Grand Horizon Hotel"; 

  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login hotelName={hotelName} />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/admin" element={<Home />} />
        <Route path="/menu/:hotelId/:tableNumber" element={<Menu />} />
        <Route path="/booking" element={<BookingPage />} />
        <Route path="/generate-qr" element={<GenerateQR />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

export default App;