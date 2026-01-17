import { useEffect, useRef } from 'react';
import { wsService } from '../services/websocket';
import { useTradingStore } from '../stores/tradingStore';

export const useTradesWebSocket = (symbol) => {
  const { recentTrades } = useTradingStore();
  const unsubscribesRef = useRef([]);

  useEffect(() => {
    if (!symbol) return;

    // Connect to trades channel
    wsService.connect('trades', { symbol });

    // Subscribe to new trades
    const unsubNew = wsService.subscribe('trades', { symbol }, 'new_trade', (data) => {
      const trade = data.trade || data;

      useTradingStore.setState((state) => ({
        recentTrades: [trade, ...(state.recentTrades || [])].slice(0, 100)
      }));
    });
    if (unsubNew) unsubscribesRef.current.push(unsubNew);

    // Subscribe to initial trades
    const unsubInitial = wsService.subscribe('trades', { symbol }, 'recent_trades', (data) => {
      useTradingStore.setState({ recentTrades: data.trades || [] });
    });
    if (unsubInitial) unsubscribesRef.current.push(unsubInitial);

    return () => {
      unsubscribesRef.current.forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      unsubscribesRef.current = [];
      wsService.disconnect('trades', { symbol });
    };
  }, [symbol]);

  return recentTrades;
};