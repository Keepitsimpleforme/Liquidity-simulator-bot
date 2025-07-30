const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs-extra');
const { fetchAndCacheOrcaPools } = require('./services/orca');
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