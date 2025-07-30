const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

const ORCA_API_URL = 'https://api.orca.so/pools';
const HIGH_APY_THRESHOLD = 0.05; // 5% APY threshold (API returns decimal values)
const CACHE_FILE_PATH = path.join(__dirname, '..', 'data', 'highApyPools.json');

/**
 * Fetches pool data from Orca API
 * @returns {Promise<Array>} Raw pool data from Orca API
 */
async function fetchOrcaPools() {
  try {
    logger.info('Fetching pools from Orca API...');
    const response = await axios.get(ORCA_API_URL, {
      timeout: 30000, // 30 second timeout
      headers: {
        'User-Agent': 'Solana-High-APY-Tracker/1.0'
      }
    });

    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid response format from Orca API');
    }

    logger.info(`Successfully fetched ${response.data.length} pools from Orca API`);
    return response.data;
  } catch (error) {
    if (error.response) {
      logger.error(`Orca API request failed with status ${error.response.status}: ${error.response.statusText}`);
    } else if (error.request) {
      logger.error('No response received from Orca API:', error.message);
    } else {
      logger.error('Error setting up Orca API request:', error.message);
    }
    throw new Error(`Failed to fetch pools from Orca API: ${error.message}`);
  }
}

/**
 * Filters pools to only include those with high APY
 * @param {Array} pools - Array of pool objects from Orca API
 * @returns {Array} Filtered pools with APY > threshold
 */
function filterHighApyPools(pools) {
  const highApyPools = pools.filter(pool => {
    // Check the actual APY fields from Orca API (they use decimal format)
    const apy = pool.apy_30d || pool.apy_7d || pool.apy_24h || 0;
    const apyValue = typeof apy === 'number' ? apy : parseFloat(apy) || 0;
    
    return apyValue > HIGH_APY_THRESHOLD;
  });

  logger.info(`Filtered ${highApyPools.length} pools with APY > ${(HIGH_APY_THRESHOLD * 100).toFixed(1)}% from ${pools.length} total pools`);
  return highApyPools;
}

/**
 * Processes and enriches pool data with additional metadata
 * @param {Array} pools - Filtered high APY pools
 * @returns {Array} Processed pools with additional metadata
 */
function processPoolData(pools) {
  const currentTime = new Date().toISOString();
  
  return pools.map(pool => ({
    // Core pool information
    id: pool.account || pool.mint_account,
    name: pool.name || pool.name2 || 'Unknown Pool',
    protocol: 'Orca',
    
    // APY information
    apy: pool.apy_30d || pool.apy_7d || pool.apy_24h || 0,
    apy_24h: pool.apy_24h || 0,
    apy_7d: pool.apy_7d || 0,
    apy_30d: pool.apy_30d || 0,
    
    // Token information (extracted from name)
    pair: pool.name || pool.name2 || 'Unknown',
    mint_account: pool.mint_account || null,
    
    // Liquidity information
    liquidity: pool.liquidity || 0,
    price: pool.price || 0,
    volume_24h: pool.volume_24h || 0,
    volume_7d: pool.volume_7d || 0,
    volume_30d: pool.volume_30d || 0,
    
    // Additional metadata
    lastUpdated: pool.lastUpdated || currentTime,
    lastFetched: currentTime,
    
    // Raw data for debugging (optional)
    _raw: process.env.NODE_ENV === 'development' ? pool : undefined
  })).filter(pool => pool.id); // Remove pools without valid IDs
}

/**
 * Saves processed pool data to local cache file
 * @param {Array} pools - Processed pool data
 */
async function savePoolsToCache(pools) {
  try {
    // Ensure data directory exists
    await fs.ensureDir(path.dirname(CACHE_FILE_PATH));
    
    // Add metadata to the cache
    const cacheData = {
      lastUpdated: new Date().toISOString(),
      totalPools: pools.length,
      threshold: HIGH_APY_THRESHOLD,
      protocol: 'Orca',
      pools: pools
    };
    
    await fs.writeJson(CACHE_FILE_PATH, pools, { spaces: 2 });
    logger.info(`Successfully cached ${pools.length} high APY pools to ${CACHE_FILE_PATH}`);
  } catch (error) {
    logger.error('Error saving pools to cache:', error.message);
    throw new Error(`Failed to save pools to cache: ${error.message}`);
  }
}

/**
 * Main function to fetch, filter, and cache Orca pools
 * @returns {Promise<Array>} Processed high APY pools
 */
async function fetchAndCacheOrcaPools() {
  try {
    logger.info(`Starting Orca pools fetch and cache process (APY threshold: ${(HIGH_APY_THRESHOLD * 100).toFixed(1)}%)`);
    
    // Fetch raw pool data
    const rawPools = await fetchOrcaPools();
    
    // Filter for high APY pools
    const highApyPools = filterHighApyPools(rawPools);
    
    if (highApyPools.length === 0) {
      logger.warn(`No pools found with APY > ${(HIGH_APY_THRESHOLD * 100).toFixed(1)}%`);
      await savePoolsToCache([]);
      return [];
    }
    
    // Process and enrich pool data
    const processedPools = processPoolData(highApyPools);
    
    // Save to cache
    await savePoolsToCache(processedPools);
    
    logger.info(`✅ Successfully processed and cached ${processedPools.length} high APY pools`);
    return processedPools;
    
  } catch (error) {
    logger.error('Error in fetchAndCacheOrcaPools:', error.message);
    throw error;
  }
}

/**
 * Gets cached pool data if available
 * @returns {Promise<Array>} Cached pool data or empty array
 */
async function getCachedPools() {
  try {
    if (await fs.pathExists(CACHE_FILE_PATH)) {
      const cachedData = await fs.readJson(CACHE_FILE_PATH);
      return Array.isArray(cachedData) ? cachedData : [];
    }
    return [];
  } catch (error) {
    logger.error('Error reading cached pools:', error.message);
    return [];
  }
}

module.exports = {
  fetchAndCacheOrcaPools,
  getCachedPools,
  HIGH_APY_THRESHOLD
};