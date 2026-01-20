/**
 * Premium Trading Chart
 * =====================
 * An exceptional, interactive trading chart with unique visual effects
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

const TIMEFRAMES = [
  { label: '1M', value: '1m', seconds: 60 },
  { label: '5M', value: '5m', seconds: 300 },
  { label: '15M', value: '15m', seconds: 900 },
  { label: '1H', value: '1h', seconds: 3600 },
  { label: '4H', value: '4h', seconds: 14400 },
  { label: '1D', value: '1d', seconds: 86400 },
  { label: '1W', value: '1w', seconds: 604800 },
];

const CHART_STYLES = [
  { label: 'Candles', value: 'candle', icon: '📊' },
  { label: 'Line', value: 'line', icon: '📈' },
  { label: 'Area', value: 'area', icon: '📉' },
];

const PriceChart = ({ currentPair, ticker }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const animationRef = useRef(null);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [chartStyle, setChartStyle] = useState('candle');
  const [hoveredCandle, setHoveredCandle] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showCrosshair, setShowCrosshair] = useState(false);
  const [data, setData] = useState([]);
  const [priceRange, setPriceRange] = useState({ min: 0, max: 0 });
  const [animationProgress, setAnimationProgress] = useState(0);
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChangePercent, setPriceChangePercent] = useState(0);

  const symbol = currentPair?.symbol?.replace('_', '/') || 'BTC/USDT';
  const basePrice = parseFloat(ticker?.last_price || currentPair?.last_price || 45000);

  // Generate realistic OHLCV data
  const generateData = useCallback((timeframe, price) => {
    const candles = [];
    const now = Date.now();
    const tf = TIMEFRAMES.find(t => t.value === timeframe);
    const interval = (tf?.seconds || 3600) * 1000;
    const points = 80;

    let currentPrice = price * 0.95;

    for (let i = points; i >= 0; i--) {
      const time = now - (i * interval);
      const volatility = price * 0.006;
      const trend = Math.sin(i / 15) * volatility * 0.8;
      const momentum = Math.cos(i / 25) * volatility * 0.4;
      const random = (Math.random() - 0.48) * volatility * 1.5;

      const open = currentPrice;
      const change = trend + momentum + random;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * volatility * 0.6;
      const low = Math.min(open, close) - Math.random() * volatility * 0.6;
      const volume = Math.floor(Math.random() * 800000) + 200000;

      // RSI-like momentum indicator (0-100)
      const rsi = 50 + (change / volatility) * 30 + (Math.random() - 0.5) * 10;

      candles.push({
        time,
        open: Number(open.toFixed(2)),
        high: Number(high.toFixed(2)),
        low: Number(low.toFixed(2)),
        close: Number(close.toFixed(2)),
        volume,
        rsi: Math.max(0, Math.min(100, rsi)),
        bullish: close >= open,
      });

      currentPrice = close;
    }

    const prices = candles.flatMap(c => [c.high, c.low]);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1;

    setPriceRange({ min: min - padding, max: max + padding });
    setCurrentPrice(candles[candles.length - 1]?.close || price);

    const firstPrice = candles[0]?.open || price;
    const lastPrice = candles[candles.length - 1]?.close || price;
    setPriceChangePercent(((lastPrice - firstPrice) / firstPrice) * 100);

    return candles;
  }, []);

  // Initialize data
  useEffect(() => {
    const newData = generateData(selectedTimeframe, basePrice);
    setData(newData);
    setAnimationProgress(0);

    // Animate in
    let progress = 0;
    const animate = () => {
      progress += 0.03;
      setAnimationProgress(Math.min(1, progress));
      if (progress < 1) {
        animationRef.current = requestAnimationFrame(animate);
      }
    };
    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [selectedTimeframe, basePrice, generateData]);

  // Real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        if (prev.length === 0) return prev;
        const last = { ...prev[prev.length - 1] };
        const change = (Math.random() - 0.5) * basePrice * 0.0008;
        last.close = Number((last.close + change).toFixed(2));
        last.high = Math.max(last.high, last.close);
        last.low = Math.min(last.low, last.close);
        last.bullish = last.close >= last.open;
        setCurrentPrice(last.close);
        return [...prev.slice(0, -1), last];
      });
    }, 1500);

    return () => clearInterval(interval);
  }, [basePrice]);

  // Draw chart
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.style.width = `${rect.width}px`;
    canvas.style.height = `${rect.height}px`;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 70, bottom: 60, left: 10 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;
    const volumeHeight = 50;
    const mainChartHeight = chartHeight - volumeHeight - 20;

    // Clear
    ctx.clearRect(0, 0, width, height);

    // Background gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0a0e17');
    bgGradient.addColorStop(1, '#0d1320');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;

    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (mainChartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
    }

    // Price scale
    ctx.fillStyle = '#6b7280';
    ctx.font = '11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'right';

    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (mainChartHeight / 5) * i;
      const price = priceRange.max - ((priceRange.max - priceRange.min) / 5) * i;
      ctx.fillText(price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }), width - 8, y + 4);
    }

    // Helper functions
    const priceToY = (price) => {
      return padding.top + ((priceRange.max - price) / (priceRange.max - priceRange.min)) * mainChartHeight;
    };

    const indexToX = (index) => {
      return padding.left + (index / (data.length - 1)) * chartWidth;
    };

    // Calculate visible candles
    const candleWidth = Math.max(3, (chartWidth / data.length) * 0.7);
    const candleGap = (chartWidth / data.length) * 0.3;

    // Draw based on chart style
    if (chartStyle === 'candle') {
      // Draw candles with glow effect
      data.forEach((candle, i) => {
        const visibleIndex = Math.floor(i * animationProgress);
        if (i > visibleIndex && animationProgress < 1) return;

        const x = padding.left + (i / data.length) * chartWidth + candleGap / 2;
        const isHovered = hoveredCandle === i;

        const openY = priceToY(candle.open);
        const closeY = priceToY(candle.close);
        const highY = priceToY(candle.high);
        const lowY = priceToY(candle.low);

        const color = candle.bullish ? '#00ff88' : '#ff4466';
        const darkColor = candle.bullish ? '#00cc6a' : '#cc3355';

        // Glow effect for hovered or recent candles
        if (isHovered || i === data.length - 1) {
          ctx.shadowColor = color;
          ctx.shadowBlur = isHovered ? 20 : 10;
        }

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + candleWidth / 2, highY);
        ctx.lineTo(x + candleWidth / 2, lowY);
        ctx.stroke();

        // Body gradient
        const bodyGradient = ctx.createLinearGradient(x, Math.min(openY, closeY), x, Math.max(openY, closeY));
        bodyGradient.addColorStop(0, color);
        bodyGradient.addColorStop(1, darkColor);

        ctx.fillStyle = bodyGradient;
        ctx.fillRect(
          x,
          Math.min(openY, closeY),
          candleWidth,
          Math.max(2, Math.abs(closeY - openY))
        );

        // Border
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.5;
        ctx.strokeRect(
          x,
          Math.min(openY, closeY),
          candleWidth,
          Math.max(2, Math.abs(closeY - openY))
        );

        ctx.shadowBlur = 0;
      });
    } else if (chartStyle === 'line' || chartStyle === 'area') {
      // Line/Area chart with gradient
      ctx.beginPath();

      data.forEach((candle, i) => {
        const x = indexToX(i);
        const y = priceToY(candle.close);

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          // Smooth curve
          const prevX = indexToX(i - 1);
          const prevY = priceToY(data[i - 1].close);
          const cpX = (prevX + x) / 2;
          ctx.quadraticCurveTo(prevX, prevY, cpX, (prevY + y) / 2);
        }
      });

      // Stroke the line
      const lineGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + mainChartHeight);
      lineGradient.addColorStop(0, priceChangePercent >= 0 ? '#00ff88' : '#ff4466');
      lineGradient.addColorStop(1, priceChangePercent >= 0 ? '#00aa55' : '#aa2244');

      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // Area fill
      if (chartStyle === 'area') {
        ctx.lineTo(indexToX(data.length - 1), padding.top + mainChartHeight);
        ctx.lineTo(indexToX(0), padding.top + mainChartHeight);
        ctx.closePath();

        const areaGradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + mainChartHeight);
        areaGradient.addColorStop(0, priceChangePercent >= 0 ? 'rgba(0, 255, 136, 0.3)' : 'rgba(255, 68, 102, 0.3)');
        areaGradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

        ctx.fillStyle = areaGradient;
        ctx.fill();
      }

      // Animated dot at the end
      const lastX = indexToX(data.length - 1);
      const lastY = priceToY(data[data.length - 1].close);

      // Pulse animation
      const pulseSize = 4 + Math.sin(Date.now() / 200) * 2;

      ctx.beginPath();
      ctx.arc(lastX, lastY, pulseSize + 4, 0, Math.PI * 2);
      ctx.fillStyle = priceChangePercent >= 0 ? 'rgba(0, 255, 136, 0.2)' : 'rgba(255, 68, 102, 0.2)';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(lastX, lastY, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = priceChangePercent >= 0 ? '#00ff88' : '#ff4466';
      ctx.fill();
    }

    // Volume bars
    const maxVolume = Math.max(...data.map(d => d.volume));
    const volumeTop = padding.top + mainChartHeight + 20;

    data.forEach((candle, i) => {
      const x = padding.left + (i / data.length) * chartWidth + candleGap / 2;
      const volHeight = (candle.volume / maxVolume) * volumeHeight;

      const volGradient = ctx.createLinearGradient(x, volumeTop + volumeHeight - volHeight, x, volumeTop + volumeHeight);
      volGradient.addColorStop(0, candle.bullish ? 'rgba(0, 255, 136, 0.6)' : 'rgba(255, 68, 102, 0.6)');
      volGradient.addColorStop(1, candle.bullish ? 'rgba(0, 255, 136, 0.1)' : 'rgba(255, 68, 102, 0.1)');

      ctx.fillStyle = volGradient;
      ctx.fillRect(x, volumeTop + volumeHeight - volHeight, candleWidth, volHeight);
    });

    // Current price line
    const currentPriceY = priceToY(currentPrice);
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = priceChangePercent >= 0 ? '#00ff88' : '#ff4466';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding.left, currentPriceY);
    ctx.lineTo(width - padding.right, currentPriceY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price label
    const priceLabel = currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const labelWidth = ctx.measureText(priceLabel).width + 16;

    ctx.fillStyle = priceChangePercent >= 0 ? '#00ff88' : '#ff4466';
    ctx.beginPath();
    ctx.roundRect(width - padding.right + 4, currentPriceY - 10, labelWidth, 20, 4);
    ctx.fill();

    ctx.fillStyle = '#000';
    ctx.font = 'bold 11px Inter, system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(priceLabel, width - padding.right + 12, currentPriceY + 4);

    // Crosshair
    if (showCrosshair && mousePos.x > padding.left && mousePos.x < width - padding.right) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.setLineDash([3, 3]);
      ctx.lineWidth = 1;

      // Vertical line
      ctx.beginPath();
      ctx.moveTo(mousePos.x, padding.top);
      ctx.lineTo(mousePos.x, padding.top + mainChartHeight);
      ctx.stroke();

      // Horizontal line
      ctx.beginPath();
      ctx.moveTo(padding.left, mousePos.y);
      ctx.lineTo(width - padding.right, mousePos.y);
      ctx.stroke();

      ctx.setLineDash([]);
    }

    // Time labels
    ctx.fillStyle = '#6b7280';
    ctx.font = '10px Inter, system-ui, sans-serif';
    ctx.textAlign = 'center';

    const labelInterval = Math.ceil(data.length / 6);
    data.forEach((candle, i) => {
      if (i % labelInterval === 0) {
        const x = padding.left + (i / data.length) * chartWidth + candleWidth / 2;
        const date = new Date(candle.time);
        const label = selectedTimeframe === '1d' || selectedTimeframe === '1w'
          ? date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        ctx.fillText(label, x, height - 8);
      }
    });

  }, [data, priceRange, animationProgress, hoveredCandle, mousePos, showCrosshair, chartStyle, currentPrice, priceChangePercent, selectedTimeframe]);

  // Mouse handlers
  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setMousePos({ x, y });
    setShowCrosshair(true);

    // Find hovered candle
    const padding = { left: 10, right: 70 };
    const chartWidth = rect.width - padding.left - padding.right;
    const candleIndex = Math.floor(((x - padding.left) / chartWidth) * data.length);

    if (candleIndex >= 0 && candleIndex < data.length) {
      setHoveredCandle(candleIndex);
    } else {
      setHoveredCandle(null);
    }
  };

  const handleMouseLeave = () => {
    setShowCrosshair(false);
    setHoveredCandle(null);
  };

  const formatPrice = (price) => {
    if (!price) return '-';
    return parseFloat(price).toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatVolume = (vol) => {
    if (vol >= 1e9) return (vol / 1e9).toFixed(2) + 'B';
    if (vol >= 1e6) return (vol / 1e6).toFixed(2) + 'M';
    if (vol >= 1e3) return (vol / 1e3).toFixed(2) + 'K';
    return vol.toFixed(0);
  };

  const hoveredData = hoveredCandle !== null ? data[hoveredCandle] : null;

  return (
    <div className="h-full flex flex-col bg-gradient-to-b from-[#0a0e17] to-[#0d1320] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-white">{symbol}</h3>
                <span className={`text-sm font-semibold px-2 py-0.5 rounded-full ${
                  priceChangePercent >= 0
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {priceChangePercent >= 0 ? '↑' : '↓'} {Math.abs(priceChangePercent).toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                <span className={`text-2xl font-mono font-bold ${
                  priceChangePercent >= 0 ? 'text-green-400' : 'text-red-400'
                }`}>
                  ${formatPrice(currentPrice)}
                </span>
              </div>
            </div>
          </div>

          {/* Chart Style Toggle */}
          <div className="flex items-center gap-1 bg-white/5 rounded-lg p-1">
            {CHART_STYLES.map((style) => (
              <button
                key={style.value}
                onClick={() => setChartStyle(style.value)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                  chartStyle === style.value
                    ? 'bg-white/10 text-white shadow-lg'
                    : 'text-gray-500 hover:text-white'
                }`}
                title={style.label}
              >
                {style.icon}
              </button>
            ))}
          </div>
        </div>

        {/* Timeframe Selector */}
        <div className="flex items-center gap-1 mt-4">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setSelectedTimeframe(tf.value)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all duration-300 ${
                selectedTimeframe === tf.value
                  ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hovered Candle Info */}
      {hoveredData && (
        <div className="absolute top-24 left-4 z-10 bg-black/80 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-xl">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
            <div className="text-gray-500">Open</div>
            <div className="text-white font-mono">${formatPrice(hoveredData.open)}</div>
            <div className="text-gray-500">High</div>
            <div className="text-green-400 font-mono">${formatPrice(hoveredData.high)}</div>
            <div className="text-gray-500">Low</div>
            <div className="text-red-400 font-mono">${formatPrice(hoveredData.low)}</div>
            <div className="text-gray-500">Close</div>
            <div className={`font-mono ${hoveredData.bullish ? 'text-green-400' : 'text-red-400'}`}>
              ${formatPrice(hoveredData.close)}
            </div>
            <div className="text-gray-500">Volume</div>
            <div className="text-white font-mono">{formatVolume(hoveredData.volume)}</div>
          </div>
        </div>
      )}

      {/* Chart Canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative cursor-crosshair"
        style={{ minHeight: '350px' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-4 gap-4 p-4 border-t border-white/5 bg-black/20">
        <div>
          <div className="text-xs text-gray-500 mb-1">24h Volume</div>
          <div className="text-sm font-mono text-white font-semibold">
            {formatVolume(data.reduce((sum, d) => sum + d.volume, 0))}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">24h High</div>
          <div className="text-sm font-mono text-green-400 font-semibold">
            ${formatPrice(Math.max(...data.map(d => d.high)))}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">24h Low</div>
          <div className="text-sm font-mono text-red-400 font-semibold">
            ${formatPrice(Math.min(...data.map(d => d.low)))}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">Trades</div>
          <div className="text-sm font-mono text-white font-semibold">
            {(Math.random() * 50000 + 10000).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ",")}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PriceChart;