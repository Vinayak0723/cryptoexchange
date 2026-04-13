import React, { useState, useEffect } from 'react';
import { useTradingStore } from '../../stores/tradingStore';
import { useWalletStore } from '../../stores/walletStore';
import toast from 'react-hot-toast';
import clsx from 'clsx';

const TradeForm = ({ currentPair }) => {
  const { createOrder, isLoading } = useTradingStore();
  const { balances, fetchBalances } = useWalletStore();

  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('limit');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [total, setTotal] = useState('');

  const baseBalance = balances.find(b => b.currency_symbol === currentPair?.base_currency_symbol);
  const quoteBalance = balances.find(b => b.currency_symbol === currentPair?.quote_currency_symbol);

  useEffect(() => {
    if (price && quantity) {
      const calculatedTotal = (parseFloat(price) * parseFloat(quantity)).toFixed(8);
      setTotal(calculatedTotal);
    } else {
      setTotal('');
    }
  }, [price, quantity]);

  // Set price from ticker when switching to limit
  useEffect(() => {
    if (orderType === 'limit' && currentPair?.last_price && !price) {
      setPrice(parseFloat(currentPair.last_price).toFixed(2));
    }
  }, [orderType, currentPair]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentPair) {
      toast.error('Please select a trading pair');
      return;
    }

    if (orderType === 'limit' && !price) {
      toast.error('Please enter a price');
      return;
    }

    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    const orderData = {
      trading_pair_id: currentPair.id,
      side,
      order_type: orderType,
      quantity: quantity,
      time_in_force: 'GTC',
    };

    if (orderType === 'limit') {
      orderData.price = price;
    }

    const result = await createOrder(orderData);

    if (result.success) {
      toast.success(`${side.toUpperCase()} order placed!`);
      setQuantity('');
      setTotal('');
      fetchBalances();
    } else {
      toast.error(result.error || 'Order failed');
    }
  };

  const handlePercentageClick = (percentage) => {
    if (side === 'buy' && quoteBalance && price && parseFloat(price) > 0) {
      const available = parseFloat(quoteBalance.available);
      const maxQuantity = available / parseFloat(price);
      setQuantity((maxQuantity * percentage).toFixed(6));
    } else if (side === 'sell' && baseBalance) {
      const available = parseFloat(baseBalance.available);
      setQuantity((available * percentage).toFixed(6));
    }
  };

  const formatBalance = (balance) => {
    const num = parseFloat(balance || 0);
    if (num >= 1000) return num.toFixed(2);
    if (num >= 1) return num.toFixed(4);
    return num.toFixed(6);
  };

  if (!currentPair) {
    return (
      <div className="card h-full flex items-center justify-center text-exchange-muted">
        <div className="text-center">
          <p>Select a trading pair to start trading</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card h-full flex flex-col">
      {/* Buy/Sell Toggle */}
      <div className="grid grid-cols-2 gap-1 p-2 m-3 mb-0 bg-exchange-bg rounded-lg">
        <button
          onClick={() => setSide('buy')}
          className={clsx(
            'py-2.5 rounded-md font-semibold transition-all duration-200',
            side === 'buy'
              ? 'bg-success text-white shadow-lg shadow-success/25'
              : 'text-exchange-muted hover:text-exchange-text'
          )}
        >
          Buy
        </button>
        <button
          onClick={() => setSide('sell')}
          className={clsx(
            'py-2.5 rounded-md font-semibold transition-all duration-200',
            side === 'sell'
              ? 'bg-danger text-white shadow-lg shadow-danger/25'
              : 'text-exchange-muted hover:text-exchange-text'
          )}
        >
          Sell
        </button>
      </div>

      {/* Order Type Toggle */}
      <div className="flex gap-4 px-4 py-3 border-b border-exchange-border">
        {['limit', 'market'].map((type) => (
          <button
            key={type}
            onClick={() => setOrderType(type)}
            className={clsx(
              'text-sm capitalize font-medium transition-colors',
              orderType === type
                ? 'text-exchange-text'
                : 'text-exchange-muted hover:text-exchange-text'
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="flex-1 flex flex-col p-4 pt-3">
        {/* Available Balance */}
        <div className="flex items-center justify-between text-xs mb-3">
          <span className="text-exchange-muted">Available</span>
          <span className="text-exchange-text font-mono">
            {side === 'buy'
              ? `${formatBalance(quoteBalance?.available)} ${currentPair.quote_currency_symbol}`
              : `${formatBalance(baseBalance?.available)} ${currentPair.base_currency_symbol}`
            }
          </span>
        </div>

        {/* Price Input */}
        {orderType === 'limit' && (
          <div className="mb-3">
            <label className="text-xs text-exchange-muted mb-1.5 block">Price</label>
            <div className="relative">
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="input pr-16 font-mono"
                placeholder="0.00"
                step="any"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-exchange-muted font-medium">
                {currentPair.quote_currency_symbol}
              </span>
            </div>
          </div>
        )}

        {/* Quantity Input */}
        <div className="mb-3">
          <label className="text-xs text-exchange-muted mb-1.5 block">Amount</label>
          <div className="relative">
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="input pr-16 font-mono"
              placeholder="0.00"
              step="any"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-exchange-muted font-medium">
              {currentPair.base_currency_symbol}
            </span>
          </div>
        </div>

        {/* Percentage Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-3">
          {[25, 50, 75, 100].map((pct) => (
            <button
              key={pct}
              type="button"
              onClick={() => handlePercentageClick(pct / 100)}
              className="py-1.5 text-xs bg-exchange-bg hover:bg-exchange-border rounded font-medium text-exchange-muted hover:text-exchange-text transition-colors"
            >
              {pct}%
            </button>
          ))}
        </div>

        {/* Total */}
        {orderType === 'limit' && (
          <div className="mb-4">
            <label className="text-xs text-exchange-muted mb-1.5 block">Total</label>
            <div className="relative">
              <input
                type="text"
                value={total}
                readOnly
                className="input pr-16 font-mono bg-exchange-bg"
                placeholder="0.00"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-exchange-muted font-medium">
                {currentPair.quote_currency_symbol}
              </span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className={clsx(
            'w-full py-3 rounded-lg font-semibold mt-auto transition-all duration-200',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            'active:scale-[0.98]',
            side === 'buy'
              ? 'bg-success hover:brightness-110 shadow-lg shadow-success/20'
              : 'bg-danger hover:brightness-110 shadow-lg shadow-danger/20',
            'text-white'
          )}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="loading-spinner w-4 h-4 border-white/30 border-t-white"></span>
              Processing...
            </span>
          ) : (
            `${side === 'buy' ? 'Buy' : 'Sell'} ${currentPair.base_currency_symbol}`
          )}
        </button>
      </form>
    </div>
  );
};

export default TradeForm;