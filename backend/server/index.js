const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { fetchAndCacheOrcaPools } = require('./services/orca');
const { bot, shouldInvest, simulateInvestment } = require('./services/bot');
const logger = require('./utils/logger');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
const dataDir = path.join(__dirname, 'data');
fs.ensureDirSync(dataDir);

// Routes
app.get('/api/high-apy-pools', async (req, res) => {
  try {
    const poolsFilePath = path.join(__dirname, 'data', 'highApyPools.json');
    
    // Check if cached data exists
    if (await fs.pathExists(poolsFilePath)) {
      const cachedData = await fs.readJson(poolsFilePath);
      logger.info(`Serving ${cachedData.length} cached high APY pools`);
      
      res.json({
        success: true,
        data: cachedData,
        lastUpdated: cachedData.length > 0 ? cachedData[0].lastFetched : null,
        count: cachedData.length
      });
    } else {
      logger.warn('No cached data found, returning empty array');
      res.json({
        success: true,
        data: [],
        message: 'No high APY pools data available. Please fetch data first.',
        count: 0
      });
    }
  } catch (error) {
    logger.error('Error serving high APY pools:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve high APY pools data'
    });
  }
});

// Endpoint to manually refresh data
app.post('/api/refresh-pools', async (req, res) => {
  try {
    logger.info('Manual refresh requested');
    const pools = await fetchAndCacheOrcaPools();
    
    res.json({
      success: true,
      message: 'Pool data refreshed successfully',
      count: pools.length,
      data: pools
    });
  } catch (error) {
    logger.error('Error refreshing pools:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh pool data'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Solana High APY Pools API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err.message);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Bot control endpoints
app.post('/api/bot/start', async (req, res) => {
  try {
    await bot.initialize();
    await bot.start();
    
    res.json({
      success: true,
      message: 'Bot started successfully',
      status: bot.getStatus()
    });
  } catch (error) {
    logger.error('Error starting bot:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to start bot'
    });
  }
});

app.post('/api/bot/stop', async (req, res) => {
  try {
    bot.stop();
    
    res.json({
      success: true,
      message: 'Bot stopped successfully',
      status: bot.getStatus()
    });
  } catch (error) {
    logger.error('Error stopping bot:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to stop bot'
    });
  }
});

app.get('/api/bot/status', async (req, res) => {
  try {
    res.json({
      success: true,
      status: bot.getStatus()
    });
  } catch (error) {
    logger.error('Error getting bot status:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get bot status'
    });
  }
});

app.get('/api/bot/investments/active', async (req, res) => {
  try {
    const activeInvestments = bot.getActiveInvestments();
    
    res.json({
      success: true,
      data: activeInvestments,
      count: activeInvestments.length
    });
  } catch (error) {
    logger.error('Error getting active investments:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get active investments'
    });
  }
});

app.get('/api/bot/investments/history', async (req, res) => {
  try {
    const investmentHistory = bot.getInvestmentHistory();
    
    res.json({
      success: true,
      data: investmentHistory,
      count: investmentHistory.length
    });
  } catch (error) {
    logger.error('Error getting investment history:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to get investment history'
    });
  }
});

// Manual investment simulation endpoint
app.post('/api/bot/investments/simulate', async (req, res) => {
  try {
    const { poolId, poolName, protocol, apy, price, liquidity, volume_24h } = req.body;
    
    if (!poolId || !poolName || !protocol || apy === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: poolId, poolName, protocol, apy'
      });
    }

    // Create a pool object that matches the expected format
    const pool = {
      id: poolId,
      name: poolName,
      protocol: protocol,
      apy: apy,
      price: price || 1,
      liquidity: liquidity || 1000,
      volume_24h: volume_24h || 100
    };

    // For manual simulation, we'll bypass some checks and create a custom investment
    // Check basic criteria
    if (pool.apy < 0.3) {
      return res.status(400).json({
        success: false,
        error: 'Pool APY must be at least 30% for manual investment'
      });
    }

    if (pool.liquidity < 100) {
      return res.status(400).json({
        success: false,
        error: 'Pool must have at least $100 liquidity'
      });
    }

    // Create investment directly (bypassing shouldInvest for manual simulation)
    const investment = await simulateInvestment(pool);
    
    if (investment) {
      res.json({
        success: true,
        message: 'Investment simulated successfully',
        investment: investment
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to simulate investment'
      });
    }
  } catch (error) {
    logger.error('Error simulating investment:', error.message);
    res.status(500).json({
      success: false,
      error: 'Failed to simulate investment'
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
app.listen(PORT, () => {
  logger.info(`🚀 Solana High APY Pools API server running on port ${PORT}`);
  logger.info(`📊 Health check: http://localhost:${PORT}/api/health`);
  logger.info(`💰 High APY pools: http://localhost:${PORT}/api/high-apy-pools`);
  logger.info(`🤖 Bot control: http://localhost:${PORT}/api/bot/status`);
  
  // Initialize bot
  bot.initialize()
    .then(() => {
      logger.info('✅ Bot initialized successfully');
    })
    .catch((error) => {
      logger.error('❌ Bot initialization failed:', error.message);
    });
  
  // Fetch initial data
  fetchAndCacheOrcaPools()
    .then((pools) => {
      logger.info(`✅ Initial data fetch completed: ${pools.length} high APY pools found`);
    })
    .catch((error) => {
      logger.error('❌ Initial data fetch failed:', error.message);
    });
});

module.exports = app;