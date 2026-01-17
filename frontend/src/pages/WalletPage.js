import React, { useEffect, useState } from 'react';
import { useWalletStore } from '../stores/walletStore';
import { walletAPI } from '../services/api';
import toast from 'react-hot-toast';
import {
  ArrowDownTrayIcon,
  ArrowUpTrayIcon,
  ClipboardDocumentIcon,
} from '@heroicons/react/24/outline';

const WalletPage = () => {
  const { balances, fetchBalances, isLoading } = useWalletStore();
  const [activeTab, setActiveTab] = useState('balances');
  const [deposits, setDeposits] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [selectedCurrency, setSelectedCurrency] = useState(null);
  const [withdrawForm, setWithdrawForm] = useState({
    address: '',
    amount: '',
  });

  useEffect(() => {
    fetchBalances();
    fetchDeposits();
    fetchWithdrawals();
  }, []);

  const fetchDeposits = async () => {
    try {
      const response = await walletAPI.getDeposits();
      setDeposits(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching deposits:', error);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await walletAPI.getWithdrawals();
      setWithdrawals(response.data.results || response.data || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
    }
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    if (!selectedCurrency) return;

    try {
      await walletAPI.createWithdrawal({
        currency_id: selectedCurrency.id,
        to_address: withdrawForm.address,
        amount: withdrawForm.amount,
      });
      toast.success('Withdrawal request submitted');
      setWithdrawForm({ address: '', amount: '' });
      setSelectedCurrency(null);
      fetchBalances();
      fetchWithdrawals();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Withdrawal failed');
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  };

  const formatNumber = (num, decimals = 8) => {
    const n = parseFloat(num);
    if (isNaN(n)) return '0.00';
    return n.toFixed(decimals);
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-exchange-text mb-6">Wallet</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-exchange-border">
        {['balances', 'deposit', 'withdraw', 'history'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-3 font-medium capitalize transition-colors ${
              activeTab === tab
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-exchange-muted hover:text-exchange-text'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Balances Tab */}
      {activeTab === 'balances' && (
        <div className="card">
          <div className="p-4 border-b border-exchange-border">
            <h2 className="text-lg font-medium text-exchange-text">Your Balances</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-exchange-muted text-sm">
                  <th className="text-left p-4">Currency</th>
                  <th className="text-right p-4">Available</th>
                  <th className="text-right p-4">Locked</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-right p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {balances.map((balance) => (
                  <tr key={balance.currency_symbol} className="border-t border-exchange-border hover:bg-exchange-bg">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-primary-500/20 rounded-full flex items-center justify-center">
                          <span className="text-primary-400 text-xs font-bold">
                            {balance.currency_symbol?.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <div className="font-medium text-exchange-text">{balance.currency_symbol}</div>
                          <div className="text-sm text-exchange-muted">{balance.currency_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 text-right font-mono text-exchange-text">
                      {formatNumber(balance.available)}
                    </td>
                    <td className="p-4 text-right font-mono text-exchange-muted">
                      {formatNumber(balance.locked)}
                    </td>
                    <td className="p-4 text-right font-mono text-exchange-text">
                      {formatNumber(balance.total)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setActiveTab('deposit')}
                          className="p-2 hover:bg-exchange-bg rounded text-success"
                          title="Deposit"
                        >
                          <ArrowDownTrayIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCurrency(balance);
                            setActiveTab('withdraw');
                          }}
                          className="p-2 hover:bg-exchange-bg rounded text-danger"
                          title="Withdraw"
                        >
                          <ArrowUpTrayIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {balances.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-exchange-muted">
                      No balances found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-exchange-text mb-4">Deposit Funds</h2>
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
            <p className="text-warning text-sm">
              ⚠️ DEMO MODE: This is a demonstration exchange. Deposits are simulated and no real funds are involved.
            </p>
          </div>
          <div className="space-y-4">
            <p className="text-exchange-muted">
              In a real exchange, you would see your unique deposit address here for each cryptocurrency.
              For this demo, balances can be adjusted by an admin.
            </p>
            <div className="bg-exchange-bg rounded-lg p-4">
              <div className="text-sm text-exchange-muted mb-2">Demo Deposit Address (ETH)</div>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-exchange-text font-mono text-sm bg-exchange-card p-2 rounded">
                  0xDEMO...ADDRESS
                </code>
                <button
                  onClick={() => copyToClipboard('0xDEMO_DEPOSIT_ADDRESS')}
                  className="p-2 hover:bg-exchange-card rounded"
                >
                  <ClipboardDocumentIcon className="w-5 h-5 text-exchange-muted" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <div className="card p-6">
          <h2 className="text-lg font-medium text-exchange-text mb-4">Withdraw Funds</h2>
          <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
            <p className="text-warning text-sm">
              ⚠️ DEMO MODE: Withdrawals are simulated and no real funds will be sent.
            </p>
          </div>
          <form onSubmit={handleWithdraw} className="space-y-4 max-w-md">
            <div>
              <label className="block text-sm text-exchange-muted mb-2">Currency</label>
              <select
                value={selectedCurrency?.currency_symbol || ''}
                onChange={(e) => {
                  const currency = balances.find(b => b.currency_symbol === e.target.value);
                  setSelectedCurrency(currency);
                }}
                className="input"
              >
                <option value="">Select currency</option>
                {balances.map((b) => (
                  <option key={b.currency_symbol} value={b.currency_symbol}>
                    {b.currency_symbol} (Available: {formatNumber(b.available)})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-exchange-muted mb-2">Withdrawal Address</label>
              <input
                type="text"
                value={withdrawForm.address}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, address: e.target.value })}
                className="input"
                placeholder="0x..."
                required
              />
            </div>
            <div>
              <label className="block text-sm text-exchange-muted mb-2">Amount</label>
              <input
                type="number"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                className="input"
                placeholder="0.00"
                step="any"
                required
              />
            </div>
            <button type="submit" className="btn btn-danger w-full">
              Submit Withdrawal
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Deposits */}
          <div className="card">
            <div className="p-4 border-b border-exchange-border">
              <h2 className="text-lg font-medium text-exchange-text">Deposit History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-exchange-muted text-sm">
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Currency</th>
                    <th className="text-right p-4">Amount</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Tx Hash</th>
                  </tr>
                </thead>
                <tbody>
                  {deposits.map((deposit) => (
                    <tr key={deposit.id} className="border-t border-exchange-border">
                      <td className="p-4 text-exchange-text">
                        {new Date(deposit.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-exchange-text">{deposit.currency_symbol}</td>
                      <td className="p-4 text-right font-mono text-success">
                        +{formatNumber(deposit.amount)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          deposit.status === 'completed' ? 'bg-success/20 text-success' :
                          deposit.status === 'pending' ? 'bg-warning/20 text-warning' :
                          'bg-exchange-bg text-exchange-muted'
                        }`}>
                          {deposit.status}
                        </span>
                      </td>
                      <td className="p-4 text-exchange-muted font-mono text-sm">
                        {deposit.tx_hash?.slice(0, 16)}...
                      </td>
                    </tr>
                  ))}
                  {deposits.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-exchange-muted">
                        No deposits found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Withdrawals */}
          <div className="card">
            <div className="p-4 border-b border-exchange-border">
              <h2 className="text-lg font-medium text-exchange-text">Withdrawal History</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-exchange-muted text-sm">
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Currency</th>
                    <th className="text-right p-4">Amount</th>
                    <th className="text-left p-4">Status</th>
                    <th className="text-left p-4">Address</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="border-t border-exchange-border">
                      <td className="p-4 text-exchange-text">
                        {new Date(withdrawal.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-exchange-text">{withdrawal.currency_symbol}</td>
                      <td className="p-4 text-right font-mono text-danger">
                        -{formatNumber(withdrawal.amount)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          withdrawal.status === 'completed' ? 'bg-success/20 text-success' :
                          withdrawal.status === 'pending' ? 'bg-warning/20 text-warning' :
                          withdrawal.status === 'rejected' ? 'bg-danger/20 text-danger' :
                          'bg-exchange-bg text-exchange-muted'
                        }`}>
                          {withdrawal.status}
                        </span>
                      </td>
                      <td className="p-4 text-exchange-muted font-mono text-sm">
                        {withdrawal.to_address?.slice(0, 16)}...
                      </td>
                    </tr>
                  ))}
                  {withdrawals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-exchange-muted">
                        No withdrawals found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletPage;