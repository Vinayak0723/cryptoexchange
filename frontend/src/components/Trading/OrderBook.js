import React from 'react';
import ConnectionStatus from '../Common/ConnectionStatus';

const OrderBook = ({ orderBook, currentPair }) => {
  const { bids = [], asks = [] } = orderBook || {};

  const formatPrice = (price) => {
    return parseFloat(price).toFixed(currentPair?.price_precision || 2);
  };

  const formatQuantity = (qty) => {
    return parseFloat(qty).toFixed(currentPair?.quantity_precision || 4);
  };

  const maxBidTotal = bids.length > 0 ? Math.max(...bids.map(b => parseFloat(b.total || 0))) : 0;
  const maxAskTotal = asks.length > 0 ? Math.max(...asks.map(a => parseFloat(a.total || 0))) : 0;
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);

  const bestBid = bids.length > 0 ? parseFloat(bids[0].price) : 0;
  const bestAsk = asks.length > 0 ? parseFloat(asks[0].price) : 0;
  const spread = bestAsk && bestBid ? (bestAsk - bestBid).toFixed(currentPair?.price_precision || 2) : '-';
  const spreadPercent = bestAsk && bestBid ? (((bestAsk - bestBid) / bestAsk) * 100).toFixed(2) : '-';

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-exchange-border flex items-center justify-between">
        <h3 className="text-sm font-medium text-exchange-text">Order Book</h3>
        {currentPair && (
          <ConnectionStatus channel="orderbook" params={{ symbol: currentPair.symbol }} />
        )}
      </div>

      <div className="grid grid-cols-3 px-3 py-2 text-xs text-exchange-muted border-b border-exchange-border">
        <div>Price</div>
        <div className="text-right">Amount</div>
        <div className="text-right">Total</div>
      </div>

      {/* Asks */}
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col-reverse">
          {asks.slice(0, 15).map((ask, index) => {
            const depthPercent = maxTotal > 0 ? (parseFloat(ask.total || 0) / maxTotal) * 100 : 0;
            return (
              <div key={`ask-${index}`} className="orderbook-row ask grid grid-cols-3 px-3 py-1 text-xs hover:bg-exchange-bg cursor-pointer relative">
                <div className="depth-bar" style={{ width: `${depthPercent}%` }} />
                <div className="text-danger relative z-10">{formatPrice(ask.price)}</div>
                <div className="text-right text-exchange-text relative z-10">{formatQuantity(ask.quantity)}</div>
                <div className="text-right text-exchange-muted relative z-10">{formatQuantity(ask.total || 0)}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Spread */}
      <div className="px-3 py-2 border-y border-exchange-border bg-exchange-bg">
        <div className="flex items-center justify-between text-xs">
          <span className="text-exchange-muted">Spread</span>
          <span className="text-exchange-text">{spread} ({spreadPercent}%)</span>
        </div>
      </div>

      {/* Bids */}
      <div className="flex-1 overflow-y-auto">
        {bids.slice(0, 15).map((bid, index) => {
          const depthPercent = maxTotal > 0 ? (parseFloat(bid.total || 0) / maxTotal) * 100 : 0;
          return (
            <div key={`bid-${index}`} className="orderbook-row bid grid grid-cols-3 px-3 py-1 text-xs hover:bg-exchange-bg cursor-pointer relative">
              <div className="depth-bar" style={{ width: `${depthPercent}%` }} />
              <div className="text-success relative z-10">{formatPrice(bid.price)}</div>
              <div className="text-right text-exchange-text relative z-10">{formatQuantity(bid.quantity)}</div>
              <div className="text-right text-exchange-muted relative z-10">{formatQuantity(bid.total || 0)}</div>
            </div>
          );
        })}
      </div>

      {bids.length === 0 && asks.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-exchange-muted text-sm">
          No orders in book
        </div>
      )}
    </div>
  );
};

export default OrderBook;