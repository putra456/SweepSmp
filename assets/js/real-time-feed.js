// Real-time Feed Service - Enterprise Real-time Data Streaming
class RealTimeFeedService {
    constructor() {
        this.feeds = new Map();
        this.subscribers = new Map();
        this.buffer = new Map();
        this.connections = new Map();
        this.reconnectAttempts = new Map();
        
        this.init();
    }
    
    async init() {
        console.log('📡 Initializing Real-time Feed Service');
        
        // Initialize WebSocket connections
        await this.initializeConnections();
        
        // Setup feed handlers
        this.setupFeedHandlers();
        
        // Start buffer management
        this.startBufferManagement();
        
        // Setup heartbeat monitoring
        this.setupHeartbeatMonitoring();
        
        console.log('✅ Real-time Feed Service initialized');
    }
    
    async initializeConnections() {
        // Initialize different feed connections
        const feedConfigs = [
            {
                name: 'market',
                url: 'wss://stream.rayzw2e.com/market',
                reconnectInterval: 5000,
                maxReconnectAttempts: 10
            },
            {
                name: 'trades',
                url: 'wss://stream.rayzw2e.com/trades',
                reconnectInterval: 3000,
                maxReconnectAttempts: 15
            },
            {
                name: 'quotes',
                url: 'wss://stream.rayzw2e.com/quotes',
                reconnectInterval: 2000,
                maxReconnectAttempts: 20
            },
            {
                name: 'news',
                url: 'wss://stream.rayzw2e.com/news',
                reconnectInterval: 10000,
                maxReconnectAttempts: 5
            }
        ];
        
        for (const config of feedConfigs) {
            await this.connectFeed(config);
        }
    }
    
    async connectFeed(config) {
        try {
            const ws = new WebSocket(config.url);
            
            ws.onopen = () => {
                console.log(`✅ Connected to ${config.name} feed`);
                this.connections.set(config.name, ws);
                this.reconnectAttempts.set(config.name, 0);
                
                // Subscribe to default channels
                this.subscribeToDefaultChannels(ws, config.name);
            };
            
            ws.onmessage = (event) => {
                this.handleMessage(config.name, event.data);
            };
            
            ws.onclose = () => {
                console.log(`❌ Disconnected from ${config.name} feed`);
                this.connections.delete(config.name);
                this.attemptReconnect(config);
            };
            
            ws.onerror = (error) => {
                console.error(`❌ Error in ${config.name} feed:`, error);
            };
            
            this.feeds.set(config.name, {
                websocket: ws,
                config,
                status: 'connecting',
                lastMessage: null,
                messageCount: 0
            });
            
        } catch (error) {
            console.error(`❌ Failed to connect to ${config.name} feed:`, error);
            this.attemptReconnect(config);
        }
    }
    
    async attemptReconnect(config) {
        const attempts = this.reconnectAttempts.get(config.name) || 0;
        
        if (attempts >= config.maxReconnectAttempts) {
            console.error(`❌ Max reconnect attempts reached for ${config.name} feed`);
            return;
        }
        
        this.reconnectAttempts.set(config.name, attempts + 1);
        
        console.log(`🔄 Attempting to reconnect to ${config.name} feed (${attempts + 1}/${config.maxReconnectAttempts})`);
        
        setTimeout(() => {
            this.connectFeed(config);
        }, config.reconnectInterval);
    }
    
    subscribeToDefaultChannels(ws, feedName) {
        const subscriptions = {
            market: ['BTCUSDT', 'ETHUSDT', 'XAUUSD', 'EURUSD', 'SPY'],
            trades: ['executed', 'filled', 'cancelled'],
            quotes: ['bid', 'ask', 'spread'],
            news: ['market', 'analysis', 'regulatory']
        };
        
        const channels = subscriptions[feedName] || [];
        
        channels.forEach(channel => {
            ws.send(JSON.stringify({
                action: 'subscribe',
                channel: channel
            }));
        });
    }
    
    setupFeedHandlers() {
        // Setup message handlers for different feed types
        this.handlers = {
            market: this.handleMarketMessage.bind(this),
            trades: this.handleTradeMessage.bind(this),
            quotes: this.handleQuoteMessage.bind(this),
            news: this.handleNewsMessage.bind(this)
        };
    }
    
    handleMessage(feedName, data) {
        try {
            const message = JSON.parse(data);
            const feed = this.feeds.get(feedName);
            
            if (feed) {
                feed.lastMessage = message;
                feed.messageCount++;
                feed.status = 'connected';
            }
            
            // Route to appropriate handler
            const handler = this.handlers[feedName];
            if (handler) {
                handler(message);
            }
            
            // Add to buffer
            this.addToBuffer(feedName, message);
            
            // Notify subscribers
            this.notifySubscribers(feedName, message);
            
        } catch (error) {
            console.error(`❌ Error handling message from ${feedName}:`, error);
        }
    }
    
    handleMarketMessage(message) {
        // Handle market data messages
        if (message.type === 'price') {
            this.updateMarketPrice(message);
        } else if (message.type === 'volume') {
            this.updateMarketVolume(message);
        } else if (message.type === 'depth') {
            this.updateMarketDepth(message);
        }
        
        // Emit market event
        if (window.enterpriseCore) {
            window.enterpriseCore.services.get('events').emit('market:update', message);
        }
    }
    
    handleTradeMessage(message) {
        // Handle trade execution messages
        if (message.type === 'executed') {
            this.handleTradeExecuted(message);
        } else if (message.type === 'filled') {
            this.handleTradeFilled(message);
        } else if (message.type === 'cancelled') {
            this.handleTradeCancelled(message);
        }
        
        // Emit trade event
        if (window.enterpriseCore) {
            window.enterpriseCore.services.get('events').emit('trade:update', message);
        }
    }
    
    handleQuoteMessage(message) {
        // Handle quote messages
        if (message.type === 'bid') {
            this.updateBidQuote(message);
        } else if (message.type === 'ask') {
            this.updateAskQuote(message);
        } else if (message.type === 'spread') {
            this.updateSpread(message);
        }
        
        // Emit quote event
        if (window.enterpriseCore) {
            window.enterpriseCore.services.get('events').emit('quote:update', message);
        }
    }
    
    handleNewsMessage(message) {
        // Handle news messages
        if (message.type === 'breaking') {
            this.handleBreakingNews(message);
        } else if (message.type === 'analysis') {
            this.handleAnalysisNews(message);
        } else if (message.type === 'regulatory') {
            this.handleRegulatoryNews(message);
        }
        
        // Emit news event
        if (window.enterpriseCore) {
            window.enterpriseCore.services.get('events').emit('news:update', message);
        }
    }
    
    updateMarketPrice(message) {
        const { symbol, price, change, changePercent, timestamp } = message;
        
        // Update market data in multi-market engine
        if (window.multiMarketEngine) {
            const existingData = window.multiMarketEngine.realTimeData.get(symbol);
            const updatedData = {
                ...existingData,
                price,
                change,
                changePercent,
                timestamp
            };
            
            window.multiMarketEngine.realTimeData.set(symbol, updatedData);
        }
        
        // Update UI
        this.updatePriceUI(symbol, price, changePercent);
    }
    
    updateMarketVolume(message) {
        const { symbol, volume, timestamp } = message;
        
        // Update volume data
        if (window.multiMarketEngine) {
            const existingData = window.multiMarketEngine.realTimeData.get(symbol);
            const updatedData = {
                ...existingData,
                volume,
                timestamp
            };
            
            window.multiMarketEngine.realTimeData.set(symbol, updatedData);
        }
    }
    
    updateMarketDepth(message) {
        const { symbol, bids, asks, timestamp } = message;
        
        // Update order book
        if (window.multiMarketEngine) {
            const existingData = window.multiMarketEngine.realTimeData.get(symbol);
            const updatedData = {
                ...existingData,
                orderbook: { bids, asks },
                timestamp
            };
            
            window.multiMarketEngine.realTimeData.set(symbol, updatedData);
        }
        
        // Update order book UI
        this.updateOrderBookUI(symbol, bids, asks);
    }
    
    handleTradeExecuted(message) {
        const { id, symbol, type, quantity, price, timestamp } = message;
        
        // Show notification
        if (window.enterpriseCore) {
            window.enterpriseCore.services.get('notifications').show(
                `Trade executed: ${type} ${quantity} ${symbol} at ${price}`,
                'success'
            );
        }
        
        // Update trading engine
        if (window.tradingEngine) {
            window.tradingEngine.handleTradeExecuted(message);
        }
    }
    
    handleTradeFilled(message) {
        const { id, symbol, filledQuantity, remainingQuantity, timestamp } = message;
        
        // Update trade status
        if (window.tradingEngine) {
            window.tradingEngine.handleTradeFilled(message);
        }
    }
    
    handleTradeCancelled(message) {
        const { id, symbol, reason, timestamp } = message;
        
        // Show notification
        if (window.enterpriseCore) {
            window.enterpriseCore.services.get('notifications').show(
                `Trade cancelled: ${reason}`,
                'warning'
            );
        }
        
        // Update trading engine
        if (window.tradingEngine) {
            window.tradingEngine.handleTradeCancelled(message);
        }
    }
    
    updateBidQuote(message) {
        const { symbol, price, size, timestamp } = message;
        
        // Update bid quote
        this.updateQuoteUI(symbol, 'bid', price, size);
    }
    
    updateAskQuote(message) {
        const { symbol, price, size, timestamp } = message;
        
        // Update ask quote
        this.updateQuoteUI(symbol, 'ask', price, size);
    }
    
    updateSpread(message) {
        const { symbol, spread, timestamp } = message;
        
        // Update spread
        this.updateSpreadUI(symbol, spread);
    }
    
    handleBreakingNews(message) {
        const { title, content, severity, timestamp } = message;
        
        // Show breaking news notification
        if (window.enterpriseCore) {
            window.enterpriseCore.services.get('notifications').show(
                `Breaking: ${title}`,
                severity.toLowerCase()
            );
        }
        
        // Update news feed
        this.updateNewsFeedUI(message);
    }
    
    handleAnalysisNews(message) {
        const { title, content, analyst, timestamp } = message;
        
        // Update analysis feed
        this.updateAnalysisFeedUI(message);
    }
    
    handleRegulatoryNews(message) {
        const { title, content, regulator, timestamp } = message;
        
        // Update regulatory feed
        this.updateRegulatoryFeedUI(message);
    }
    
    addToBuffer(feedName, message) {
        if (!this.buffer.has(feedName)) {
            this.buffer.set(feedName, []);
        }
        
        const feedBuffer = this.buffer.get(feedName);
        feedBuffer.push({
            ...message,
            timestamp: Date.now()
        });
        
        // Limit buffer size
        const maxBufferSize = 1000;
        if (feedBuffer.length > maxBufferSize) {
            feedBuffer.splice(0, feedBuffer.length - maxBufferSize);
        }
    }
    
    startBufferManagement() {
        // Clean old messages from buffer
        setInterval(() => {
            this.cleanBuffer();
        }, 60000); // Every minute
    }
    
    cleanBuffer() {
        const maxAge = 5 * 60 * 1000; // 5 minutes
        const now = Date.now();
        
        for (const [feedName, messages] of this.buffer) {
            const filteredMessages = messages.filter(msg => 
                now - msg.timestamp < maxAge
            );
            
            this.buffer.set(feedName, filteredMessages);
        }
    }
    
    setupHeartbeatMonitoring() {
        // Send heartbeat to maintain connection
        setInterval(() => {
            this.sendHeartbeat();
        }, 30000); // Every 30 seconds
        
        // Check connection health
        setInterval(() => {
            this.checkConnectionHealth();
        }, 10000); // Every 10 seconds
    }
    
    sendHeartbeat() {
        for (const [feedName, feed] of this.feeds) {
            if (feed.websocket && feed.websocket.readyState === WebSocket.OPEN) {
                feed.websocket.send(JSON.stringify({
                    type: 'heartbeat',
                    timestamp: Date.now()
                }));
            }
        }
    }
    
    checkConnectionHealth() {
        for (const [feedName, feed] of this.feeds) {
            const timeSinceLastMessage = Date.now() - (feed.lastMessage?.timestamp || 0);
            
            if (timeSinceLastMessage > 60000) { // 1 minute
                console.warn(`⚠️ No message from ${feedName} feed for 1 minute`);
                
                // Attempt to reconnect
                if (feed.websocket && feed.websocket.readyState !== WebSocket.OPEN) {
                    this.attemptReconnect(feed.config);
                }
            }
        }
    }
    
    subscribe(feedName, channel, callback) {
        const key = `${feedName}:${channel}`;
        
        if (!this.subscribers.has(key)) {
            this.subscribers.set(key, new Set());
        }
        
        this.subscribers.get(key).add(callback);
        
        // Send subscription message
        const feed = this.feeds.get(feedName);
        if (feed && feed.websocket && feed.websocket.readyState === WebSocket.OPEN) {
            feed.websocket.send(JSON.stringify({
                action: 'subscribe',
                channel: channel
            }));
        }
        
        // Return unsubscribe function
        return () => {
            const subscribers = this.subscribers.get(key);
            if (subscribers) {
                subscribers.delete(callback);
            }
        };
    }
    
    unsubscribe(feedName, channel, callback) {
        const key = `${feedName}:${channel}`;
        const subscribers = this.subscribers.get(key);
        
        if (subscribers) {
            subscribers.delete(callback);
            
            // If no more subscribers, send unsubscribe message
            if (subscribers.size === 0) {
                const feed = this.feeds.get(feedName);
                if (feed && feed.websocket && feed.websocket.readyState === WebSocket.OPEN) {
                    feed.websocket.send(JSON.stringify({
                        action: 'unsubscribe',
                        channel: channel
                    }));
                }
            }
        }
    }
    
    notifySubscribers(feedName, message) {
        const channel = message.channel || 'default';
        const key = `${feedName}:${channel}`;
        const subscribers = this.subscribers.get(key);
        
        if (subscribers) {
            subscribers.forEach(callback => {
                try {
                    callback(message);
                } catch (error) {
                    console.error('Error in subscriber callback:', error);
                }
            });
        }
    }
    
    updatePriceUI(symbol, price, changePercent) {
        // Update price elements
        const priceElements = document.querySelectorAll(`[data-price="${symbol}"]`);
        priceElements.forEach(element => {
            element.textContent = this.formatPrice(price);
            element.className = changePercent >= 0 ? 'price-positive' : 'price-negative';
        });
        
        // Update change elements
        const changeElements = document.querySelectorAll(`[data-change="${symbol}"]`);
        changeElements.forEach(element => {
            const sign = changePercent >= 0 ? '+' : '';
            element.textContent = `${sign}${changePercent.toFixed(2)}%`;
            element.className = changePercent >= 0 ? 'change-positive' : 'change-negative';
        });
    }
    
    updateOrderBookUI(symbol, bids, asks) {
        // Update order book display
        const bidsContainer = document.getElementById(`${symbol}-bids`);
        const asksContainer = document.getElementById(`${symbol}-asks`);
        
        if (bidsContainer) {
            bidsContainer.innerHTML = bids.slice(0, 10).map(bid => `
                <div class="order-row bid">
                    <span class="price">${this.formatPrice(bid.price)}</span>
                    <span class="size">${this.formatSize(bid.size)}</span>
                </div>
            `).join('');
        }
        
        if (asksContainer) {
            asksContainer.innerHTML = asks.slice(0, 10).map(ask => `
                <div class="order-row ask">
                    <span class="price">${this.formatPrice(ask.price)}</span>
                    <span class="size">${this.formatSize(ask.size)}</span>
                </div>
            `).join('');
        }
    }
    
    updateQuoteUI(symbol, type, price, size) {
        const element = document.getElementById(`${symbol}-${type}`);
        if (element) {
            element.innerHTML = `
                <span class="price">${this.formatPrice(price)}</span>
                <span class="size">${this.formatSize(size)}</span>
            `;
        }
    }
    
    updateSpreadUI(symbol, spread) {
        const element = document.getElementById(`${symbol}-spread`);
        if (element) {
            element.textContent = this.formatPrice(spread);
        }
    }
    
    updateNewsFeedUI(message) {
        const newsFeed = document.getElementById('newsFeed');
        if (newsFeed) {
            const newsItem = document.createElement('div');
            newsItem.className = 'news-item breaking';
            newsItem.innerHTML = `
                <div class="news-header">
                    <span class="news-title">${message.title}</span>
                    <span class="news-time">${new Date(message.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="news-content">${message.content}</div>
            `;
            
            newsFeed.insertBefore(newsItem, newsFeed.firstChild);
            
            // Limit news items
            while (newsFeed.children.length > 10) {
                newsFeed.removeChild(newsFeed.lastChild);
            }
        }
    }
    
    updateAnalysisFeedUI(message) {
        const analysisFeed = document.getElementById('analysisFeed');
        if (analysisFeed) {
            const analysisItem = document.createElement('div');
            analysisItem.className = 'news-item analysis';
            analysisItem.innerHTML = `
                <div class="news-header">
                    <span class="news-title">${message.title}</span>
                    <span class="news-analyst">${message.analyst}</span>
                </div>
                <div class="news-content">${message.content}</div>
            `;
            
            analysisFeed.insertBefore(analysisItem, analysisFeed.firstChild);
            
            // Limit analysis items
            while (analysisFeed.children.length > 5) {
                analysisFeed.removeChild(analysisFeed.lastChild);
            }
        }
    }
    
    updateRegulatoryFeedUI(message) {
        const regulatoryFeed = document.getElementById('regulatoryFeed');
        if (regulatoryFeed) {
            const regulatoryItem = document.createElement('div');
            regulatoryItem.className = 'news-item regulatory';
            regulatoryItem.innerHTML = `
                <div class="news-header">
                    <span class="news-title">${message.title}</span>
                    <span class="news-regulator">${message.regulator}</span>
                </div>
                <div class="news-content">${message.content}</div>
            `;
            
            regulatoryFeed.insertBefore(regulatoryItem, regulatoryFeed.firstChild);
            
            // Limit regulatory items
            while (regulatoryFeed.children.length > 3) {
                regulatoryFeed.removeChild(regulatoryFeed.lastChild);
            }
        }
    }
    
    formatPrice(price) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    }
    
    formatSize(size) {
        if (size >= 1000000) {
            return (size / 1000000).toFixed(2) + 'M';
        } else if (size >= 1000) {
            return (size / 1000).toFixed(2) + 'K';
        }
        return size.toFixed(2);
    }
    
    // Public API
    getConnectionStatus(feedName) {
        const feed = this.feeds.get(feedName);
        return feed ? feed.status : 'disconnected';
    }
    
    getBuffer(feedName, limit = 100) {
        const messages = this.buffer.get(feedName) || [];
        return messages.slice(-limit);
    }
    
    getFeedStats(feedName) {
        const feed = this.feeds.get(feedName);
        if (!feed) return null;
        
        return {
            status: feed.status,
            messageCount: feed.messageCount,
            lastMessage: feed.lastMessage,
            reconnectAttempts: this.reconnectAttempts.get(feedName) || 0
        };
    }
    
    getAllFeedStats() {
        const stats = {};
        for (const [feedName] of this.feeds) {
            stats[feedName] = this.getFeedStats(feedName);
        }
        return stats;
    }
    
    async subscribeToSymbol(symbol, callback) {
        return this.subscribe('market', symbol, callback);
    }
    
    async unsubscribeFromSymbol(symbol, callback) {
        return this.unsubscribe('market', symbol, callback);
    }
    
    async subscribeToTrades(callback) {
        return this.subscribe('trades', 'executed', callback);
    }
    
    async subscribeToNews(callback) {
        return this.subscribe('news', 'breaking', callback);
    }
}

// Initialize Real-time Feed Service
window.realTimeFeedService = new RealTimeFeedService();
