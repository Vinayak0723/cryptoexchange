import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTradingStore } from '../stores/tradingStore';
import { useWalletStore } from '../stores/walletStore';
import { useOrderBookWebSocket } from '../hooks/useOrderBookWebSocket';
import { useTradesWebSocket } from '../hooks/useTradesWebSocket';
import { useUserWebSocket } from '../hooks/useUserWebSocket';
import OrderBook from '../components/Trading/OrderBook';
import TradeForm from '../components/Trading/TradeForm';
import RecentTrades from '../components/Trading/RecentTrades';
import TradingPairSelector from '../components/Trading/TradingPairSelector';
import PriceChart from '../components/Trading/PriceChart';

const TradingPage = () => {
  const { symbol } = useParams();
  const {
    tradingPairs,
    currentPair,
    setCurrentPair,
    fetchTradingPairs,
    fetchOrderBook,
    fetchRecentTrades,
    fetchTicker,
    orderBook,
    recentTrades,
    ticker
  } = useTradingStore();

  const { fetchBalances } = useWalletStore();

  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('chart'); // For mobile: chart, orderbook, trades

  const pairsArray = Array.isArray(tradingPairs) ? tradingPairs : [];

  // WebSocket connections
  useOrderBookWebSocket(currentPair?.symbol);
  useTradesWebSocket(currentPair?.symbol);
  useUserWebSocket();

  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchTradingPairs();
      await fetchBalances();
      setIsLoading(false);
    };
    init();
  }, []);

  useEffect(() => {
    if (pairsArray.length > 0) {
      if (symbol) {
        const pair = pairsArray.find(p => p.symbol === symbol.toUpperCase());
        if (pair) {
          setCurrentPair(pair);
        }
      } else if (!currentPair) {
        setCurrentPair(pairsArray[0]);
      }
    }
  }, [symbol, pairsArray, currentPair, setCurrentPair]);

  useEffect(() => {
    if (currentPair) {
      fetchOrderBook(currentPair.symbol);
      fetchRecentTrades(currentPair.symbol);
      fetchTicker(currentPair.symbol);

      const interval = setInterval(() => {
        fetchTicker(currentPair.symbol);
      }, 10000);

      return () => clearInterval(interval);
    }
  }, [currentPair]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="flex flex-col items-center gap-4">
          <div className="loading-spinner w-8 h-8"></div>
          <span className="text-exchange-muted">Loading...</span>
        </div>
      </div>
    );
  }

  // Mobile Tab Button Component
  const MobileTabButton = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`flex-1 py-2 text-sm font-medium transition-colors ${
        activeTab === tab
          ? 'text-primary-400 border-b-2 border-primary-400'
          : 'text-exchange-muted'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-[calc(100vh-64px-40px)]">
      {/* Desktop Layout */}
      <div className="hidden lg:block h-[calc(100vh-64px-40px)] p-4">
        <div className="grid grid-cols-12 gap-4 h-full">
          {/* Left Column - Order Book */}
          <div className="col-span-3 flex flex-col gap-4">
            <TradingPairSelector
              pairs={pairsArray}
              currentPair={currentPair}
              onSelect={setCurrentPair}
              ticker={ticker}
            />
            <div className="flex-1 card overflow-hidden">
              <OrderBook
                orderBook={orderBook}
                currentPair={currentPair}
              />
            </div>
          </div>

          {/* Center Column - Chart & Form */}
          <div className="col-span-6 flex flex-col gap-4">
            <div className="flex-1 card p-4">
              <PriceChart
                currentPair={currentPair}
                ticker={ticker}
              />
            </div>
            <div className="h-72">
              <TradeForm currentPair={currentPair} />
            </div>
          </div>

          {/* Right Column - Recent Trades */}
          <div className="col-span-3 card overflow-hidden">
            <RecentTrades
              trades={Array.isArray(recentTrades) ? recentTrades : []}
              currentPair={currentPair}
            />
          </div>
        </div>
      </div>

      {/* Tablet Layout */}
      <div className="hidden md:block lg:hidden p-4">
        <div className="grid grid-cols-2 gap-4">
          {/* Left - Pair Selector & Order Book */}
          <div className="space-y-4">
            <TradingPairSelector
              pairs={pairsArray}
              currentPair={currentPair}
              onSelect={setCurrentPair}
              ticker={ticker}
            />
            <div className="card h-[400px] overflow-hidden">
              <OrderBook
                orderBook={orderBook}
                currentPair={currentPair}
              />
            </div>
          </div>

          {/* Right - Chart & Trades */}
          <div className="space-y-4">
            <div className="card p-4 h-[250px]">
              <PriceChart
                currentPair={currentPair}
                ticker={ticker}
              />
            </div>
            <div className="card h-[200px] overflow-hidden">
              <RecentTrades
                trades={Array.isArray(recentTrades) ? recentTrades : []}
                currentPair={currentPair}
              />
            </div>
          </div>

          {/* Trade Form - Full Width */}
          <div className="col-span-2">
            <TradeForm currentPair={currentPair} />
          </div>
        </div>
      </div>

      {/* Mobile Layout */}
      <div className="md:hidden">
        {/* Pair Selector */}
        <div className="p-4 pb-0">
          <TradingPairSelector
            pairs={pairsArray}
            currentPair={currentPair}
            onSelect={setCurrentPair}
            ticker={ticker}
          />
        </div>

        {/* Mobile Tabs */}
        <div className="flex border-b border-exchange-border mt-4 px-4">
          <MobileTabButton tab="chart" label="Chart" />
          <MobileTabButton tab="orderbook" label="Order Book" />
          <MobileTabButton tab="trades" label="Trades" />
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {activeTab === 'chart' && (
            <div className="card p-4 h-[300px] animate-fadeIn">
              <PriceChart
                currentPair={currentPair}
                ticker={ticker}
              />
            </div>
          )}

          {activeTab === 'orderbook' && (
            <div className="card h-[400px] overflow-hidden animate-fadeIn">
              <OrderBook
                orderBook={orderBook}
                currentPair={currentPair}
              />
            </div>
          )}

          {activeTab === 'trades' && (
            <div className="card h-[400px] overflow-hidden animate-fadeIn">
              <RecentTrades
                trades={Array.isArray(recentTrades) ? recentTrades : []}
                currentPair={currentPair}
              />
            </div>
          )}
        </div>

        {/* Trade Form - Fixed at Bottom */}
        <div className="p-4 pt-0">
          <TradeForm currentPair={currentPair} />
        </div>
      </div>
    </div>
  );
};

export default TradingPage;