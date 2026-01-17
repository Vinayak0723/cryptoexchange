import React, { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import { useAuthStore } from '../../stores/authStore';
import { useWalletStore } from '../../stores/walletStore';
import { useTradingStore } from '../../stores/tradingStore';
import { useUserWebSocket } from '../../hooks/useUserWebSocket';
import { wsService } from '../../services/websocket';

const Layout = () => {
  const { fetchUser } = useAuthStore();
  const { fetchBalances, fetchCurrencies } = useWalletStore();
  const { fetchTradingPairs } = useTradingStore();

  // Initialize user WebSocket for notifications
  useUserWebSocket();

  useEffect(() => {
    // Initialize data on mount
    fetchUser();
    fetchBalances();
    fetchCurrencies();
    fetchTradingPairs();

    // Cleanup WebSocket connections on unmount
    return () => {
      wsService.disconnectAll();
    };
  }, []);

  return (
    <div className="min-h-screen bg-exchange-bg">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;