/**
 * WebSocket Service
 * =================
 * Handles real-time connections to the exchange backend.
 */

class WebSocketService {
  constructor() {
    this.connections = {};
    this.listeners = {};
    this.reconnectAttempts = {};
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 3000;
    this.baseUrl = process.env.REACT_APP_WS_URL || 'ws://localhost:8000/ws';
  }

  /**
   * Connect to a WebSocket channel
   */
  connect(channel, params = {}) {
    const key = this._getKey(channel, params);

    if (this.connections[key]?.readyState === WebSocket.OPEN) {
      console.log(`WebSocket already connected: ${key}`);
      return;
    }

    const url = this._buildUrl(channel, params);
    console.log(`WebSocket connecting: ${url}`);

    try {
      const ws = new WebSocket(url);
      this.connections[key] = ws;
      this.reconnectAttempts[key] = 0;

      ws.onopen = () => {
        console.log(`WebSocket connected: ${key}`);
        this.reconnectAttempts[key] = 0;
        this._emit(key, 'connected', { channel, params });
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this._emit(key, 'message', data);

          if (data.type) {
            this._emit(key, data.type, data);
          }
        } catch (error) {
          console.error('WebSocket message parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error(`WebSocket error: ${key}`, error);
        this._emit(key, 'error', error);
      };

      ws.onclose = (event) => {
        console.log(`WebSocket closed: ${key}`, event.code, event.reason);
        this._emit(key, 'disconnected', { code: event.code, reason: event.reason });

        if (this.reconnectAttempts[key] < this.maxReconnectAttempts) {
          this.reconnectAttempts[key]++;
          console.log(`WebSocket reconnecting (${this.reconnectAttempts[key]}/${this.maxReconnectAttempts}): ${key}`);
          setTimeout(() => this.connect(channel, params), this.reconnectDelay);
        }
      };
    } catch (error) {
      console.error(`WebSocket connection error: ${key}`, error);
    }
  }

  /**
   * Disconnect from a WebSocket channel
   */
  disconnect(channel, params = {}) {
    const key = this._getKey(channel, params);
    const ws = this.connections[key];

    if (ws) {
      this.reconnectAttempts[key] = this.maxReconnectAttempts;
      ws.close();
      delete this.connections[key];
      delete this.listeners[key];
      console.log(`WebSocket disconnected: ${key}`);
    }
  }

  /**
   * Subscribe to events on a channel
   */
  subscribe(channel, params, eventType, callback) {
    const key = this._getKey(channel, params);

    if (!this.listeners[key]) {
      this.listeners[key] = {};
    }

    if (!this.listeners[key][eventType]) {
      this.listeners[key][eventType] = [];
    }

    this.listeners[key][eventType].push(callback);

    // Return unsubscribe function
    return () => {
      if (this.listeners[key] && this.listeners[key][eventType]) {
        const index = this.listeners[key][eventType].indexOf(callback);
        if (index > -1) {
          this.listeners[key][eventType].splice(index, 1);
        }
      }
    };
  }

  /**
   * Send message to a channel
   */
  send(channel, params, message) {
    const key = this._getKey(channel, params);
    const ws = this.connections[key];

    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    } else {
      console.warn(`WebSocket not connected: ${key}`);
    }
  }

  /**
   * Check if connected to a channel
   */
  isConnected(channel, params = {}) {
    const key = this._getKey(channel, params);
    return this.connections[key]?.readyState === WebSocket.OPEN;
  }

  /**
   * Disconnect all connections
   */
  disconnectAll() {
    Object.keys(this.connections).forEach(key => {
      this.reconnectAttempts[key] = this.maxReconnectAttempts;
      if (this.connections[key]) {
        this.connections[key].close();
      }
    });
    this.connections = {};
    this.listeners = {};
  }

  // Private methods
  _getKey(channel, params) {
    const paramStr = Object.entries(params || {}).sort().map(([k, v]) => `${k}=${v}`).join('&');
    return paramStr ? `${channel}:${paramStr}` : channel;
  }

  _buildUrl(channel, params) {
    let url = `${this.baseUrl}/${channel}/`;

    if (params && params.symbol) {
      url = `${this.baseUrl}/${channel}/${params.symbol}/`;
    }

    if (channel === 'user') {
      const token = localStorage.getItem('access_token');
      if (token) {
        url += `?token=${token}`;
      }
    }

    return url;
  }

  _emit(key, eventType, data) {
    if (!this.listeners[key] || !this.listeners[key][eventType]) {
      return;
    }

    const callbacks = this.listeners[key][eventType] || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('WebSocket listener error:', error);
      }
    });
  }
}

// Export singleton instance
export const wsService = new WebSocketService();
export default wsService;