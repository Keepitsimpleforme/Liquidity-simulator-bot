#!/usr/bin/env node

const axios = require('axios');
const readline = require('readline');

const API_BASE_URL = 'http://localhost:3001/api';

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log(`❌ Error: ${message}`, 'red');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

async function makeRequest(endpoint, method = 'GET', data = null) {
  try {
    const config = {
      method,
      url: `${API_BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error || 'Request failed');
    } else if (error.request) {
      throw new Error('No response from server. Is the server running?');
    } else {
      throw new Error(error.message);
    }
  }
}

async function startBot() {
  try {
    logInfo('Starting liquidity mining bot...');
    const result = await makeRequest('/bot/start', 'POST');
    
    if (result.success) {
      logSuccess('Bot started successfully!');
      displayBotStatus(result.status);
    } else {
      logError('Failed to start bot');
    }
  } catch (error) {
    logError(error.message);
  }
}

async function stopBot() {
  try {
    logInfo('Stopping liquidity mining bot...');
    const result = await makeRequest('/bot/stop', 'POST');
    
    if (result.success) {
      logSuccess('Bot stopped successfully!');
      displayBotStatus(result.status);
    } else {
      logError('Failed to stop bot');
    }
  } catch (error) {
    logError(error.message);
  }
}

async function getBotStatus() {
  try {
    const result = await makeRequest('/bot/status');
    
    if (result.success) {
      displayBotStatus(result.status);
    } else {
      logError('Failed to get bot status');
    }
  } catch (error) {
    logError(error.message);
  }
}

async function getActiveInvestments() {
  try {
    const result = await makeRequest('/bot/investments/active');
    
    if (result.success) {
      displayActiveInvestments(result.data);
    } else {
      logError('Failed to get active investments');
    }
  } catch (error) {
    logError(error.message);
  }
}

async function getInvestmentHistory() {
  try {
    const result = await makeRequest('/bot/investments/history');
    
    if (result.success) {
      displayInvestmentHistory(result.data);
    } else {
      logError('Failed to get investment history');
    }
  } catch (error) {
    logError(error.message);
  }
}

function displayBotStatus(status) {
  console.log('\n' + '='.repeat(50));
  log('🤖 BOT STATUS', 'bright');
  console.log('='.repeat(50));
  
  log(`Status: ${status.isRunning ? '🟢 Running' : '🔴 Stopped'}`, status.isRunning ? 'green' : 'red');
  log(`Active Investments: ${status.activeInvestments}`, 'cyan');
  log(`Total Investments: ${status.totalInvestments}`, 'cyan');
  log(`Successful Exits: ${status.successfulExits}`, 'green');
  log(`Failed Exits: ${status.failedExits}`, 'red');
  log(`Total Profit: $${status.totalProfit.toFixed(2)}`, 'green');
  log(`Total Loss: $${status.totalLoss.toFixed(2)}`, 'red');
  log(`Average Holding Time: ${status.averageHoldingTime.toFixed(2)} hours`, 'yellow');
  
  console.log('\n📊 Configuration:');
  log(`APY Threshold: ${(status.config.HIGH_APY_THRESHOLD * 100).toFixed(1)}%`, 'cyan');
  log(`Investment Amount: $${status.config.INVESTMENT_AMOUNT}`, 'cyan');
  log(`Holding Period: ${status.config.HOLDING_PERIOD_HOURS} hours`, 'cyan');
  log(`Max Active Investments: ${status.config.MAX_ACTIVE_INVESTMENTS}`, 'cyan');
  log(`Check Interval: ${status.config.CHECK_INTERVAL_MINUTES} minutes`, 'cyan');
  console.log('='.repeat(50) + '\n');
}

function displayActiveInvestments(investments) {
  console.log('\n' + '='.repeat(80));
  log('💰 ACTIVE INVESTMENTS', 'bright');
  console.log('='.repeat(80));
  
  if (investments.length === 0) {
    logInfo('No active investments');
    console.log('='.repeat(80) + '\n');
    return;
  }
  
  investments.forEach((inv, index) => {
    const entryTime = new Date(inv.entryTimestamp);
    const holdingTime = ((new Date() - entryTime) / (1000 * 60 * 60)).toFixed(2);
    
    console.log(`\n${index + 1}. ${inv.poolName}`);
    log(`   Investment ID: ${inv.id}`, 'cyan');
    log(`   Protocol: ${inv.protocol}`, 'yellow');
    log(`   Entry APY: ${(inv.entryApy * 100).toFixed(2)}%`, 'green');
    log(`   Investment Amount: $${inv.investmentAmount}`, 'cyan');
    log(`   Entry Time: ${entryTime.toLocaleString()}`, 'blue');
    log(`   Holding Time: ${holdingTime} hours`, 'yellow');
    log(`   Remaining Time: ${(48 - parseFloat(holdingTime)).toFixed(2)} hours`, 'magenta');
  });
  
  console.log('='.repeat(80) + '\n');
}

function displayInvestmentHistory(investments) {
  console.log('\n' + '='.repeat(80));
  log('📈 INVESTMENT HISTORY', 'bright');
  console.log('='.repeat(80));
  
  if (investments.length === 0) {
    logInfo('No investment history');
    console.log('='.repeat(80) + '\n');
    return;
  }
  
  // Sort by exit timestamp (most recent first)
  const sortedInvestments = investments.sort((a, b) => 
    new Date(b.exitTimestamp) - new Date(a.exitTimestamp)
  );
  
  sortedInvestments.slice(0, 10).forEach((inv, index) => {
    const exitTime = new Date(inv.exitTimestamp);
    const profitColor = inv.profitLoss >= 0 ? 'green' : 'red';
    const profitSymbol = inv.profitLoss >= 0 ? '+' : '';
    
    console.log(`\n${index + 1}. ${inv.poolName}`);
    log(`   Investment ID: ${inv.id}`, 'cyan');
    log(`   Protocol: ${inv.protocol}`, 'yellow');
    log(`   Entry APY: ${(inv.entryApy * 100).toFixed(2)}% → Exit APY: ${(inv.exitApy * 100).toFixed(2)}%`, 'blue');
    log(`   Investment Amount: $${inv.investmentAmount}`, 'cyan');
    log(`   Profit/Loss: ${profitSymbol}$${inv.profitLoss.toFixed(2)} (${profitSymbol}${inv.profitLossPercentage.toFixed(2)}%)`, profitColor);
    log(`   Holding Time: ${inv.holdingTimeHours.toFixed(2)} hours`, 'yellow');
    log(`   Exit Time: ${exitTime.toLocaleString()}`, 'blue');
  });
  
  if (investments.length > 10) {
    logInfo(`... and ${investments.length - 10} more investments`);
  }
  
  console.log('='.repeat(80) + '\n');
}

function showMenu() {
  console.log('\n' + '='.repeat(40));
  log('🤖 LIQUIDITY MINING BOT CLI', 'bright');
  console.log('='.repeat(40));
  log('1. Start Bot', 'green');
  log('2. Stop Bot', 'red');
  log('3. Bot Status', 'blue');
  log('4. Active Investments', 'cyan');
  log('5. Investment History', 'yellow');
  log('6. Exit', 'magenta');
  console.log('='.repeat(40));
}

async function handleMenuChoice(choice) {
  switch (choice.trim()) {
    case '1':
      await startBot();
      break;
    case '2':
      await stopBot();
      break;
    case '3':
      await getBotStatus();
      break;
    case '4':
      await getActiveInvestments();
      break;
    case '5':
      await getInvestmentHistory();
      break;
    case '6':
      logInfo('Goodbye!');
      rl.close();
      process.exit(0);
      break;
    default:
      logWarning('Invalid choice. Please select 1-6.');
  }
}

async function main() {
  try {
    // Check if server is running
    await makeRequest('/health');
    logSuccess('Connected to server successfully!');
  } catch (error) {
    logError('Cannot connect to server. Please make sure the server is running on port 3001.');
    logInfo('Start the server with: npm start');
    process.exit(1);
  }
  
  // Main loop
  const runMenu = () => {
    showMenu();
    rl.question('\nSelect an option (1-6): ', async (choice) => {
      await handleMenuChoice(choice);
      runMenu();
    });
  };
  
  runMenu();
}

// Handle Ctrl+C gracefully
rl.on('SIGINT', () => {
  logInfo('Goodbye!');
  rl.close();
  process.exit(0);
});

// Start the CLI
main().catch(error => {
  logError('Unexpected error: ' + error.message);
  process.exit(1);
}); 