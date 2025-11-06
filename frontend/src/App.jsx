import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

import Login from './pages/Login';
import Register from './pages/Register';

// Layouts
import SuperAdminDashboard from './layouts/SuperAdminDashboard';
import MainLayout from './layouts/MainLayout';

// SuperAdmin pages
import Dashboard from './pages/superadmin/Dashboard';
import ManageUsers from './pages/superadmin/ManageUsers';
import Home from './pages/common/Home';
import Explore from './pages/common/Explore';
import Bookings from './pages/common/Bookings';
import Profile from './pages/common/Profile';
import Upload from './pages/common/Upload';







export default function App() {
  const [user, setUser] = useState(null);

   useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (loginData) => {
    setUser(loginData.user);
  };

  const logout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Register />} />

        {/* SuperAdmin Routes with Nested Pages */}
        <Route
          path="/superadmin"
          element={
            user?.role === 'superadmin' ? (
              <SuperAdminDashboard user={user} logout={logout} />
            ) : (
              <Navigate to="/login" />
            )
          }
        >
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="manage-users" element={<ManageUsers />} />
        
        </Route>

       <Route
  path="/designer"
  element={user?.role === 'designer' ? <MainLayout user={user} logout={logout} /> : <Navigate to="/login" />}
>
  <Route index element={<Home />} />
  <Route path="explore" element={<Explore />} />
  <Route path="bookings" element={<Bookings />} />
 <Route path="profile" element={<Profile />} />
 <Route path="uploads" element={<Upload />} />
</Route>

<Route
  path="/creator"
  element={user?.role === 'creator' ? <MainLayout user={user} logout={logout} /> : <Navigate to="/login" />}
>
  <Route index element={<Home />} />
  <Route path="explore" element={<Explore />} />
   <Route path="bookings" element={<Bookings />} />
    <Route path="profile" element={<Profile />} />
    <Route path="uploads" element={<Upload />} />

</Route>

 


        {/* Default Route */}
        <Route
          path="/"
          element={
            user ? (
              user.role === 'superadmin' ? (
                <Navigate to="/superadmin/dashboard" />
              ) : user.role === 'designer' ? (
                <Navigate to="/designer" />
              ) : (
                <Navigate to="/creator" />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />
      </Routes>
    </Router>
  );
}
