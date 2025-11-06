// layout/superadmindashboard.jsx
import React from 'react';
import { Outlet, NavLink } from 'react-router-dom';

export default function SuperAdminDashboardLayout() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h1 className="text-xl font-bold mb-4">Super Admin</h1>
        <nav className="flex flex-col space-y-2">
          <NavLink to="dashboard" className={({ isActive }) => isActive ? 'text-blue-300' : ''}>Dashboard</NavLink>
          <NavLink to="manage-users" className={({ isActive }) => isActive ? 'text-blue-300' : ''}>Manage Users</NavLink>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-50">
        <Outlet />
      </main>
    </div>
  );
}