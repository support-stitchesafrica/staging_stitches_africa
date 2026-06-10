'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { StandardProtectedRoute } from '@/components/shops/auth/RouteProtectionComponents';
import { ArrowLeft, Tag, TrendingUp, ShoppingBag, Percent, Copy, Check, Share2, Pencil, X, Loader2 } from 'lucide-react';
import type { ReferralPurchase } from '@/types/referral-discount';

interface MyPurchasesResponse
{
  success: boolean;
  referralCode: string;
  purchases: (ReferralPurchase & { id: string })[];
  stats: { totalUsage: number; totalDiscountGiven: number; totalSales: number };
  error?: string;
}

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://stitchesafrica.com';

export default function ReferralDashboardPage()
{
  return (
    <StandardProtectedRoute>
      <ReferralDashboardContent />
    </StandardProtectedRoute>
  );
}

function ReferralDashboardContent()
{
  const router = useRouter();
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [purchases, setPurchases] = useState<(ReferralPurchase & { id: string })[]>([]);
  const [stats, setStats] = useState({ totalUsage: 0, totalDiscountGiven: 0, totalSales: 0 });

  const [codeCopied, setCodeCopied] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const referralLink = referralCode ? `${BASE_URL}/signup?ref=${referralCode}` : '';

  const loadData = useCallback(async () =>
  {
    if (!user) return;
    try
    {
      setLoading(true);
      setError(null);
      const token = await user.getIdToken();
      const res = await fetch('/api/referral/my-purchases', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data: MyPurchasesResponse = await res.json();
      if (!data.success) { setError(data.error ?? 'Failed to load referral data.'); return; }
      setReferralCode(data.referralCode);
      setPurchases(data.purchases);
      setStats(data.stats);
    } catch
    {
      setError('Failed to load referral data. Please try again.');
    } finally
    {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { loadData(); }, [loadData]);

  const formatNaira = (n: number) => `\u20a6${n.toLocaleString('en-NG')}`;

  const formatDate = (ts: ReferralPurchase['createdAt']) =>
  {
    if (!ts) return '\u2014';
    const d = typeof (ts as any).toDate === 'function' ? (ts as any).toDate() : new Date(ts as any);
    return d.toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const copyToClipboard = async (text: string, type: 'code' | 'link') =>
  {
    await navigator.clipboard.writeText(text);
    if (type === 'code') { setCodeCopied(true); setTimeout(() => setCodeCopied(false), 2000); }
    else { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }
  };

  const handleShare = async () =>
  {
    if (navigator.share)
    {
      await navigator.share({ title: 'Join Stitches Africa', text: `Use my referral code ${referralCode} to sign up!`, url: referralLink });
    } else
    {
      copyToClipboard(referralLink, 'link');
    }
  };

  const openEdit = () => { setNewCode(referralCode); setCodeError(''); setSaveSuccess(false); setEditMode(true); };
  const closeEdit = () => { setEditMode(false); setCodeError(''); };

  const handleSaveCode = async () =>
  {
    if (!newCode) { setCodeError('Code is required.'); return; }
    if (!/^[A-Z0-9]{3,12}$/.test(newCode)) { setCodeError('Must be 3\u201312 uppercase letters and numbers only.'); return; }
    if (!user) return;
    try
    {
      setSaving(true);
      setCodeError('');
      const idToken = await user.getIdToken();
      const res = await fetch('/api/referral/update-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, newCode }),
      });
      const data = await res.json();
      if (!data.success) { setCodeError(data.error?.message ?? 'Failed to update code.'); return; }
      setReferralCode(newCode);
      setSaveSuccess(true);
      setTimeout(() => { setSaveSuccess(false); setEditMode(false); }, 1500);
    } catch
    {
      setCodeError('Something went wrong. Please try again.');
    } finally
    {
      setSaving(false);
    }
  };

  if (loading)
  {
    return (
      <div className="min-h-screen bg-white py-6 sm:py-8">
        <div className="container-responsive">
          <button onClick={() => router.back()} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back
          </button>
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-48" />
            <div className="h-40 bg-gray-100 rounded-2xl" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <div key={i} className="h-28 bg-gray-100 rounded-xl" />)}
            </div>
            <div className="h-64 bg-gray-100 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  if (error)
  {
    return (
      <div className="min-h-screen bg-white py-6 sm:py-8">
        <div className="container-responsive">
          <button onClick={() => router.back()} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back
          </button>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <button onClick={loadData} className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors">Try Again</button>
          </div>
        </div>
      </div>
    );
  }

  const statCards = [
    { label: 'Total Uses', value: stats.totalUsage.toString(), icon: ShoppingBag, color: 'bg-blue-50 text-blue-600' },
    { label: 'Total Discount Given', value: formatNaira(stats.totalDiscountGiven), icon: Percent, color: 'bg-green-50 text-green-600' },
    { label: 'Total Sales Generated', value: formatNaira(stats.totalSales), icon: TrendingUp, color: 'bg-purple-50 text-purple-600' },
  ];

  return (
    <div className="min-h-screen bg-white py-6 sm:py-8">
      <div className="container-responsive">

        {/* Header */}
        <div className="mb-8">
          <button onClick={() => router.back()} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors">
            <ArrowLeft className="h-5 w-5 mr-2" /> Back
          </button>
          <div className="flex items-center gap-3">
            <Tag className="h-6 w-6 text-gray-700" />
            <h1 className="text-3xl font-bold text-gray-900">My Referral Dashboard</h1>
          </div>
        </div>

        {/* Referral Code Card */}
        {referralCode && (
          <div className="bg-gradient-to-br from-gray-900 to-gray-700 text-white rounded-2xl p-6 mb-8 shadow-lg">
            <p className="text-gray-300 text-sm mb-1">Your referral code</p>

            {editMode ? (
              <div className="mt-2 mb-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    value={newCode}
                    onChange={(e) => { setNewCode(e.target.value.toUpperCase()); setCodeError(''); }}
                    maxLength={12}
                    placeholder="e.g. MYCODE123"
                    className="bg-white/10 border border-white/20 text-white placeholder-white/40 rounded-lg px-3 py-2 text-lg font-mono tracking-widest w-44 focus:outline-none focus:ring-2 focus:ring-white/40"
                  />
                  <button
                    onClick={handleSaveCode}
                    disabled={saving}
                    className="flex items-center gap-1.5 bg-white text-gray-900 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-gray-100 disabled:opacity-60 transition-colors"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saveSuccess ? <Check className="h-4 w-4 text-green-600" /> : null}
                    {saving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save'}
                  </button>
                  <button onClick={closeEdit} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                {codeError && <p className="text-red-300 text-xs mt-1.5">{codeError}</p>}
                <p className="text-gray-400 text-xs mt-1.5">3-12 uppercase letters and numbers. No spaces.</p>
              </div>
            ) : (
              <div className="flex items-center gap-3 mt-1 mb-4">
                <span className="text-3xl font-bold tracking-widest font-mono">{referralCode}</span>
                <button onClick={openEdit} title="Customise code" className="p-1.5 rounded-lg hover:bg-white/10 transition-colors text-gray-300 hover:text-white">
                  <Pencil className="h-4 w-4" />
                </button>
              </div>
            )}

            {/* Referral link row */}
            <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3 mb-4">
              <span className="text-sm text-gray-200 truncate font-mono">{referralLink}</span>
              <button
                onClick={() => copyToClipboard(referralLink, 'link')}
                className="shrink-0 flex items-center gap-1.5 text-xs font-medium bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors"
              >
                {linkCopied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {linkCopied ? 'Copied!' : 'Copy link'}
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => copyToClipboard(referralCode, 'code')}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                {codeCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {codeCopied ? 'Copied!' : 'Copy code'}
              </button>
              <button
                onClick={handleShare}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {statCards.map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="border border-gray-100 rounded-xl p-5 flex items-center gap-4 shadow-sm">
              <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-gray-500">{label}</p>
                <p className="text-xl font-bold text-gray-900">{value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Purchase History */}
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Purchase History</h2>

          {purchases.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-gray-200 rounded-xl">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <Tag className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No purchases yet</h3>
              <p className="text-gray-500 text-sm">When someone uses your referral code, their purchases will appear here.</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block overflow-x-auto rounded-xl border border-gray-100 shadow-sm">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                    <tr>
                      <th className="px-4 py-3 text-left">Order ID</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-right">Original Amount</th>
                      <th className="px-4 py-3 text-right">Discount %</th>
                      <th className="px-4 py-3 text-right">Discount Amount</th>
                      <th className="px-4 py-3 text-right">Final Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {purchases.map((p) => (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 font-mono text-gray-700 text-xs">{p.orderId}</td>
                        <td className="px-4 py-3 text-gray-600">{formatDate(p.createdAt)}</td>
                        <td className="px-4 py-3 text-right text-gray-700">{formatNaira(p.originalAmount)}</td>
                        <td className="px-4 py-3 text-right">
                          <span className="inline-block bg-blue-50 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">{p.discountPercentage}%</span>
                        </td>
                        <td className="px-4 py-3 text-right text-green-600 font-medium">-{formatNaira(p.discountAmount)}</td>
                        <td className="px-4 py-3 text-right font-semibold text-gray-900">{formatNaira(p.finalAmount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {purchases.map((p) => (
                  <div key={p.id} className="border border-gray-100 rounded-xl p-4 shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-mono text-xs text-gray-500 truncate max-w-[60%]">{p.orderId}</span>
                      <span className="text-xs text-gray-400">{formatDate(p.createdAt)}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <p className="text-gray-400 text-xs">Original</p>
                        <p className="font-medium text-gray-700">{formatNaira(p.originalAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-xs">Discount</p>
                        <p className="font-medium text-green-600">-{formatNaira(p.discountAmount)} ({p.discountPercentage}%)</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-400 text-xs">Final Amount</p>
                        <p className="font-bold text-gray-900">{formatNaira(p.finalAmount)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
