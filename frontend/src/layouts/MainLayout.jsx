// src/layouts/MainLayout.jsx
import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = ({ user, logout }) => {
  return (
    <div className="main-layout">
      <Navbar user={user} logout={logout} />
      <main style={{ padding: '1rem' }}>
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;
