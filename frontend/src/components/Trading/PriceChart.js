/**
 * PriceChart Component
 * ====================
 * Candlestick chart using lightweight-charts
 */

import React, { useEffect, useRef, useState } from 'react';

const TIMEFRAMES = [
  { label: '1m', value: '1m', seconds: 60 },
  { label: '5m', value: '5m', seconds: 300 },
  { label: '15m', value: '15m', seconds: 900 },
  { label: '1H', value: '1h', seconds: 3600 },
  { label: '4H', value: '4h', seconds: 14400 },
  { label: '1D', value: '1d', seconds: 86400 },
];

const PriceChart = ({ currentPair, ticker }) => {
  const chartContainerRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');

  const symbol = currentPair?.symbol?.replace('_', '/') || 'BTC/USDT';
  const basePrice = parseFloat(ticker?.last_price || currentPair?.last_price || 45000);

  // Generate mock data
  const generateData = (timeframe, price) => {
    const candles = [];
    const volumes = [];
    const now = Math.floor(Date.now() / 1000);
    const tf = TIMEFRAMES.find(t => t.value === timeframe);
    const interval = tf?.seconds || 3600;

    let currentPrice = price * 0.98;

    for (let i = 100; i >= 0; i--) {
      const time = now - (i * interval);
      const volatility = price * 0.003;
      const change = (Math.random() - 0.48) * volatility * 2;

      const open = currentPrice;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility;
      const low = Math.min(open, close) - Math.random() * volatility;

      candles.push({
        time,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
      });

      volumes.push({
        time,
        value: Math.floor(Math.random() * 500000) + 100000,
        color: close >= open ? 'rgba(14, 203, 129, 0.5)' : 'rgba(246, 70, 93, 0.5)',
      });

      currentPrice = close;
    }

    return { candles, volumes };
  };

  // Initialize chart
  useEffect(() => {
    let chart = null;
    let candleSeries = null;
    let volumeSeries = null;
    let isDisposed = false;

    const initChart = async () => {
      if (!chartContainerRef.current || isDisposed) return;

      try {
        const LWC = await import('lightweight-charts');

        if (isDisposed || !chartContainerRef.current) return;

        // Create chart
        chart = LWC.createChart(chartContainerRef.current, {
          layout: {
            background: { color: '#0b0e11' },
            textColor: '#848e9c',
          },
          grid: {
            vertLines: { color: '#1e2329' },
            horzLines: { color: '#1e2329' },
          },
          width: chartContainerRef.current.clientWidth,
          height: 300,
          rightPriceScale: { borderColor: '#2b3139' },
          timeScale: {
            borderColor: '#2b3139',
            timeVisible: true,
          },
        });

        chartInstanceRef.current = chart;

        // Try different APIs based on version
        if (typeof chart.addCandlestickSeries === 'function') {
          // v3 API
          candleSeries = chart.addCandlestickSeries({
            upColor: '#0ecb81',
            downColor: '#f6465d',
            borderUpColor: '#0ecb81',
            borderDownColor: '#f6465d',
            wickUpColor: '#0ecb81',
            wickDownColor: '#f6465d',
          });

          volumeSeries = chart.addHistogramSeries({
            color: '#0ecb81',
            priceFormat: { type: 'volume' },
            priceScaleId: '',
            scaleMargins: { top: 0.8, bottom: 0 },
          });
        } else if (LWC.CandlestickSeries) {
          // v4 API
          candleSeries = chart.addSeries(LWC.CandlestickSeries, {
            upColor: '#0ecb81',
            downColor: '#f6465d',
            borderUpColor: '#0ecb81',
            borderDownColor: '#f6465d',
            wickUpColor: '#0ecb81',
            wickDownColor: '#f6465d',
          });

          volumeSeries = chart.addSeries(LWC.HistogramSeries, {
            color: '#0ecb81',
            priceFormat: { type: 'volume' },
            priceScaleId: 'volume',
          });
          volumeSeries.priceScale().applyOptions({
            scaleMargins: { top: 0.8, bottom: 0 },
          });
        }

        candleSeriesRef.current = candleSeries;
        volumeSeriesRef.current = volumeSeries;

        // Load data
        const { candles, volumes } = generateData(selectedTimeframe, basePrice);
        if (candleSeries) candleSeries.setData(candles);
        if (volumeSeries) volumeSeries.setData(volumes);

        chart.timeScale().fitContent();

        // Handle resize
        const resizeHandler = () => {
          if (chart && chartContainerRef.current && !isDisposed) {
            chart.applyOptions({
              width: chartContainerRef.current.clientWidth
            });
          }
        };

        window.addEventListener('resize', resizeHandler);

        // Store cleanup reference
        chartInstanceRef.current = { chart, resizeHandler };

      } catch (error) {
        console.error('Chart init error:', error);
      }
    };

    initChart();

    return () => {
      isDisposed = true;
      if (chartInstanceRef.current) {
        const { chart, resizeHandler } = chartInstanceRef.current;
        if (resizeHandler) {
          window.removeEventListener('resize', resizeHandler);
        }
        if (chart) {
          try {
            chart.remove();
          } catch (e) {
            // Ignore disposal errors
          }
        }
        chartInstanceRef.current = null;
      }
    };
  }, []);

  // Update on timeframe change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current) return;

    const { candles, volumes } = generateData(selectedTimeframe, basePrice);
    candleSeriesRef.current.setData(candles);
    volumeSeriesRef.current.setData(volumes);

    if (chartInstanceRef.current?.chart) {
      chartInstanceRef.current.chart.timeScale().fitContent();
    }
  }, [selectedTimeframe, basePrice]);

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
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-lg font-medium text-white">{symbol}</h3>
          <p className="text-xs text-gray-500">24h Price Movement (Demo Data)</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-500">24h High / Low</div>
          <div className="text-sm">
            <span className="text-green-400">{formatPrice(ticker?.high_24h || currentPair?.high_24h)}</span>
            <span className="text-gray-500 mx-2">/</span>
            <span className="text-red-400">{formatPrice(ticker?.low_24h || currentPair?.low_24h)}</span>
          </div>
        </div>
      </div>

      {/* Timeframe Selector */}
      <div className="flex items-center gap-1 mb-3">
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf.value}
            onClick={() => setSelectedTimeframe(tf.value)}
            className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
              selectedTimeframe === tf.value
                ? 'bg-yellow-500 text-black'
                : 'text-gray-400 hover:text-white hover:bg-gray-700'
            }`}
          >
            {tf.label}
          </button>
        ))}
      </div>

      {/* Chart */}
      <div
        ref={chartContainerRef}
        style={{ minHeight: '300px', width: '100%' }}
      />

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t border-gray-700">
        <div>
          <div className="text-xs text-gray-500">24h Volume</div>
          <div className="text-sm font-mono text-white">
            {parseFloat(ticker?.volume_24h || currentPair?.volume_24h || 0).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Best Bid</div>
          <div className="text-sm font-mono text-green-400">
            {formatPrice(ticker?.best_bid)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Best Ask</div>
          <div className="text-sm font-mono text-red-400">
            {formatPrice(ticker?.best_ask)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500">Spread</div>
          <div className="text-sm font-mono text-white">
            {ticker?.spread || '-'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;