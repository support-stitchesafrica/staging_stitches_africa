"use client";

import { useState, useEffect } from "react";
import { getFreeGiftStats, type FreeGiftStats } from "@/services/freeGiftAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { 
  MapPin, 
  TrendingUp, 
  Package, 
  Users, 
  Globe,
  BarChart3,
  PieChart as PieChartIcon
} from "lucide-react";
import { useRouter } from "next/navigation";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4', '#84CC16', '#F97316'];

export function RegionalAnalytics() {
  const router = useRouter();
  const [stats, setStats] = useState<FreeGiftStats>({
    totalRequested: 0,
    totalDelivered: 0,
    byCountry: {},
    byState: {},
    byCity: {},
    byRegion: {},
    deliveryRate: 0,
    topRegions: [],
    recentTrends: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      try {
        const data = await getFreeGiftStats();
        setStats(data);
      } catch (error) {
        console.error("Failed to load regional analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Prepare data for charts
  const countryData = Object.entries(stats.byCountry)
    .map(([country, count]) => ({ country, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const stateData = Object.entries(stats.byState)
    .map(([state, count]) => ({ state, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const cityData = Object.entries(stats.byCity)
    .map(([city, count]) => ({ city, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const regionData = stats.topRegions.map((region, index) => ({
    ...region,
    color: COLORS[index % COLORS.length]
  }));

  // Handle chart clicks
  const handleCountryClick = (data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const countryName = data.activePayload[0].payload.country;
      router.push(`/atlas/free-gifts/claims?country=${encodeURIComponent(countryName)}`);
    }
  };

  const handleStateClick = (entry: any) => {
    if (entry && entry.state) {
      router.push(`/atlas/free-gifts/claims?state=${encodeURIComponent(entry.state)}`);
    }
  };

  const handleCityClick = (city: string) => {
    router.push(`/atlas/free-gifts/claims?city=${encodeURIComponent(city)}`);
  };

  const handleRegionClick = (region: string) => {
    // Extract state and country from region string (format: "State, Country")
    const [state, country] = region.split(', ');
    const params = new URLSearchParams();
    if (state) params.append('state', state);
    if (country) params.append('country', country);
    router.push(`/atlas/free-gifts/claims?${params.toString()}`);
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Requests</p>
                <p className="text-2xl font-bold">{stats.totalRequested.toLocaleString()}</p>
              </div>
              <Users className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivered</p>
                <p className="text-2xl font-bold">{stats.totalDelivered.toLocaleString()}</p>
              </div>
              <Package className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Delivery Rate</p>
                <p className="text-2xl font-bold">{stats.deliveryRate.toFixed(1)}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Countries</p>
                <p className="text-2xl font-bold">{Object.keys(stats.byCountry).length}</p>
              </div>
              <Globe className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Countries */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Top Countries
              <span className="text-xs text-gray-500 ml-auto">Click bars to view details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart 
                data={countryData}
                onClick={handleCountryClick}
                style={{ cursor: 'pointer' }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="country" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip 
                  cursor={{ fill: "rgba(59, 130, 246, 0.1)" }}
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">{label}</p>
                          <p className="text-blue-600">
                            Claims: {payload[0].value}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Click to view details
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" fill="#3B82F6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top States */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Top States
              <span className="text-xs text-gray-500 ml-auto">Click segments to view details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stateData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ state, percent }) => `${state} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  onClick={handleStateClick}
                  style={{ cursor: 'pointer' }}
                >
                  {stateData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="bg-white p-3 border rounded-lg shadow-lg">
                          <p className="font-medium">{payload[0].payload.state}</p>
                          <p className="text-blue-600">
                            Claims: {payload[0].value}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Click to view details
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Recent Trends (Last 7 Days)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.recentTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="date" 
                  tickFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <YAxis />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="requested" 
                  stroke="#3B82F6" 
                  strokeWidth={2}
                  name="Requested"
                />
                <Line 
                  type="monotone" 
                  dataKey="delivered" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="Delivered"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Cities */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Top Cities
              <span className="text-xs text-gray-500 ml-auto">Click to view details</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {cityData.slice(0, 8).map((city, index) => (
                <div 
                  key={city.city} 
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleCityClick(city.city)}
                >
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{city.city}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600">{city.count}</span>
                    <div className="w-20">
                      <Progress 
                        value={(city.count / cityData[0].count) * 100} 
                        className="h-2"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Regions with Delivery Rates */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Regional Performance
            <span className="text-xs text-gray-500 ml-auto">Click cards to view details</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {regionData.slice(0, 9).map((region) => (
              <div 
                key={region.region}
                className="p-4 border rounded-lg hover:shadow-md transition-all cursor-pointer hover:border-blue-300"
                onClick={() => handleRegionClick(region.region)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{region.region}</h4>
                  <Badge 
                    variant="secondary"
                    className={
                      region.deliveryRate >= 80 
                        ? "bg-green-100 text-green-700"
                        : region.deliveryRate >= 60
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }
                  >
                    {region.deliveryRate.toFixed(1)}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Requests:</span>
                    <span className="font-medium">{region.count}</span>
                  </div>
                  <Progress value={region.deliveryRate} className="h-2" />
                  <p className="text-xs text-gray-500 mt-1">
                    Click to view claims
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}