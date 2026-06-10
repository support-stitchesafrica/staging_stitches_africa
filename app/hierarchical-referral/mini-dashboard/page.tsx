'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { auth, db } from '@/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import
{
    doc, getDoc, collection, query, where, getDocs,
    addDoc, serverTimestamp, orderBy
} from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { EditableReferralCode } from '@/components/hierarchical-referral/EditableReferralCode';
import { ReferralTree, TreeNode } from '@/components/hierarchical-referral/ReferralTree';
import { copyToClipboard } from '@/lib/hierarchical-referral/utils/clipboard';
import
{
    DollarSign, TrendingUp, Users, LogOut, Loader2, RefreshCw,
    CheckCircle, Link as LinkIcon, Plus, Copy, Network, Clock,
    BarChart3, Share2, Settings, Zap, ChevronRight, Sparkles, Wallet
} from 'lucide-react';

interface MiniInfluencerData
{
    id: string; name: string; type: string; status: string;
    referralCode?: string; parentInfluencerId?: string; totalEarnings: number;
    payoutInfo?: { minimumThreshold: number; currency: string; isVerified: boolean };
}
interface SavedCode { id: string; code: string; link: string; createdAt: any; }

async function fetchDescendants(parentId: string): Promise<TreeNode[]>
{
    const q = query(collection(db, 'influencers'), where('parentInfluencerId', '==', parentId));
    const snap = await getDocs(q);
    const nodes: TreeNode[] = [];
    for (const d of snap.docs)
    {
        const data = d.data();
        nodes.push({
            id: d.id, name: data.name ?? '', email: data.email ?? '',
            status: data.status ?? 'inactive', totalEarnings: data.totalEarnings ?? 0,
            referralCode: data.referralCode, children: await fetchDescendants(d.id),
        });
    }
    return nodes;
}

function countAll(nodes: TreeNode[]): number
{
    return nodes.reduce((acc, n) => acc + 1 + countAll(n.children ?? []), 0);
}

function StatCard({ icon, label, value, sub, color }: {
    icon: React.ReactNode; label: string; value: string | number; sub?: string; color: string;
})
{
    return (
        <Card className="relative overflow-hidden border-0 shadow-sm bg-white">
            <CardContent className="pt-5 pb-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
                    </div>
                    <div className={`p-2.5 rounded-xl ${color}`}>{icon}</div>
                </div>
            </CardContent>
        </Card>
    );
}

export default function MiniInfluencerDashboard()
{
    const router = useRouter();
    const [influencer, setInfluencer] = useState<MiniInfluencerData | null>(null);
    const [tree, setTree] = useState<TreeNode[]>([]);
    const [savedCodes, setSavedCodes] = useState<SavedCode[]>([]);
    const [token, setToken] = useState<string | null>(null);
    const [uid, setUid] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isGeneratingCode, setIsGeneratingCode] = useState(false);
    const [newSubCode, setNewSubCode] = useState<string | null>(null);
    const [inviteLink, setInviteLink] = useState<string | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const [origin, setOrigin] = useState('');

    useEffect(() => { setOrigin(window.location.origin); }, []);

    useEffect(() =>
    {
        const unsub = onAuthStateChanged(auth, async (user) =>
        {
            if (!user) { router.push('/hierarchical-referral/login'); return; }
            const idToken = await user.getIdToken();
            setToken(idToken); setUid(user.uid);
            await loadDashboard(user.uid);
        });
        return () => unsub();
    }, [router]);

    const loadDashboard = async (userId: string) =>
    {
        setIsLoading(true); setError(null);
        try
        {
            const snap = await getDoc(doc(db, 'influencers', userId));
            if (!snap.exists()) { setError('Influencer account not found.'); return; }
            const data = snap.data();
            if (data.type !== 'mini') { router.push('/hierarchical-referral/dashboard'); return; }
            setInfluencer({ id: userId, ...data } as MiniInfluencerData);
            setTree(await fetchDescendants(userId));
            const codesSnap = await getDocs(query(collection(db, 'influencers', userId, 'generatedCodes'), orderBy('createdAt', 'desc')));
            setSavedCodes(codesSnap.docs.map(d => ({ id: d.id, ...d.data() } as SavedCode)));
        } catch (err: any) { setError(err.message || 'Failed to load dashboard'); }
        finally { setIsLoading(false); }
    };

    const generateSubCode = async () =>
    {
        if (!token || !uid) return;
        setIsGeneratingCode(true); setNewSubCode(null); setInviteLink(null);
        try
        {
            const res = await fetch('/api/hierarchical-referral/codes/generate-sub-direct', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const data = await res.json();
            if (data.success)
            {
                const code = data.data.subReferralCode;
                const link = `${window.location.origin}/hierarchical-referral/mini-influencer?ref=${code}`;
                setNewSubCode(code); setInviteLink(link);
                await addDoc(collection(db, 'influencers', uid, 'generatedCodes'), { code, link, createdAt: serverTimestamp() });
                const codesSnap = await getDocs(query(collection(db, 'influencers', uid, 'generatedCodes'), orderBy('createdAt', 'desc')));
                setSavedCodes(codesSnap.docs.map(d => ({ id: d.id, ...d.data() } as SavedCode)));
            } else { setError(data.error || 'Failed to generate code'); }
        } catch { setError('Failed to generate invite code'); }
        finally { setIsGeneratingCode(false); }
    };

    const copyText = (text: string, key: string) =>
    {
        copyToClipboard(text); setCopied(key);
        setTimeout(() => setCopied(null), 2000);
    };

    const handleLogout = async () => { await auth.signOut(); router.push('/hierarchical-referral/login'); };

    const earnings = influencer?.totalEarnings ?? 0;
    const threshold = influencer?.payoutInfo?.minimumThreshold ?? 0;
    const payoutProgress = threshold > 0 ? Math.min((earnings / threshold) * 100, 100) : 0;
    const totalNetwork = countAll(tree);
    const activeDirects = tree.filter(m => m.status === 'active').length;

    if (isLoading) return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-purple-950 flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="relative mx-auto w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-4 border-violet-500/20" />
                    <div className="absolute inset-0 rounded-full border-4 border-t-violet-400 animate-spin" />
                    <Users className="absolute inset-0 m-auto h-6 w-6 text-violet-400" />
                </div>
                <p className="text-violet-200 text-sm font-medium">Loading your dashboard...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50/50">
            {/* Header */}
            <header className="bg-gradient-to-r from-slate-900 via-violet-950 to-purple-900 text-white sticky top-0 z-30 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-violet-400/20 rounded-lg">
                                <Users className="h-5 w-5 text-violet-300" />
                            </div>
                            <div>
                                <Link href="/hierarchical-referral" className="text-sm font-bold text-white hover:text-violet-200 transition-colors">
                                    Stitches Africa
                                </Link>
                                <p className="text-xs text-violet-300">Mini Influencer Portal</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2.5 bg-white/10 rounded-xl px-3 py-1.5">
                                <Avatar className="h-7 w-7">
                                    <AvatarFallback className="bg-violet-500 text-white text-xs font-bold">
                                        {influencer?.name?.charAt(0) ?? 'M'}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="text-right">
                                    <p className="text-xs font-semibold text-white leading-tight">{influencer?.name}</p>
                                    <p className="text-xs text-violet-300">Mini Influencer</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={handleLogout}
                                className="text-violet-200 hover:text-white hover:bg-white/10 gap-1.5">
                                <LogOut className="h-4 w-4" />
                                <span className="hidden sm:inline text-xs">Logout</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <div className="bg-gradient-to-r from-slate-900 via-violet-950 to-purple-900 text-white pb-16 pt-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <Sparkles className="h-4 w-4 text-violet-300" />
                                <span className="text-xs text-violet-300 font-medium uppercase tracking-widest">Welcome back</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-white">{influencer?.name ?? 'Dashboard'}</h1>
                            <p className="text-violet-300 text-sm mt-1">
                                {totalNetwork} in your sub-network · {activeDirects} direct recruits active
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-white/10 backdrop-blur rounded-xl px-4 py-2 text-center">
                                <p className="text-xs text-violet-300">Total Earnings</p>
                                <p className="text-xl font-bold text-yellow-300">₦{earnings.toLocaleString()}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stats */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <StatCard icon={<DollarSign className="h-5 w-5 text-emerald-600" />} label="Earnings" value={`₦${earnings.toLocaleString()}`} color="bg-emerald-50" />
                    <StatCard icon={<Wallet className="h-5 w-5 text-blue-600" />} label="Payout Progress" value={`${Math.round(payoutProgress)}%`} sub={`of ₦${threshold.toLocaleString()}`} color="bg-blue-50" />
                    <StatCard icon={<Users className="h-5 w-5 text-purple-600" />} label="Sub-Network" value={totalNetwork} sub={`${activeDirects} active`} color="bg-purple-50" />
                    <StatCard icon={<Share2 className="h-5 w-5 text-orange-600" />} label="Saved Codes" value={savedCodes.length} color="bg-orange-50" />
                </div>
            </div>

            {/* Tabs */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {error && (
                    <Alert variant="destructive" className="mb-6">
                        <AlertDescription className="flex items-center justify-between">
                            {error}
                            <Button variant="ghost" size="sm" onClick={() => { const u = auth.currentUser; if (u) loadDashboard(u.uid); }}>
                                <RefreshCw className="h-4 w-4 mr-1" /> Retry
                            </Button>
                        </AlertDescription>
                    </Alert>
                )}

                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="bg-white border border-gray-200 shadow-sm p-1 rounded-xl h-auto flex-wrap gap-1">
                        <TabsTrigger value="overview" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow gap-1.5 text-sm">
                            <BarChart3 className="h-4 w-4" /> Overview
                        </TabsTrigger>
                        <TabsTrigger value="earnings" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow gap-1.5 text-sm">
                            <Wallet className="h-4 w-4" /> Earnings
                        </TabsTrigger>
                        <TabsTrigger value="invite" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow gap-1.5 text-sm">
                            <Share2 className="h-4 w-4" /> Invite
                        </TabsTrigger>
                        <TabsTrigger value="network" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow gap-1.5 text-sm">
                            <Network className="h-4 w-4" /> Network
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-violet-600 data-[state=active]:text-white data-[state=active]:shadow gap-1.5 text-sm">
                            <Settings className="h-4 w-4" /> Settings
                        </TabsTrigger>
                    </TabsList>

                    {/* OVERVIEW */}
                    <TabsContent value="overview" className="space-y-6 mt-0">
                        <div className="grid lg:grid-cols-3 gap-6">
                            <Card className="lg:col-span-2 border-0 shadow-sm">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold">Performance Summary</CardTitle>
                                        <Badge className={`text-xs border-0 ${influencer?.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                                            {influencer?.status ?? 'inactive'}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="flex items-end gap-2">
                                        <span className="text-4xl font-bold text-gray-900">₦{earnings.toLocaleString()}</span>
                                        <span className="text-sm text-gray-400 mb-1">total earned</span>
                                    </div>
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between text-xs text-gray-500">
                                            <span>Payout progress</span>
                                            <span>{Math.round(payoutProgress)}% of ₦{threshold.toLocaleString()}</span>
                                        </div>
                                        <Progress value={payoutProgress} className="h-2" />
                                    </div>
                                    <Separator />
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-2xl font-bold text-violet-600">{tree.length}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Direct Recruits</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-purple-600">{totalNetwork}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Total Network</p>
                                        </div>
                                        <div>
                                            <p className="text-2xl font-bold text-emerald-600">{activeDirects}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">Active</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold">Quick Actions</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2">
                                    {[
                                        { label: 'Generate Invite Link', icon: <Plus className="h-4 w-4" />, color: 'bg-violet-50 text-violet-700 hover:bg-violet-100' },
                                        { label: 'View Sub-Network', icon: <Network className="h-4 w-4" />, color: 'bg-purple-50 text-purple-700 hover:bg-purple-100' },
                                        { label: 'Edit Referral Code', icon: <Settings className="h-4 w-4" />, color: 'bg-gray-50 text-gray-700 hover:bg-gray-100' },
                                    ].map(({ label, icon, color }) => (
                                        <button key={label} className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${color}`}>
                                            <span className="flex items-center gap-2">{icon}{label}</span>
                                            <ChevronRight className="h-4 w-4 opacity-50" />
                                        </button>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>

                        {savedCodes.length > 0 && (
                            <Card className="border-0 shadow-sm">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Clock className="h-4 w-4 text-gray-400" /> Recent Invite Codes
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="space-y-2">
                                        {savedCodes.slice(0, 3).map((sc) => (
                                            <div key={sc.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                                                <div className="p-1.5 bg-violet-100 rounded-lg shrink-0">
                                                    <LinkIcon className="h-3 w-3 text-violet-600" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <code className="text-xs font-bold text-gray-800 block truncate">{sc.code}</code>
                                                    <span className="text-xs text-gray-400 truncate block">{sc.link}</span>
                                                </div>
                                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0" onClick={() => copyText(sc.link, sc.id)}>
                                                    {copied === sc.id ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>

                    {/* EARNINGS */}
                    <TabsContent value="earnings" className="mt-0">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">Payout Progress</CardTitle>
                                    <CardDescription>Minimum threshold: ₦{threshold > 0 ? threshold.toLocaleString() : '—'}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-5">
                                    <div className="text-center py-4">
                                        <p className="text-5xl font-bold text-gray-900">₦{earnings.toLocaleString()}</p>
                                        <p className="text-sm text-gray-400 mt-1">current balance</p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-500">Progress to payout</span>
                                            <span className="font-semibold text-gray-900">{Math.round(payoutProgress)}%</span>
                                        </div>
                                        <Progress value={payoutProgress} className="h-3" />
                                        <p className="text-xs text-gray-400">₦{Math.max(0, threshold - earnings).toLocaleString()} remaining to reach threshold</p>
                                    </div>
                                    <Separator />
                                    {influencer?.payoutInfo?.isVerified ? (
                                        <div className="flex items-center gap-2 p-3 bg-emerald-50 rounded-xl">
                                            <CheckCircle className="h-5 w-5 text-emerald-600 shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-emerald-800">Payout Verified</p>
                                                <p className="text-xs text-emerald-600">Your payout account is set up and ready</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 bg-amber-50 rounded-xl">
                                            <TrendingUp className="h-5 w-5 text-amber-600 shrink-0" />
                                            <div>
                                                <p className="text-sm font-semibold text-amber-800">Payout Not Verified</p>
                                                <p className="text-xs text-amber-600">Contact your sponsor to set up your payout account</p>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">Your Referral Code</CardTitle>
                                    <CardDescription>Share with customers to earn commissions on their orders</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {influencer?.referralCode && token ? (
                                        <EditableReferralCode
                                            code={influencer.referralCode}
                                            token={token}
                                            onUpdated={(newCode) => setInfluencer(prev => prev ? { ...prev, referralCode: newCode } : prev)}
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-500">No referral code assigned yet. Contact your sponsor.</p>
                                    )}
                                    <p className="text-xs text-gray-400">Click the pencil icon to customise your code</p>
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* INVITE */}
                    <TabsContent value="invite" className="space-y-6 mt-0">

                        {/* Customer shop link */}
                        {influencer?.referralCode && (
                            <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <LinkIcon className="h-4 w-4 text-amber-600" /> Share with Customers
                                    </CardTitle>
                                    <CardDescription>Send this link to customers — when they sign up and shop, you earn commission</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {[
                                        {
                                            label: 'Shop link (with your referral code)',
                                            value: `${origin}/shops?ref=${influencer.referralCode}`,
                                            key: 'shopLink',
                                        },
                                        {
                                            label: 'Sign-up link (pre-fills your code)',
                                            value: `${origin}/shops/auth?ref=${influencer.referralCode}`,
                                            key: 'signupLink',
                                        },
                                    ].map(({ label, value, key }) => (
                                        <div key={key}>
                                            <p className="text-xs text-gray-500 mb-1">{label}</p>
                                            <div className="flex items-center gap-2 bg-white border border-amber-200 rounded-lg px-3 py-2.5">
                                                <Input readOnly value={value}
                                                    className="border-0 bg-transparent p-0 text-xs text-amber-800 font-mono h-auto focus-visible:ring-0" />
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => copyText(value, key)}>
                                                    {copied === key ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-400" />}
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <p className="text-xs text-amber-700 bg-amber-100 rounded-lg px-3 py-2">
                                        Customers who sign up via your link will have your referral code attached. You earn commission on their purchases.
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold flex items-center gap-2">
                                        <Zap className="h-4 w-4 text-yellow-500" /> Generate New Invite
                                    </CardTitle>
                                    <CardDescription>Recruit others to join as Mini Influencers under you</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <Button onClick={generateSubCode} disabled={isGeneratingCode}
                                        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-md h-11">
                                        {isGeneratingCode
                                            ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</>
                                            : <><Plus className="mr-2 h-4 w-4" /> Generate Invite Code & Link</>}
                                    </Button>

                                    {newSubCode && (
                                        <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl space-y-3">
                                            <div className="flex items-center gap-2">
                                                <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0" />
                                                <span className="text-sm font-semibold text-emerald-800">Code generated successfully</span>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1.5">Sub-referral code</p>
                                                <div className="flex items-center gap-2 bg-white border border-emerald-200 rounded-lg px-3 py-2.5">
                                                    <code className="flex-1 font-mono font-bold text-emerald-800 text-sm">{newSubCode}</code>
                                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => copyText(newSubCode, 'code')}>
                                                        {copied === 'code' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-400" />}
                                                    </Button>
                                                </div>
                                            </div>
                                            {inviteLink && (
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                                                        <LinkIcon className="h-3 w-3" /> Invite link
                                                    </p>
                                                    <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2.5">
                                                        <Input readOnly value={inviteLink}
                                                            className="border-0 bg-transparent p-0 text-xs text-blue-700 font-mono h-auto focus-visible:ring-0" />
                                                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0" onClick={() => copyText(inviteLink, 'link')}>
                                                            {copied === 'link' ? <CheckCircle className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4 text-gray-400" />}
                                                        </Button>
                                                    </div>
                                                    <p className="text-xs text-gray-400 mt-1.5">Saved automatically to your code history</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-base font-semibold flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-gray-400" /> Code History
                                        </CardTitle>
                                        <Badge variant="secondary">{savedCodes.length}</Badge>
                                    </div>
                                    <CardDescription>All previously generated invite codes</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {savedCodes.length === 0 ? (
                                        <div className="text-center py-8 text-gray-400">
                                            <Share2 className="h-8 w-8 mx-auto mb-2 opacity-30" />
                                            <p className="text-sm">No codes generated yet</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                                            {savedCodes.map((sc) => (
                                                <div key={sc.id} className="flex items-center gap-3 p-3 bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl group">
                                                    <div className="p-1.5 bg-violet-100 rounded-lg shrink-0">
                                                        <LinkIcon className="h-3 w-3 text-violet-600" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <code className="text-xs font-bold text-gray-800 block truncate">{sc.code}</code>
                                                        <span className="text-xs text-gray-400 truncate block">{sc.link}</span>
                                                    </div>
                                                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => copyText(sc.link, sc.id)}>
                                                        {copied === sc.id ? <CheckCircle className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4 text-gray-400" />}
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>

                    {/* NETWORK */}
                    <TabsContent value="network" className="mt-0">
                        <Card className="border-0 shadow-sm">
                            <CardHeader>
                                <div className="flex items-center justify-between flex-wrap gap-3">
                                    <div>
                                        <CardTitle className="text-base font-semibold">Your Sub-Network</CardTitle>
                                        <CardDescription>Full pyramid view of everyone you've recruited</CardDescription>
                                    </div>
                                    <div className="flex gap-2">
                                        <div className="bg-emerald-50 rounded-lg px-3 py-1.5 text-center">
                                            <p className="text-xs text-gray-500">Active</p>
                                            <p className="text-sm font-bold text-emerald-700">{activeDirects}</p>
                                        </div>
                                        <div className="bg-violet-50 rounded-lg px-3 py-1.5 text-center">
                                            <p className="text-xs text-gray-500">Total</p>
                                            <p className="text-sm font-bold text-violet-700">{totalNetwork}</p>
                                        </div>
                                    </div>
                                </div>
                            </CardHeader>
                            <CardContent>
                                <ReferralTree
                                    mother={{ name: influencer?.name ?? '', referralCode: influencer?.referralCode, totalEarnings: earnings }}
                                    miniInfluencers={tree}
                                />
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* SETTINGS */}
                    <TabsContent value="settings" className="mt-0">
                        <div className="grid lg:grid-cols-2 gap-6">
                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">Your Referral Code</CardTitle>
                                    <CardDescription>Customise your personal code for customer referrals</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {influencer?.referralCode && token ? (
                                        <EditableReferralCode
                                            code={influencer.referralCode}
                                            token={token}
                                            onUpdated={(newCode) => setInfluencer(prev => prev ? { ...prev, referralCode: newCode } : prev)}
                                        />
                                    ) : (
                                        <p className="text-sm text-gray-500">No referral code assigned yet.</p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="border-0 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="text-base font-semibold">Account Info</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {[
                                        { label: 'Name', value: influencer?.name },
                                        { label: 'Role', value: 'Mini Influencer' },
                                        { label: 'Status', value: influencer?.status },
                                        { label: 'Payout Verified', value: influencer?.payoutInfo?.isVerified ? 'Yes' : 'No' },
                                    ].map(({ label, value }) => (
                                        <div key={label} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0">
                                            <span className="text-sm text-gray-500">{label}</span>
                                            <span className="text-sm font-medium text-gray-900 capitalize">{value}</span>
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
