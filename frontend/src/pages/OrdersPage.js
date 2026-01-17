import React, { useEffect, useState } from 'react';
import { tradingAPI } from '../services/api';
import { useTradingStore } from '../stores/tradingStore';
import toast from 'react-hot-toast';
import { XMarkIcon } from '@heroicons/react/24/outline';

const OrdersPage = () => {
  const [activeTab, setActiveTab] = useState('open');
  const [orders, setOrders] = useState([]);
  const [trades, setTrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const { cancelOrder } = useTradingStore();

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'open') {
        const response = await tradingAPI.getOpenOrders();
        setOrders(response.data.results || response.data || []);
      } else if (activeTab === 'all') {
        const response = await tradingAPI.getOrders({});
        setOrders(response.data.results || response.data || []);
      } else if (activeTab === 'trades') {
        const response = await tradingAPI.getUserTrades({});
        setTrades(response.data.results || response.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
    setIsLoading(false);
  };

  const handleCancelOrder = async (orderId) => {
    const result = await cancelOrder(orderId);
    if (result.success) {
      toast.success('Order cancelled');
      fetchData();
    } else {
      toast.error(result.error || 'Failed to cancel order');
    }
  };

  const formatNumber = (num, decimals = 8) => {
    const n = parseFloat(num);
    if (isNaN(n)) return '0.00';
    return n.toFixed(decimals);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return 'bg-primary-500/20 text-primary-400';
      case 'partial': return 'bg-warning/20 text-warning';
      case 'filled': return 'bg-success/20 text-success';
      case 'cancelled': return 'bg-exchange-bg text-exchange-muted';
      default: return 'bg-exchange-bg text-exchange-muted';
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-exchange-text mb-6">Orders and Trades</h1>

      <div className="flex gap-4 mb-6 border-b border-exchange-border">
        {[
          { id: 'open', label: 'Open Orders' },
          { id: 'all', label: 'All Orders' },
          { id: 'trades', label: 'Trade History' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-3 font-medium transition-colors ${
              activeTab === tab.id
                ? 'text-primary-400 border-b-2 border-primary-400'
                : 'text-exchange-muted hover:text-exchange-text'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {(activeTab === 'open' || activeTab === 'all') && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-exchange-muted text-sm border-b border-exchange-border">
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Pair</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Side</th>
                  <th className="text-right p-4">Price</th>
                  <th className="text-right p-4">Quantity</th>
                  <th className="text-right p-4">Filled</th>
                  <th className="text-left p-4">Status</th>
                  {activeTab === 'open' && <th className="text-right p-4">Action</th>}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-exchange-muted">
                      Loading...
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-exchange-muted">
                      No orders found
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className="border-t border-exchange-border hover:bg-exchange-bg">
                      <td className="p-4 text-exchange-text text-sm">
                        {new Date(order.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-exchange-text font-medium">
                        {order.trading_pair_symbol}
                      </td>
                      <td className="p-4 text-exchange-muted capitalize">
                        {order.order_type}
                      </td>
                      <td className="p-4">
                        <span className={order.side === 'buy' ? 'text-success' : 'text-danger'}>
                          {order.side.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-exchange-text">
                        {order.price ? formatNumber(order.price) : 'Market'}
                      </td>
                      <td className="p-4 text-right font-mono text-exchange-text">
                        {formatNumber(order.quantity)}
                      </td>
                      <td className="p-4 text-right font-mono text-exchange-muted">
                        {formatNumber(order.filled_quantity)} ({formatNumber(order.fill_percentage, 1)}%)
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${getStatusColor(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      {activeTab === 'open' && (
                        <td className="p-4 text-right">
                          <button
                            onClick={() => handleCancelOrder(order.id)}
                            className="p-1 hover:bg-danger/20 rounded text-danger"
                            title="Cancel Order"
                          >
                            <XMarkIcon className="w-5 h-5" />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'trades' && (
        <div className="card">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-exchange-muted text-sm border-b border-exchange-border">
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Pair</th>
                  <th className="text-left p-4">Side</th>
                  <th className="text-right p-4">Price</th>
                  <th className="text-right p-4">Quantity</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-right p-4">Fee</th>
                  <th className="text-left p-4">Role</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-exchange-muted">
                      Loading...
                    </td>
                  </tr>
                ) : trades.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="p-8 text-center text-exchange-muted">
                      No trades found
                    </td>
                  </tr>
                ) : (
                  trades.map((trade) => (
                    <tr key={trade.id} className="border-t border-exchange-border hover:bg-exchange-bg">
                      <td className="p-4 text-exchange-text text-sm">
                        {new Date(trade.created_at).toLocaleString()}
                      </td>
                      <td className="p-4 text-exchange-text font-medium">
                        {trade.trading_pair_symbol}
                      </td>
                      <td className="p-4">
                        <span className={trade.side === 'buy' ? 'text-success' : 'text-danger'}>
                          {trade.side ? trade.side.toUpperCase() : '-'}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono text-exchange-text">
                        {formatNumber(trade.price)}
                      </td>
                      <td className="p-4 text-right font-mono text-exchange-text">
                        {formatNumber(trade.quantity)}
                      </td>
                      <td className="p-4 text-right font-mono text-exchange-text">
                        {formatNumber(trade.quote_quantity)}
                      </td>
                      <td className="p-4 text-right font-mono text-exchange-muted">
                        {formatNumber(trade.fee, 6)}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          trade.is_maker ? 'bg-primary-500/20 text-primary-400' : 'bg-exchange-bg text-exchange-muted'
                        }`}>
                          {trade.is_maker ? 'Maker' : 'Taker'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersPage;