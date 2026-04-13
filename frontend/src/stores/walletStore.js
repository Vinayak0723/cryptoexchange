import { create } from 'zustand';
import { walletAPI } from '../services/api';

export const useWalletStore = create((set, get) => ({
  // State
  balances: [],
  currencies: [],
  deposits: [],
  withdrawals: [],
  isLoading: false,
  error: null,

  // Actions
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // Fetch currencies
  fetchCurrencies: async () => {
    try {
      const response = await walletAPI.getCurrencies();
      set({ currencies: response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching currencies:', error);
      return [];
    }
  },

  // Fetch balances
  fetchBalances: async () => {
    set({ isLoading: true });
    try {
      const response = await walletAPI.getBalances();
      set({ balances: response.data, isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Error fetching balances:', error);
      set({ isLoading: false });
      return [];
    }
  },

  // Get balance for a specific currency
  getBalance: (symbol) => {
    const balances = get().balances;
    return balances.find(b => b.currency_symbol === symbol) || {
      currency_symbol: symbol,
      available: '0',
      locked: '0',
      total: '0',
    };
  },

  // Fetch deposits
  fetchDeposits: async () => {
    try {
      const response = await walletAPI.getDeposits();
      set({ deposits: response.data.results || response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching deposits:', error);
      return [];
    }
  },

  // Fetch withdrawals
  fetchWithdrawals: async () => {
    try {
      const response = await walletAPI.getWithdrawals();
      set({ withdrawals: response.data.results || response.data });
      return response.data;
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      return [];
    }
  },

  // Create withdrawal
  createWithdrawal: async (currencyId, toAddress, amount) => {
    set({ isLoading: true, error: null });
    try {
      const response = await walletAPI.createWithdrawal({
        currency_id: currencyId,
        to_address: toAddress,
        amount: amount,
      });
      set({ isLoading: false });

      // Refresh balances and withdrawals
      get().fetchBalances();
      get().fetchWithdrawals();

      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.error || 'Withdrawal failed';
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },
}));