const fs = require('fs-extra');
const path = require('path');
const logger = require('../utils/logger');

// Bot configuration
const BOT_CONFIG = {
  HIGH_APY_THRESHOLD: 0.30, // 30% APY threshold
  INVESTMENT_AMOUNT: 1000, // $1,000 per investment
  HOLDING_PERIOD_HOURS: 48, // 48 hours holding period
  MAX_ACTIVE_INVESTMENTS: 10, // Maximum number of simultaneous investments
  MIN_LIQUIDITY: 100, // Minimum liquidity in USD
  MIN_VOLUME_24H: 50, // Minimum 24h volume in USD
  CHECK_INTERVAL_MINUTES: 15, // How often to check for new opportunities
  DATA_FILE_PATH: path.join(__dirname, '..', 'data', 'botInvestments.json'),
  LOG_FILE_PATH: path.join(__dirname, '..', 'logs', 'botActivity.log')
};

class LiquidityMiningBot {
  constructor() {
    this.activeInvestments = new Map();
    this.investmentHistory = [];
    this.isRunning = false;
    this.stats = {
      totalInvestments: 0,
      successfulExits: 0,
      failedExits: 0,
      totalProfit: 0,
      totalLoss: 0,
      averageHoldingTime: 0
    };
  }

  /**
   * Initialize the bot and load existing data
   */
  async initialize() {
    try {
      // Ensure data directory exists
      await fs.ensureDir(path.dirname(BOT_CONFIG.DATA_FILE_PATH));
      await fs.ensureDir(path.dirname(BOT_CONFIG.LOG_FILE_PATH));

      // Load existing investments
      await this.loadInvestments();
      
      logger.info('🤖 Liquidity Mining Bot initialized successfully');
      logger.info(`📊 Configuration: APY > ${(BOT_CONFIG.HIGH_APY_THRESHOLD * 100).toFixed(1)}%, Investment: $${BOT_CONFIG.INVESTMENT_AMOUNT}, Hold: ${BOT_CONFIG.HOLDING_PERIOD_HOURS}h`);
      
      return true;
    } catch (error) {
      logger.error('Failed to initialize bot:', error.message);
      return false;
    }
  }

  /**
   * Start the bot
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🚀 Starting Liquidity Mining Bot...');

    // Start the main bot loop
    this.runBotLoop();
  }

  /**
   * Stop the bot
   */
  stop() {
    this.isRunning = false;
    logger.info('⏹️ Bot stopped');
  }

  /**
   * Main bot loop
   */
  async runBotLoop() {
    while (this.isRunning) {
      try {
        // Check for exit opportunities
        await this.checkForExits();
        
        // Check for new investment opportunities
        if (this.activeInvestments.size < BOT_CONFIG.MAX_ACTIVE_INVESTMENTS) {
          await this.checkForNewOpportunities();
        }

        // Wait before next check
        await this.sleep(BOT_CONFIG.CHECK_INTERVAL_MINUTES * 60 * 1000);
      } catch (error) {
        logger.error('Error in bot loop:', error.message);
        await this.sleep(60000); // Wait 1 minute on error
      }
    }
  }

  /**
   * Decision Phase: Check for new high-yield opportunities
   */
  async checkForNewOpportunities() {
    try {
      const pools = await this.getHighApyPools();
      
      for (const pool of pools) {
        if (await this.shouldInvest(pool)) {
          await this.simulateInvestment(pool);
        }
      }
    } catch (error) {
      logger.error('Error checking for new opportunities:', error.message);
    }
  }

  /**
   * Get high APY pools from the existing service
   */
  async getHighApyPools() {
    try {
      const poolsFilePath = path.join(__dirname, '..', 'data', 'highApyPools.json');
      
      if (await fs.pathExists(poolsFilePath)) {
        const pools = await fs.readJson(poolsFilePath);
        return pools.filter(pool => pool.apy >= BOT_CONFIG.HIGH_APY_THRESHOLD);
      }
      
      return [];
    } catch (error) {
      logger.error('Error getting high APY pools:', error.message);
      return [];
    }
  }

  /**
   * Decision logic: Determine if we should invest in a pool
   */
  async shouldInvest(pool) {
    // Check if we already have an investment in this pool
    if (this.activeInvestments.has(pool.id)) {
      return false;
    }

    // Check APY threshold
    if (pool.apy < BOT_CONFIG.HIGH_APY_THRESHOLD) {
      return false;
    }

    // Check liquidity requirements
    if (pool.liquidity < BOT_CONFIG.MIN_LIQUIDITY) {
      return false;
    }

    // Check volume requirements
    if (pool.volume_24h < BOT_CONFIG.MIN_VOLUME_24H) {
      return false;
    }

    // Check if pool is relatively new (launched within last 7 days)
    const poolAge = this.getPoolAge(pool);
    if (poolAge > 7) {
      return false;
    }

    return true;
  }

  /**
   * Investment Phase: Simulate investment in a pool
   */
  async simulateInvestment(pool) {
    try {
      const investment = {
        id: this.generateInvestmentId(),
        poolId: pool.id,
        poolName: pool.name,
        protocol: pool.protocol,
        entryApy: pool.apy,
        entryPrice: pool.price,
        entryLiquidity: pool.liquidity,
        entryVolume24h: pool.volume_24h,
        investmentAmount: BOT_CONFIG.INVESTMENT_AMOUNT,
        entryTimestamp: new Date().toISOString(),
        status: 'active',
        exitTimestamp: null,
        exitApy: null,
        exitPrice: null,
        profitLoss: null,
        profitLossPercentage: null,
        holdingTimeHours: null
      };

      // Add to active investments
      this.activeInvestments.set(pool.id, investment);
      
      // Log investment
      this.logInvestment(investment, 'INVESTMENT');
      
      logger.info(`💰 New investment: ${pool.name} (APY: ${(pool.apy * 100).toFixed(2)}%)`);
      
      // Save to file
      await this.saveInvestments();
      
      return investment;
    } catch (error) {
      logger.error('Error simulating investment:', error.message);
      return null;
    }
  }

  /**
   * Holding Phase: Check for exit opportunities
   */
  async checkForExits() {
    const now = new Date();
    const investmentsToExit = [];

    for (const [poolId, investment] of this.activeInvestments) {
      const entryTime = new Date(investment.entryTimestamp);
      const holdingTimeHours = (now - entryTime) / (1000 * 60 * 60);

      // Exit after holding period
      if (holdingTimeHours >= BOT_CONFIG.HOLDING_PERIOD_HOURS) {
        investmentsToExit.push(investment);
      }
    }

    // Process exits
    for (const investment of investmentsToExit) {
      await this.simulateExit(investment);
    }
  }

  /**
   * Exit Phase: Simulate selling the investment
   */
  async simulateExit(investment) {
    try {
      // Get current pool data
      const currentPool = await this.getCurrentPoolData(investment.poolId);
      
      const exitData = {
        exitTimestamp: new Date().toISOString(),
        exitApy: currentPool ? currentPool.apy : investment.entryApy,
        exitPrice: currentPool ? currentPool.price : investment.entryPrice,
        holdingTimeHours: this.calculateHoldingTime(investment.entryTimestamp)
      };

      // Calculate profit/loss based on APY change
      const apyChange = exitData.exitApy - investment.entryApy;
      const apyChangePercentage = (apyChange / investment.entryApy) * 100;
      
      // Simulate profit/loss (simplified calculation)
      const profitLoss = (apyChangePercentage / 100) * investment.investmentAmount;
      const profitLossPercentage = apyChangePercentage;

      // Update investment with exit data
      const updatedInvestment = {
        ...investment,
        ...exitData,
        profitLoss,
        profitLossPercentage,
        status: 'exited'
      };

      // Remove from active investments
      this.activeInvestments.delete(investment.poolId);
      
      // Add to history
      this.investmentHistory.push(updatedInvestment);
      
      // Update stats
      this.updateStats(updatedInvestment);
      
      // Log exit
      this.logInvestment(updatedInvestment, 'EXIT');
      
      logger.info(`📈 Exit: ${investment.poolName} - P&L: $${profitLoss.toFixed(2)} (${profitLossPercentage.toFixed(2)}%)`);
      
      // Save to file
      await this.saveInvestments();
      
      return updatedInvestment;
    } catch (error) {
      logger.error('Error simulating exit:', error.message);
      return null;
    }
  }

  /**
   * Get current pool data (simplified - in real implementation, fetch from API)
   */
  async getCurrentPoolData(poolId) {
    try {
      const poolsFilePath = path.join(__dirname, '..', 'data', 'highApyPools.json');
      
      if (await fs.pathExists(poolsFilePath)) {
        const pools = await fs.readJson(poolsFilePath);
        return pools.find(pool => pool.id === poolId);
      }
      
      return null;
    } catch (error) {
      logger.error('Error getting current pool data:', error.message);
      return null;
    }
  }

  /**
   * Calculate holding time in hours
   */
  calculateHoldingTime(entryTimestamp) {
    const entryTime = new Date(entryTimestamp);
    const now = new Date();
    return (now - entryTime) / (1000 * 60 * 60);
  }

  /**
   * Get pool age in days
   */
  getPoolAge(pool) {
    // Simplified - in real implementation, you'd track when pools were created
    // For now, we'll use a random age between 0-30 days
    return Math.random() * 30;
  }

  /**
   * Update bot statistics
   */
  updateStats(investment) {
    this.stats.totalInvestments++;
    
    if (investment.profitLoss > 0) {
      this.stats.successfulExits++;
      this.stats.totalProfit += investment.profitLoss;
    } else {
      this.stats.failedExits++;
      this.stats.totalLoss += Math.abs(investment.profitLoss);
    }
    
    // Update average holding time
    const totalHoldingTime = this.investmentHistory.reduce((sum, inv) => sum + inv.holdingTimeHours, 0);
    this.stats.averageHoldingTime = totalHoldingTime / this.investmentHistory.length;
  }

  /**
   * Generate unique investment ID
   */
  generateInvestmentId() {
    return `inv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log investment activity
   */
  logInvestment(investment, action) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      action,
      investment: {
        id: investment.id,
        poolName: investment.poolName,
        entryApy: investment.entryApy,
        investmentAmount: investment.investmentAmount,
        profitLoss: investment.profitLoss,
        profitLossPercentage: investment.profitLossPercentage
      }
    };

    // Write to log file
    fs.appendFileSync(BOT_CONFIG.LOG_FILE_PATH, JSON.stringify(logEntry) + '\n');
  }

  /**
   * Load investments from file
   */
  async loadInvestments() {
    try {
      if (await fs.pathExists(BOT_CONFIG.DATA_FILE_PATH)) {
        const data = await fs.readJson(BOT_CONFIG.DATA_FILE_PATH);
        
        // Load active investments
        this.activeInvestments = new Map();
        if (data.activeInvestments) {
          for (const [key, value] of Object.entries(data.activeInvestments)) {
            this.activeInvestments.set(key, value);
          }
        }
        
        // Load investment history
        this.investmentHistory = data.investmentHistory || [];
        
        // Load stats
        this.stats = data.stats || this.stats;
        
        logger.info(`📊 Loaded ${this.activeInvestments.size} active investments and ${this.investmentHistory.length} historical investments`);
      }
    } catch (error) {
      logger.error('Error loading investments:', error.message);
    }
  }

  /**
   * Save investments to file
   */
  async saveInvestments() {
    try {
      const data = {
        activeInvestments: Object.fromEntries(this.activeInvestments),
        investmentHistory: this.investmentHistory,
        stats: this.stats,
        lastUpdated: new Date().toISOString()
      };
      
      await fs.writeJson(BOT_CONFIG.DATA_FILE_PATH, data, { spaces: 2 });
    } catch (error) {
      logger.error('Error saving investments:', error.message);
    }
  }

  /**
   * Get bot status and statistics
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      activeInvestments: this.activeInvestments.size,
      totalInvestments: this.stats.totalInvestments,
      successfulExits: this.stats.successfulExits,
      failedExits: this.stats.failedExits,
      totalProfit: this.stats.totalProfit,
      totalLoss: this.stats.totalLoss,
      averageHoldingTime: this.stats.averageHoldingTime,
      config: BOT_CONFIG
    };
  }

  /**
   * Get active investments
   */
  getActiveInvestments() {
    return Array.from(this.activeInvestments.values());
  }

  /**
   * Get investment history
   */
  getInvestmentHistory() {
    return this.investmentHistory;
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Create singleton instance
const bot = new LiquidityMiningBot();

module.exports = {
  bot,
  LiquidityMiningBot,
  BOT_CONFIG,
  // Export methods for manual investment simulation
  shouldInvest: (pool) => bot.shouldInvest(pool),
  simulateInvestment: (pool) => bot.simulateInvestment(pool)
}; 