// Risk Management Service - Enterprise Grade Risk Assessment
class RiskManagementService {
    constructor() {
        this.riskModels = new Map();
        this.riskMetrics = new Map();
        this.alerts = [];
        this.limits = new Map();
        this.scenarios = new Map();
        
        this.init();
    }
    
    async init() {
        console.log('🛡️ Initializing Risk Management Service');
        
        // Load risk models
        await this.loadRiskModels();
        
        // Initialize risk metrics
        this.initializeRiskMetrics();
        
        // Setup risk monitoring
        this.setupRiskMonitoring();
        
        // Load risk limits
        await this.loadRiskLimits();
        
        // Initialize stress scenarios
        this.initializeStressScenarios();
        
        console.log('✅ Risk Management Service initialized');
    }
    
    async loadRiskModels() {
        // VaR Model
        this.riskModels.set('var', new VaRModel());
        
        // Monte Carlo Model
        this.riskModels.set('monteCarlo', new MonteCarloModel());
        
        // Expected Shortfall Model
        this.riskModels.set('expectedShortfall', new ExpectedShortfallModel());
        
        // Drawdown Model
        this.riskModels.set('drawdown', new DrawdownModel());
        
        // Correlation Model
        this.riskModels.set('correlation', new CorrelationModel());
        
        // Concentration Model
        this.riskModels.set('concentration', new ConcentrationModel());
        
        // Initialize all models
        for (const [name, model] of this.riskModels) {
            if (model.init) {
                await model.init();
            }
        }
    }
    
    initializeRiskMetrics() {
        this.riskMetrics.set('portfolio', {
            totalValue: 0,
            totalRisk: 0,
            var: 0,
            expectedShortfall: 0,
            maxDrawdown: 0,
            sharpeRatio: 0,
            sortinoRatio: 0,
            calmarRatio: 0,
            beta: 0,
            alpha: 0,
            rSquared: 0,
            volatility: 0,
            trackingError: 0,
            informationRatio: 0
        });
        
        this.riskMetrics.set('positions', new Map());
        this.riskMetrics.set('market', new Map());
    }
    
    setupRiskMonitoring() {
        // Monitor portfolio risk
        setInterval(() => {
            this.updatePortfolioRisk();
        }, 5000);
        
        // Monitor position risk
        setInterval(() => {
            this.updatePositionRisk();
        }, 2000);
        
        // Monitor market risk
        setInterval(() => {
            this.updateMarketRisk();
        }, 1000);
        
        // Check risk limits
        setInterval(() => {
            this.checkRiskLimits();
        }, 10000);
    }
    
    async loadRiskLimits() {
        // Default risk limits
        this.limits.set('portfolio', {
            maxVar: 100000, // $100k
            maxDrawdown: 0.15, // 15%
            maxConcentration: 0.25, // 25%
            maxLeverage: 5, // 5x
            maxVolatility: 0.25, // 25%
            minSharpeRatio: 0.5,
            maxPositions: 50,
            maxSectorExposure: 0.3
        });
        
        this.limits.set('position', {
            maxSize: 100000, // $100k
            maxLeverage: 10,
            maxLoss: 0.05, // 5%
            maxHoldingPeriod: 30 // days
        });
    }
    
    initializeStressScenarios() {
        // Market crash scenario
        this.scenarios.set('marketCrash', {
            name: 'Market Crash',
            description: '30% market decline',
            marketShock: -0.30,
            volatilityIncrease: 2,
            correlationIncrease: 0.5,
            liquidityDecrease: 0.5
        });
        
        // Interest rate shock
        this.scenarios.set('interestRateShock', {
            name: 'Interest Rate Shock',
            description: '200bps rate increase',
            rateChange: 0.02,
            bondImpact: -0.10,
            equityImpact: -0.15,
            currencyImpact: 0.05
        });
        
        // Currency crisis
        this.scenarios.set('currencyCrisis', {
            name: 'Currency Crisis',
            description: 'Major currency devaluation',
            currencyShock: -0.25,
            emergingMarketsImpact: -0.20,
            commoditiesImpact: 0.10
        });
        
        // Liquidity crisis
        this.scenarios.set('liquidityCrisis', {
            name: 'Liquidity Crisis',
            description: 'Market liquidity dries up',
            liquidityDecrease: 0.7,
            spreadIncrease: 5,
            impactDuration: 30 // days
        });
    }
    
    async assessPortfolioRisk(portfolio) {
        const riskAssessment = {
            portfolio: portfolio.id,
            timestamp: Date.now(),
            metrics: {},
            alerts: [],
            recommendations: []
        };
        
        // Calculate VaR
        const varModel = this.riskModels.get('var');
        riskAssessment.metrics.var = await varModel.calculate(portfolio);
        
        // Calculate Expected Shortfall
        const esModel = this.riskModels.get('expectedShortfall');
        riskAssessment.metrics.expectedShortfall = await esModel.calculate(portfolio);
        
        // Calculate Maximum Drawdown
        const ddModel = this.riskModels.get('drawdown');
        riskAssessment.metrics.maxDrawdown = await ddModel.calculate(portfolio);
        
        // Calculate correlation risk
        const corrModel = this.riskModels.get('correlation');
        riskAssessment.metrics.correlationRisk = await corrModel.calculate(portfolio);
        
        // Calculate concentration risk
        const concModel = this.riskModels.get('concentration');
        riskAssessment.metrics.concentrationRisk = await concModel.calculate(portfolio);
        
        // Calculate overall risk score
        riskAssessment.metrics.riskScore = this.calculateRiskScore(riskAssessment.metrics);
        
        // Check for alerts
        riskAssessment.alerts = this.checkRiskAlerts(riskAssessment.metrics);
        
        // Generate recommendations
        riskAssessment.recommendations = this.generateRiskRecommendations(riskAssessment);
        
        // Store assessment
        this.riskMetrics.set('portfolio', riskAssessment.metrics);
        
        return riskAssessment;
    }
    
    async assessPositionRisk(position) {
        const riskAssessment = {
            position: position.id,
            timestamp: Date.now(),
            metrics: {},
            alerts: []
        };
        
        // Calculate position VaR
        const varModel = this.riskModels.get('var');
        riskAssessment.metrics.var = await varModel.calculatePosition(position);
        
        // Calculate position beta
        riskAssessment.metrics.beta = this.calculatePositionBeta(position);
        
        // Calculate position volatility
        riskAssessment.metrics.volatility = this.calculatePositionVolatility(position);
        
        // Calculate position concentration
        riskAssessment.metrics.concentration = this.calculatePositionConcentration(position);
        
        // Calculate risk score
        riskAssessment.metrics.riskScore = this.calculatePositionRiskScore(riskAssessment.metrics);
        
        // Check alerts
        riskAssessment.alerts = this.checkPositionAlerts(riskAssessment.metrics);
        
        // Store assessment
        this.riskMetrics.get('positions').set(position.id, riskAssessment.metrics);
        
        return riskAssessment;
    }
    
    calculateRiskScore(metrics) {
        const weights = {
            var: 0.25,
            expectedShortfall: 0.20,
            maxDrawdown: 0.20,
            correlationRisk: 0.15,
            concentrationRisk: 0.20
        };
        
        let score = 0;
        for (const [metric, weight] of Object.entries(weights)) {
            const normalizedValue = this.normalizeRiskMetric(metrics[metric]);
            score += normalizedValue * weight;
        }
        
        return Math.min(Math.max(score, 0), 1);
    }
    
    normalizeRiskMetric(value) {
        // Normalize risk metric to 0-1 scale
        if (typeof value === 'object') {
            return Math.min(value.value / 100000, 1); // Normalize to $100k
        }
        return Math.min(Math.abs(value), 1);
    }
    
    calculatePositionRiskScore(metrics) {
        const weights = {
            var: 0.3,
            beta: 0.2,
            volatility: 0.25,
            concentration: 0.25
        };
        
        let score = 0;
        for (const [metric, weight] of Object.entries(weights)) {
            const normalizedValue = this.normalizeRiskMetric(metrics[metric]);
            score += normalizedValue * weight;
        }
        
        return Math.min(Math.max(score, 0), 1);
    }
    
    checkRiskAlerts(metrics) {
        const alerts = [];
        const limits = this.limits.get('portfolio');
        
        // Check VaR limit
        if (metrics.var && metrics.var.value > limits.maxVar) {
            alerts.push({
                type: 'VAR_EXCEEDED',
                severity: 'HIGH',
                message: `VaR exceeds limit: ${this.formatCurrency(metrics.var.value)} > ${this.formatCurrency(limits.maxVar)}`,
                value: metrics.var.value,
                limit: limits.maxVar
            });
        }
        
        // Check drawdown limit
        if (metrics.maxDrawdown && metrics.maxDrawdown > limits.maxDrawdown) {
            alerts.push({
                type: 'DRAWDOWN_EXCEEDED',
                severity: 'HIGH',
                message: `Drawdown exceeds limit: ${(metrics.maxDrawdown * 100).toFixed(2)}% > ${(limits.maxDrawdown * 100).toFixed(2)}%`,
                value: metrics.maxDrawdown,
                limit: limits.maxDrawdown
            });
        }
        
        // Check concentration limit
        if (metrics.concentrationRisk && metrics.concentrationRisk > limits.maxConcentration) {
            alerts.push({
                type: 'CONCENTRATION_HIGH',
                severity: 'MEDIUM',
                message: `Concentration risk high: ${(metrics.concentrationRisk * 100).toFixed(2)}% > ${(limits.maxConcentration * 100).toFixed(2)}%`,
                value: metrics.concentrationRisk,
                limit: limits.maxConcentration
            });
        }
        
        return alerts;
    }
    
    checkPositionAlerts(metrics) {
        const alerts = [];
        const limits = this.limits.get('position');
        
        // Check position size limit
        if (metrics.var && metrics.var.value > limits.maxSize) {
            alerts.push({
                type: 'POSITION_SIZE_EXCEEDED',
                severity: 'MEDIUM',
                message: `Position size exceeds limit: ${this.formatCurrency(metrics.var.value)} > ${this.formatCurrency(limits.maxSize)}`,
                value: metrics.var.value,
                limit: limits.maxSize
            });
        }
        
        return alerts;
    }
    
    generateRiskRecommendations(assessment) {
        const recommendations = [];
        
        // High VaR recommendation
        if (assessment.metrics.var && assessment.metrics.var.value > 50000) {
            recommendations.push({
                type: 'REDUCE_EXPOSURE',
                priority: 'HIGH',
                message: 'Consider reducing portfolio exposure to lower VaR',
                action: 'Reduce position sizes or add hedges'
            });
        }
        
        // High concentration recommendation
        if (assessment.metrics.concentrationRisk > 0.2) {
            recommendations.push({
                type: 'DIVERSIFY',
                priority: 'MEDIUM',
                message: 'Portfolio concentration is high, consider diversification',
                action: 'Add positions in different sectors/asset classes'
            });
        }
        
        // High correlation recommendation
        if (assessment.metrics.correlationRisk > 0.7) {
            recommendations.push({
                type: 'REDUCE_CORRELATION',
                priority: 'MEDIUM',
                message: 'High correlation detected, consider adding uncorrelated assets',
                action: 'Add assets with low correlation to existing positions'
            });
        }
        
        return recommendations;
    }
    
    async runStressTest(portfolio, scenarioName) {
        const scenario = this.scenarios.get(scenarioName);
        if (!scenario) {
            throw new Error(`Stress scenario '${scenarioName}' not found`);
        }
        
        const stressTest = {
            portfolio: portfolio.id,
            scenario: scenarioName,
            timestamp: Date.now(),
            results: {}
        };
        
        // Apply market shock
        const shockedPortfolio = this.applyMarketShock(portfolio, scenario);
        
        // Calculate stressed VaR
        const varModel = this.riskModels.get('var');
        stressTest.results.var = await varModel.calculate(shockedPortfolio);
        
        // Calculate stressed drawdown
        const ddModel = this.riskModels.get('drawdown');
        stressTest.results.maxDrawdown = await ddModel.calculate(shockedPortfolio);
        
        // Calculate liquidity impact
        stressTest.results.liquidityImpact = this.calculateLiquidityImpact(portfolio, scenario);
        
        // Calculate overall impact
        stressTest.results.portfolioImpact = this.calculatePortfolioImpact(portfolio, scenario);
        
        // Generate stress test recommendations
        stressTest.recommendations = this.generateStressTestRecommendations(stressTest);
        
        return stressTest;
    }
    
    applyMarketShock(portfolio, scenario) {
        const shockedPortfolio = JSON.parse(JSON.stringify(portfolio));
        
        // Apply scenario shocks to positions
        shockedPortfolio.positions.forEach(position => {
            // Apply market shock
            if (scenario.marketShock) {
                position.currentPrice *= (1 + scenario.marketShock);
            }
            
            // Apply volatility increase
            if (scenario.volatilityIncrease) {
                position.volatility *= scenario.volatilityIncrease;
            }
            
            // Apply correlation increase
            if (scenario.correlationIncrease) {
                position.correlation = Math.min(1, position.correlation + scenario.correlationIncrease);
            }
            
            // Apply liquidity decrease
            if (scenario.liquidityDecrease) {
                position.liquidity *= scenario.liquidityDecrease;
            }
        });
        
        return shockedPortfolio;
    }
    
    calculateLiquidityImpact(portfolio, scenario) {
        let totalImpact = 0;
        
        portfolio.positions.forEach(position => {
            const liquidityScore = position.liquidity || 0.5;
            const positionSize = position.size || 0;
            const impact = positionSize * (1 - liquidityScore) * (scenario.liquidityDecrease || 0.5);
            totalImpact += impact;
        });
        
        return totalImpact;
    }
    
    calculatePortfolioImpact(portfolio, scenario) {
        let totalValue = 0;
        let shockedValue = 0;
        
        portfolio.positions.forEach(position => {
            const originalValue = position.size * position.currentPrice;
            totalValue += originalValue;
            
            let shockedPrice = position.currentPrice;
            
            // Apply scenario-specific shocks
            if (scenario.marketShock) {
                shockedPrice *= (1 + scenario.marketShock);
            }
            
            const shockedValue = position.size * shockedPrice;
            shockedValue += shockedValue;
        });
        
        return {
            originalValue: totalValue,
            shockedValue: shockedValue,
            impact: (shockedValue - totalValue) / totalValue,
            impactPercent: ((shockedValue - totalValue) / totalValue) * 100
        };
    }
    
    generateStressTestRecommendations(stressTest) {
        const recommendations = [];
        
        // High impact recommendation
        if (Math.abs(stressTest.results.portfolioImpact.impact) > 0.2) {
            recommendations.push({
                type: 'REDUCE_STRESS_SENSITIVITY',
                priority: 'HIGH',
                message: `Portfolio highly sensitive to ${stressTest.scenario} scenario`,
                action: 'Consider reducing exposure or adding hedges'
            });
        }
        
        // Liquidity risk recommendation
        if (stressTest.results.liquidityImpact > 50000) {
            recommendations.push({
                type: 'IMPROVE_LIQUIDITY',
                priority: 'MEDIUM',
                message: 'Liquidity risk high under stress conditions',
                action: 'Add more liquid assets or reduce position sizes'
            });
        }
        
        return recommendations;
    }
    
    async updatePortfolioRisk() {
        if (!window.portfolioManager) return;
        
        try {
            const portfolio = await window.portfolioManager.getCurrentPortfolio();
            const riskAssessment = await this.assessPortfolioRisk(portfolio);
            
            // Update UI
            this.updateRiskUI(riskAssessment);
            
            // Process alerts
            this.processRiskAlerts(riskAssessment.alerts);
            
        } catch (error) {
            console.error('Error updating portfolio risk:', error);
        }
    }
    
    async updatePositionRisk() {
        if (!window.tradingEngine) return;
        
        try {
            const positions = await window.tradingEngine.getActivePositions();
            
            for (const position of positions) {
                const riskAssessment = await this.assessPositionRisk(position);
                
                // Update position risk UI
                this.updatePositionRiskUI(position.id, riskAssessment);
                
                // Process alerts
                this.processRiskAlerts(riskAssessment.alerts);
            }
            
        } catch (error) {
            console.error('Error updating position risk:', error);
        }
    }
    
    async updateMarketRisk() {
        try {
            const marketData = await this.getMarketRiskData();
            
            // Calculate market risk metrics
            const marketRisk = this.calculateMarketRisk(marketData);
            
            // Update market risk UI
            this.updateMarketRiskUI(marketRisk);
            
        } catch (error) {
            console.error('Error updating market risk:', error);
        }
    }
    
    async getMarketRiskData() {
        // Get market data for risk calculation
        const marketModule = window.multiMarketEngine;
        if (!marketModule) return {};
        
        return {
            vix: this.getVIX(),
            volatilityIndex: this.getVolatilityIndex(),
            correlationMatrix: await this.getCorrelationMatrix(),
            liquidityMeasures: this.getLiquidityMeasures()
        };
    }
    
    calculateMarketRisk(marketData) {
        return {
            vix: marketData.vix,
            volatilityIndex: marketData.volatilityIndex,
            systemicRisk: this.calculateSystemicRisk(marketData),
            liquidityRisk: this.calculateLiquidityRisk(marketData.liquidityMeasures),
            timestamp: Date.now()
        };
    }
    
    calculateSystemicRisk(marketData) {
        // Calculate systemic risk based on VIX and correlations
        const vixLevel = marketData.vix || 15;
        const avgCorrelation = this.getAverageCorrelation(marketData.correlationMatrix);
        
        return (vixLevel / 50) * 0.6 + avgCorrelation * 0.4;
    }
    
    calculateLiquidityRisk(liquidityMeasures) {
        // Calculate liquidity risk based on market liquidity measures
        const bidAskSpread = liquidityMeasures.bidAskSpread || 0.01;
        const marketDepth = liquidityMeasures.marketDepth || 1000000;
        const volume = liquidityMeasures.volume || 100000000;
        
        const spreadScore = Math.min(bidAskSpread * 100, 1);
        const depthScore = Math.max(1 - marketDepth / 10000000, 0);
        const volumeScore = Math.max(1 - volume / 1000000000, 0);
        
        return (spreadScore + depthScore + volumeScore) / 3;
    }
    
    getVIX() {
        // Get VIX value (simplified)
        return 15 + Math.random() * 35;
    }
    
    getVolatilityIndex() {
        // Get volatility index (simplified)
        return 20 + Math.random() * 30;
    }
    
    async getCorrelationMatrix() {
        // Get correlation matrix (simplified)
        return {
            'BTC-USD': { 'ETH-USD': 0.7, 'SPY': 0.3, 'GLD': 0.2 },
            'ETH-USD': { 'BTC-USD': 0.7, 'SPY': 0.4, 'GLD': 0.1 },
            'SPY': { 'BTC-USD': 0.3, 'ETH-USD': 0.4, 'GLD': -0.2 },
            'GLD': { 'BTC-USD': 0.2, 'ETH-USD': 0.1, 'SPY': -0.2 }
        };
    }
    
    getLiquidityMeasures() {
        // Get liquidity measures (simplified)
        return {
            bidAskSpread: 0.001 + Math.random() * 0.01,
            marketDepth: 1000000 + Math.random() * 9000000,
            volume: 100000000 + Math.random() * 900000000
        };
    }
    
    getAverageCorrelation(correlationMatrix) {
        if (!correlationMatrix) return 0.5;
        
        let total = 0;
        let count = 0;
        
        for (const [asset1, correlations] of Object.entries(correlationMatrix)) {
            for (const [asset2, correlation] of Object.entries(correlations)) {
                if (asset1 < asset2) { // Avoid double counting
                    total += Math.abs(correlation);
                    count++;
                }
            }
        }
        
        return count > 0 ? total / count : 0.5;
    }
    
    checkRiskLimits() {
        const portfolioMetrics = this.riskMetrics.get('portfolio');
        const limits = this.limits.get('portfolio');
        
        if (!portfolioMetrics || !limits) return;
        
        // Check portfolio-level limits
        this.checkPortfolioLimits(portfolioMetrics, limits);
        
        // Check position-level limits
        const positionMetrics = this.riskMetrics.get('positions');
        const positionLimits = this.limits.get('position');
        
        for (const [positionId, metrics] of positionMetrics) {
            this.checkPositionLimits(positionId, metrics, positionLimits);
        }
    }
    
    checkPortfolioLimits(metrics, limits) {
        // Check VaR limit
        if (metrics.var && metrics.var.value > limits.maxVar) {
            this.triggerRiskAlert('PORTFOLIO_VAR_LIMIT', {
                current: metrics.var.value,
                limit: limits.maxVar,
                severity: 'HIGH'
            });
        }
        
        // Check drawdown limit
        if (metrics.maxDrawdown > limits.maxDrawdown) {
            this.triggerRiskAlert('PORTFOLIO_DRAWDOWN_LIMIT', {
                current: metrics.maxDrawdown,
                limit: limits.maxDrawdown,
                severity: 'HIGH'
            });
        }
    }
    
    checkPositionLimits(positionId, metrics, limits) {
        // Check position size limit
        if (metrics.var && metrics.var.value > limits.maxSize) {
            this.triggerRiskAlert('POSITION_SIZE_LIMIT', {
                position: positionId,
                current: metrics.var.value,
                limit: limits.maxSize,
                severity: 'MEDIUM'
            });
        }
    }
    
    triggerRiskAlert(type, data) {
        const alert = {
            id: Date.now(),
            type,
            severity: data.severity,
            message: this.generateAlertMessage(type, data),
            data,
            timestamp: Date.now()
        };
        
        this.alerts.push(alert);
        
        // Limit alerts array size
        if (this.alerts.length > 100) {
            this.alerts = this.alerts.slice(-100);
        }
        
        // Show notification
        this.showRiskAlert(alert);
        
        // Emit event
        if (window.enterpriseCore) {
            window.enterpriseCore.services.get('events').emit('risk:alert', alert);
        }
    }
    
    generateAlertMessage(type, data) {
        const messages = {
            'PORTFOLIO_VAR_LIMIT': `Portfolio VaR exceeds limit: ${this.formatCurrency(data.current)} > ${this.formatCurrency(data.limit)}`,
            'PORTFOLIO_DRAWDOWN_LIMIT': `Portfolio drawdown exceeds limit: ${(data.current * 100).toFixed(2)}% > ${(data.limit * 100).toFixed(2)}%`,
            'POSITION_SIZE_LIMIT': `Position size exceeds limit: ${this.formatCurrency(data.current)} > ${this.formatCurrency(data.limit)}`
        };
        
        return messages[type] || `Risk limit exceeded: ${type}`;
    }
    
    showRiskAlert(alert) {
        const notificationService = window.enterpriseCore?.services.get('notifications');
        if (notificationService) {
            notificationService.show(alert.message, alert.severity.toLowerCase());
        }
    }
    
    processRiskAlerts(alerts) {
        for (const alert of alerts) {
            this.triggerRiskAlert(alert.type, alert);
        }
    }
    
    updateRiskUI(riskAssessment) {
        // Update risk metrics display
        this.updateElement('riskScore', (riskAssessment.metrics.riskScore * 100).toFixed(1) + '%');
        this.updateElement('varValue', this.formatCurrency(riskAssessment.metrics.var?.value || 0));
        this.updateElement('maxDrawdown', ((riskAssessment.metrics.maxDrawdown || 0) * 100).toFixed(2) + '%');
        
        // Update risk gauge
        this.updateRiskGauge(riskAssessment.metrics.riskScore);
        
        // Update alerts list
        this.updateAlertsList(riskAssessment.alerts);
    }
    
    updatePositionRiskUI(positionId, riskAssessment) {
        // Update position risk display
        const riskElement = document.getElementById(`position-${positionId}-risk`);
        if (riskElement) {
            riskElement.textContent = (riskAssessment.metrics.riskScore * 100).toFixed(1) + '%';
            riskElement.className = `risk-score ${this.getRiskLevel(riskAssessment.metrics.riskScore)}`;
        }
    }
    
    updateMarketRiskUI(marketRisk) {
        // Update market risk display
        this.updateElement('vixValue', marketRisk.vix?.toFixed(2) || 'N/A');
        this.updateElement('systemicRisk', (marketRisk.systemicRisk * 100).toFixed(1) + '%');
        this.updateElement('liquidityRisk', (marketRisk.liquidityRisk * 100).toFixed(1) + '%');
    }
    
    updateRiskGauge(riskScore) {
        const gauge = document.getElementById('riskGauge');
        if (!gauge) return;
        
        const percentage = riskScore * 100;
        const color = this.getRiskColor(riskScore);
        
        gauge.style.setProperty('--risk-percentage', percentage + '%');
        gauge.style.setProperty('--risk-color', color);
    }
    
    updateAlertsList(alerts) {
        const alertsList = document.getElementById('riskAlertsList');
        if (!alertsList) return;
        
        alertsList.innerHTML = alerts.map(alert => `
            <div class="risk-alert ${alert.severity.toLowerCase()}">
                <div class="alert-header">
                    <span class="alert-type">${alert.type}</span>
                    <span class="alert-time">${new Date(alert.timestamp).toLocaleTimeString()}</span>
                </div>
                <div class="alert-message">${alert.message}</div>
            </div>
        `).join('');
    }
    
    getRiskLevel(riskScore) {
        if (riskScore < 0.3) return 'low';
        if (riskScore < 0.7) return 'medium';
        return 'high';
    }
    
    getRiskColor(riskScore) {
        if (riskScore < 0.3) return '#10b981';
        if (riskScore < 0.7) return '#f59e0b';
        return '#ef4444';
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
    
    // Public API
    async getPortfolioRisk() {
        return this.riskMetrics.get('portfolio');
    }
    
    async getPositionRisk(positionId) {
        return this.riskMetrics.get('positions').get(positionId);
    }
    
    async getMarketRisk() {
        return this.riskMetrics.get('market');
    }
    
    async getRiskAlerts() {
        return this.alerts;
    }
    
    async runStressTestScenario(portfolio, scenarioName) {
        return await this.runStressTest(portfolio, scenarioName);
    }
    
    async getStressScenarios() {
        return Array.from(this.scenarios.entries()).map(([name, scenario]) => ({
            name,
            ...scenario
        }));
    }
}

// Risk Model Classes
class VaRModel {
    async calculate(portfolio) {
        // Calculate Value at Risk using Monte Carlo simulation
        const confidence = 0.95;
        const timeHorizon = 1; // 1 day
        const simulations = 10000;
        
        const returns = this.generateReturns(portfolio, simulations);
        returns.sort((a, b) => a - b);
        
        const varIndex = Math.floor((1 - confidence) * simulations);
        const varValue = returns[varIndex] * portfolio.totalValue;
        
        return {
            value: Math.abs(varValue),
            confidence,
            timeHorizon,
            method: 'MonteCarlo'
        };
    }
    
    async calculatePosition(position) {
        // Simplified position VaR calculation
        const volatility = position.volatility || 0.2;
        const value = position.size * position.currentPrice;
        const varValue = value * volatility * 2.33; // 99% VaR
        
        return {
            value: Math.abs(varValue),
            confidence: 0.99,
            timeHorizon: 1,
            method: 'Parametric'
        };
    }
    
    generateReturns(portfolio, simulations) {
        const returns = [];
        
        for (let i = 0; i < simulations; i++) {
            let portfolioReturn = 0;
            
            for (const position of portfolio.positions) {
                const positionReturn = this.generatePositionReturn(position);
                const weight = position.value / portfolio.totalValue;
                portfolioReturn += positionReturn * weight;
            }
            
            returns.push(portfolioReturn);
        }
        
        return returns;
    }
    
    generatePositionReturn(position) {
        const mean = position.expectedReturn || 0;
        const volatility = position.volatility || 0.2;
        
        // Generate random return using normal distribution
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        
        const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
        
        return mean + volatility * z;
    }
}

class MonteCarloModel {
    async calculate(portfolio) {
        // Monte Carlo simulation for portfolio risk
        const simulations = 10000;
        const timeSteps = 252; // 1 year of trading days
        
        const paths = this.generatePaths(portfolio, simulations, timeSteps);
        const metrics = this.calculatePathMetrics(paths);
        
        return metrics;
    }
    
    generatePaths(portfolio, simulations, timeSteps) {
        const paths = [];
        
        for (let i = 0; i < simulations; i++) {
            const path = this.generateSinglePath(portfolio, timeSteps);
            paths.push(path);
        }
        
        return paths;
    }
    
    generateSinglePath(portfolio, timeSteps) {
        const path = [];
        let currentValue = portfolio.totalValue;
        
        for (let t = 0; t < timeSteps; t++) {
            const portfolioReturn = this.calculatePortfolioReturn(portfolio);
            currentValue *= (1 + portfolioReturn);
            path.push(currentValue);
        }
        
        return path;
    }
    
    calculatePortfolioReturn(portfolio) {
        let totalReturn = 0;
        
        for (const position of portfolio.positions) {
            const positionReturn = this.generateReturn(position);
            const weight = position.value / portfolio.totalValue;
            totalReturn += positionReturn * weight;
        }
        
        return totalReturn;
    }
    
    generateReturn(position) {
        const mean = position.expectedReturn || 0.0005; // Daily return
        const volatility = position.volatility || 0.02; // Daily volatility
        
        return mean + volatility * this.generateNormalRandom();
    }
    
    generateNormalRandom() {
        let u = 0, v = 0;
        while (u === 0) u = Math.random();
        while (v === 0) v = Math.random();
        
        return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    }
    
    calculatePathMetrics(paths) {
        const finalValues = paths.map(path => path[path.length - 1]);
        const initialValue = paths[0][0];
        
        const returns = finalValues.map(value => (value - initialValue) / initialValue);
        returns.sort((a, b) => a - b);
        
        const percentiles = [5, 25, 50, 75, 95];
        const var95 = returns[Math.floor(0.05 * returns.length)];
        const expectedShortfall = returns.slice(0, Math.floor(0.05 * returns.length))
            .reduce((sum, ret) => sum + ret, 0) / Math.floor(0.05 * returns.length);
        
        return {
            var95: var95 * initialValue,
            expectedShortfall: expectedShortfall * initialValue,
            percentiles: percentiles.map(p => ({
                percentile: p,
                value: returns[Math.floor(p * 0.01 * returns.length)] * initialValue
            }))
        };
    }
}

class ExpectedShortfallModel {
    async calculate(portfolio) {
        // Calculate Expected Shortfall (CVaR)
        const confidence = 0.95;
        const simulations = 10000;
        
        const returns = this.generateReturns(portfolio, simulations);
        returns.sort((a, b) => a - b);
        
        const varIndex = Math.floor((1 - confidence) * simulations);
        const tailReturns = returns.slice(0, varIndex);
        
        const expectedShortfall = tailReturns.reduce((sum, ret) => sum + ret, 0) / tailReturns.length;
        
        return {
            value: Math.abs(expectedShortfall * portfolio.totalValue),
            confidence,
            method: 'Historical'
        };
    }
    
    generateReturns(portfolio, simulations) {
        // Simplified return generation
        const returns = [];
        
        for (let i = 0; i < simulations; i++) {
            let portfolioReturn = 0;
            
            for (const position of portfolio.positions) {
                const positionReturn = (Math.random() - 0.5) * 0.1; // ±5% daily
                const weight = position.value / portfolio.totalValue;
                portfolioReturn += positionReturn * weight;
            }
            
            returns.push(portfolioReturn);
        }
        
        return returns;
    }
}

class DrawdownModel {
    async calculate(portfolio) {
        // Calculate Maximum Drawdown
        const prices = this.generatePriceSeries(portfolio);
        const drawdowns = this.calculateDrawdowns(prices);
        const maxDrawdown = Math.max(...drawdowns);
        
        return {
            value: maxDrawdown,
            maxDrawdownDuration: this.getMaxDrawdownDuration(drawdowns),
            currentDrawdown: drawdowns[drawdowns.length - 1]
        };
    }
    
    generatePriceSeries(portfolio) {
        const prices = [];
        let currentValue = portfolio.totalValue;
        
        for (let i = 0; i < 252; i++) { // 1 year
            const return_ = (Math.random() - 0.5) * 0.05; // ±2.5% daily
            currentValue *= (1 + return_);
            prices.push(currentValue);
        }
        
        return prices;
    }
    
    calculateDrawdowns(prices) {
        const drawdowns = [];
        let peak = prices[0];
        
        for (const price of prices) {
            if (price > peak) {
                peak = price;
            }
            
            const drawdown = (peak - price) / peak;
            drawdowns.push(drawdown);
        }
        
        return drawdowns;
    }
    
    getMaxDrawdownDuration(drawdowns) {
        let maxDuration = 0;
        let currentDuration = 0;
        
        for (const drawdown of drawdowns) {
            if (drawdown > 0) {
                currentDuration++;
            } else {
                maxDuration = Math.max(maxDuration, currentDuration);
                currentDuration = 0;
            }
        }
        
        return maxDuration;
    }
}

class CorrelationModel {
    async calculate(portfolio) {
        // Calculate portfolio correlation risk
        const correlationMatrix = this.getCorrelationMatrix(portfolio);
        const avgCorrelation = this.calculateAverageCorrelation(correlationMatrix);
        const maxCorrelation = this.calculateMaxCorrelation(correlationMatrix);
        
        return {
            averageCorrelation: avgCorrelation,
            maxCorrelation: maxCorrelation,
            correlationMatrix: correlationMatrix,
            riskContribution: this.calculateCorrelationRiskContribution(correlationMatrix)
        };
    }
    
    getCorrelationMatrix(portfolio) {
        const assets = portfolio.positions.map(p => p.symbol);
        const matrix = {};
        
        for (const asset1 of assets) {
            matrix[asset1] = {};
            for (const asset2 of assets) {
                if (asset1 === asset2) {
                    matrix[asset1][asset2] = 1;
                } else {
                    // Simplified correlation calculation
                    matrix[asset1][asset2] = (Math.random() - 0.5) * 1.5; // -0.75 to 0.75
                }
            }
        }
        
        return matrix;
    }
    
    calculateAverageCorrelation(matrix) {
        let total = 0;
        let count = 0;
        
        for (const [asset1, correlations] of Object.entries(matrix)) {
            for (const [asset2, correlation] of Object.entries(correlations)) {
                if (asset1 < asset2) {
                    total += Math.abs(correlation);
                    count++;
                }
            }
        }
        
        return count > 0 ? total / count : 0;
    }
    
    calculateMaxCorrelation(matrix) {
        let maxCorr = 0;
        
        for (const [asset1, correlations] of Object.entries(matrix)) {
            for (const [asset2, correlation] of Object.entries(correlations)) {
                if (asset1 !== asset2) {
                    maxCorr = Math.max(maxCorr, Math.abs(correlation));
                }
            }
        }
        
        return maxCorr;
    }
    
    calculateCorrelationRiskContribution(matrix) {
        // Calculate how much each asset contributes to correlation risk
        const contributions = {};
        
        for (const [asset, correlations] of Object.entries(matrix)) {
            const avgCorrelation = Object.values(correlations)
                .filter(c => c !== 1)
                .reduce((sum, c) => sum + Math.abs(c), 0) / (Object.keys(correlations).length - 1);
            
            contributions[asset] = avgCorrelation;
        }
        
        return contributions;
    }
}

class ConcentrationModel {
    async calculate(portfolio) {
        // Calculate portfolio concentration risk
        const positions = portfolio.positions;
        const totalValue = portfolio.totalValue;
        
        const concentrations = {};
        let maxConcentration = 0;
        let herfindahlIndex = 0;
        
        for (const position of positions) {
            const weight = position.value / totalValue;
            concentrations[position.symbol] = weight;
            maxConcentration = Math.max(maxConcentration, weight);
            herfindahlIndex += weight * weight;
        }
        
        return {
            maxConcentration,
            herfindahlIndex,
            concentrations,
            diversificationRatio: 1 / herfindahlIndex
        };
    }
}

// Initialize Risk Management Service
window.riskManagementService = new RiskManagementService();
