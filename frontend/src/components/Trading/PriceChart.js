import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const PriceChart = ({ currentPair, ticker }) => {
  // Generate mock chart data for demo
  // In production, you would fetch real OHLCV data
  const generateMockData = () => {
    const data = [];
    const basePrice = parseFloat(ticker?.last_price || currentPair?.last_price || 100);
    const now = Date.now();

    for (let i = 24; i >= 0; i--) {
      const randomChange = (Math.random() - 0.5) * 0.02; // ±1% change
      const price = basePrice * (1 + randomChange * (i / 24));
      data.push({
        time: new Date(now - i * 3600000).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }),
        price: price.toFixed(2),
      });
    }
    return data;
  };

  const data = generateMockData();
  const priceChange = ticker?.price_change_24h ? parseFloat(ticker.price_change_24h) : 0;
  const chartColor = priceChange >= 0 ? '#0ecb81' : '#f6465d';

  const formatPrice = (price) => {
    if (!price) return '-';
    return parseFloat(price).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    });
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-medium text-exchange-text">
            {currentPair?.symbol?.replace('_', '/') || 'Price Chart'}
          </h3>
          <p className="text-xs text-exchange-muted">24h Price Movement (Demo Data)</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-exchange-muted">24h High / Low</div>
          <div className="text-sm">
            <span className="text-success">{formatPrice(ticker?.high_24h || currentPair?.high_24h)}</span>
            <span className="text-exchange-muted mx-2">/</span>
            <span className="text-danger">{formatPrice(ticker?.low_24h || currentPair?.low_24h)}</span>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColor} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColor} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="time"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#848e9c', fontSize: 10 }}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={['auto', 'auto']}
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#848e9c', fontSize: 10 }}
              width={60}
              tickFormatter={(value) => value.toLocaleString()}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e2329',
                border: '1px solid #2b3139',
                borderRadius: '8px',
              }}
              labelStyle={{ color: '#848e9c' }}
              itemStyle={{ color: '#eaecef' }}
              formatter={(value) => [`$${parseFloat(value).toLocaleString()}`, 'Price']}
            />
            <Area
              type="monotone"
              dataKey="price"
              stroke={chartColor}
              strokeWidth={2}
              fill="url(#priceGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-exchange-border">
        <div>
          <div className="text-xs text-exchange-muted">24h Volume</div>
          <div className="text-sm font-mono text-exchange-text">
            {parseFloat(ticker?.volume_24h || currentPair?.volume_24h || 0).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-exchange-muted">Best Bid</div>
          <div className="text-sm font-mono text-success">
            {formatPrice(ticker?.best_bid)}
          </div>
        </div>
        <div>
          <div className="text-xs text-exchange-muted">Best Ask</div>
          <div className="text-sm font-mono text-danger">
            {formatPrice(ticker?.best_ask)}
          </div>
        </div>
        <div>
          <div className="text-xs text-exchange-muted">Spread</div>
          <div className="text-sm font-mono text-exchange-text">
            {ticker?.spread || '-'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;