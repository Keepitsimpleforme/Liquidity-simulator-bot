# 🤖 Liquidity Mining Bot

A sophisticated bot for simulating high-yield liquidity mining opportunities on Solana DeFi protocols. The bot automatically identifies, invests in, and exits from high-APY pools based on configurable parameters.

## 🎯 Features

### Decision Phase
- **APY Threshold**: Automatically identifies pools with APY > 30% (configurable)
- **New Pool Detection**: Focuses on pools launched within the first 7 days
- **Risk Management**: Filters pools based on liquidity and volume requirements
- **Duplicate Prevention**: Avoids investing in the same pool multiple times

### Investment Phase
- **Fixed Investment**: Simulates $1,000 investment per opportunity
- **Comprehensive Logging**: Records token name, entry APY, timestamp, and protocol source
- **Real-time Tracking**: Monitors active investments and their performance

### Holding Phase
- **48-Hour Strategy**: Holds each investment for exactly 48 hours
- **Performance Tracking**: Monitors APY changes during holding period
- **Market Analysis**: Tracks liquidity and volume changes

### Exit Phase
- **Automatic Exit**: Sells after 48-hour holding period
- **Profit/Loss Calculation**: Calculates returns based on APY changes
- **Performance Analytics**: Tracks success rate and average returns
- **Historical Data**: Maintains complete investment history

## 🚀 Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Start the Server
```bash
npm start
```

The server will start on port 3001 and automatically:
- Initialize the bot
- Fetch high APY pools from Orca
- Set up API endpoints

### 3. Control the Bot

#### Using the CLI (Recommended)
```bash
npm run bot
```

This opens an interactive CLI with options to:
- Start/Stop the bot
- Check bot status
- View active investments
- View investment history

#### Using API Endpoints
```bash
# Start the bot
curl -X POST http://localhost:3001/api/bot/start

# Stop the bot
curl -X POST http://localhost:3001/api/bot/stop

# Check bot status
curl http://localhost:3001/api/bot/status

# Get active investments
curl http://localhost:3001/api/bot/investments/active

# Get investment history
curl http://localhost:3001/api/bot/investments/history
```

## ⚙️ Configuration

The bot configuration is defined in `server/services/bot.js`:

```javascript
const BOT_CONFIG = {
  HIGH_APY_THRESHOLD: 0.30,        // 30% APY threshold
  INVESTMENT_AMOUNT: 1000,          // $1,000 per investment
  HOLDING_PERIOD_HOURS: 48,         // 48 hours holding period
  MAX_ACTIVE_INVESTMENTS: 10,       // Max simultaneous investments
  MIN_LIQUIDITY: 100,               // Minimum liquidity in USD
  MIN_VOLUME_24H: 50,               // Minimum 24h volume in USD
  CHECK_INTERVAL_MINUTES: 15        // Check frequency
};
```

## 📊 API Endpoints

### Bot Control
- `POST /api/bot/start` - Start the bot
- `POST /api/bot/stop` - Stop the bot
- `GET /api/bot/status` - Get bot status and statistics

### Investment Data
- `GET /api/bot/investments/active` - Get active investments
- `GET /api/bot/investments/history` - Get investment history

### Pool Data
- `GET /api/high-apy-pools` - Get high APY pools
- `POST /api/refresh-pools` - Refresh pool data

## 📈 Bot Statistics

The bot tracks comprehensive statistics:

- **Total Investments**: Number of investments made
- **Successful Exits**: Profitable investments
- **Failed Exits**: Loss-making investments
- **Total Profit/Loss**: Overall performance
- **Average Holding Time**: Average time investments were held
- **Active Investments**: Currently held positions

## 🔍 Investment Logic

### Entry Criteria
1. **APY > 30%**: Pool must have high yield
2. **Sufficient Liquidity**: Minimum $100 liquidity
3. **Active Trading**: Minimum $50 24h volume
4. **New Pool**: Launched within last 7 days
5. **No Duplicate**: Not already invested in this pool

### Exit Strategy
- **Time-based**: Exit after exactly 48 hours
- **Performance-based**: Calculate P&L based on APY changes
- **Risk Management**: Maximum 10 simultaneous investments

## 📁 Data Storage

The bot stores data in JSON files:

- `server/data/botInvestments.json` - Investment data
- `server/logs/botActivity.log` - Activity logs
- `server/data/highApyPools.json` - Pool data cache

## 🛠️ Development

### Project Structure
```
backend/
├── server/
│   ├── services/
│   │   ├── bot.js          # Bot logic
│   │   └── orca.js         # Orca API integration
│   ├── data/               # Data storage
│   ├── logs/               # Activity logs
│   └── index.js            # Main server
├── bot-cli.js              # CLI interface
└── package.json
```

### Adding New Protocols

To add support for additional protocols:

1. Create a new service in `server/services/`
2. Implement pool fetching logic
3. Update the bot to use multiple data sources
4. Add protocol-specific filtering logic

### Customizing Investment Strategy

Modify the `shouldInvest()` method in `bot.js` to implement custom criteria:

```javascript
async shouldInvest(pool) {
  // Add your custom logic here
  // Return true to invest, false to skip
}
```

## 🔒 Safety Features

- **Simulation Only**: No real funds are used
- **Rate Limiting**: Prevents API abuse
- **Error Handling**: Graceful failure recovery
- **Data Persistence**: Survives server restarts
- **Logging**: Complete audit trail

## 📊 Monitoring

### Real-time Monitoring
- Check bot status via CLI or API
- Monitor active investments
- Track performance metrics

### Log Analysis
- Activity logs in `server/logs/botActivity.log`
- Investment data in `server/data/botInvestments.json`
- Pool data in `server/data/highApyPools.json`

## 🚨 Troubleshooting

### Common Issues

1. **Server not starting**
   - Check if port 3001 is available
   - Ensure all dependencies are installed

2. **Bot not finding opportunities**
   - Check if pool data is being fetched
   - Verify APY threshold settings
   - Ensure pools meet liquidity/volume requirements

3. **CLI connection issues**
   - Verify server is running on port 3001
   - Check network connectivity

### Debug Mode

Enable debug logging by setting environment variable:
```bash
NODE_ENV=development npm start
```

## 📝 License

MIT License - See LICENSE file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the logs in `server/logs/`
- Open an issue on GitHub

---

**⚠️ Disclaimer**: This bot is for educational and simulation purposes only. No real funds are used. Always do your own research before making any investment decisions. 