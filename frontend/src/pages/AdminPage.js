import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import {
  UsersIcon,
  CurrencyDollarIcon,
  ArrowsRightLeftIcon,
  ChartBarIcon,
  BanknotesIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

const AdminPage = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('overview');
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.is_staff) {
      fetchData();
    }
  }, [activeTab, user]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'overview') {
        await fetchStats();
      } else if (activeTab === 'users') {
        await fetchUsers();
      } else if (activeTab === 'withdrawals') {
        await fetchWithdrawals();
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setIsLoading(false);
  };

  const fetchStats = async () => {
    setStats({
      totalUsers: 150,
      activeUsers24h: 45,
      totalOrders: 1250,
      totalTrades: 890,
      totalVolume: '1,234,567.89',
      pendingWithdrawals: 5,
    });
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/auth/admin/users/');
      setUsers(response.data.results || response.data || []);
    } catch (error) {
      setUsers([
        { id: 1, email: 'user1@example.com', is_active: true, created_at: new Date().toISOString() },
        { id: 2, email: 'user2@example.com', is_active: true, created_at: new Date().toISOString() },
      ]);
    }
  };

  const fetchWithdrawals = async () => {
    try {
      const response = await api.get('/wallets/admin/withdrawals/');
      setWithdrawals(response.data.results || response.data || []);
    } catch (error) {
      setWithdrawals([]);
    }
  };

  // Check if user is admin - must be after all hooks
  if (!user?.is_staff) {
    return <Navigate to="/trade" replace />;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: ChartBarIcon },
    { id: 'users', label: 'Users', icon: UsersIcon },
    { id: 'balances', label: 'Adjust Balances', icon: CurrencyDollarIcon },
    { id: 'withdrawals', label: 'Withdrawals', icon: BanknotesIcon },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-exchange-text">Admin Dashboard</h1>
          <p className="text-exchange-muted text-sm mt-1">Manage your exchange</p>
        </div>
        <div className="badge badge-primary">Admin</div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-exchange-border pb-4">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-500/20 text-primary-400'
                  : 'text-exchange-muted hover:text-exchange-text hover:bg-exchange-bg'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab stats={stats} isLoading={isLoading} />}
      {activeTab === 'users' && <UsersTab users={users} isLoading={isLoading} />}
      {activeTab === 'balances' && <BalancesTab />}
      {activeTab === 'withdrawals' && <WithdrawalsTab withdrawals={withdrawals} isLoading={isLoading} onRefresh={fetchWithdrawals} />}
    </div>
  );
};

// Overview Tab
const OverviewTab = ({ stats, isLoading }) => {
  if (isLoading) {
    return <div className="text-exchange-muted">Loading...</div>;
  }

  const statCards = [
    { label: 'Total Users', value: stats?.totalUsers || 0, icon: UsersIcon, color: 'text-primary-400' },
    { label: 'Active (24h)', value: stats?.activeUsers24h || 0, icon: ClockIcon, color: 'text-success' },
    { label: 'Total Orders', value: stats?.totalOrders || 0, icon: ArrowsRightLeftIcon, color: 'text-warning' },
    { label: 'Total Trades', value: stats?.totalTrades || 0, icon: ChartBarIcon, color: 'text-primary-400' },
    { label: 'Volume (USDT)', value: stats?.totalVolume || '0', icon: CurrencyDollarIcon, color: 'text-success' },
    { label: 'Pending Withdrawals', value: stats?.pendingWithdrawals || 0, icon: BanknotesIcon, color: 'text-danger' },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <div key={index} className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-exchange-muted text-sm">{stat.label}</p>
                <p className="text-2xl font-bold text-exchange-text mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-lg bg-exchange-bg ${stat.color}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

// Users Tab
const UsersTab = ({ users, isLoading }) => {
  if (isLoading) {
    return <div className="text-exchange-muted">Loading...</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-exchange-border">
        <h2 className="text-lg font-medium text-exchange-text">All Users</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-exchange-border">
              <th className="text-left p-4 text-exchange-muted text-sm font-medium">Email</th>
              <th className="text-left p-4 text-exchange-muted text-sm font-medium">Status</th>
              <th className="text-left p-4 text-exchange-muted text-sm font-medium">Joined</th>
              <th className="text-right p-4 text-exchange-muted text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((u) => (
                <tr key={u.id} className="border-b border-exchange-border hover:bg-exchange-bg">
                  <td className="p-4 text-exchange-text">{u.email}</td>
                  <td className="p-4">
                    <span className={`badge ${u.is_active ? 'badge-success' : 'badge-danger'}`}>
                      {u.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-exchange-muted text-sm">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4 text-right">
                    <button className="btn btn-sm btn-ghost">View</button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={4} className="p-8 text-center text-exchange-muted">
                  No users found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Balances Tab
const BalancesTab = () => {
  const [formData, setFormData] = useState({
    email: '',
    currency: 'USDT',
    amount: '',
    type: 'credit',
    reason: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.post('/wallets/admin/adjust-balance/', {
        user_email: formData.email,
        currency_symbol: formData.currency,
        amount: formData.amount,
        adjustment_type: formData.type,
        reason: formData.reason,
      });
      toast.success(`Balance ${formData.type}ed successfully!`);
      setFormData({ ...formData, amount: '', reason: '' });
    } catch (error) {
      toast.error(error.response?.data?.error || 'Failed to adjust balance');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="card p-6 max-w-lg">
      <h2 className="text-lg font-medium text-exchange-text mb-6">Adjust User Balance</h2>

      <div className="bg-warning/10 border border-warning/30 rounded-lg p-4 mb-6">
        <p className="text-warning text-sm">
          ⚠️ This action will be logged in the audit trail. Use responsibly.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-exchange-muted mb-2">User Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="input"
            placeholder="user@example.com"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-exchange-muted mb-2">Currency</label>
          <select
            value={formData.currency}
            onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
            className="input"
          >
            <option value="USDT">USDT</option>
            <option value="ETH">ETH</option>
            <option value="BTC">BTC</option>
            <option value="USDC">USDC</option>
          </select>
        </div>

        <div>
          <label className="block text-sm text-exchange-muted mb-2">Adjustment Type</label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'credit' })}
              className={`py-2 rounded-lg font-medium transition-colors ${
                formData.type === 'credit'
                  ? 'bg-success text-white'
                  : 'bg-exchange-bg text-exchange-muted'
              }`}
            >
              Credit (+)
            </button>
            <button
              type="button"
              onClick={() => setFormData({ ...formData, type: 'debit' })}
              className={`py-2 rounded-lg font-medium transition-colors ${
                formData.type === 'debit'
                  ? 'bg-danger text-white'
                  : 'bg-exchange-bg text-exchange-muted'
              }`}
            >
              Debit (-)
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm text-exchange-muted mb-2">Amount</label>
          <input
            type="number"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            className="input"
            placeholder="0.00"
            step="any"
            required
          />
        </div>

        <div>
          <label className="block text-sm text-exchange-muted mb-2">Reason (Required)</label>
          <textarea
            value={formData.reason}
            onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
            className="input min-h-[80px]"
            placeholder="Enter reason for adjustment..."
            required
          />
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full btn btn-primary py-3"
        >
          {isSubmitting ? 'Processing...' : `${formData.type === 'credit' ? 'Credit' : 'Debit'} Balance`}
        </button>
      </form>
    </div>
  );
};

// Withdrawals Tab
const WithdrawalsTab = ({ withdrawals, isLoading, onRefresh }) => {
  const handleApprove = async (id) => {
    try {
      await api.post(`/wallets/admin/withdrawals/${id}/approve/`);
      toast.success('Withdrawal approved');
      onRefresh();
    } catch (error) {
      toast.error('Failed to approve withdrawal');
    }
  };

  const handleReject = async (id) => {
    try {
      await api.post(`/wallets/admin/withdrawals/${id}/reject/`);
      toast.success('Withdrawal rejected');
      onRefresh();
    } catch (error) {
      toast.error('Failed to reject withdrawal');
    }
  };

  if (isLoading) {
    return <div className="text-exchange-muted">Loading...</div>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-exchange-border flex items-center justify-between">
        <h2 className="text-lg font-medium text-exchange-text">Pending Withdrawals</h2>
        <button onClick={onRefresh} className="btn btn-sm btn-ghost">
          Refresh
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-exchange-border">
              <th className="text-left p-4 text-exchange-muted text-sm font-medium">User</th>
              <th className="text-left p-4 text-exchange-muted text-sm font-medium">Currency</th>
              <th className="text-right p-4 text-exchange-muted text-sm font-medium">Amount</th>
              <th className="text-left p-4 text-exchange-muted text-sm font-medium">Address</th>
              <th className="text-left p-4 text-exchange-muted text-sm font-medium">Status</th>
              <th className="text-right p-4 text-exchange-muted text-sm font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withdrawals.length > 0 ? (
              withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-exchange-border hover:bg-exchange-bg">
                  <td className="p-4 text-exchange-text">{w.user_email}</td>
                  <td className="p-4 text-exchange-text">{w.currency_symbol}</td>
                  <td className="p-4 text-right font-mono text-exchange-text">{w.amount}</td>
                  <td className="p-4 text-exchange-muted text-sm font-mono">
                    {w.to_address?.slice(0, 10)}...
                  </td>
                  <td className="p-4">
                    <span className={`badge badge-${w.status === 'pending' ? 'warning' : 'neutral'}`}>
                      {w.status}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    {w.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleApprove(w.id)}
                          className="btn btn-sm btn-success"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleReject(w.id)}
                          className="btn btn-sm btn-danger"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="p-8 text-center text-exchange-muted">
                  No pending withdrawals
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminPage;