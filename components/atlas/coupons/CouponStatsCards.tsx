"use client";

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, CheckCircle, XCircle, Clock, TrendingDown } from 'lucide-react';
import { auth } from '@/firebase';

interface CouponStats {
  totalCoupons: number;
  activeCoupons: number;
  usedCoupons: number;
  expiredCoupons: number;
  disabledCoupons: number;
  totalDiscountGiven: number;
}

interface CouponStatsCardsProps {
  refreshTrigger?: number;
}

export function CouponStatsCards({ refreshTrigger = 0 }: CouponStatsCardsProps) {
  const [stats, setStats] = useState<CouponStats>({
    totalCoupons: 0,
    activeCoupons: 0,
    usedCoupons: 0,
    expiredCoupons: 0,
    disabledCoupons: 0,
    totalDiscountGiven: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [refreshTrigger]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        console.warn('No authenticated user for stats');
        return;
      }

      const token = await user.getIdToken();
      
      // Fetch all coupons to calculate stats (use multiple requests if needed)
      const response = await fetch('/api/atlas/coupons?limit=100&page=1', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch coupons`);
      }

      const data = await response.json();
      const coupons = data.data || [];

      // Calculate stats
      const newStats: CouponStats = {
        totalCoupons: coupons.length,
        activeCoupons: coupons.filter((c: any) => c.status === 'ACTIVE').length,
        usedCoupons: coupons.filter((c: any) => c.status === 'USED').length,
        expiredCoupons: coupons.filter((c: any) => c.status === 'EXPIRED').length,
        disabledCoupons: coupons.filter((c: any) => c.status === 'DISABLED').length,
        totalDiscountGiven: coupons
          .filter((c: any) => c.status === 'USED')
          .reduce((sum: number, c: any) => {
            const totalDiscount = c.usageHistory?.reduce(
              (historySum: number, record: any) => historySum + (record.discountApplied || 0),
              0
            ) || 0;
            return sum + totalDiscount;
          }, 0)
      };

      setStats(newStats);
    } catch (error) {
      console.error('Error fetching coupon stats:', error);
      // Set default stats on error
      setStats({
        totalCoupons: 0,
        activeCoupons: 0,
        usedCoupons: 0,
        expiredCoupons: 0,
        disabledCoupons: 0,
        totalDiscountGiven: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  const statCards = [
    {
      title: 'Total Coupons',
      value: stats.totalCoupons,
      icon: Ticket,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Active Coupons',
      value: stats.activeCoupons,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Used Coupons',
      value: stats.usedCoupons,
      icon: CheckCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Expired Coupons',
      value: stats.expiredCoupons,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50'
    },
    {
      title: 'Disabled Coupons',
      value: stats.disabledCoupons,
      icon: XCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    },
    {
      title: 'Total Discount Given',
      value: formatCurrency(stats.totalDiscountGiven),
      icon: TrendingDown,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      isAmount: true
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader className="pb-2">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-gray-200 rounded w-16"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-6">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className={`text-2xl font-bold ${stat.color}`}>
                  {stat.isAmount ? stat.value : stat.value.toLocaleString()}
                </div>
                <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
