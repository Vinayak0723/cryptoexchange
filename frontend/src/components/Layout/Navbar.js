import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import clsx from 'clsx';
import {
  ChartBarIcon,
  WalletIcon,
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  Bars3Icon,
  XMarkIcon,
  ShieldCheckIcon,
  PresentationChartLineIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
    setIsMobileMenuOpen(false);
  };

  const navItems = [
    { path: '/trade', label: 'Trade', icon: ChartBarIcon },
    { path: '/market', label: 'Market', icon: PresentationChartLineIcon },
    { path: '/transfer', label: 'Transfer', icon: PaperAirplaneIcon },
    { path: '/wallet', label: 'Wallet', icon: WalletIcon },
    { path: '/orders', label: 'Orders', icon: ClipboardDocumentListIcon },
    { path: '/security', label: 'Security', icon: ShieldCheckIcon },
    { path: '/settings', label: 'Settings', icon: Cog6ToothIcon },
    ...(user?.is_staff ? [{ path: '/admin', label: 'Admin', icon: ShieldCheckIcon }] : []),
  ];

  const NavLink = ({ item, mobile = false }) => {
    const Icon = item.icon;
    const isActive = location.pathname.startsWith(item.path);

    return (
      <Link
        to={item.path}
        onClick={() => setIsMobileMenuOpen(false)}
        className={clsx(
          'flex items-center gap-2 px-4 py-2 rounded-lg transition-colors',
          mobile ? 'w-full' : '',
          isActive
            ? 'bg-exchange-bg text-primary-400'
            : 'text-exchange-muted hover:text-exchange-text hover:bg-exchange-bg'
        )}
      >
        <Icon className="w-5 h-5" />
        <span>{item.label}</span>
      </Link>
    );
  };

  return (
    <nav className="bg-exchange-card border-b border-exchange-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/trade" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-lg flex items-center justify-center shadow-lg shadow-primary-500/20">
              <span className="text-white font-bold text-sm">TK</span>
            </div>
            <span className="text-xl font-bold text-exchange-text hidden sm:block">
              ToKeNlY
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} />
            ))}
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden sm:block text-sm text-exchange-muted truncate max-w-[200px]">
              {user?.email?.split('@')[0]}
            </div>

            <button
              onClick={handleLogout}
              className="hidden sm:flex items-center gap-2 px-3 py-2 text-exchange-muted hover:text-exchange-text transition-colors"
              title="Logout"
            >
              <ArrowRightOnRectangleIcon className="w-5 h-5" />
            </button>

            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-exchange-muted hover:text-exchange-text"
            >
              {isMobileMenuOpen ? (
                <XMarkIcon className="w-6 h-6" />
              ) : (
                <Bars3Icon className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-exchange-border animate-slideDown">
          <div className="px-4 py-4 space-y-2">
            {navItems.map((item) => (
              <NavLink key={item.path} item={item} mobile />
            ))}

            <div className="pt-4 border-t border-exchange-border">
              <div className="flex items-center gap-2 px-4 py-2">
                <span className="text-exchange-muted text-sm">
                  {user?.email}
                </span>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 text-danger px-4 py-2"
              >
                <ArrowRightOnRectangleIcon className="w-5 h-5" />
                <span>Logout</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;