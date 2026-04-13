import React, { useState, useEffect } from 'react';
import { wsService } from '../../services/websocket';

const ConnectionStatus = ({ channel, params = {} }) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const checkConnection = () => {
      setIsConnected(wsService.isConnected(channel, params));
    };

    // Check immediately
    checkConnection();

    // Check periodically
    const interval = setInterval(checkConnection, 1000);

    return () => clearInterval(interval);
  }, [channel, params]);

  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'}`} />
      <span className="text-xs text-exchange-muted">
        {isConnected ? 'Live' : 'Connecting...'}
      </span>
    </div>
  );
};

export default ConnectionStatus;