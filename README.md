# 🚀 Liquidity Simulator Bot

A sophisticated automated liquidity mining bot that monitors high-yield opportunities in the Solana ecosystem and simulates profit-maximizing yield farming strategies.

## 🌟 Features

### 🤖 **Automated Bot Features**
- **Real-time Monitoring**: Continuously monitors Orca DEX for new high-yield pools
- **Smart Investment Logic**: Automatically invests in pools with >30% APY
- **Risk Management**: Implements liquidity and volume thresholds
- **48-Hour Holding Strategy**: Optimized exit timing for maximum profits
- **Portfolio Management**: Tracks up to 10 simultaneous investments

### 📊 **Frontend Dashboard**
- **Real-time Pool Data**: Live APY, liquidity, and volume metrics
- **Interactive Filtering**: Filter by chain, APY range, and search terms
- **Manual Investment Simulation**: Click to simulate $1,000 investments
- **Bot Dashboard**: Monitor active investments and performance
- **Responsive Design**: Works on desktop and mobile devices

### 🔧 **Backend API**
- **RESTful API**: Complete API for pool data and bot control
- **Real-time Data**: Fetches and caches Orca pool data every 15 minutes
- **Investment Tracking**: Persistent storage of all investments
- **Performance Analytics**: Comprehensive profit/loss tracking

## 🛠️ Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Next.js 15 + React + TypeScript
- **UI Components**: Shadcn/ui + Tailwind CSS
- **Data Source**: Orca DEX API
- **Storage**: JSON files for data persistence

## 📋 Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **pnpm** package manager
- **Git**

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone <your-repo-url>
cd liquidity-simulator
```

### 2. Install Dependencies

#### Backend Dependencies
```bash
cd backend
npm install
```

#### Frontend Dependencies
```bash
cd frontend
npm install
```

### 3. Start the Backend Server

```bash
cd backend
node server/index.js
```

**Backend will start on:** `http://localhost:3001`

**Available API Endpoints:**
- `GET /api/health` - Health check
- `GET /api/high-apy-pools` - Get all high APY pools
- `GET /api/bot/status` - Bot status and statistics
- `GET /api/bot/investments/active` - Active investments
- `GET /api/bot/investments/history` - Investment history
- `POST /api/bot/investments/simulate` - Manual investment simulation

### 4. Start the Frontend Server

```bash
cd frontend
npm run dev
```

**Frontend will start on:** `http://localhost:3000`

## 🎯 How to Use

### **Main Dashboard** (`http://localhost:3000`)
1. **Browse Pools**: View all high APY liquidity pools from Orca
2. **Filter & Search**: Use filters to find specific pools
3. **Simulate Investment**: Click "Simulate Investment" on any pool with >30% APY
4. **View Results**: See investment confirmation and details

### **Bot Dashboard** (`http://localhost:3000/bot`)
1. **Monitor Active Investments**: View all current bot investments
2. **Performance Tracking**: See profit/loss for each investment
3. **Bot Statistics**: Overall performance metrics
4. **Investment History**: Complete history of all trades

## 🔧 Bot Configuration

The bot is configured with the following parameters (in `backend/server/services/bot.js`):

```javascript
const BOT_CONFIG = {
  HIGH_APY_THRESHOLD: 0.30,        // 30% APY minimum
  INVESTMENT_AMOUNT: 1000,         // $1,000 per investment
  HOLDING_PERIOD_HOURS: 48,        // 48 hours holding period
  MAX_ACTIVE_INVESTMENTS: 10,      // Max simultaneous investments
  MIN_LIQUIDITY: 100,              // Minimum $100 liquidity
  MIN_VOLUME_24H: 50,              // Minimum $50 24h volume
  CHECK_INTERVAL_MINUTES: 15       // Check every 15 minutes
};
```

## 📊 Investment Strategy

### **Entry Criteria**
- APY > 30%
- Liquidity > $100
- 24h Volume > $50
- Pool age < 7 days

### **Exit Strategy**
- Automatic exit after 48 hours
- Profit/loss calculation based on APY changes
- Performance tracking and analytics

## 🔍 API Documentation

### **Get High APY Pools**
```bash
curl http://localhost:3001/api/high-apy-pools
```

### **Get Bot Status**
```bash
curl http://localhost:3001/api/bot/status
```

### **Simulate Investment**
```bash
curl -X POST http://localhost:3001/api/bot/investments/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "poolId": "pool_id",
    "poolName": "Pool Name",
    "protocol": "Orca",
    "apy": 0.35,
    "price": 1,
    "liquidity": 1000,
    "volume_24h": 100
  }'
```

## 📁 Project Structure

```
liquidity-simulator/
├── backend/
│   ├── server/
│   │   ├── index.js              # Main server file
│   │   ├── services/
│   │   │   ├── bot.js            # Bot logic
│   │   │   └── orca.js           # Orca API integration
│   │   ├── data/                 # Cached pool data
│   │   └── logs/                 # Bot activity logs
│   └── package.json
├── frontend/
│   ├── app/
│   │   ├── page.tsx              # Main dashboard
│   │   └── bot/page.tsx          # Bot dashboard
│   ├── components/
│   │   └── bot-dashboard.tsx     # Bot dashboard component
│   └── package.json
└── README.md
```

## 🚨 Troubleshooting

### **Backend Issues**
1. **Port 3001 already in use**: Kill existing processes
   ```bash
   pkill -f "node server/index.js"
   ```

2. **Module not found errors**: Ensure you're in the backend directory
   ```bash
   cd backend
   node server/index.js
   ```

### **Frontend Issues**
1. **Port 3000 already in use**: Kill existing processes
   ```bash
   pkill -f "next dev"
   ```

2. **API connection errors**: Ensure backend is running on port 3001

### **Bot Issues**
1. **No investments being made**: Check if pools meet APY threshold (>30%)
2. **Data not updating**: Check Orca API connectivity
3. **Investment simulation fails**: Verify pool data format

## 🔄 Development

### **Adding New Features**
1. **Backend**: Add new endpoints in `backend/server/index.js`
2. **Frontend**: Create new components in `frontend/components/`
3. **Bot Logic**: Modify `backend/server/services/bot.js`

### **Data Sources**
- **Orca API**: Main source for pool data
- **Future**: Can integrate DefiLlama, Raydium, and other DEXs

## 📈 Performance Metrics

The bot tracks:
- **Total Investments**: Number of investments made
- **Success Rate**: Percentage of profitable exits
- **Total Profit/Loss**: Overall performance
- **Average Holding Time**: Optimization metric
- **Active Investments**: Current portfolio status

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the API documentation
3. Check server logs for error messages
4. Open an issue on GitHub

---

**Happy Trading! 🚀💰** 