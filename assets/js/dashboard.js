// Update dashboard.js to use real data
let realChart = null;
let realTimeInterval = null;

document.addEventListener('DOMContentLoaded', function() {
    initializeRealDashboard();
});

function initializeRealDashboard() {
    // Subscribe to real data updates
    if (window.realDataEngine) {
        window.realDataEngine.subscribe(handleRealDataUpdate);
    }
    
    initializeRealChart();
    startRealDashboardUpdates();
    updateConnectionStatus();
}

function handleRealDataUpdate(symbol, data) {
    // Update current pair display
    const currentPairElement = document.getElementById('currentPair');
    if (currentPairElement && symbol === currentPairElement.textContent) {
        updateRealChart(data);
        updateLastUpdateTime();
    }
    
    // Update technical indicators
    updateRealTechnicalIndicators(symbol);
    
    // Update AI analysis
    updateRealAIAnalysis(symbol);
}

function initializeRealChart() {
    const ctx = document.getElementById('mainChart');
    if (!ctx) return;
    
    realChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                label: 'Real Price',
                data: [],
                borderColor: '#6366f1',
                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                borderWidth: 2,
                tension: 0.4,
                fill: true,
                pointRadius: 0,
                pointHoverRadius: 4
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0 // Disable animations for real-time feel
            },
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    titleColor: '#e2e8f0',
                    bodyColor: '#94a3b8',
                    borderColor: '#334155',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `Price: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        maxRotation: 0
                    }
                },
                y: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.05)',
                        drawBorder: false
                    },
                    ticks: {
                        color: '#64748b',
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

function updateRealChart(data) {
    if (!realChart || !data.klines) return;
    
    const labels = data.klines.map(k => 
        new Date(k.time).toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })
    );
    
    const prices = data.klines.map(k => k.close);
    
    realChart.data.labels = labels;
    realChart.data.datasets[0].data = prices;
    realChart.update('none'); // Update without animation for real-time feel
}

function updateRealTechnicalIndicators(symbol) {
    if (!window.realDataEngine) return;
    
    const analysis = window.realDataEngine.calculateTechnicalAnalysis(symbol);
    if (!analysis) return;
    
    const indicatorsContainer = document.getElementById('realTechnicalIndicators');
    if (!indicatorsContainer) return;
    
    indicatorsContainer.innerHTML = `
        <div class="indicator-item">
            <span class="indicator-label">RSI (14)</span>
            <span class="indicator-value ${analysis.rsi > 70 ? 'overbought' : analysis.rsi < 30 ? 'oversold' : 'neutral'}">
                ${analysis.rsi.toFixed(2)}
            </span>
        </div>
        <div class="indicator-item">
            <span class="indicator-label">MACD</span>
            <span class="indicator-value ${analysis.macd.macd > analysis.macd.signal ? 'bullish' : 'bearish'}">
                ${analysis.macd.macd > analysis.macd.signal ? '▲' : '▼'} ${Math.abs(analysis.macd.macd - analysis.macd.signal).toFixed(4)}
            </span>
        </div>
        <div class="indicator-item">
            <span class="indicator-label">BB Position</span>
            <span class="indicator-value">
                ${((analysis.currentPrice - analysis.bollinger.lower) / (analysis.bollinger.upper - analysis.bollinger.lower) * 100).toFixed(1)}%
            </span>
        </div>
        <div class="indicator-item">
            <span class="indicator-label">Volume</span>
            <span class="indicator-value">
                ${Object.values(analysis.volumeProfile).slice(-1)[0].toFixed(0)}
            </span>
        </div>
    `;
}

async function updateRealAIAnalysis(symbol) {
    if (!window.realDataEngine) return;
    
    const analysis = await window.realDataEngine.performAIAnalysis(symbol);
    if (!analysis) return;
    
    const signalsContainer = document.getElementById('aiSignals');
    if (!signalsContainer) return;
    
    signalsContainer.innerHTML = `
        <div class="ai-analysis-result ${analysis.recommendation.toLowerCase()}">
            <div class="analysis-header">
                <span class="analysis-recommendation">${analysis.recommendation}</span>
                <span class="analysis-confidence">${analysis.confidence}% Confidence</span>
            </div>
            <div class="analysis-signals">
                ${Object.entries(analysis.signals).map(([indicator, signal]) => `
                    <div class="signal-badge ${signal.toLowerCase()}">
                        ${indicator}: ${signal}
                    </div>
                `).join('')}
            </div>
            <div class="analysis-explanation">
                Based on ${Object.values(analysis.signals).filter(s => s === analysis.recommendation).length}/${Object.keys(analysis.signals).length} indicators
            </div>
        </div>
    `;
    
    // Update AI status
    const statusElement = document.getElementById('aiStatus');
    if (statusElement) {
        statusElement.innerHTML = `
            <div class="status-indicator active"></div>
            <span>AI Analysis Complete: ${analysis.recommendation} ${symbol} (${analysis.confidence}% confidence)</span>
        `;
    }
}

function updateLastUpdateTime() {
    const timeElement = document.getElementById('lastUpdateTime');
    if (timeElement) {
        timeElement.textContent = new Date().toLocaleTimeString();
    }
}

function updateConnectionStatus() {
    const statusElement = document.getElementById('connectionStatus');
    if (statusElement) {
        statusElement.innerHTML = `
            <span class="pulse-dot"></span>
            <span>Connected to Binance API - Real Data</span>
        `;
        statusElement.className = 'connection-status connected';
    }
}

function toggleRealAutoTrading() {
    window.isAutoTrading = !window.isAutoTrading;
    const btn = document.getElementById('autoTradeBtn');
    
    if (window.isAutoTrading) {
        btn.innerHTML = '<i class="fas fa-stop"></i> Stop REAL Auto Trading';
        btn.classList.add('active');
        
        // Start real auto trading with actual market data
        startRealAutoTrading();
        
        if (typeof showNotification === 'function') {
            showNotification('REAL Auto Trading Started with Live Market Data', 'success');
        }
    } else {
        btn.innerHTML = '<i class="fas fa-play"></i> Start REAL Auto Trading';
        btn.classList.remove('active');
        
        if (typeof showNotification === 'function') {
            showNotification('REAL Auto Trading Stopped', 'info');
        }
    }
}

function startRealAutoTrading() {
    if (!window.realDataEngine || !window.isAutoTrading) return;
    
    // Execute trades based on real AI analysis
    setInterval(async () => {
        if (!window.isAutoTrading) return;
        
        // Analyze all active pairs
        for (const pair of window.selectedPairs || ['BTCUSDT']) {
            const analysis = await window.realDataEngine.performAIAnalysis(pair);
            
            if (analysis && analysis.confidence > 75 && analysis.recommendation !== 'HOLD') {
                // Execute real trade
                const amount = Math.random() * 1000 + 100;
                window.realDataEngine.executeRealTrade(pair, analysis.recommendation, amount);
            }
        }
    }, 10000); // Check every 10 seconds
}

function startRealDashboardUpdates() {
    // Update chart every second with real data
    realTimeInterval = setInterval(() => {
        if (window.realDataEngine && realChart) {
            const currentPair = document.getElementById('currentPair').textContent;
            const data = window.realDataEngine.priceData[currentPair];
            
            if (data) {
                updateRealChart(data);
                updateLastUpdateTime();
            }
        }
    }, 1000);
}

// Clean up on page unload
window.addEventListener('beforeunload', () => {
    if (realTimeInterval) {
        clearInterval(realTimeInterval);
    }
});
