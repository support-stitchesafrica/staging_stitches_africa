/**
 * Vendor Analytics Types
 * Comprehensive type definitions for vendor analytics, metrics, rankings, and notifications
 */

// ============================================================================
// Date and Time Types
// ============================================================================

export interface DateRange {
  start: Date;
  end: Date;
  preset?: 'today' | '7days' | '30days' | '90days' | 'custom';
}

export interface TrendDataPoint {
  date: Date;
  value: number;
  label?: string;
}

// ============================================================================
// Core Analytics Types
// ============================================================================

export interface VendorAnalytics {
  vendorId: string;
  period: DateRange;
  sales: SalesMetrics;
  orders: OrderMetrics;
  products: ProductMetrics;
  customers: CustomerMetrics;
  payouts: PayoutMetrics;
  store: StoreMetrics;
  updatedAt: Date;
}

// ============================================================================
// Sales Metrics
// ============================================================================

export interface SalesMetrics {
  totalRevenue: number;
  revenueChange: number; // percentage
  averageOrderValue: number;
  aovChange: number;
  topCategories: CategoryRevenue[];
  revenueByProduct: ProductRevenue[];
  salesTrend: TrendDataPoint[];
  completedOrders: number;
  cancelledOrders: number;
  cancellationRate: number;
  paymentMethods: PaymentMethodStats[];
}

export interface CategoryRevenue {
  category: string;
  revenue: number;
  orderCount: number;
  percentage: number;
}

export interface ProductRevenue {
  productId: string;
  productName: string;
  revenue: number;
  quantity: number;
  percentage: number;
}

export interface PaymentMethodStats {
  method: string;
  count: number;
  totalAmount: number;
  successRate: number;
  percentage: number;
  failureCount?: number;
  successCount?: number;
  averageAmount?: number;
  trend?: TrendDataPoint[];
}

export interface PaymentMethodInsights {
  vendorId: string;
  period: DateRange;
  methods: PaymentMethodStats[];
  successVsFailureRate: {
    totalAttempts: number;
    successful: number;
    failed: number;
    successRate: number;
  };
  distributionBySegment: PaymentMethodBySegment[];
  usageTrends: PaymentMethodTrend[];
  abandonmentByMethod: PaymentAbandonmentStats[];
  updatedAt: Date;
}

export interface PaymentMethodBySegment {
  segment: CustomerSegment['type'];
  methods: {
    method: string;
    count: number;
    percentage: number;
  }[];
}

export interface PaymentMethodTrend {
  method: string;
  trend: TrendDataPoint[];
  growthRate: number;
}

export interface PaymentAbandonmentStats {
  method: string;
  attempts: number;
  completed: number;
  abandoned: number;
  abandonmentRate: number;
}

// ============================================================================
// Order Metrics
// ============================================================================

export interface OrderMetrics {
  totalOrders: number;
  orderChange: number;
  funnel: OrderFunnel;
  averageFulfillmentTime: number; // hours
  fulfillmentChange: number;
  cancellationReasons: CancellationReason[];
  abandonedCheckouts: number;
  abandonmentRate: number;
  returnRate: number;
  complaintRate: number;
}

export interface OrderFunnel {
  viewed: number;
  addedToCart: number;
  ordered: number;
  paid: number;
  delivered: number;
}

export interface CancellationReason {
  reason: string;
  count: number;
  percentage: number;
}

// ============================================================================
// Product Metrics
// ============================================================================

export interface ProductMetrics {
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  lowStock: number;
  topPerformers: ProductPerformance[];
  underPerformers: ProductPerformance[];
  trendingProducts: string[];
}

export interface ProductPerformance {
  productId: string;
  productName: string;
  views: number;
  sales: number;
  revenue: number;
  conversionRate: number;
  rating: number;
}

export interface ProductAnalytics {
  productId: string;
  title: string;
  vendorId: string;
  views: number;
  uniqueViews?: number;
  viewsChange: number;
  addToCartRate: number;
  addToCartCount?: number;
  conversionRate: number;
  cartConversionRate?: number;
  salesCount: number;
  revenue: number;
  averageOrderValue?: number;
  averageRating: number;
  reviewCount: number;
  visibilityScore: number;
  rankingPosition: number;
  category: string;
  stockLevel: number;
  isTrending: boolean;
  customerComments: CommentSummary;
  rankingFactors: RankingFactors;
  recommendations: string[];
  activityTimeline?: ActivityEvent[];
  peakActivityTimes?: PeakActivityData;
  updatedAt: Date;
}

// Activity Timeline Types (Requirement 22.4)
export interface ActivityEvent {
  id: string;
  type: 'view' | 'add_to_cart' | 'remove_from_cart' | 'purchase';
  timestamp: string;
  userId: string;
  deviceType: 'mobile' | 'tablet' | 'desktop' | 'unknown';
  location?: {
    country: string;
    state?: string;
    city?: string;
  };
  metadata?: {
    price?: number;
    quantity?: number;
  };
}

// Peak Activity Patterns Types (Requirement 22.5)
export interface PeakActivityData {
  peakHour: {
    hour: number;
    count: number;
    label: string;
  } | null;
  peakDay: {
    day: string;
    count: number;
  } | null;
  topDevice: {
    device: string;
    count: number;
    percentage: number;
  } | null;
  hourlyDistribution: Array<{
    hour: number;
    count: number;
    label: string;
  }>;
  dailyDistribution: Array<{
    day: string;
    count: number;
  }>;
  deviceDistribution: Array<{
    device: string;
    count: number;
    percentage: number;
  }>;
}

export interface CommentSummary {
  positive: number;
  negative: number;
  neutral: number;
  commonThemes: string[];
}

// ============================================================================
// Ranking Types
// ============================================================================

export interface RankingFactors {
  ctr: number; // click-through rate
  conversionRate: number;
  rating: number;
  fulfillmentSpeed: number;
  complaintScore: number;
  stockHealth: number;
  priceCompetitiveness: number;
  engagementSignals: number;
  overallScore: number;
}

export interface ProductRanking {
  productId: string;
  vendorId: string;
  category: string;
  visibilityScore: number;
  rankingPosition: number;
  categoryRankingPosition: number;
  factors: RankingFactors;
  change: number; // position change from previous period
  changeExplanation: string;
  recommendations: string[];
  lastUpdated: Date;
}

// ============================================================================
// Customer Metrics
// ============================================================================

export interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  frequentBuyers: number;
  highValueCustomers: number;
  segments: CustomerSegment[];
  locationInsights: LocationData[];
  purchaseBehavior: PurchasePattern[];
  averageLifetimeValue: number;
  ratingTrends: RatingTrend[];
}

export interface CustomerSegment {
  type: 'new' | 'returning' | 'frequent' | 'high-value';
  count: number;
  percentage: number;
  averageOrderValue: number;
  totalRevenue: number;
  averagePurchaseFrequency: number;
}

export interface LocationData {
  city: string;
  state: string;
  country: string;
  customerCount: number;
  revenue: number;
  percentage: number;
}

export interface PurchasePattern {
  category: string;
  purchaseCount: number;
  averageSpend: number;
  frequency: number;
}

export interface RatingTrend {
  period: string;
  averageRating: number;
  reviewCount: number;
}

export interface AnonymizedCustomer {
  customerId: string; // hashed
  segment: CustomerSegment['type'];
  location: {
    city: string;
    state: string;
  };
  purchaseHistory: AnonymizedPurchase[];
  lifetimeValue: number;
  averageOrderValue: number;
  orderCount: number;
  lastPurchaseDate: Date;
}

export interface AnonymizedPurchase {
  date: Date;
  amount: number;
  products: string[]; // product IDs only
  category: string;
}

// ============================================================================
// Payout Metrics
// ============================================================================

export interface PayoutMetrics {
  pendingBalance: number;
  availableBalance: number;
  nextPayoutDate: Date;
  nextPayoutAmount: number;
  totalEarnings: number;
  totalFees: number;
  payoutHistory: PayoutRecord[];
  calendar: PayoutCalendarEntry[];
}

export interface PayoutRecord {
  id: string;
  amount: number;
  fees: FeeBreakdown;
  netAmount: number;
  status: 'processing' | 'paid' | 'failed';
  transferDate: Date;
  paystackReference: string;
  failureReason?: string;
  statementUrl?: string;
  transactions: PayoutTransaction[];
}

export interface FeeBreakdown {
  platformCommission: number;
  commissionRate: number;
  paymentProcessingFee: number;
  otherFees: number;
  totalFees: number;
}

export interface PayoutTransaction {
  orderId: string;
  date: Date;
  amount: number;
  commission: number;
  netAmount: number;
}

export interface PayoutCalendarEntry {
  date: Date;
  amount: number;
  status: 'scheduled' | 'processing' | 'completed';
}

// ============================================================================
// Store Metrics
// ============================================================================

export interface StoreMetrics {
  engagementScore: number;
  searchAppearances: number;
  profileVisits: number;
  followerCount: number;
  categoryPerformance: CategoryPerformance[];
  rankingVsSimilarStores: number; // percentile
  suggestions: StoreSuggestion[];
}

export interface CategoryPerformance {
  category: string;
  ranking: number;
  totalVendors: number;
  percentile: number;
  revenue: number;
  orderCount: number;
}

export interface StoreSuggestion {
  type: 'images' | 'stock' | 'response_time' | 'cancellation' | 'pricing' | 'fulfillment' | 'description';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  impact: string;
  actionUrl?: string;
}

// ============================================================================
// Inventory Types
// ============================================================================

export interface InventoryAlert {
  productId: string;
  productName: string;
  type: 'low_stock' | 'out_of_stock' | 'high_return_rate' | 'slow_fulfillment';
  severity: 'critical' | 'warning' | 'info';
  currentStock?: number;
  recommendedStock?: number;
  message: string;
  createdAt: Date;
}

export interface InventoryForecast {
  productId: string;
  productName: string;
  currentStock: number;
  averageDailySales: number;
  daysUntilStockout: number;
  recommendedReorderQuantity: number;
  seasonalityFactor: number;
}

export interface FulfillmentMetrics {
  averageFulfillmentTime: number;
  onTimeDeliveryRate: number;
  fulfillmentScore: number;
  delayedOrders: number;
  fastestFulfillment: number;
  slowestFulfillment: number;
}

// ============================================================================
// Notification Types
// ============================================================================

export interface VendorNotification {
  id: string;
  vendorId: string;
  type: 'alert' | 'info' | 'warning' | 'celebration';
  category: 'stock' | 'payout' | 'performance' | 'ranking' | 'milestone';
  title: string;
  message: string;
  actionUrl?: string;
  isRead: boolean;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface NotificationPreferences {
  vendorId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  categories: {
    stock: boolean;
    payout: boolean;
    performance: boolean;
    ranking: boolean;
    milestone: boolean;
  };
  updatedAt: Date;
}

// ============================================================================
// Export Types
// ============================================================================

export interface ExportOptions {
  format: 'csv' | 'pdf';
  dataType: 'sales' | 'orders' | 'products' | 'customers' | 'payouts';
  dateRange: DateRange;
  includeCharts?: boolean;
}

export interface ExportResult {
  blob: Blob;
  filename: string;
  mimeType: string;
  size: number;
}

// ============================================================================
// Comparison Types
// ============================================================================

export interface ComparisonMetrics {
  current: number;
  previous: number;
  change: number; // percentage
  trend: 'up' | 'down' | 'stable';
}

export interface ProductComparison {
  products: ProductAnalytics[];
  metrics: {
    views: ComparisonMetrics[];
    sales: ComparisonMetrics[];
    revenue: ComparisonMetrics[];
    conversionRate: ComparisonMetrics[];
    rating: ComparisonMetrics[];
  };
}

// ============================================================================
// Goal Tracking Types
// ============================================================================

export interface PerformanceGoal {
  id: string;
  vendorId: string;
  metric: 'revenue' | 'orders' | 'conversion_rate' | 'rating' | 'fulfillment_time';
  targetValue: number;
  currentValue: number;
  progress: number; // percentage
  deadline: Date;
  status: 'on_track' | 'at_risk' | 'achieved' | 'missed';
  createdAt: Date;
  updatedAt: Date;
}

// ============================================================================
// Historical Data Types
// ============================================================================

export interface HistoricalData {
  vendorId: string;
  metric: string;
  dataPoints: TrendDataPoint[];
  seasonalPatterns: SeasonalPattern[];
  yearOverYearComparison: YearOverYearComparison[];
}

export interface SeasonalPattern {
  period: string; // e.g., "Q1", "December", "Week 1"
  averageValue: number;
  trend: 'high' | 'medium' | 'low';
}

export interface YearOverYearComparison {
  year: number;
  value: number;
  change: number;
}

// ============================================================================
// Bundling Insights Types
// ============================================================================

export interface BundlingInsight {
  productId: string;
  productName: string;
  frequentlyBoughtWith: ProductPair[];
  averageItemsPerOrder: number;
  crossSellConversionRate: number;
  suggestedBundles: SuggestedBundle[];
}

export interface ProductPair {
  productId: string;
  productName: string;
  frequency: number;
  revenue: number;
}

export interface SuggestedBundle {
  products: string[]; // product IDs
  estimatedRevenue: number;
  confidence: number;
}

// ============================================================================
// Performance Alert Types
// ============================================================================

export type AlertType = 'metric_decline' | 'quality_issue' | 'critical_inventory' | 'ranking_drop' | 'opportunity';
export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';

export interface PerformanceAlert {
  type: AlertType;
  severity: AlertSeverity;
  category: 'stock' | 'payout' | 'performance' | 'ranking' | 'milestone';
  title: string;
  message: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

// ============================================================================
// Service Response Types
// ============================================================================

export interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  timestamp: Date;
}

export interface ServiceError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

// ============================================================================
// Query Types
// ============================================================================

export interface AnalyticsQuery {
  vendorId: string;
  dateRange: DateRange;
  metrics?: string[];
  groupBy?: 'day' | 'week' | 'month';
  filters?: Record<string, any>;
}

export interface ProductAnalyticsQuery {
  vendorId: string;
  productId?: string;
  dateRange: DateRange;
  sortBy?: 'views' | 'sales' | 'revenue' | 'conversion_rate';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
}
