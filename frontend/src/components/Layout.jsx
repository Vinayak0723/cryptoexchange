/**
 * Main Layout Component
 * =====================
 */
import React from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import SystemBanner from './SystemBanner';

const Layout = () => {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* System Banner - only shows in demo/maintenance mode */}
      <SystemBanner />
      
      {/* Navigation */}
      <Navbar />
      
      <div className="flex">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;
