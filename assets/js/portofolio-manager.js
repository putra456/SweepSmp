// Portfolio Manager - Enterprise Portfolio Management
class PortfolioManager {
    constructor() {
        this.portfolios = new Map();
        this.currentPortfolio = null;
        this.performance = new Map();
        this.allocations = new Map();
        this.rebalancing = new Map();
        
        this.init();
    }
    
    async init() {
        console.log('💼 Initializing Portfolio Manager');
        
        // Load portfolios
        await this.loadPortfolios();
        
        // Initialize performance tracking
        this.initializePerformanceTracking();
        
        // Setup rebalancing
        this.setupRebalancing();
        
        // Load allocation strategies
        await this.loadAllocationStrategies();
        
        console.log('✅ Portfolio Manager initialized');
    }
    
    async loadPortfolios() {
        try {
            // Load user portfolios
            const response = await fetch('/api/portfolios');
            const portfolios = await response.json();
            
            for (const portfolio of portfolios) {
                this.portfolios.set(portfolio.id, portfolio);
            }
            
            // Set current portfolio
            if (portfolios.length > 0) {
                this.currentPortfolio = portfolios[0];
            }
            
        } catch (error) {
            console.warn('Using default portfolio');
            this.createDefaultPortfolio();
        }
    }
    
    createDefaultPortfolio() {
        const defaultPortfolio = {
            id: 'default',
            name: 'Default Portfolio',
            description: 'Default trading portfolio',
            currency: 'USD',
            totalValue: 100000,
            cash: 100000,
            positions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.portfolios.set(defaultPortfolio.id, defaultPortfolio);
        this.currentPortfolio = defaultPortfolio;
    }
    
    initializePerformanceTracking() {
        // Track portfolio performance
        setInterval(() => {
            this.updatePerformance();
        }, 5000);
        
        // Calculate daily performance
        setInterval(() => {
            this.calculateDailyPerformance();
        }, 86400000); // Once per day
    }
    
    setupRebalancing() {
        // Check for rebalancing opportunities
        setInterval(() => {
            this.checkRebalancing();
        }, 3600000); // Once per hour
    }
    
    async loadAllocationStrategies() {
        // Load allocation strategies
        this.allocations.set('conservative', {
            name: 'Conservative',
            description: 'Low risk, stable returns',
            targetAllocations: {
                stocks: 0.4,
                bonds: 0.4,
                commodities: 0.1,
                cash: 0.1
            },
            rebalanceThreshold: 0.05
        });
        
        this.allocations.set('balanced', {
            name: 'Balanced',
            description: 'Moderate risk, balanced growth',
            targetAllocations: {
                stocks: 0.6,
                bonds: 0.3,
                commodities: 0.05,
                cash: 0.05
            },
            rebalanceThreshold: 0.1
        });
        
        this.allocations.set('aggressive', {
            name: 'Aggressive',
            description: 'High risk, high returns',
            targetAllocations: {
                stocks: 0.8,
                bonds: 0.1,
                commodities: 0.05,
                cash: 0.05
            },
            rebalanceThreshold: 0.15
        });
    }
    
    async getCurrentPortfolio() {
        if (!this.currentPortfolio) {
            throw new Error('No current portfolio set');
        }
        
        // Update portfolio with current market data
        await this.updatePortfolioValues(this.currentPortfolio);
        
        return this.currentPortfolio;
    }
    
    async updatePortfolioValues(portfolio) {
        if (!portfolio.positions) return;
        
        let totalValue = portfolio.cash || 0;
        
        for (const position of portfolio.positions) {
            const currentPrice = await this.getCurrentPrice(position.symbol);
            position.currentPrice = currentPrice;
            position.currentValue = position.quantity * currentPrice;
            position.unrealizedPnL = position.currentValue - (position.avgPrice * position.quantity);
            position.unrealizedPnLPercent = (position.unrealizedPnL / (position.avgPrice * position.quantity)) * 100;
            
            totalValue += position.currentValue;
        }
        
        portfolio.totalValue = totalValue;
        portfolio.updatedAt = new Date().toISOString();
    }
    
    async getCurrentPrice(symbol) {
        try {
            // Get current price from market data
            const marketModule = window.multiMarketEngine;
            if (marketModule) {
                const data = marketModule.realTimeData.get(symbol);
                if (data) {
                    return data.price;
                }
            }
            
            // Fallback to mock price
            return this.getMockPrice(symbol);
            
        } catch (error) {
            console.error('Error getting current price:', error);
            return this.getMockPrice(symbol);
        }
    }
    
    getMockPrice(symbol) {
        // Generate mock price based on symbol
        const basePrices = {
            'BTCUSDT': 43000,
            'ETHUSDT': 2245,
            'XAUUSD': 2045,
            'SPY': 450,
            'QQQ': 380,
            'AAPL': 178,
            'GOOGL': 138,
            'MSFT': 378
        };
        
        return basePrices[symbol] || 100 + Math.random() * 1000;
    }
    
    async addPosition(symbol, quantity, type, price) {
        if (!this.currentPortfolio) {
            throw new Error('No current portfolio');
        }
        
        const portfolio = this.currentPortfolio;
        const existingPosition = portfolio.positions.find(p => p.symbol === symbol);
        
        if (existingPosition) {
            // Update existing position
            const totalQuantity = existingPosition.quantity + (type === 'BUY' ? quantity : -quantity);
            const totalCost = (existingPosition.avgPrice * existingPosition.quantity) + (price * quantity);
            
            existingPosition.quantity = totalQuantity;
            existingPosition.avgPrice = totalCost / totalQuantity;
            existingPosition.type = type;
            
            // Remove position if quantity is zero
            if (existingPosition.quantity === 0) {
                portfolio.positions = portfolio.positions.filter(p => p.symbol !== symbol);
            }
        } else {
            // Add new position
            const newPosition = {
                id: Date.now().toString(),
                symbol,
                quantity,
                avgPrice: price,
                currentPrice: price,
                type,
                createdAt: new Date().toISOString()
            };
            
            portfolio.positions.push(newPosition);
        }
        
        // Update cash
        const cost = quantity * price;
        portfolio.cash += type === 'BUY' ? -cost : cost;
        
        // Update portfolio
        await this.updatePortfolioValues(portfolio);
        
        // Save portfolio
        await this.savePortfolio(portfolio);
        
        // Emit event
        if (window.enterpriseCore) {
            window.enterpriseCore.services.get('events').emit('portfolio:positionAdded', {
                portfolio: portfolio.id,
                symbol,
                quantity,
                type,
                price
            });
        }
        
        return portfolio;
    }
    
    async removePosition(symbol, quantity) {
        return await this.addPosition(symbol, quantity, 'SELL', await this.getCurrentPrice(symbol));
    }
    
    async closePosition(symbol) {
        const portfolio = this.currentPortfolio;
        const position = portfolio.positions.find(p => p.symbol === symbol);
        
        if (!position) {
            throw new Error(`Position ${symbol} not found`);
        }
        
        const currentPrice = await this.getCurrentPrice(symbol);
        return await this.removePosition(symbol, position.quantity);
    }
    
    async getPerformance(portfolioId, period = '1M') {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) {
            throw new Error(`Portfolio ${portfolioId} not found`);
        }
        
        const performance = this.performance.get(portfolioId) || {};
        
        // Calculate performance metrics
        const metrics = await this.calculatePerformanceMetrics(portfolio, period);
        
        // Store performance
        this.performance.set(portfolioId, {
            ...performance,
            [period]: metrics,
            lastUpdated: Date.now()
        });
        
        return metrics;
    }
    
    async calculatePerformanceMetrics(portfolio, period) {
        const now = Date.now();
        const periodMs = this.getPeriodMs(period);
        const startTime = now - periodMs;
        
        // Get historical portfolio values
        const historicalValues = await this.getHistoricalValues(portfolio.id, startTime, now);
        
        if (historicalValues.length < 2) {
            return this.getDefaultPerformanceMetrics();
        }
        
        const startValue = historicalValues[0].value;
        const endValue = historicalValues[historicalValues.length - 1].value;
        const totalReturn = (endValue - startValue) / startValue;
        
        // Calculate daily returns
        const dailyReturns = [];
        for (let i = 1; i < historicalValues.length; i++) {
            const dailyReturn = (historicalValues[i].value - historicalValues[i-1].value) / historicalValues[i-1].value;
            dailyReturns.push(dailyReturn);
        }
        
        // Calculate metrics
        const volatility = this.calculateVolatility(dailyReturns);
        const sharpeRatio = this.calculateSharpeRatio(totalReturn, volatility, period);
        const maxDrawdown = this.calculateMaxDrawdown(historicalValues);
        const winRate = this.calculateWinRate(dailyReturns);
        
        return {
            totalReturn,
            annualizedReturn: this.annualizeReturn(totalReturn, period),
            volatility,
            sharpeRatio,
            maxDrawdown,
            winRate,
            period,
            startValue,
            endValue,
            startTime,
            endTime: now
        };
    }
    
    getPeriodMs(period) {
        const periods = {
            '1D': 86400000,
            '1W': 604800000,
            '1M': 2592000000,
            '3M': 7776000000,
            '6M': 15552000000,
            '1Y': 31536000000
        };
        
        return periods[period] || periods['1M'];
    }
    
    async getHistoricalValues(portfolioId, startTime, endTime) {
        // Generate mock historical values
        const values = [];
        const days = Math.floor((endTime - startTime) / 86400000);
        let currentValue = 100000;
        
        for (let i = 0; i < days; i++) {
            const return_ = (Math.random() - 0.5) * 0.02; // ±1% daily
            currentValue *= (1 + return_);
            
            values.push({
                timestamp: startTime + (i * 86400000),
                value: currentValue
            });
        }
        
        return values;
    }
    
    calculateVolatility(returns) {
        if (returns.length < 2) return 0;
        
        const mean = returns.reduce((sum, r) => sum + r, 0) / returns.length;
        const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
        
        return Math.sqrt(variance) * Math.sqrt(252); // Annualized
    }
    
    calculateSharpeRatio(totalReturn, volatility, period) {
        const riskFreeRate = 0.02; // 2% annual risk-free rate
        const periodsPerYear = this.getPeriodsPerYear(period);
        const annualizedReturn = this.annualizeReturn(totalReturn, period);
        
        return (annualizedReturn - riskFreeRate) / volatility;
    }
    
    annualizeReturn(totalReturn, period) {
        const periodsPerYear = this.getPeriodsPerYear(period);
        return Math.pow(1 + totalReturn, periodsPerYear) - 1;
    }
    
    getPeriodsPerYear(period) {
        const periods = {
            '1D': 252,
            '1W': 52,
            '1M': 12,
            '3M': 4,
            '6M': 2,
            '1Y': 1
        };
        
        return periods[period] || 12;
    }
    
    calculateMaxDrawdown(values) {
        let maxDrawdown = 0;
        let peak = values[0].value;
        
        for (const value of values) {
            if (value.value > peak) {
                peak = value.value;
            }
            
            const drawdown = (peak - value.value) / peak;
            maxDrawdown = Math.max(maxDrawdown, drawdown);
        }
        
        return maxDrawdown;
    }
    
    calculateWinRate(returns) {
        if (returns.length === 0) return 0;
        
        const winningDays = returns.filter(r => r > 0).length;
        return winningDays / returns.length;
    }
    
    getDefaultPerformanceMetrics() {
        return {
            totalReturn: 0,
            annualizedReturn: 0,
            volatility: 0,
            sharpeRatio: 0,
            maxDrawdown: 0,
            winRate: 0,
            period: '1M',
            startValue: 100000,
            endValue: 100000,
            startTime: Date.now(),
            endTime: Date.now()
        };
    }
    
    async getAllocation(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) {
            throw new Error(`Portfolio ${portfolioId} not found`);
        }
        
        const allocation = {
            byAsset: {},
            bySector: {},
            byRegion: {},
            byCurrency: {}
        };
        
        // Calculate allocation by asset
        for (const position of portfolio.positions) {
            const weight = position.currentValue / portfolio.totalValue;
            allocation.byAsset[position.symbol] = weight;
        }
        
        // Calculate allocation by sector (mock data)
        allocation.bySector = {
            'Technology': 0.35,
            'Healthcare': 0.15,
            'Finance': 0.20,
            'Energy': 0.10,
            'Consumer': 0.12,
            'Other': 0.08
        };
        
        // Calculate allocation by region (mock data)
        allocation.byRegion = {
            'US': 0.60,
            'Europe': 0.20,
            'Asia': 0.15,
            'Other': 0.05
        };
        
        return allocation;
    }
    
    async rebalancePortfolio(portfolioId, targetAllocation) {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) {
            throw new Error(`Portfolio ${portfolioId} not found`);
        }
        
        const currentAllocation = await this.getAllocation(portfolioId);
        const rebalancingTrades = [];
        
        // Calculate required trades
        for (const [asset, targetWeight] of Object.entries(targetAllocation)) {
            const currentWeight = currentAllocation.byAsset[asset] || 0;
            const weightDiff = targetWeight - currentWeight;
            
            if (Math.abs(weightDiff) > 0.01) { // 1% threshold
                const targetValue = portfolio.totalValue * targetWeight;
                const currentValue = portfolio.totalValue * currentWeight;
                const tradeValue = targetValue - currentValue;
                
                if (tradeValue > 0) {
                    // Buy
                    const currentPrice = await this.getCurrentPrice(asset);
                    const quantity = tradeValue / currentPrice;
                    
                    rebalancingTrades.push({
                        symbol: asset,
                        type: 'BUY',
                        quantity,
                        price: currentPrice,
                        value: tradeValue
                    });
                } else {
                    // Sell
                    const position = portfolio.positions.find(p => p.symbol === asset);
                    if (position) {
                        const quantity = Math.abs(tradeValue) / position.currentPrice;
                        
                        rebalancingTrades.push({
                            symbol: asset,
                            type: 'SELL',
                            quantity: Math.min(quantity, position.quantity),
                            price: position.currentPrice,
                            value: Math.abs(tradeValue)
                        });
                    }
                }
            }
        }
        
        // Execute rebalancing trades
        for (const trade of rebalancingTrades) {
            await this.addPosition(trade.symbol, trade.quantity, trade.type, trade.price);
        }
        
        // Store rebalancing record
        this.rebalancing.set(portfolioId, {
            timestamp: Date.now(),
            targetAllocation,
            trades: rebalancingTrades,
            totalValue: rebalancingTrades.reduce((sum, trade) => sum + Math.abs(trade.value), 0)
        });
        
        return rebalancingTrades;
    }
    
    async checkRebalancing() {
        if (!this.currentPortfolio) return;
        
        const portfolio = this.currentPortfolio;
        const allocation = await this.getAllocation(portfolio.id);
        
        // Check if rebalancing is needed
        for (const [strategyName, strategy] of this.allocations) {
            const needsRebalancing = this.needsRebalancing(allocation, strategy);
            
            if (needsRebalancing) {
                // Trigger rebalancing alert
                if (window.enterpriseCore) {
                    window.enterpriseCore.services.get('notifications').show(
                        `Portfolio ${portfolio.name} needs rebalancing for ${strategyName} strategy`,
                        'info'
                    );
                }
            }
        }
    }
    
    needsRebalancing(currentAllocation, strategy) {
        for (const [asset, targetWeight] of Object.entries(strategy.targetAllocations)) {
            const currentWeight = currentAllocation.byAsset[asset] || 0;
            const deviation = Math.abs(currentWeight - targetWeight);
            
            if (deviation > strategy.rebalanceThreshold) {
                return true;
            }
        }
        
        return false;
    }
    
    async updatePerformance() {
        if (!this.currentPortfolio) return;
        
        const portfolio = this.currentPortfolio;
        const performance = await this.getPerformance(portfolio.id, '1D');
        
        // Update UI
        this.updatePerformanceUI(performance);
    }
    
    updatePerformanceUI(performance) {
        // Update performance display
        this.updateElement('portfolioReturn', (performance.totalReturn * 100).toFixed(2) + '%');
        this.updateElement('portfolioValue', this.formatCurrency(performance.endValue));
        this.updateElement('portfolioChange', this.formatChange(performance.totalReturn));
        
        // Update performance chart
        this.updatePerformanceChart(performance);
    }
    
    updatePerformanceChart(performance) {
        const chart = window.enterpriseCore?.modules.get('charts');
        if (chart) {
            chart.updateData('performanceChart', {
                value: performance.endValue,
                change: performance.totalReturn
            });
        }
    }
    
    calculateDailyPerformance() {
        if (!this.currentPortfolio) return;
        
        const portfolio = this.currentPortfolio;
        const today = new Date().toDateString();
        
        // Store daily performance
        const dailyPerformance = {
            date: today,
            value: portfolio.totalValue,
            return: 0 // Calculate from previous day's value
        };
        
        // Save daily performance
        this.saveDailyPerformance(portfolio.id, dailyPerformance);
    }
    
    async saveDailyPerformance(portfolioId, performance) {
        try {
            await fetch(`/api/portfolios/${portfolioId}/performance`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(performance)
            });
        } catch (error) {
            console.error('Error saving daily performance:', error);
        }
    }
    
    async savePortfolio(portfolio) {
        try {
            await fetch(`/api/portfolios/${portfolio.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(portfolio)
            });
        } catch (error) {
            console.error('Error saving portfolio:', error);
        }
    }
    
    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    }
    
    formatCurrency(value) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(value);
    }
    
    formatChange(value) {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${(value * 100).toFixed(2)}%`;
    }
    
    // Public API
    async createPortfolio(name, description, initialCapital) {
        const portfolio = {
            id: Date.now().toString(),
            name,
            description,
            currency: 'USD',
            totalValue: initialCapital,
            cash: initialCapital,
            positions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        this.portfolios.set(portfolio.id, portfolio);
        await this.savePortfolio(portfolio);
        
        return portfolio;
    }
    
    async deletePortfolio(portfolioId) {
        this.portfolios.delete(portfolioId);
        this.performance.delete(portfolioId);
        
        try {
            await fetch(`/api/portfolios/${portfolioId}`, {
                method: 'DELETE'
            });
        } catch (error) {
            console.error('Error deleting portfolio:', error);
        }
    }
    
    async getPortfolios() {
        return Array.from(this.portfolios.values());
    }
    
    async getPortfolioById(portfolioId) {
        return this.portfolios.get(portfolioId);
    }
    
    setCurrentPortfolio(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        if (portfolio) {
            this.currentPortfolio = portfolio;
        }
    }
    
    async getPositions(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        return portfolio ? portfolio.positions : [];
    }
    
    async getTotalValue(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        return portfolio ? portfolio.totalValue : 0;
    }
    
    async getCashBalance(portfolioId) {
        const portfolio = this.portfolios.get(portfolioId);
        return portfolio ? portfolio.cash : 0;
    }
    
    async getAllocationStrategies() {
        return Array.from(this.allocations.entries()).map(([name, strategy]) => ({
            name,
            ...strategy
        }));
    }
    
    async getRebalancingHistory(portfolioId) {
        return this.rebalancing.get(portfolioId);
    }
}

// Initialize Portfolio Manager
window.portfolioManager = new PortfolioManager();
