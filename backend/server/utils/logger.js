const fs = require('fs');
const path = require('path');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log levels
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

const CURRENT_LOG_LEVEL = LOG_LEVELS[process.env.LOG_LEVEL?.toUpperCase()] || LOG_LEVELS.INFO;

/**
 * Formats timestamp for logging
 * @returns {string} Formatted timestamp
 */
function getTimestamp() {
  return new Date().toISOString();
}

/**
 * Formats log message with timestamp and level
 * @param {string} level - Log level
 * @param {string} message - Log message
 * @returns {string} Formatted log entry
 */
function formatLogMessage(level, message) {
  return `[${getTimestamp()}] [${level.padEnd(5)}] ${message}`;
}

/**
 * Writes log to file
 * @param {string} level - Log level
 * @param {string} message - Log message
 */
function writeToFile(level, message) {
  const logFile = path.join(logsDir, `app-${new Date().toISOString().split('T')[0]}.log`);
  const logEntry = formatLogMessage(level, message) + '\n';
  
  fs.appendFileSync(logFile, logEntry, 'utf8');
}

/**
 * Generic logging function
 * @param {string} level - Log level
 * @param {number} levelValue - Numeric log level
 * @param {Array} args - Arguments to log
 */
function log(level, levelValue, ...args) {
  if (levelValue > CURRENT_LOG_LEVEL) {
    return;
  }

  const message = args.map(arg => 
    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
  ).join(' ');

  const formattedMessage = formatLogMessage(level, message);
  
  // Console output with colors
  const colors = {
    ERROR: '\x1b[31m', // Red
    WARN: '\x1b[33m',  // Yellow
    INFO: '\x1b[36m',  // Cyan
    DEBUG: '\x1b[37m'  // White
  };
  const resetColor = '\x1b[0m';
  
  console.log(`${colors[level] || ''}${formattedMessage}${resetColor}`);
  
  // File output (only in production or if LOG_TO_FILE is set)
  if (process.env.NODE_ENV === 'production' || process.env.LOG_TO_FILE === 'true') {
    try {
      writeToFile(level, message);
    } catch (error) {
      console.error('Failed to write to log file:', error.message);
    }
  }
}

/**
 * Logger object with different log levels
 */
const logger = {
  error: (...args) => log('ERROR', LOG_LEVELS.ERROR, ...args),
  warn: (...args) => log('WARN', LOG_LEVELS.WARN, ...args),
  info: (...args) => log('INFO', LOG_LEVELS.INFO, ...args),
  debug: (...args) => log('DEBUG', LOG_LEVELS.DEBUG, ...args),
  
  // Utility methods
  logApiCall: (method, url, statusCode, duration) => {
    const message = `${method} ${url} - ${statusCode} (${duration}ms)`;
    if (statusCode >= 400) {
      logger.error(`API Error: ${message}`);
    } else {
      logger.info(`API Call: ${message}`);
    }
  },
  
  logPoolsUpdate: (protocol, count, threshold) => {
    logger.info(`🔄 ${protocol} pools updated: ${count} pools with APY > ${threshold}%`);
  }
};

module.exports = logger;