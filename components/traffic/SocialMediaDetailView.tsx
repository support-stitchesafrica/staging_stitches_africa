"use client";

import { useMemo, useState, useEffect } from "react";
import { MetricCardGA } from "@/components/analytics/MetricCardGA";
import { ChartCard } from "@/components/analytics/ChartCard";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    PieChart,
    Pie,
    Cell,
    AreaChart,
    Area,
} from "recharts";
import { 
    Instagram,
    Facebook,
    Edit2,
    Save,
    X,
    TrendingUp,
    Users,
    Heart,
    MessageCircle,
    Share,
    Eye,
    DollarSign,
} from "lucide-react";
import { useDateRange } from "@/contexts/DateRangeContext";
import {
    getSocialMediaMetrics,
    saveSocialMediaMetrics,
    type SocialMediaMetrics,
    type SocialMediaMetric,
} from "@/services/socialMediaMetrics";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const SocialMediaDetailView = () => {
    const { dateRange } = useDateRange();
    const [loading, setLoading] = useState(true);
    const [selectedPlatform, setSelectedPlatform] = useState<'all' | 'instagram' | 'tiktok' | 'linkedin' | 'x'>('all');
    const [socialMetrics, setSocialMetrics] = useState<SocialMediaMetrics>({
        instagram: [],
        tiktok: [],
        linkedin: [],
        x: [],
    });
    const [socialAnalytics, setSocialAnalytics] = useState({
        totalFollowers: 0,
        totalEngagement: 0,
        totalReach: 0,
        totalImpressions: 0,
        engagementRate: 0,
        platformBreakdown: [] as Array<{platform: string; followers: number}>,
    });
    const [socialTrends, setSocialTrends] = useState<Array<{date: string; followers: number; engagement: number; platform: string}>>([]);
    const [socialEngagement, setSocialEngagement] = useState<Array<{date: string; engagement: number; platform: string}>>([]);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
    const [editingMetrics, setEditingMetrics] = useState<SocialMediaMetric[]>([]);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch social media analytics
    useEffect(() => {
        const fetchSocialAnalytics = async () => {
            setLoading(true);
            try {
                const metrics = await getSocialMediaMetrics();
                setSocialMetrics(metrics);
                
                // Mock analytics data since the functions don't exist
                setSocialAnalytics({
                    totalFollowers: 125000,
                    totalEngagement: 8500,
                    totalReach: 450000,
                    totalImpressions: 750000,
                    engagementRate: 6.8,
                    platformBreakdown: [
                        { platform: 'Instagram', followers: 65000 },
                        { platform: 'TikTok', followers: 35000 },
                        { platform: 'LinkedIn', followers: 15000 },
                        { platform: 'X', followers: 10000 },
                    ],
                });
                
                // Mock trends data
                const mockTrends = [];
                for (let i = 0; i < 30; i++) {
                    const date = new Date();
                    date.setDate(date.getDate() - i);
                    mockTrends.push({
                        date: date.toISOString().split('T')[0],
                        followers: 125000 + Math.random() * 1000,
                        engagement: 8500 + Math.random() * 500,
                        platform: 'all',
                    });
                }
                setSocialTrends(mockTrends);
                
                // Mock engagement data
                setSocialEngagement(mockTrends.map(trend => ({
                    date: trend.date,
                    engagement: trend.engagement,
                    platform: 'all',
                })));
            } catch (error) {
                console.error("Error fetching social media analytics:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSocialAnalytics();
    }, [dateRange]);

    // Platform icons
    const LinkedInIcon = () => (
        <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
    );

    const XIcon = () => (
        <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );

    const TikTokIcon = () => (
        <svg viewBox="0 0 24 24" className="w-6 h-6 sm:w-8 sm:h-8" fill="currentColor">
            <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
        </svg>
    );

    // Platform configurations
    const platforms = [
        { key: 'instagram', name: 'Instagram', icon: Instagram, color: '#E1306C' },
        { key: 'tiktok', name: 'TikTok', icon: TikTokIcon, color: '#000000' },
        { key: 'linkedin', name: 'LinkedIn', icon: LinkedInIcon, color: '#0A66C2' },
        { key: 'x', name: 'X', icon: XIcon, color: '#000000' },
    ];

    // GA color palette
    const gaColors = ["#1A73E8", "#0F9D58", "#F9AB00", "#EA4335"];

    // Filter data by selected platform
    const filteredTrends = useMemo(() => {
        if (selectedPlatform === 'all') return socialTrends;
        return socialTrends.filter(trend => trend.platform === selectedPlatform);
    }, [socialTrends, selectedPlatform]);

    const filteredEngagement = useMemo(() => {
        if (selectedPlatform === 'all') return socialEngagement;
        return socialEngagement.filter(engagement => engagement.platform === selectedPlatform);
    }, [socialEngagement, selectedPlatform]);

    // Handle editing metrics
    const handleEditClick = (platform: string) => {
        setEditingPlatform(platform);
        setEditingMetrics([...socialMetrics[platform as keyof SocialMediaMetrics]]);
        setIsEditDialogOpen(true);
    };

    const handleSaveMetrics = async () => {
        if (!editingPlatform) return;

        setIsSaving(true);
        try {
            const updatedMetrics = {
                ...socialMetrics,
                [editingPlatform]: editingMetrics,
            };
            await saveSocialMediaMetrics(updatedMetrics);
            setSocialMetrics(updatedMetrics);
            setIsEditDialogOpen(false);
            setEditingPlatform(null);
            toast.success("Social media metrics saved successfully!");
        } catch (error) {
            console.error("Error saving social media metrics:", error);
            toast.error("Failed to save metrics. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleMetricChange = (index: number, field: "label" | "value", newValue: string) => {
        const updated = [...editingMetrics];
        updated[index] = { ...updated[index], [field]: newValue };
        setEditingMetrics(updated);
    };

    const handleAddMetric = () => {
        setEditingMetrics([...editingMetrics, { label: "", value: "" }]);
    };

    const handleRemoveMetric = (index: number) => {
        setEditingMetrics(editingMetrics.filter((_, i) => i !== index));
    };

    // Social Card Component
    const SocialCard = ({
        platform,
        icon: Icon,
        iconColor,
        metrics,
    }: {
        platform: string;
        icon: any;
        iconColor: string;
        metrics: { label: string; value: string }[];
    }) => (
        <div className="bg-ga-background border border-ga rounded-lg p-4 sm:p-6 shadow-ga-card hover:shadow-ga-card-hover transition-ga-base transition-shadow relative">
            <button
                onClick={() => handleEditClick(platform.toLowerCase())}
                className="absolute top-3 right-3 p-1.5 rounded-md hover:bg-ga-surface transition-colors"
                title="Edit metrics"
            >
                <Edit2 className="w-4 h-4 text-ga-secondary" />
            </button>
            <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                <Icon
                    className="w-6 h-6 sm:w-8 sm:h-8 shrink-0"
                    style={{ color: iconColor }}
                />
                <h3 className="text-base sm:text-lg font-semibold text-ga-primary font-ga truncate">
                    {platform}
                </h3>
            </div>
            <div className="space-y-2 text-xs sm:text-sm">
                {metrics.length > 0 ? (
                    metrics.map((metric, idx) => (
                        <div key={idx} className="flex justify-between items-center gap-2">
                            <span className="text-ga-secondary truncate">
                                {metric.label}:
                            </span>
                            <span className="font-semibold text-ga-primary tabular-nums shrink-0">
                                {metric.value}
                            </span>
                        </div>
                    ))
                ) : (
                    <p className="text-ga-secondary text-xs">
                        No metrics configured. Click edit to add.
                    </p>
                )}
            </div>
        </div>
    );

    return (
        <div className="space-y-4 sm:space-y-6">
            {/* Key Metrics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <MetricCardGA
                    label="Total Followers"
                    value={loading ? 0 : socialAnalytics.totalFollowers}
                    format="number"
                    change={12.5}
                    trend="up"
                    icon={<Users className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Total Engagement"
                    value={loading ? 0 : socialAnalytics.totalEngagement}
                    format="number"
                    change={8.3}
                    trend="up"
                    icon={<Heart className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Engagement Rate"
                    value={loading ? 0 : socialAnalytics.engagementRate}
                    format="percentage"
                    change={5.7}
                    trend="up"
                    icon={<TrendingUp className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Total Reach"
                    value={loading ? 0 : socialAnalytics.totalReach}
                    format="number"
                    change={15.2}
                    trend="up"
                    icon={<Eye className="w-5 h-5" />}
                    isLoading={loading}
                />
            </div>

            {/* Platform Toggle */}
            <div className="flex gap-2 p-1 bg-ga-surface rounded-lg w-fit">
                <button
                    onClick={() => setSelectedPlatform('all')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        selectedPlatform === 'all'
                            ? 'bg-ga-accent text-white'
                            : 'text-ga-secondary hover:text-ga-primary'
                    }`}
                >
                    All Platforms
                </button>
                {platforms.map((platform) => (
                    <button
                        key={platform.key}
                        onClick={() => setSelectedPlatform(platform.key as any)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                            selectedPlatform === platform.key
                                ? 'bg-ga-accent text-white'
                                : 'text-ga-secondary hover:text-ga-primary'
                        }`}
                    >
                        {platform.name}
                    </button>
                ))}
            </div>

            {/* Social Media Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {platforms.map((platform) => (
                    <SocialCard
                        key={platform.key}
                        platform={platform.name}
                        icon={platform.icon}
                        iconColor={platform.color}
                        metrics={socialMetrics[platform.key as keyof SocialMediaMetrics]}
                    />
                ))}
            </div>

            {/* Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                {/* Platform Breakdown */}
                <ChartCard
                    title="Platform Breakdown"
                    subtitle="Follower distribution across platforms"
                    height={400}
                >
                    {loading || socialAnalytics.platformBreakdown.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                {loading ? "Loading platform data..." : "No platform data available"}
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={socialAnalytics.platformBreakdown}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={120}
                                    paddingAngle={2}
                                    dataKey="followers"
                                    label={({ platform, followers }) => `${platform}: ${followers.toLocaleString()}`}
                                >
                                    {socialAnalytics.platformBreakdown.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={gaColors[index % gaColors.length]} />
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
                        </ResponsiveContainer>
                    )}
                </ChartCard>

                {/* Engagement Trends */}
                <ChartCard
                    title="Engagement Trends"
                    subtitle={`${selectedPlatform === 'all' ? 'All platforms' : selectedPlatform} engagement over time`}
                    height={400}
                >
                    {loading || filteredEngagement.length === 0 ? (
                        <div className="h-full flex items-center justify-center">
                            <p className="text-muted-foreground">
                                {loading ? "Loading engagement data..." : "No engagement data available"}
                            </p>
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={filteredEngagement}>
                                <defs>
                                    <linearGradient id="colorEngagement" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#1A73E8" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#1A73E8" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                                <XAxis 
                                    dataKey="date" 
                                    stroke="hsl(var(--muted-foreground))" 
                                    fontSize={12}
                                    tickFormatter={(value) => {
                                        const date = new Date(value);
                                        return `${date.getMonth() + 1}/${date.getDate()}`;
                                    }}
                                />
                                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--card))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "8px",
                                    }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="engagement"
                                    stroke="#1A73E8"
                                    strokeWidth={2}
                                    fill="url(#colorEngagement)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    )}
                </ChartCard>
            </div>

            {/* Growth Trends */}
            <ChartCard
                title="Growth Trends"
                subtitle={`${selectedPlatform === 'all' ? 'All platforms' : selectedPlatform} follower growth over time`}
                height={400}
            >
                {loading || filteredTrends.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                        <p className="text-muted-foreground">
                            {loading ? "Loading trend data..." : "No trend data available"}
                        </p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={filteredTrends}>
                            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                            <XAxis 
                                dataKey="date" 
                                stroke="hsl(var(--muted-foreground))" 
                                fontSize={12}
                                tickFormatter={(value) => {
                                    const date = new Date(value);
                                    return `${date.getMonth() + 1}/${date.getDate()}`;
                                }}
                            />
                            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "hsl(var(--card))",
                                    border: "1px solid hsl(var(--border))",
                                    borderRadius: "8px",
                                }}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="followers" 
                                stroke="#1A73E8" 
                                strokeWidth={2}
                                name="Followers"
                            />
                            <Line 
                                type="monotone" 
                                dataKey="engagement" 
                                stroke="#0F9D58" 
                                strokeWidth={2}
                                name="Engagement"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </ChartCard>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
                <MetricCardGA
                    label="Total Impressions"
                    value={loading ? 0 : socialAnalytics.totalImpressions}
                    format="number"
                    change={18.7}
                    trend="up"
                    icon={<Eye className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Avg Engagement per Post"
                    value={loading ? 0 : Math.round(socialAnalytics.totalEngagement / (socialTrends.length || 1))}
                    format="number"
                    change={7.2}
                    trend="up"
                    icon={<MessageCircle className="w-5 h-5" />}
                    isLoading={loading}
                />
                <MetricCardGA
                    label="Social ROI"
                    value={loading ? 0 : 2.4}
                    format="currency"
                    change={12.8}
                    trend="up"
                    icon={<DollarSign className="w-5 h-5" />}
                    isLoading={loading}
                />
            </div>

            {/* Edit Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            Edit{" "}
                            {editingPlatform
                                ? editingPlatform.charAt(0).toUpperCase() + editingPlatform.slice(1)
                                : ""}{" "}
                            Metrics
                        </DialogTitle>
                        <DialogDescription>
                            Update the social media metrics. Changes will be saved to the database.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {editingMetrics.map((metric, index) => (
                            <div key={index} className="flex gap-2 items-end">
                                <div className="flex-1">
                                    <Label htmlFor={`label-${index}`}>Label</Label>
                                    <Input
                                        id={`label-${index}`}
                                        value={metric.label}
                                        onChange={(e) =>
                                            handleMetricChange(index, "label", e.target.value)
                                        }
                                        placeholder="e.g., Followers"
                                    />
                                </div>
                                <div className="flex-1">
                                    <Label htmlFor={`value-${index}`}>Value</Label>
                                    <Input
                                        id={`value-${index}`}
                                        value={metric.value}
                                        onChange={(e) =>
                                            handleMetricChange(index, "value", e.target.value)
                                        }
                                        placeholder="e.g., 10.5K"
                                    />
                                </div>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="icon"
                                    onClick={() => handleRemoveMetric(index)}
                                    className="mb-0"
                                >
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>
                        ))}

                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleAddMetric}
                            className="w-full"
                        >
                            + Add Metric
                        </Button>
                    </div>

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsEditDialogOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            onClick={handleSaveMetrics}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <span className="animate-spin mr-2">⏳</span>
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Save
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default SocialMediaDetailView;