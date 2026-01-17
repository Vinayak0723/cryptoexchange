import { useEffect, useRef } from 'react';
import { wsService } from '../services/websocket';
import { useTradingStore } from '../stores/tradingStore';

export const useOrderBookWebSocket = (symbol) => {
  const { orderBook } = useTradingStore();
  const unsubscribesRef = useRef([]);

  useEffect(() => {
    if (!symbol) return;

    // Connect to order book channel
    wsService.connect('orderbook', { symbol });

    // Subscribe to order book updates
    const unsubUpdate = wsService.subscribe('orderbook', { symbol }, 'orderbook_update', (data) => {
      useTradingStore.setState({ orderBook: data.orderbook || data });
    });
    if (unsubUpdate) unsubscribesRef.current.push(unsubUpdate);

    // Subscribe to initial snapshot
    const unsubSnapshot = wsService.subscribe('orderbook', { symbol }, 'snapshot', (data) => {
      useTradingStore.setState({ orderBook: data.orderbook || data });
    });
    if (unsubSnapshot) unsubscribesRef.current.push(unsubSnapshot);

    return () => {
      unsubscribesRef.current.forEach(unsub => {
        if (typeof unsub === 'function') {
          unsub();
        }
      });
      unsubscribesRef.current = [];
      wsService.disconnect('orderbook', { symbol });
    };
  }, [symbol]);

  return orderBook;
};