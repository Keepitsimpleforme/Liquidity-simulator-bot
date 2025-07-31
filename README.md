# 🤖 Liquidity Mining Simulator

A comprehensive DeFi liquidity mining simulation platform with automated bot functionality for identifying and simulating high-yield opportunities on Solana blockchain.

## 🎯 Features

### Backend (Node.js/Express)
- **High APY Pool Detection**: Automatically fetches and filters pools with APY > 30%
- **Automated Trading Bot**: Simulates investments with configurable parameters
- **Real-time Monitoring**: Tracks active investments and performance metrics
- **Data Persistence**: Stores investment history and bot statistics
- **RESTful API**: Complete API for bot control and data access
- **CLI Interface**: Interactive command-line tool for bot management

### Frontend (Next.js/React)
- **Modern Dashboard**: Beautiful UI for monitoring pools and bot status
- **Real-time Updates**: Live data refresh and status monitoring
- **Responsive Design**: Works on desktop and mobile devices
- **Dark Mode**: Toggle between light and dark themes
- **Interactive Charts**: Visual representation of performance metrics

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd liquidity-simulator
```

### 2. Backend Setup
```bash
cd backend
npm install
npm start
```

The backend will start on `http://localhost:3001` and automatically:
- Initialize the bot
- Fetch high APY pools from Orca
- Set up API endpoints

### 3. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

The frontend will start on `http://localhost:3000`

### 4. Control the Bot

#### Using the CLI (Recommended)
```bash
cd backend
npm run bot
```

#### Using the Web Interface
Navigate to `http://localhost:3000/bot` for the bot dashboard

#### Using API Endpoints
```bash
# Start the bot
curl -X POST http://localhost:3001/api/bot/start

# Check status
curl http://localhost:3001/api/bot/status

# Get active investments
curl http://localhost:3001/api/bot/investments/active
```

## 📊 Bot Configuration

The bot uses the following default configuration:

```javascript
{
  HIGH_APY_THRESHOLD: 0.30,        // 30% APY threshold
  INVESTMENT_AMOUNT: 1000,          // $1,000 per investment
  HOLDING_PERIOD_HOURS: 48,         // 48 hours holding period
  MAX_ACTIVE_INVESTMENTS: 10,       // Max simultaneous investments
  MIN_LIQUIDITY: 100,               // Minimum liquidity in USD
  MIN_VOLUME_24H: 50,               // Minimum 24h volume in USD
  CHECK_INTERVAL_MINUTES: 15        // Check frequency
}
```

## 🔧 API Endpoints

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

### Health Check
- `GET /api/health` - Server health status

## 🤖 Bot Logic

### Decision Phase
1. **APY Threshold**: Identifies pools with APY > 30%
2. **Liquidity Check**: Ensures minimum $100 liquidity
3. **Volume Check**: Requires minimum $50 24h volume
4. **Age Filter**: Focuses on pools launched within 7 days
5. **Duplicate Prevention**: Avoids investing in same pool twice

### Investment Phase
- Simulates $1,000 investment per opportunity
- Records comprehensive investment details
- Tracks entry APY, timestamp, and protocol source

### Holding Phase
- Holds investments for exactly 48 hours
- Monitors APY changes during holding period
- Tracks liquidity and volume changes

### Exit Phase
- Automatically exits after 48-hour holding period
- Calculates profit/loss based on APY changes
- Updates statistics and investment history

## 📁 Project Structure

```
liquidity-simulator/
├── backend/
│   ├── server/
│   │   ├── services/
│   │   │   ├── bot.js          # Bot logic
│   │   │   └── orca.js         # Orca API integration
│   │   ├── data/               # Data storage
│   │   ├── logs/               # Activity logs
│   │   └── index.js            # Main server
│   ├── bot-cli.js              # CLI interface
│   ├── test-bot.js             # Test script
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx            # Main dashboard
│   │   └── bot/
│   │       └── page.tsx        # Bot dashboard
│   ├── components/
│   │   ├── bot-dashboard.tsx   # Bot dashboard component
│   │   └── ui/                 # UI components
│   └── package.json
└── README.md
```

## 🧪 Testing

### Run Bot Tests
```bash
cd backend
npm test
```

### Manual Testing
```bash
# Test the bot with sample data
cd backend
node test-bot.js
```

## 📈 Monitoring

### Real-time Monitoring
- **Web Dashboard**: `http://localhost:3000/bot`
- **CLI Interface**: `npm run bot` in backend directory
- **API Endpoints**: Direct API access for integration

### Logs and Data
- **Activity Logs**: `backend/server/logs/botActivity.log`
- **Investment Data**: `backend/server/data/botInvestments.json`
- **Pool Data**: `backend/server/data/highApyPools.json`

## 🔒 Safety Features

- **Simulation Only**: No real funds are used
- **Rate Limiting**: Prevents API abuse
- **Error Handling**: Graceful failure recovery
- **Data Persistence**: Survives server restarts
- **Complete Logging**: Full audit trail

## 🛠️ Development

### Adding New Protocols
1. Create new service in `backend/server/services/`
2. Implement pool fetching logic
3. Update bot to use multiple data sources
4. Add protocol-specific filtering

### Customizing Investment Strategy
Modify `shouldInvest()` method in `backend/server/services/bot.js`:

```javascript
async shouldInvest(pool) {
  // Add your custom logic here
  // Return true to invest, false to skip
}
```

### Frontend Development
- Built with Next.js 14 and React
- Uses Tailwind CSS for styling
- Includes shadcn/ui components
- Supports dark/light mode

## 🚨 Troubleshooting

### Common Issues

1. **Server not starting**
   - Check if port 3001 is available
   - Ensure all dependencies are installed
   - Check Node.js version (18+ required)

2. **Bot not finding opportunities**
   - Verify pool data is being fetched
   - Check APY threshold settings
   - Ensure pools meet liquidity/volume requirements

3. **Frontend connection issues**
   - Verify backend is running on port 3001
   - Check CORS settings
   - Ensure API endpoints are accessible

4. **CLI connection issues**
   - Verify server is running on port 3001
   - Check network connectivity
   - Ensure axios is installed

### Debug Mode
```bash
# Backend debug
NODE_ENV=development npm start

# Frontend debug
npm run dev
```

## 📝 Scripts

### Backend Scripts
```bash
npm start          # Start the server
npm run dev        # Development mode
npm run bot        # Start CLI interface
npm test           # Run bot tests
```

### Frontend Scripts
```bash
npm run dev        # Development server
npm run build      # Production build
npm run start      # Production server
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This project is for **educational and simulation purposes only**. No real funds are used in any transactions. The bot simulates investments but does not execute actual trades. Always do your own research before making any investment decisions.

## 📞 Support

For issues and questions:
- Check the troubleshooting section
- Review the logs in `backend/server/logs/`
- Open an issue on GitHub
- Check the documentation in `backend/BOT_README.md`

---

**Happy Trading! 🚀** 