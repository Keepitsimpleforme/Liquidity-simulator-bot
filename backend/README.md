# Solana High APY Pools Backend API

A Node.js backend API that fetches and serves high APY liquidity pools from the Solana blockchain, starting with Orca protocol.

## Features

- 🚀 Express.js API server with CORS support
- 💰 Fetches pools with APY > 30% from Orca
- 📁 Local JSON caching to minimize API calls
- 🛡️ Comprehensive error handling and logging
- 🔄 Manual refresh endpoint for real-time updates
- 📊 Health check endpoint for monitoring

## API Endpoints

### GET /api/high-apy-pools
Returns all cached high APY pools (APY > 30%).

**Response:**
```json
{
  "success": true,
  "data": [...],
  "lastUpdated": "2025-01-27T10:30:00.000Z",
  "count": 15
}
```

### POST /api/refresh-pools
Manually refreshes pool data from Orca API.

### GET /api/health
Health check endpoint.

## Project Structure

```
server/
├── index.js               # Entry point and Express server
├── services/orca.js       # Orca API integration and filtering
├── data/highApyPools.json # Local cache for pool data
└── utils/logger.js        # Custom logging utility
```

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Start the server:
```bash
npm start
```

The API will be available at `http://localhost:5000`

## Environment Variables

- `PORT` - Server port (default: 5000)
- `LOG_LEVEL` - Logging level (ERROR, WARN, INFO, DEBUG)
- `LOG_TO_FILE` - Enable file logging (true/false)
- `NODE_ENV` - Environment (development/production)

## Data Flow

1. Server starts and fetches initial data from Orca API
2. Pools are filtered for APY > 30%
3. Filtered data is cached locally in JSON file
4. API serves cached data to minimize external API calls
5. Data can be refreshed manually via `/api/refresh-pools`

## Future Enhancements

- [ ] Scheduled data refresh (every 5 minutes)
- [ ] Support for additional protocols (DefiLlama, etc.)
- [ ] Database integration for better data management
- [ ] Rate limiting and authentication
- [ ] WebSocket support for real-time updates