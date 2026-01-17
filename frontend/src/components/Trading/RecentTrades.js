import React from 'react';

const RecentTrades = ({ trades = [], currentPair }) => {
  const formatPrice = (price) => {
    return parseFloat(price).toFixed(currentPair?.price_precision || 2);
  };

  const formatQuantity = (qty) => {
    return parseFloat(qty).toFixed(currentPair?.quantity_precision || 4);
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-exchange-border">
        <h3 className="text-sm font-medium text-exchange-text">Recent Trades</h3>
      </div>

      {/* Column Headers */}
      <div className="grid grid-cols-3 px-3 py-2 text-xs text-exchange-muted border-b border-exchange-border">
        <div>Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Time</div>
      </div>

      {/* Trades List */}
      <div className="flex-1 overflow-y-auto">
        {trades.length > 0 ? (
          trades.map((trade, index) => {
            const isBuy = trade.side === 'buy' || trade.buyer_is_maker === false;
            return (
              <div
                key={trade.id || index}
                className="grid grid-cols-3 px-3 py-1 text-xs hover:bg-exchange-bg"
              >
                <div className={isBuy ? 'text-success' : 'text-danger'}>
                  {formatPrice(trade.price)}
                </div>
                <div className="text-right text-exchange-text">
                  {formatQuantity(trade.quantity)}
                </div>
                <div className="text-right text-exchange-muted">
                  {formatTime(trade.created_at || trade.timestamp)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="flex items-center justify-center h-32 text-exchange-muted text-sm">
            No recent trades
          </div>
        )}
      </div>
    </div>
  );
};

export default RecentTrades;