/**
 * System Banner Component
 * =======================
 * Shows banners based on system status
 * - Demo mode banner (only if DEMO_MODE=true)
 * - Maintenance banner
 * - Warning banners
 */
import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, X } from 'lucide-react';

const SystemBanner = () => {
  const [status, setStatus] = useState(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchSystemStatus();
  }, []);

  const fetchSystemStatus = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/api/v1/status/`);
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error('Failed to fetch system status:', error);
    }
  };

  if (!status || dismissed) return null;

  // Maintenance mode - highest priority
  if (status.maintenance_mode) {
    return (
      <div className="bg-red-600 text-white px-4 py-3 text-center">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span className="font-medium">
            {status.maintenance_message || 'System is under maintenance'}
          </span>
        </div>
      </div>
    );
  }

  // Demo mode banner - only shows if demo_mode is true
  if (status.demo_mode) {
    return (
      <div className="bg-yellow-500 text-black px-4 py-2 text-center relative">
        <div className="flex items-center justify-center gap-2">
          <Info className="w-5 h-5" />
          <span className="font-medium">
            DEMO MODE - This is a demonstration. No real transactions.
          </span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-4 top-1/2 transform -translate-y-1/2"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    );
  }

  // Trading disabled
  if (!status.trading_enabled) {
    return (
      <div className="bg-orange-500 text-white px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Trading is temporarily disabled</span>
        </div>
      </div>
    );
  }

  // Withdrawals disabled
  if (!status.withdrawals_enabled) {
    return (
      <div className="bg-orange-500 text-white px-4 py-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5" />
          <span>Withdrawals are temporarily disabled</span>
        </div>
      </div>
    );
  }

  // No banner needed - production mode, everything enabled
  return null;
};

export default SystemBanner;
