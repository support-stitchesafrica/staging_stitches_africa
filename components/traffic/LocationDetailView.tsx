"use client";

import { useMemo, useState, useEffect } from "react";
import { MetricCardGA } from "@/components/analytics/MetricCardGA";
import { ChartCard } from "@/components/analytics/ChartCard";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    LineChart,
    Line,
} from "recharts";
import { 
    Globe, 
    MapPin, 
    Users, 
    TrendingUp,
    ChevronDown,
    ChevronRight,
    Flag,
    Building,
} from "lucide-react";
import { useDateRange } from "@/contexts/DateRangeContext";
import {
    getUsersByCountry,
    type CountryData,
} from "@/services/userLocationAnalytics";
import {
    getTrafficByCountryAndState,
    type TrafficByCountryState,
} from "@/services/webTrafficAnalytics";

const LocationDetailView = () => {
    const { dateRange } = useDateRange();
    const [loading, setLoading] = useState(true);
    const [countryData, setCountryData] = useState<CountryData[]>([]);
    const [countryStateData, setCountryStateData] = useState<TrafficByCountryState[]>([]);
    const [expandedCountries, setExpandedCountries] = useState<Set<string>>(new Set());
    const [selectedView, setSelectedView] = useState<'countries' | 'states' | 'cities'>('countries');

    // Fetch detailed location analytics
    useEffect(() => {
        const fetchLocationAnalytics = async () => {
            setLoading(true);
            try {
                const [
                    countries,
                    countryStates,
                ] = await Promise.all([
                    getUsersByCountry(),
                    getTrafficByCountryAndState(dateRange.start, dateRange.end),
                ]);

                setCountryData(countries);
                setCountryStateData(countryStates);
            } catch (error) {
                console.error("Error fetching location analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchLocationAnalytics();
    }, [dateRange]);

    // GA color palette
    const gaColors = [
        "#1A73E8", "#0F9D58", "#F9AB00", "#EA4335", "#9334E6",
        "#00ACC1", "#FF6D00", "#7CB342", "#C2185B", "#5E35B1"
    ];

    // Calculate metrics
    const totalCountries = countryData.length;
    const totalUsers = countryData.reduce((sum, country) => sum + country.count, 0);
    const topCountry = countryData.length > 0 ? countryData[0] : null;
    const totalStates = countryStateData.reduce((sum, country) => sum + country.states.length, 0);

    // Toggle country expansion
    const toggleCountry = (country: string) => {
        const newExpanded = new Set(expandedCountries);
        if (newExpanded.has(country)) {
            newExpanded.delete(country);
        } else {
            newExpanded.add(country);
        }
        setExpandedCountries(newExpanded);
    };

    // Prepare chart data
    const countryChartData = countryData.slice(0, 10).map((country, index) => ({
        name: country.country,
        value: country.count,
        color: gaColors[index % gaColors.length],
    }));

    const stateChartData = countryStateData
        .flatMap(country => 
            country.states.map(state => ({
                name: `${state.state}, ${country.country}`,
                value: state.hits,
                country: country.country,
            }))
        )
        .sort((a, b) => b.value - a.value)
        .slice(0, 15);

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCardGA
                    label="Total Countries"
                    value={loading ? 0 : totalCountries}
                    format="number"
                    icon={<Flag className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Total Users"
                    value={loading ? 0 : totalUsers}
                    format="number"
                    change={12.5}
                    trend="up"
                    icon={<Users className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Top Country"
                    value={loading ? "..." : (topCountry?.country || "N/A")}
                    format="text"
                    icon={<Globe className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Total States/Regions"
                    value={loading ? 0 : totalStates}
                    format="number"
                    icon={<Building className="w-5 h-5" />}
                    isLoading={loading}
                />
            </div>

            {/* View Toggle */}
            <div className="flex gap-2 p-1 bg-ga-surface rounded-lg w-fit">
                <button
                    onClick={() => setSelectedView('countries')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedView === 'countries'
                            ? 'bg-ga-accent text-white'
                            : 'text-ga-secondary hover:text-ga-primary'
                    }`}
                >
                    Countries
                </button>
                <button
                    onClick={() => setSelectedView('states')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedView === 'states'
                            ? 'bg-ga-accent text-white'
                            : 'text-ga-secondary hover:text-ga-primary'
                    }`}
                >
                    States/Regions
                </button>
                <button
                    onClick={() => setSelectedView('cities')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedView === 'cities'
                            ? 'bg-ga-accent text-white'
                            : 'text-ga-secondary hover:text-ga-primary'
                    }`}
                >
                    Cities
                </button>
            </div>

            {/* Main Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Geographic Distribution Chart */}
                <ChartCard
                    title={`Traffic by ${selectedView.charAt(0).toUpperCase() + selectedView.slice(1)}`}
                    subtitle="Geographic distribution visualization"
                    height={400}
                >
                    {loading ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">Loading geographic data...</p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            {selectedView === 'countries' ? (
                                <PieChart>
                                    <Pie
                                        data={countryChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={120}
                                        paddingAngle={2}
                                        dataKey="value"
                                        label={({ name, value }) => `${name}: ${value}`}
                                    >
                                        {countryChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                </PieChart>
                            ) : (
                                <BarChart data={stateChartData.slice(0, 10)}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                    <XAxis 
                                        dataKey="name" 
                                        stroke="hsl(var(--muted-foreground))" 
                                        fontSize={10}
                                        angle={-45}
                                        textAnchor="end"
                                        height={80}
                                    />
                                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "hsl(var(--card))",
                                            border: "1px solid hsl(var(--border))",
                                            borderRadius: "8px",
                                        }}
                                    />
                                    <Bar dataKey="value" fill="#1A73E8" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            )}
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Country Summary */}
                <ChartCard
                    title="Country Summary"
                    subtitle="Top countries by user count"
                    height={400}
                >
                    {loading || countryData.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                {loading ? "Loading country data..." : "No country data available"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[350px] overflow-y-auto">
                            {countryData.slice(0, 15).map((country, index) => (
                                <div
                                    key={country.country}
                                    className={`
                                        flex justify-between items-center p-3 rounded-lg
                                        transition-colors hover:bg-ga-surface
                                        ${index % 2 === 0 ? "bg-ga-background" : "bg-ga-surface/50"}
                                    `}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="text-sm font-medium text-ga-secondary">
                                            {index + 1}
                                        </div>
                                        <Flag className="w-4 h-4 text-ga-accent shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-ga-primary truncate">
                                                {country.country}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-semibold text-ga-primary">
                                            {country.count.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">users</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Detailed Lists */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Countries with States Breakdown */}
                <ChartCard
                    title="Countries & States Breakdown"
                    subtitle="Expandable view of countries and their states"
                    height={500}
                >
                    {loading || countryStateData.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                {loading ? "Loading regional data..." : "No regional data available"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[450px] overflow-y-auto">
                            {countryStateData.map((countryData, countryIndex) => {
                                const isExpanded = expandedCountries.has(countryData.country);
                                const hasStates = countryData.states.length > 0;

                                return (
                                    <div
                                        key={countryData.country}
                                        className="border border-ga rounded-lg overflow-hidden"
                                    >
                                        {/* Country Header */}
                                        <button
                                            onClick={() => toggleCountry(countryData.country)}
                                            className="w-full flex items-center justify-between p-4 hover:bg-ga-surface/50 transition-colors"
                                            disabled={!hasStates}
                                        >
                                            <div className="flex items-center gap-3 flex-1 min-w-0">
                                                {hasStates && (
                                                    <div className="shrink-0">
                                                        {isExpanded ? (
                                                            <ChevronDown className="w-4 h-4 text-ga-secondary" />
                                                        ) : (
                                                            <ChevronRight className="w-4 h-4 text-ga-secondary" />
                                                        )}
                                                    </div>
                                                )}
                                                <Flag className="w-4 h-4 text-ga-accent shrink-0" />
                                                <div className="flex-1 min-w-0 text-left">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-base font-semibold text-ga-primary">
                                                            {countryData.country}
                                                        </span>
                                                        {hasStates && (
                                                            <span className="text-xs text-ga-secondary">
                                                                ({countryData.states.length} states)
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <div className="text-right shrink-0">
                                                    <div className="text-sm font-semibold text-ga-primary">
                                                        {countryData.countryHits.toLocaleString()}
                                                    </div>
                                                    <div className="text-xs text-ga-secondary">hits</div>
                                                </div>
                                            </div>
                                        </button>

                                        {/* States List */}
                                        {hasStates && isExpanded && (
                                            <div className="border-t border-ga bg-ga-surface/20">
                                                <div className="p-2 space-y-1">
                                                    {countryData.states
                                                        .sort((a, b) => b.hits - a.hits)
                                                        .map((state, stateIndex) => (
                                                            <div
                                                                key={state.state}
                                                                className="flex items-center justify-between p-3 rounded-md hover:bg-ga-surface transition-colors"
                                                            >
                                                                <div className="flex items-center gap-3 flex-1 min-w-0">
                                                                    <MapPin className="w-3 h-3 text-ga-accent shrink-0" />
                                                                    <span className="text-sm text-ga-primary truncate">
                                                                        {state.state}
                                                                    </span>
                                                                </div>
                                                                <span className="text-sm font-semibold text-ga-secondary shrink-0">
                                                                    {state.hits.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </ChartCard>

                {/* State Details */}
                <ChartCard
                    title="State/Region Details"
                    subtitle="Traffic breakdown by states and regions"
                    height={500}
                >
                    {loading || countryStateData.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                {loading ? "Loading state data..." : "No state data available"}
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[450px] overflow-y-auto">
                            {countryStateData.flatMap(country => 
                                country.states.map(state => ({
                                    ...state,
                                    country: country.country
                                }))
                            ).sort((a, b) => b.hits - a.hits).slice(0, 20).map((state, index) => (
                                <div
                                    key={`${state.state}-${state.country}`}
                                    className={`
                                        flex justify-between items-center p-3 rounded-lg
                                        transition-colors hover:bg-ga-surface
                                        ${index % 2 === 0 ? "bg-ga-background" : "bg-ga-surface/50"}
                                    `}
                                >
                                    <div className="flex items-center gap-3 flex-1 min-w-0">
                                        <div className="text-sm font-medium text-ga-secondary">
                                            {index + 1}
                                        </div>
                                        <Building className="w-4 h-4 text-ga-accent shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="text-sm font-medium text-ga-primary truncate">
                                                {state.state}
                                            </div>
                                            <div className="text-xs text-muted-foreground truncate">
                                                {state.country}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <div className="text-sm font-semibold text-ga-primary">
                                            {state.hits.toLocaleString()}
                                        </div>
                                        <div className="text-xs text-muted-foreground">hits</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ChartCard>
            </div>
        </div>
    );
};

export default LocationDetailView;