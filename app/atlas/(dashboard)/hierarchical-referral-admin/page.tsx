'use client';

import { useState, useEffect, useCallback } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import
{
  Users,
  DollarSign,
  Shield,
  Search,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronRight,
  Crown,
  Network,
} from 'lucide-react';

interface Influencer
{
  id: string;
  type: 'mother' | 'mini';
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  totalEarnings: number;
  createdAt: any;
  parentInfluencerId?: string;
  masterReferralCode?: string;
  referralCode?: string;
  children?: Influencer[];
}

// ─── Recursive tree node ──────────────────────────────────────────────────────

function countDescendants(nodes: Influencer[]): number
{
  return nodes.reduce((acc, n) => acc + 1 + countDescendants(n.children ?? []), 0);
}

function InfluencerNode({
  node,
  depth = 0,
  onManage,
}: {
  node: Influencer;
  depth?: number;
  onManage: (inf: Influencer) => void;
})
{
  const [open, setOpen] = useState(false);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const totalDesc = countDescendants(node.children ?? []);

  const statusColor =
    node.status === 'active'
      ? 'bg-green-100 text-green-800'
      : node.status === 'suspended'
        ? 'bg-red-100 text-red-800'
        : 'bg-yellow-100 text-yellow-800';

  return (
    <div className={`${depth > 0 ? 'ml-6 border-l-2 border-gray-100 pl-4' : ''}`}>
      <div
        className={`flex items-center justify-between p-3 rounded-lg mb-1 hover:bg-gray-50 transition-colors ${depth === 0 ? 'bg-blue-50 border border-blue-100' : 'bg-white border border-gray-100'
          }`}
      >
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {/* Expand toggle */}
          {hasChildren ? (
            <span
              onClick={() => setOpen(!open)}
              className="flex-shrink-0 w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200 transition-colors"
            >
              {open ? (
                <ChevronDown className="w-4 h-4 text-gray-500" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-500" />
              )}
            </span>
          ) : (
            <div className="w-6 h-6 flex-shrink-0" />
          )}

          {/* Icon */}
          {depth === 0 ? (
            <Crown className="w-4 h-4 text-blue-600 flex-shrink-0" />
          ) : (
            <Users className="w-4 h-4 text-purple-500 flex-shrink-0" />
          )}

          {/* Info */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm text-gray-900 truncate">{node.name}</span>
              <Badge className={`text-xs px-1.5 py-0 ${statusColor}`}>{node.status}</Badge>
              {depth === 0 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0 text-blue-700 border-blue-200">
                  Mother
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3 mt-0.5 flex-wrap">
              <span className="text-xs text-gray-500 truncate">{node.email}</span>
              {(node.masterReferralCode || node.referralCode) && (
                <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono text-gray-600">
                  {node.masterReferralCode || node.referralCode}
                </code>
              )}
            </div>
          </div>
        </div>

        {/* Right side stats */}
        <div className="flex items-center gap-4 flex-shrink-0 ml-2">
          {hasChildren && (
            <div className="text-center hidden sm:block">
              <div className="text-xs text-gray-400">Network</div>
              <div className="text-sm font-semibold text-gray-700">{totalDesc}</div>
            </div>
          )}
          <div className="text-center hidden sm:block">
            <div className="text-xs text-gray-400">Earnings</div>
            <div className="text-sm font-semibold text-green-700">
              ₦{(node.totalEarnings ?? 0).toLocaleString()}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7"
            onClick={() => onManage(node)}
          >
            <Shield className="w-3 h-3 mr-1" />
            Manage
          </Button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && open && (
        <div className="mt-1 mb-2">
          {node.children!.map((child) => (
            <InfluencerNode key={child.id} node={child} depth={depth + 1} onManage={onManage} />
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function HierarchicalReferralAdminPage()
{
  const [mothers, setMothers] = useState<Influencer[]>([]);
  const [allInfluencers, setAllInfluencers] = useState<Influencer[]>([]);
  const [activeTab, setActiveTab] = useState<'network' | 'pending' | 'influencers'>('network');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Manage dialog
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [manageOpen, setManageOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () =>
  {
    try
    {
      setLoading(true);
      const snap = await getDocs(collection(db, 'influencers'));
      const all: Influencer[] = snap.docs.map((d) =>
      {
        const data = d.data();
        return {
          id: d.id,
          type: data.type ?? 'mini',
          name: data.name ?? '',
          email: data.email ?? '',
          status: data.status ?? 'pending',
          totalEarnings: data.totalEarnings ?? 0,
          createdAt: data.createdAt,
          parentInfluencerId: data.parentInfluencerId,
          masterReferralCode: data.masterReferralCode,
          referralCode: data.referralCode,
        };
      });

      setAllInfluencers(all);

      // Build tree: mothers at root, attach children recursively
      const byId = new Map(all.map((inf) => [inf.id, { ...inf, children: [] as Influencer[] }]));

      const roots: Influencer[] = [];
      for (const inf of byId.values())
      {
        if (inf.type === 'mother' || !inf.parentInfluencerId)
        {
          if (inf.type === 'mother') roots.push(inf);
        } else
        {
          const parent = byId.get(inf.parentInfluencerId);
          if (parent)
          {
            parent.children!.push(inf);
          } else
          {
            // orphan mini — attach to a virtual root if needed
          }
        }
      }

      setMothers(roots);
    } catch (err)
    {
      console.error(err);
      toast({ title: 'Error', description: 'Failed to load influencer data', variant: 'destructive' });
    } finally
    {
      setLoading(false);
    }
  }, []);

  useEffect(() =>
  {
    loadData();
  }, [loadData]);

  const handleManage = (inf: Influencer) =>
  {
    setSelectedInfluencer(inf);
    setNewStatus(inf.status);
    setStatusReason('');
    setManageOpen(true);
  };

  const handleSaveStatus = async () =>
  {
    if (!selectedInfluencer || !newStatus) return;
    setSaving(true);
    try
    {
      await updateDoc(doc(db, 'influencers', selectedInfluencer.id), {
        status: newStatus,
        statusReason,
        statusUpdatedAt: new Date().toISOString(),
      });
      toast({ title: 'Updated', description: `${selectedInfluencer.name} status set to ${newStatus}` });
      setManageOpen(false);
      loadData();
    } catch (err)
    {
      toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' });
    } finally
    {
      setSaving(false);
    }
  };

  // Metrics
  const totalMothers = allInfluencers.filter((i) => i.type === 'mother').length;
  const totalMinis = allInfluencers.filter((i) => i.type === 'mini').length;
  const totalEarnings = allInfluencers.reduce((s, i) => s + (i.totalEarnings ?? 0), 0);
  const pendingApprovals = allInfluencers.filter((i) => i.status === 'pending' && i.type === 'mother');

  // Filtered flat list for Influencers tab
  const filtered = allInfluencers.filter((inf) =>
  {
    const matchSearch =
      inf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      inf.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'all' || inf.status === statusFilter;
    const matchType = typeFilter === 'all' || inf.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  });

  const getStatusBadge = (status: string) =>
  {
    if (status === 'active')
      return <Badge className="bg-green-100 text-green-800 text-xs"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
    if (status === 'suspended')
      return <Badge variant="destructive" className="text-xs"><Ban className="w-3 h-3 mr-1" />Suspended</Badge>;
    return <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
  };

  if (loading)
  {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Hierarchical Referral Admin</h1>
        <p className="text-muted-foreground">Manage influencers, monitor networks, and handle approvals</p>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mother Influencers</CardTitle>
            <Crown className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMothers}</div>
            {pendingApprovals.length > 0 && (
              <p className="text-xs text-orange-600 mt-1">{pendingApprovals.length} pending approval</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mini Influencers</CardTitle>
            <Users className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMinis}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Network</CardTitle>
            <Network className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalMothers + totalMinis}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₦{totalEarnings.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Custom Tab Nav */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1" aria-label="Tabs">
          {([
            { key: 'network', label: 'Network Tree' },
            { key: 'pending', label: 'Pending Approvals', count: pendingApprovals.length },
            { key: 'influencers', label: 'All Influencers' },
          ] as const).map((tab) => (
            <span
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.key
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
            >
              {tab.label}
              {'count' in tab && tab.count > 0 && (
                <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-red-500 text-white">
                  {tab.count}
                </span>
              )}
            </span>
          ))}
        </nav>
      </div>

      {/* ── Network Tree Panel ── */}
      {activeTab === 'network' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="w-5 h-5" />
              Mother Influencer Networks
            </CardTitle>
            <CardDescription>
              Click the arrow next to any influencer to expand their downline
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mothers.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>No mother influencers found</p>
              </div>
            ) : (
              <div className="space-y-2">
                {mothers.map((mother) => (
                  <InfluencerNode key={mother.id} node={mother} depth={0} onManage={handleManage} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Pending Approvals Panel ── */}
      {activeTab === 'pending' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Pending Mother Influencer Approvals
            </CardTitle>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Pending Approvals</h3>
                <p className="text-muted-foreground">All applications have been processed</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pendingApprovals.map((inf) => (
                  <Card key={inf.id} className="border-l-4 border-l-yellow-500">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <div className="font-medium">{inf.name}</div>
                          <div className="text-sm text-muted-foreground">{inf.email}</div>
                          {inf.masterReferralCode && (
                            <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono mt-1 inline-block">
                              {inf.masterReferralCode}
                            </code>
                          )}
                          <div className="text-xs text-muted-foreground mt-1">
                            Applied:{' '}
                            {inf.createdAt
                              ? new Date(
                                inf.createdAt?._seconds
                                  ? inf.createdAt._seconds * 1000
                                  : inf.createdAt
                              ).toLocaleDateString()
                              : 'Unknown'}
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-green-600 border-green-600 hover:bg-green-50">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Approve
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Approve Mother Influencer</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Approve {inf.name}? This activates their account.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-green-600 hover:bg-green-700"
                                  onClick={async () =>
                                  {
                                    await updateDoc(doc(db, 'influencers', inf.id), { status: 'active' });
                                    toast({ title: 'Approved', description: `${inf.name} is now active` });
                                    loadData();
                                  }}
                                >
                                  Approve
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-red-600 border-red-600 hover:bg-red-50">
                                <XCircle className="w-4 h-4 mr-1" />
                                Reject
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Reject Application</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Reject {inf.name}'s application? This will suspend their account.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-600 hover:bg-red-700"
                                  onClick={async () =>
                                  {
                                    await updateDoc(doc(db, 'influencers', inf.id), { status: 'suspended' });
                                    toast({ title: 'Rejected', description: `${inf.name}'s application rejected` });
                                    loadData();
                                  }}
                                >
                                  Reject
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── All Influencers Panel ── */}
      {activeTab === 'influencers' && (
        <Card>
          <CardHeader>
            <CardTitle>All Influencers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 mb-4 flex-wrap">
              <div className="flex-1 min-w-48">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by name or email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="mother">Mother</SelectItem>
                  <SelectItem value="mini">Mini</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="h-10 px-4 text-left font-medium">Name</th>
                    <th className="h-10 px-4 text-left font-medium">Email</th>
                    <th className="h-10 px-4 text-left font-medium">Type</th>
                    <th className="h-10 px-4 text-left font-medium">Status</th>
                    <th className="h-10 px-4 text-left font-medium">Earnings</th>
                    <th className="h-10 px-4 text-left font-medium">Code</th>
                    <th className="h-10 px-4 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-gray-400">No influencers found</td>
                    </tr>
                  ) : (
                    filtered.map((inf) => (
                      <tr key={inf.id} className="border-b hover:bg-muted/30">
                        <td className="p-3">{inf.name}</td>
                        <td className="p-3 text-gray-500">{inf.email}</td>
                        <td className="p-3">
                          <Badge variant={inf.type === 'mother' ? 'default' : 'secondary'} className="text-xs">
                            {inf.type}
                          </Badge>
                        </td>
                        <td className="p-3">{getStatusBadge(inf.status)}</td>
                        <td className="p-3 font-medium text-green-700">₦{(inf.totalEarnings ?? 0).toLocaleString()}</td>
                        <td className="p-3">
                          <code className="text-xs bg-gray-100 px-1.5 py-0.5 rounded font-mono">
                            {inf.masterReferralCode || inf.referralCode || '—'}
                          </code>
                        </td>
                        <td className="p-3">
                          <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => handleManage(inf)}>
                            <Shield className="w-3 h-3 mr-1" />
                            Manage
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Manage Dialog */}
      <Dialog open={manageOpen} onOpenChange={setManageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Influencer</DialogTitle>
            <DialogDescription>{selectedInfluencer?.name} — {selectedInfluencer?.email}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea
                placeholder="Reason for status change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setManageOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveStatus} disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
