import { create } from 'zustand';
import { tradingAPI } from '../services/api';

export const useTradingStore = create((set, get) => ({
  // State
  tradingPairs: [],
  currentPair: null,
  orderBook: { bids: [], asks: [] },
  recentTrades: [],
  ticker: null,
  isLoading: false,
  error: null,

  // Order form state
  orderForm: {
    side: 'buy',
    type: 'limit',
    price: '',
    quantity: '',
  },

  // Actions
  setCurrentPair: (pair) => set({ currentPair: pair }),

  setOrderForm: (updates) => set((state) => ({
    orderForm: { ...state.orderForm, ...updates }
  })),

  resetOrderForm: () => set({
    orderForm: {
      side: 'buy',
      type: 'limit',
      price: '',
      quantity: '',
    }
  }),

  // Fetch trading pairs
  fetchTradingPairs: async () => {
    try {
      const response = await tradingAPI.getTradingPairs();
      // Handle paginated response
      const pairs = response.data.results || response.data || [];
      set({ tradingPairs: pairs });

      // Set first pair as current if none selected
      if (!get().currentPair && pairs.length > 0) {
        set({ currentPair: pairs[0] });
      }

      return pairs;
    } catch (error) {
      console.error('Error fetching trading pairs:', error);
      set({ tradingPairs: [] });
      return [];
    }
  },

  // Fetch order book
  fetchOrderBook: async (symbol) => {
    try {
      const response = await tradingAPI.getOrderBook(symbol);
      set({ orderBook: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching order book:', error);
      set({ orderBook: { bids: [], asks: [] } });
      return null;
    }
  },

  // Fetch recent trades
  fetchRecentTrades: async (symbol) => {
    try {
      const response = await tradingAPI.getRecentTrades(symbol);
      // Handle paginated response
      const trades = response.data.results || response.data || [];
      set({ recentTrades: trades });
      return trades;
    } catch (error) {
      console.error('Error fetching recent trades:', error);
      set({ recentTrades: [] });
      return [];
    }
  },

  // Fetch ticker
  fetchTicker: async (symbol) => {
    try {
      const response = await tradingAPI.getTicker(symbol);
      set({ ticker: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching ticker:', error);
      set({ ticker: null });
      return null;
    }
  },

  // Create order
  createOrder: async (orderData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await tradingAPI.createOrder(orderData);
      set({ isLoading: false });

      // Refresh order book after placing order
      if (get().currentPair) {
        get().fetchOrderBook(get().currentPair.symbol);
      }

      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.error ||
                     Object.values(error.response?.data || {})[0]?.[0] ||
                     'Order failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    try {
      await tradingAPI.cancelOrder(orderId);
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.error || 'Cancel failed';
      return { success: false, error: message };
    }
  },
}));