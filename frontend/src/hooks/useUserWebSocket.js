import { useEffect, useRef } from 'react';
import { wsService } from '../services/websocket';
import { useWalletStore } from '../stores/walletStore';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export const useUserWebSocket = () => {
  const { isAuthenticated } = useAuthStore();
  const { fetchBalances } = useWalletStore();
  const unsubscribesRef = useRef([]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Connect to user channel
    wsService.connect('user', {});

    // Subscribe to balance updates
    const unsubBalance = wsService.subscribe('user', {}, 'balance_update', (data) => {
      console.log('Balance update:', data);
      fetchBalances();
    });
    if (unsubBalance) unsubscribesRef.current.push(unsubBalance);

    // Subscribe to order updates
    const unsubOrder = wsService.subscribe('user', {}, 'order_update', (data) => {
      const order = data.order || data;

      if (order.status === 'filled') {
        toast.success(`Order filled: ${order.side?.toUpperCase()} ${order.quantity}`);
      } else if (order.status === 'partial') {
        toast.success(`Order partially filled`);
      } else if (order.status === 'cancelled') {
        toast.info('Order cancelled');
      }
    });
    if (unsubOrder) unsubscribesRef.current.push(unsubOrder);

    // Subscribe to trade notifications
    const unsubTrade = wsService.subscribe('user', {}, 'trade_notification', (data) => {
      const trade = data.trade || data;
      toast.success(`Trade executed: ${trade.quantity} @ ${trade.price}`);
      fetchBalances();
    });
    if (unsubTrade) unsubscribesRef.current.push(unsubTrade);

    return () => {
      // Safely unsubscribe
      unsubscribesRef.current.forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      unsubscribesRef.current = [];
      wsService.disconnect('user', {});
    };
  }, [isAuthenticated, fetchBalances]);
};