import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  ChartBarIcon,
  WalletIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

const Sidebar = () => {
  const navItems = [
    { path: '/trade', label: 'Trade', icon: ChartBarIcon },
    { path: '/market', label: 'Market', icon: WalletIcon },
    { path: '/transfer', label: 'Transfer', icon: ClipboardDocumentListIcon },
    { path: '/wallet', label: 'Wallet', icon: WalletIcon },
    { path: '/orders', label: 'Orders', icon: ClipboardDocumentListIcon },
    { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
  ];

  return (
    <aside className="w-64 bg-gray-800 h-full">
      <div className="p-4">
        <h1 className="text-white text-xl font-bold mb-8">ToKeNlY</h1>
        
        <nav className="space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-500 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`
                }
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
