"use client"

import { useState, useEffect } from "react"
import { Play, Square, TrendingUp, DollarSign, Clock, Activity, Target, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"

interface BotStatus {
  isRunning: boolean
  activeInvestments: number
  totalInvestments: number
  successfulExits: number
  failedExits: number
  totalProfit: number
  totalLoss: number
  averageHoldingTime: number
  config: {
    HIGH_APY_THRESHOLD: number
    INVESTMENT_AMOUNT: number
    HOLDING_PERIOD_HOURS: number
    MAX_ACTIVE_INVESTMENTS: number
    CHECK_INTERVAL_MINUTES: number
  }
}

interface Investment {
  id: string
  poolName: string
  protocol: string
  entryApy: number
  entryPrice: number
  entryLiquidity: number
  entryVolume24h: number
  investmentAmount: number
  entryTimestamp: string
  status: string
  exitTimestamp?: string
  exitApy?: number
  exitPrice?: number
  profitLoss?: number
  profitLossPercentage?: number
  holdingTimeHours?: number
}

interface BotResponse {
  success: boolean
  status?: BotStatus
  data?: Investment[]
  count?: number
}

export default function BotDashboard() {
  const [botStatus, setBotStatus] = useState<BotStatus | null>(null)
  const [activeInvestments, setActiveInvestments] = useState<Investment[]>([])
  const [investmentHistory, setInvestmentHistory] = useState<Investment[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isStarting, setIsStarting] = useState(false)
  const [isStopping, setIsStopping] = useState(false)

  const API_BASE_URL = "http://localhost:3001/api"

  const fetchBotStatus = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bot/status`)
      if (!response.ok) throw new Error("Failed to fetch bot status")
      const data: BotResponse = await response.json()
      if (data.success && data.status) {
        setBotStatus(data.status)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch bot status")
    }
  }

  const fetchActiveInvestments = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bot/investments/active`)
      if (!response.ok) throw new Error("Failed to fetch active investments")
      const data: BotResponse = await response.json()
      if (data.success && data.data) {
        setActiveInvestments(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch active investments:", err)
    }
  }

  const fetchInvestmentHistory = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bot/investments/history`)
      if (!response.ok) throw new Error("Failed to fetch investment history")
      const data: BotResponse = await response.json()
      if (data.success && data.data) {
        setInvestmentHistory(data.data)
      }
    } catch (err) {
      console.error("Failed to fetch investment history:", err)
    }
  }

  const startBot = async () => {
    try {
      setIsStarting(true)
      const response = await fetch(`${API_BASE_URL}/bot/start`, { method: "POST" })
      if (!response.ok) throw new Error("Failed to start bot")
      const data: BotResponse = await response.json()
      if (data.success && data.status) {
        setBotStatus(data.status)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start bot")
    } finally {
      setIsStarting(false)
    }
  }

  const stopBot = async () => {
    try {
      setIsStopping(true)
      const response = await fetch(`${API_BASE_URL}/bot/stop`, { method: "POST" })
      if (!response.ok) throw new Error("Failed to stop bot")
      const data: BotResponse = await response.json()
      if (data.success && data.status) {
        setBotStatus(data.status)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to stop bot")
    } finally {
      setIsStopping(false)
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      await Promise.all([
        fetchBotStatus(),
        fetchActiveInvestments(),
        fetchInvestmentHistory()
      ])
      setLoading(false)
    }

    fetchData()

    // Refresh data every 30 seconds
    const interval = setInterval(() => {
      if (botStatus?.isRunning) {
        fetchBotStatus()
        fetchActiveInvestments()
        fetchInvestmentHistory()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString()
  }

  const calculateHoldingTime = (entryTimestamp: string) => {
    const entryTime = new Date(entryTimestamp)
    const now = new Date()
    const hours = (now.getTime() - entryTime.getTime()) / (1000 * 60 * 60)
    return hours.toFixed(2)
  }

  if (loading) {
    return (
      <div className="p-8 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Liquidity Mining Bot</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Automated high-yield liquidity mining simulation
          </p>
        </div>
        <div className="flex space-x-4">
          <Button
            onClick={startBot}
            disabled={isStarting || botStatus?.isRunning}
            className="bg-green-600 hover:bg-green-700"
          >
            <Play className="h-4 w-4 mr-2" />
            {isStarting ? "Starting..." : "Start Bot"}
          </Button>
          <Button
            onClick={stopBot}
            disabled={isStopping || !botStatus?.isRunning}
            variant="destructive"
          >
            <Square className="h-4 w-4 mr-2" />
            {isStopping ? "Stopping..." : "Stop Bot"}
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      {botStatus && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bot Status</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {botStatus.isRunning ? (
                  <span className="text-green-600">Running</span>
                ) : (
                  <span className="text-red-600">Stopped</span>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Active investments: {botStatus.activeInvestments}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Profit</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(botStatus.totalProfit)}
              </div>
              <p className="text-xs text-muted-foreground">
                {botStatus.successfulExits} successful exits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loss</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(botStatus.totalLoss)}
              </div>
              <p className="text-xs text-muted-foreground">
                {botStatus.failedExits} failed exits
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Holding Time</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {botStatus.averageHoldingTime.toFixed(1)}h
              </div>
              <p className="text-xs text-muted-foreground">
                {botStatus.totalInvestments} total investments
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Configuration */}
      {botStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Target className="h-5 w-5 mr-2" />
              Bot Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">APY Threshold:</span>
                <div className="font-semibold">{formatPercentage(botStatus.config.HIGH_APY_THRESHOLD)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Investment Amount:</span>
                <div className="font-semibold">{formatCurrency(botStatus.config.INVESTMENT_AMOUNT)}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Holding Period:</span>
                <div className="font-semibold">{botStatus.config.HOLDING_PERIOD_HOURS}h</div>
              </div>
              <div>
                <span className="text-muted-foreground">Check Interval:</span>
                <div className="font-semibold">{botStatus.config.CHECK_INTERVAL_MINUTES}m</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Active Investments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="h-5 w-5 mr-2" />
            Active Investments ({activeInvestments.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeInvestments.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No active investments</p>
          ) : (
            <div className="space-y-4">
              {activeInvestments.map((investment) => (
                <div key={investment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{investment.poolName}</h3>
                      <Badge variant="outline">{investment.protocol}</Badge>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">
                        {formatCurrency(investment.investmentAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {formatTime(investment.entryTimestamp)}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Entry APY:</span>
                      <div className="font-semibold text-green-600">
                        {formatPercentage(investment.entryApy)}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Holding Time:</span>
                      <div className="font-semibold">
                        {calculateHoldingTime(investment.entryTimestamp)}h
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Remaining:</span>
                      <div className="font-semibold">
                        {(48 - parseFloat(calculateHoldingTime(investment.entryTimestamp))).toFixed(2)}h
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Progress:</span>
                      <Progress
                        value={(parseFloat(calculateHoldingTime(investment.entryTimestamp)) / 48) * 100}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Investment History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="h-5 w-5 mr-2" />
            Investment History ({investmentHistory.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {investmentHistory.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No investment history</p>
          ) : (
            <div className="space-y-4">
              {investmentHistory.slice(0, 10).map((investment) => (
                <div key={investment.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold">{investment.poolName}</h3>
                      <Badge variant="outline">{investment.protocol}</Badge>
                      <Badge
                        variant={investment.profitLoss && investment.profitLoss > 0 ? "default" : "destructive"}
                        className={investment.profitLoss && investment.profitLoss > 0 ? "bg-green-100 text-green-800" : ""}
                      >
                        {investment.profitLoss && investment.profitLoss > 0 ? "Profit" : "Loss"}
                      </Badge>
                    </div>
                    <div className="text-right">
                      <div className={`font-semibold ${
                        investment.profitLoss && investment.profitLoss > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {investment.profitLoss ? formatCurrency(investment.profitLoss) : "N/A"}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {investment.exitTimestamp ? formatTime(investment.exitTimestamp) : "N/A"}
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Entry APY:</span>
                      <div className="font-semibold">{formatPercentage(investment.entryApy)}</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Exit APY:</span>
                      <div className="font-semibold">
                        {investment.exitApy ? formatPercentage(investment.exitApy) : "N/A"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Holding Time:</span>
                      <div className="font-semibold">
                        {investment.holdingTimeHours ? `${investment.holdingTimeHours.toFixed(2)}h` : "N/A"}
                      </div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Return:</span>
                      <div className={`font-semibold ${
                        investment.profitLossPercentage && investment.profitLossPercentage > 0 ? "text-green-600" : "text-red-600"
                      }`}>
                        {investment.profitLossPercentage ? `${investment.profitLossPercentage.toFixed(2)}%` : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              {investmentHistory.length > 10 && (
                <p className="text-center text-muted-foreground">
                  ... and {investmentHistory.length - 10} more investments
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 