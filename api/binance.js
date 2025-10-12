// Binance API Integration
class BinanceAPI {
    constructor() {
        this.baseURL = 'https://api.binance.com';
        this.wsURL = 'wss://stream.binance.com:9443/ws';
        this.subscriptions = new Map();
        this.rateLimiter = new Map();
        this.lastRequest = new Map();
    }
    
    async getTicker(symbol) {
        const endpoint = `/api/v3/ticker/24hr?symbol=${symbol}`;
        return await this.makeRequest('GET', endpoint);
    }
    
    async getKlines(symbol, interval = '1m', limit = 500) {
        const endpoint = `/api/v3/klines?symbol=${symbol}&interval=${interval}&limit=${limit}`;
        return await this.makeRequest('GET', endpoint);
    }
    
    async getDepth(symbol, limit = 20) {
        const endpoint = `/api/v3/depth?symbol=${symbol}&limit=${limit}`;
        return await this.makeRequest('GET', endpoint);
    }
    
    async getTrades(symbol, limit = 500) {
        const endpoint = `/api/v3/trades?symbol=${symbol}&limit=${limit}`;
        return await this.makeRequest('GET', endpoint);
    }
    
    async getExchangeInfo() {
        const endpoint = '/api/v3/exchangeInfo';
        return await this.makeRequest('GET', endpoint);
    }
    
    async get24hrTicker() {
        const endpoint = '/api/v3/ticker/24hr';
        return await this.makeRequest('GET', endpoint);
    }
    
    subscribeToTicker(symbol, callback) {
        const stream = `${symbol.toLowerCase()}@ticker`;
        return this.subscribe(stream, callback);
    }
    
    subscribeToKline(symbol, interval, callback) {
        const stream = `${symbol.toLowerCase()}@kline_${interval}`;
        return this.subscribe(stream, callback);
    }
    
    subscribeToDepth(symbol, callback) {
        const stream = `${symbol.toLowerCase()}@depth`;
        return this.subscribe(stream, callback);
    }
    
    subscribeToTrade(symbol, callback) {
        const stream = `${symbol.toLowerCase()}@trade`;
        return this.subscribe(stream, callback);
    }
    
    subscribe(stream, callback) {
        if (this.subscriptions.has(stream)) {
            this.subscriptions.get(stream).add(callback);
            return;
        }
        
        const ws = new WebSocket(`${this.wsURL}/${stream}`);
        
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            callback(data);
        };
        
        ws.onclose = () => {
            console.log(`WebSocket closed for ${stream}`);
            setTimeout(() => {
                this.subscribe(stream, callback);
            }, 5000);
        };
        
        ws.onerror = (error) => {
            console.error(`WebSocket error for ${stream}:`, error);
        };
        
        this.subscriptions.set(stream, new Set([callback]));
    }
    
    unsubscribe(stream, callback) {
        const callbacks = this.subscriptions.get(stream);
        if (callbacks) {
            callbacks.delete(callback);
        }
    }
    
    async makeRequest(method, endpoint, params = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        if (method === 'GET' && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams(params);
            url += `?${searchParams}`;
        } else if (method === 'POST') {
            options.body = JSON.stringify(params);
        }
        
        // Rate limiting
        await this.checkRateLimit(method);
        
        try {
            const response = await fetch(url, options);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }
    
    async checkRateLimit(method) {
        const now = Date.now();
        const lastRequest = this.lastRequest.get(method) || 0;
        const minInterval = 100; // 100ms between requests
        
        if (now - lastRequest < minInterval) {
            await new Promise(resolve => setTimeout(resolve, minInterval - (now - lastRequest)));
        }
        
        this.lastRequest.set(method, now);
    }
    
    // Helper methods
    formatPrice(price) {
        return parseFloat(price).toFixed(2);
    }
    
    formatVolume(volume) {
        if (volume >= 1000000) {
            return (volume / 1000000).toFixed(2) + 'M';
        } else if (volume >= 1000) {
            return (volume / 1000).toFixed(2) + 'K';
        }
        return volume.toFixed(2);
    }
    
    formatPercent(percent) {
        return parseFloat(percent).toFixed(2) + '%';
    }
    
    // Market data aggregation
    async getMarketData(symbol) {
        const [ticker, klines, depth] = await Promise.all([
            this.getTicker(symbol),
            this.getKlines(symbol),
            this.getDepth(symbol)
        ]);
        
        return {
            symbol,
            price: parseFloat(ticker.lastPrice),
            change: parseFloat(ticker.priceChange),
            changePercent: parseFloat(ticker.priceChangePercent),
            volume: parseFloat(ticker.volume),
            high: parseFloat(ticker.highPrice),
            low: parseFloat(ticker.lowPrice),
            open: parseFloat(ticker.openPrice),
            klines: klines.map(k => ({
                time: parseInt(k[0]),
                open: parseFloat(k[1]),
                high: parseFloat(k[2]),
                low: parseFloat(k[3]),
                close: parseFloat(k[4]),
                volume: parseFloat(k[5])
            })),
            orderbook: {
                bids: depth.bids.map(b => ({
                    price: parseFloat(b[0]),
                    amount: parseFloat(b[1])
                })),
                asks: depth.asks.map(a => ({
                    price: parseFloat(a[0]),
                    amount: parseFloat(a[1])
                }))
            }
        };
    }
    
    // Technical indicators
    calculateRSI(prices, period = 14) {
        if (prices.length < period + 1) return 50;
        
        let gains = 0;
        let losses = 0;
        
        for (let i = 1; i <= period; i++) {
            const change = prices[i] - prices[i - 1];
            if (change >= 0) {
                gains += change;
            } else {
                losses -= change;
            }
        }
        
        const avgGain = gains / period;
        const avgLoss = losses / period;
        const rs = avgGain / avgLoss;
        
        return 100 - (100 / (1 + rs));
    }
    
    calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
        const emaFast = this.calculateEMA(prices, fast);
        const emaSlow = this.calculateEMA(prices, slow);
        const macdLine = emaFast - emaSlow;
        const signalLine = this.calculateEMA([macdLine], signal);
        
        return {
            macd: macdLine,
            signal: signalLine,
            histogram: macdLine - signalLine
        };
    }
    
    calculateEMA(prices, period) {
        const multiplier = 2 / (period + 1);
        let ema = prices[0];
        
        for (let i = 1; i < prices.length; i++) {
            ema = (prices[i] * multiplier) + (ema * (1 - multiplier));
        }
        
        return ema;
    }
    
    calculateBollingerBands(prices, period = 20, stdDev = 2) {
        const sma = this.calculateSMA(prices, period);
        const variance = this.calculateVariance(prices, period, sma);
        const standardDeviation = Math.sqrt(variance);
        
        return {
            upper: sma + (standardDeviation * stdDev),
            middle: sma,
            lower: sma - (standardDeviation * stdDev)
        };
    }
    
    calculateSMA(prices, period) {
        const sum = prices.slice(-period).reduce((a, b) => a + b, 0);
        return sum / period;
    }
    
    calculateVariance(prices, period, mean) {
        const variance = prices.slice(-period).reduce((sum, price) => {
            return sum + Math.pow(price - mean, 2);
        }, 0);
        return variance / period;
    }
}

// Initialize Binance API
window.binanceAPI = new BinanceAPI();
