"use client"

import { useState, useEffect } from "react"
import { Moon, Sun, Search, TrendingUp, DollarSign, Activity } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

interface Pool {
  id: string
  name: string
  protocol: string
  chain: string
  apy_24h: number
  apy_7d: number
  apy_30d: number
  volume_24h: number
  liquidity: number
}

interface ApiResponse {
  status: boolean
  data: Pool[]
}

export default function Dashboard() {
  const [pools, setPools] = useState<Pool[]>([])
  const [filteredPools, setFilteredPools] = useState<Pool[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [darkMode, setDarkMode] = useState(false)
  const [investingPools, setInvestingPools] = useState<Set<string>>(new Set())

  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedChain, setSelectedChain] = useState("all")
  const [minApy, setMinApy] = useState([0])
  const [sortBy, setSortBy] = useState("apy_24h")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const poolsPerPage = 10

  // Fetch data
  useEffect(() => {
    const fetchPools = async () => {
      try {
        setLoading(true)
        const response = await fetch("http://localhost:3001/api/high-apy-pools")
        if (!response.ok) {
          throw new Error("Failed to fetch pools")
        }
        const data: ApiResponse = await response.json()
        setPools(data.data)
        setFilteredPools(data.data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred")
      } finally {
        setLoading(false)
      }
    }

    fetchPools()
  }, [])

  // Apply filters and sorting
  useEffect(() => {
    const filtered = pools.filter((pool) => {
      const matchesSearch =
        pool.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pool.protocol.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesChain = selectedChain === "all" || pool.chain === selectedChain
      const matchesApy = Math.max(pool.apy_24h, pool.apy_7d, pool.apy_30d) * 100 >= minApy[0]

      return matchesSearch && matchesChain && matchesApy
    })

    // Sort pools
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "apy_24h":
          return b.apy_24h - a.apy_24h
        case "apy_7d":
          return b.apy_7d - a.apy_7d
        case "apy_30d":
          return b.apy_30d - a.apy_30d
        case "liquidity":
          return b.liquidity - a.liquidity
        case "volume_24h":
          return b.volume_24h - a.volume_24h
        default:
          return 0
      }
    })

    setFilteredPools(filtered)
    setCurrentPage(1)
  }, [pools, searchTerm, selectedChain, minApy, sortBy])

  // Get unique chains
  const chains = ["all", ...Array.from(new Set(pools.map((pool) => pool.chain || "Unknown").filter(Boolean)))]

  // Pagination
  const indexOfLastPool = currentPage * poolsPerPage
  const indexOfFirstPool = indexOfLastPool - poolsPerPage
  const currentPools = filteredPools.slice(indexOfFirstPool, indexOfLastPool)
  const totalPages = Math.ceil(filteredPools.length / poolsPerPage)

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatPercentage = (value: number) => {
    return `${(value * 100).toFixed(2)}%`
  }

  const isHighApy = (pool: Pool) => {
    return Math.max(pool.apy_24h, pool.apy_7d, pool.apy_30d) > 0.3
  }

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
    document.documentElement.classList.toggle("dark")
  }

  const simulateInvestment = async (pool: Pool) => {
    try {
      // Check if pool meets APY threshold before sending to backend
      const maxApy = Math.max(pool.apy_24h, pool.apy_7d, pool.apy_30d)
      if (maxApy < 0.3) {
        alert(`❌ Investment failed: Pool APY (${(maxApy * 100).toFixed(2)}%) is below the 30% threshold required for investment.`)
        return
      }

      setInvestingPools(prev => new Set(prev).add(pool.id))
      
      const response = await fetch("http://localhost:3001/api/bot/investments/simulate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          poolId: pool.id,
          poolName: pool.name,
          protocol: pool.protocol,
          apy: Math.max(pool.apy_24h, pool.apy_7d, pool.apy_30d),
          price: 1, // Default price
          liquidity: pool.liquidity,
          volume_24h: pool.volume_24h
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to simulate investment")
      }

      const result = await response.json()
      
      if (result.success) {
        // Show success message
        alert(`✅ Investment simulated successfully!\nPool: ${pool.name}\nAmount: $1,000\nAPY: ${(Math.max(pool.apy_24h, pool.apy_7d, pool.apy_30d) * 100).toFixed(2)}%`)
        
        // Optionally redirect to bot dashboard
        if (confirm("View your investment in the Bot Dashboard?")) {
          window.location.href = "/bot"
        }
      }
    } catch (error) {
      console.error("Investment simulation failed:", error)
      alert(`❌ Investment failed: ${error instanceof Error ? error.message : "Unknown error"}`)
    } finally {
      setInvestingPools(prev => {
        const newSet = new Set(prev)
        newSet.delete(pool.id)
        return newSet
      })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex">
          {/* Sidebar Skeleton */}
          <div className="w-64 bg-white dark:bg-gray-800 shadow-lg">
            <div className="p-6">
              <Skeleton className="h-8 w-32 mb-8" />
              <div className="space-y-4">
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-6 w-full" />
              </div>
            </div>
          </div>

          {/* Main Content Skeleton */}
          <div className="flex-1 p-8">
            <Skeleton className="h-12 w-64 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-64 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 dark:text-gray-300">{error}</p>
            <Button onClick={() => window.location.reload()} className="mt-4 w-full">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${darkMode ? "dark" : ""}`}>
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-white dark:bg-gray-800 shadow-lg min-h-screen">
          <div className="p-6">
            <div className="flex items-center space-x-3 mb-8">
              <TrendingUp className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">High APY Pools</h1>
            </div>

            <nav className="space-y-4">
              <div className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Navigation
              </div>
              <a
                href="#"
                className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Activity className="h-5 w-5" />
                <span>Dashboard</span>
              </a>
              <a
                href="#"
                className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <DollarSign className="h-5 w-5" />
                <span>Portfolio</span>
              </a>
              <a
                href="/bot"
                className="flex items-center space-x-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
              >
                <Activity className="h-5 w-5" />
                <span>Bot Dashboard</span>
              </a>
            </nav>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Top Navigation */}
          <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
            <div className="px-8 py-4 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">DeFi Pool Dashboard</h2>
              <div className="flex items-center space-x-4">
                <Button 
                  onClick={() => window.location.href = '/bot'} 
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Bot Dashboard
                </Button>
                <Button variant="outline" size="icon" onClick={toggleDarkMode} className="bg-transparent">
                  {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </header>

          {/* Filters */}
          <div className="p-8 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search pools..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Chain Filter */}
              <Select value={selectedChain} onValueChange={setSelectedChain}>
                <SelectTrigger>
                  <SelectValue placeholder="Select chain" />
                </SelectTrigger>
                <SelectContent>
                  {chains.map((chain, index) => (
                    <SelectItem key={`chain-${index}-${chain}`} value={chain}>
                      {chain === "all" ? "All Chains" : chain}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem key="apy_24h" value="apy_24h">APY 24h</SelectItem>
                  <SelectItem key="apy_7d" value="apy_7d">APY 7d</SelectItem>
                  <SelectItem key="apy_30d" value="apy_30d">APY 30d</SelectItem>
                  <SelectItem key="liquidity" value="liquidity">Liquidity</SelectItem>
                  <SelectItem key="volume_24h" value="volume_24h">Volume 24h</SelectItem>
                </SelectContent>
              </Select>

              {/* APY Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Min APY: {minApy[0]}%</label>
                <Slider value={minApy} onValueChange={setMinApy} max={100} step={1} className="w-full" />
              </div>
            </div>
          </div>

          {/* Pool Cards */}
          <div className="p-8">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-gray-600 dark:text-gray-400">
                Showing {currentPools.length} of {filteredPools.length} pools
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {currentPools.map((pool) => (
                <Card
                  key={pool.id}
                  className={`hover:shadow-lg transition-shadow ${
                    isHighApy(pool) ? "ring-2 ring-yellow-400 border-yellow-400" : ""
                  }`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{pool.name}</CardTitle>
                      {isHighApy(pool) && (
                        <Badge
                          variant="secondary"
                          className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        >
                          High APY
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline">{pool.protocol}</Badge>
                      <Badge variant="outline">{pool.chain}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">24h APY</p>
                        <p className="font-semibold text-green-600">{formatPercentage(pool.apy_24h)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">7d APY</p>
                        <p className="font-semibold text-green-600">{formatPercentage(pool.apy_7d)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">30d APY</p>
                        <p className="font-semibold text-green-600">{formatPercentage(pool.apy_30d)}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Liquidity:</span>
                        <span className="font-medium">{formatCurrency(pool.liquidity)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Volume 24h:</span>
                        <span className="font-medium">{formatCurrency(pool.volume_24h)}</span>
                      </div>
                    </div>

                    <Button 
                      className="w-full bg-transparent" 
                      variant="outline"
                      onClick={() => simulateInvestment(pool)}
                      disabled={investingPools.has(pool.id) || Math.max(pool.apy_24h, pool.apy_7d, pool.apy_30d) < 0.3}
                    >
                      {investingPools.has(pool.id) ? "Investing..." : 
                       Math.max(pool.apy_24h, pool.apy_7d, pool.apy_30d) < 0.3 ? "APY < 30%" : "Simulate Investment"}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center space-x-2">
                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>

                <div className="flex space-x-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  ))}
                </div>

                <Button
                  variant="outline"
                  onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
