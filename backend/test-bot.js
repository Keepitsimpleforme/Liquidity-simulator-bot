#!/usr/bin/env node

const { bot } = require('./server/services/bot');
const fs = require('fs-extra');
const path = require('path');

// Sample high APY pools for testing
const samplePools = [
  {
    id: "test_pool_1",
    name: "TEST/SOL",
    protocol: "Orca",
    apy: 0.45, // 45% APY
    apy_24h: 0.42,
    apy_7d: 0.48,
    apy_30d: 0.45,
    pair: "TEST/SOL",
    mint_account: "test_mint_1",
    liquidity: 5000,
    price: 0.1,
    volume_24h: 200,
    volume_7d: 1500,
    volume_30d: 5000,
    lastUpdated: new Date().toISOString(),
    lastFetched: new Date().toISOString()
  },
  {
    id: "test_pool_2", 
    name: "NEW/SOL",
    protocol: "Orca",
    apy: 0.35, // 35% APY
    apy_24h: 0.33,
    apy_7d: 0.37,
    apy_30d: 0.35,
    pair: "NEW/SOL",
    mint_account: "test_mint_2",
    liquidity: 3000,
    price: 0.05,
    volume_24h: 150,
    volume_7d: 1200,
    volume_30d: 4000,
    lastUpdated: new Date().toISOString(),
    lastFetched: new Date().toISOString()
  }
];

async function setupTestData() {
  console.log('🧪 Setting up test data...');
  
  // Create test pools file
  const poolsFilePath = path.join(__dirname, 'server', 'data', 'highApyPools.json');
  await fs.ensureDir(path.dirname(poolsFilePath));
  await fs.writeJson(poolsFilePath, samplePools, { spaces: 2 });
  
  console.log('✅ Test data created');
}

async function runBotTest() {
  console.log('🤖 Starting bot test...');
  
  // Initialize bot
  await bot.initialize();
  console.log('✅ Bot initialized');
  
  // Start bot
  await bot.start();
  console.log('✅ Bot started');
  
  // Wait a bit for bot to process
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check status
  const status = bot.getStatus();
  console.log('\n📊 Bot Status:');
  console.log(`- Running: ${status.isRunning}`);
  console.log(`- Active Investments: ${status.activeInvestments}`);
  console.log(`- Total Investments: ${status.totalInvestments}`);
  
  // Check active investments
  const activeInvestments = bot.getActiveInvestments();
  console.log('\n💰 Active Investments:');
  if (activeInvestments.length > 0) {
    activeInvestments.forEach((inv, index) => {
      console.log(`${index + 1}. ${inv.poolName} - APY: ${(inv.entryApy * 100).toFixed(2)}%`);
    });
  } else {
    console.log('No active investments');
  }
  
  // Stop bot
  bot.stop();
  console.log('\n⏹️ Bot stopped');
}

async function simulateTimePassage() {
  console.log('\n⏰ Simulating time passage...');
  
  // Create a test investment that's ready to exit
  const testInvestment = {
    id: "test_inv_1",
    poolId: "test_pool_1",
    poolName: "TEST/SOL",
    protocol: "Orca",
    entryApy: 0.45,
    entryPrice: 0.1,
    entryLiquidity: 5000,
    entryVolume24h: 200,
    investmentAmount: 1000,
    entryTimestamp: new Date(Date.now() - 49 * 60 * 60 * 1000).toISOString(), // 49 hours ago
    status: 'active',
    exitTimestamp: null,
    exitApy: null,
    exitPrice: null,
    profitLoss: null,
    profitLossPercentage: null,
    holdingTimeHours: null
  };
  
  // Add to active investments
  bot.activeInvestments.set(testInvestment.poolId, testInvestment);
  
  console.log('✅ Added test investment (49 hours old)');
  
  // Start bot to trigger exit
  await bot.start();
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Check if exit was processed
  const activeInvestments = bot.getActiveInvestments();
  const investmentHistory = bot.getInvestmentHistory();
  
  console.log(`\n📊 After exit processing:`);
  console.log(`- Active Investments: ${activeInvestments.length}`);
  console.log(`- Investment History: ${investmentHistory.length}`);
  
  if (investmentHistory.length > 0) {
    const lastExit = investmentHistory[investmentHistory.length - 1];
    console.log(`- Last Exit: ${lastExit.poolName} - P&L: $${lastExit.profitLoss?.toFixed(2) || 'N/A'}`);
  }
  
  bot.stop();
}

async function main() {
  try {
    console.log('🚀 Starting Liquidity Mining Bot Test\n');
    
    // Setup test data
    await setupTestData();
    
    // Run basic bot test
    await runBotTest();
    
    // Simulate time passage and exit
    await simulateTimePassage();
    
    console.log('\n✅ Test completed successfully!');
    console.log('\n📝 To run the full bot:');
    console.log('1. Start server: npm start');
    console.log('2. Use CLI: npm run bot');
    console.log('3. Or use API endpoints directly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
main(); 