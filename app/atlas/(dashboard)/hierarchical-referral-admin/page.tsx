'use client';

import { useState, useEffect } from 'react';
import { auth } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { toast } from '@/hooks/use-toast';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Activity, 
  AlertTriangle, 
  Shield, 
  Search,
  Eye,
  Ban,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react';

interface SystemMetrics {
  totalMotherInfluencers: number;
  totalMiniInfluencers: number;
  totalEarnings: number;
  totalActivities: number;
  averageNetworkSize: number;
}

interface Influencer {
  id: string;
  type: 'mother' | 'mini';
  name: string;
  email: string;
  status: 'active' | 'suspended' | 'pending';
  totalEarnings: number;
  createdAt: string;
  parentInfluencerId?: string;
  masterReferralCode?: string;
}

interface ReferralTree {
  motherInfluencer: Influencer;
  miniInfluencers: Influencer[];
  totalNetworkEarnings: number;
  totalNetworkActivities: number;
}

interface DisputeCase {
  id: string;
  type: 'commission' | 'payout';
  amount: number;
  status: string;
  createdAt: string;
  reason?: string;
}

export default function HierarchicalReferralAdminPage() {
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [referralTrees, setReferralTrees] = useState<ReferralTree[]>([]);
  const [disputeCases, setDisputeCases] = useState<DisputeCase[]>([]);
  const [adminLogs, setAdminLogs] = useState<any[]>([]);
  const [pendingMotherInfluencers, setPendingMotherInfluencers] = useState<Influencer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Dialog states
  const [selectedInfluencer, setSelectedInfluencer] = useState<Influencer | null>(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [statusReason, setStatusReason] = useState('');

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get Firebase ID token for authentication
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to access admin features',
          variant: 'destructive'
        });
        return;
      }

      const idToken = await user.getIdToken();
      const headers = {
        'Authorization': `Bearer ${idToken}`,
        'Content-Type': 'application/json'
      };
      
      // Load system metrics and referral trees
      const [dashboardResponse, treesResponse, disputesResponse, logsResponse, pendingResponse] = await Promise.all([
        fetch('/api/hierarchical-referral/admin/dashboard', { headers }),
        fetch('/api/hierarchical-referral/admin/referral-trees', { headers }),
        fetch('/api/hierarchical-referral/admin/disputes', { headers }),
        fetch('/api/hierarchical-referral/admin/logs?limit=20', { headers }),
        fetch('/api/hierarchical-referral/admin/influencers?search=&status=pending&type=mother&limit=50', { headers })
      ]);

      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setSystemMetrics(dashboardData.data?.systemMetrics || null);
      } else {
        console.warn('Failed to load dashboard data:', dashboardResponse.status);
      }

      if (treesResponse.ok) {
        const treesData = await treesResponse.json();
        setReferralTrees(Array.isArray(treesData.data) ? treesData.data : []);
      } else {
        console.warn('Failed to load referral trees:', treesResponse.status);
      }

      if (disputesResponse.ok) {
        const disputesData = await disputesResponse.json();
        setDisputeCases(Array.isArray(disputesData.data) ? disputesData.data : []);
      } else {
        console.warn('Failed to load disputes:', disputesResponse.status);
      }

      if (logsResponse.ok) {
        const logsData = await logsResponse.json();
        const logs = logsData.data?.logs || logsData.data || [];
        setAdminLogs(Array.isArray(logs) ? logs : []);
      } else {
        console.warn('Failed to load admin logs:', logsResponse.status);
      }

      if (pendingResponse.ok) {
        const pendingData = await pendingResponse.json();
        // Handle different possible response structures
        const pendingInfluencers = pendingData.data?.searchResults || pendingData.data?.data || pendingData.data || [];
        setPendingMotherInfluencers(Array.isArray(pendingInfluencers) ? pendingInfluencers : []);
      } else {
        console.warn('Failed to load pending mother influencers:', pendingResponse.status);
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load dashboard data',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInfluencerApproval = async (influencerId: string, newStatus: 'active' | 'suspended') => {
    try {
      // Get Firebase ID token for authentication
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to perform this action',
          variant: 'destructive'
        });
        return;
      }

      const idToken = await user.getIdToken();

      const response = await fetch(`/api/hierarchical-referral/admin/influencer/${influencerId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          reason: newStatus === 'active' ? 'Approved by admin' : 'Rejected by admin'
        })
      });

      if (response.ok) {
        const actionText = newStatus === 'active' ? 'approved' : 'rejected';
        toast({
          title: 'Success',
          description: `Mother Influencer ${actionText} successfully`,
          variant: newStatus === 'active' ? 'default' : 'destructive'
        });
        
        // Reload dashboard data to refresh the lists
        loadDashboardData();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating influencer status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update influencer status',
        variant: 'destructive'
      });
    }
  };

  const handleStatusUpdate = async () => {
    if (!selectedInfluencer || !newStatus) return;

    try {
      // Get Firebase ID token for authentication
      const user = auth.currentUser;
      if (!user) {
        toast({
          title: 'Authentication Error',
          description: 'Please log in to perform this action',
          variant: 'destructive'
        });
        return;
      }

      const idToken = await user.getIdToken();

      const response = await fetch(`/api/hierarchical-referral/admin/influencer/${selectedInfluencer.id}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          status: newStatus,
          reason: statusReason
        })
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Influencer status updated successfully'
        });
        setStatusUpdateDialog(false);
        setSelectedInfluencer(null);
        setNewStatus('');
        setStatusReason('');
        loadDashboardData();
      } else {
        const error = await response.json();
        toast({
          title: 'Error',
          description: error.error || 'Failed to update status',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update influencer status',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Active</Badge>;
      case 'suspended':
        return <Badge variant="destructive"><Ban className="w-3 h-3 mr-1" />Suspended</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const filteredInfluencers = referralTrees.flatMap(tree => [tree.motherInfluencer, ...tree.miniInfluencers])
    .filter(influencer => {
      const matchesSearch = influencer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           influencer.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || influencer.status === statusFilter;
      const matchesType = typeFilter === 'all' || influencer.type === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hierarchical Referral Admin</h1>
          <p className="text-muted-foreground">
            Manage influencers, monitor system performance, and handle disputes
          </p>
        </div>
      </div>

      {/* System Metrics */}
      {systemMetrics && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mother Influencers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.totalMotherInfluencers}</div>
              {pendingMotherInfluencers.length > 0 && (
                <div className="text-xs text-orange-600 mt-1">
                  {pendingMotherInfluencers.length} pending approval
                </div>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mini Influencers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.totalMiniInfluencers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${systemMetrics.totalEarnings.toFixed(2)}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.totalActivities}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Network Size</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{systemMetrics.averageNetworkSize.toFixed(1)}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="pending-approvals" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending-approvals">
            Pending Approvals
            {pendingMotherInfluencers.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {pendingMotherInfluencers.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="influencers">Influencers</TabsTrigger>
          <TabsTrigger value="referral-trees">Referral Trees</TabsTrigger>
          <TabsTrigger value="disputes">Disputes</TabsTrigger>
          <TabsTrigger value="audit-logs">Audit Logs</TabsTrigger>
        </TabsList>

        <TabsContent value="pending-approvals" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Pending Mother Influencer Approvals
              </CardTitle>
              <CardDescription>
                Review and approve or reject mother influencer applications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {pendingMotherInfluencers.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Pending Approvals</h3>
                  <p className="text-muted-foreground">All mother influencer applications have been processed</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingMotherInfluencers.map((influencer) => (
                    <Card key={influencer.id} className="border-l-4 border-l-yellow-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-4">
                              <div className="flex-1">
                                <div className="font-medium text-lg">{influencer.name}</div>
                                <div className="text-sm text-muted-foreground">{influencer.email}</div>
                                <div className="text-xs text-muted-foreground mt-1">
                                  Applied: {new Date(
                                    (influencer.createdAt as any)?._seconds 
                                      ? (influencer.createdAt as any)._seconds * 1000 
                                      : influencer.createdAt
                                  ).toLocaleDateString()}
                                </div>
                                {influencer.masterReferralCode && (
                                  <div className="text-xs text-muted-foreground">
                                    Referral Code: <span className="font-mono">{influencer.masterReferralCode}</span>
                                  </div>
                                )}
                                {(influencer as any).verificationData?.expectedMonthlyReferrals && (
                                  <div className="text-xs text-muted-foreground">
                                    Expected Monthly Referrals: {(influencer as any).verificationData.expectedMonthlyReferrals}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
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
                                    Are you sure you want to approve {influencer.name} as a Mother Influencer? 
                                    This will activate their account and allow them to start recruiting Mini Influencers.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleInfluencerApproval(influencer.id, 'active')}
                                    className="bg-green-600 hover:bg-green-700"
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
                                  <AlertDialogTitle>Reject Mother Influencer</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to reject {influencer.name}'s application? 
                                    This action cannot be undone and they will need to reapply.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction 
                                    onClick={() => handleInfluencerApproval(influencer.id, 'suspended')}
                                    className="bg-red-600 hover:bg-red-700"
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
        </TabsContent>

        <TabsContent value="influencers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Influencer Management</CardTitle>
              <CardDescription>
                Search, filter, and manage all influencers in the system
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search and Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search by name or email..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="status-filter">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="type-filter">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All</SelectItem>
                      <SelectItem value="mother">Mother</SelectItem>
                      <SelectItem value="mini">Mini</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Influencers Table */}
              <div className="rounded-md border">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="h-12 px-4 text-left align-middle font-medium">Name</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Email</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Type</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Status</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Earnings</th>
                        <th className="h-12 px-4 text-left align-middle font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInfluencers.map((influencer) => (
                        <tr key={influencer.id} className="border-b">
                          <td className="p-4 align-middle">{influencer.name}</td>
                          <td className="p-4 align-middle">{influencer.email}</td>
                          <td className="p-4 align-middle">
                            <Badge variant={influencer.type === 'mother' ? 'default' : 'secondary'}>
                              {influencer.type}
                            </Badge>
                          </td>
                          <td className="p-4 align-middle">{getStatusBadge(influencer.status)}</td>
                          <td className="p-4 align-middle">${influencer.totalEarnings.toFixed(2)}</td>
                          <td className="p-4 align-middle">
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                  setSelectedInfluencer(influencer);
                                  setNewStatus(influencer.status);
                                  setStatusUpdateDialog(true);
                                }}
                              >
                                <Shield className="w-4 h-4 mr-1" />
                                Manage
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referral-trees" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Referral Trees</CardTitle>
              <CardDescription>
                View all Mother Influencers and their complete referral networks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {referralTrees.map((tree) => (
                  <Card key={tree.motherInfluencer.id} className="border-l-4 border-l-blue-500">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <CardTitle className="text-lg">{tree.motherInfluencer.name}</CardTitle>
                          <CardDescription>{tree.motherInfluencer.email}</CardDescription>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Network Earnings</div>
                          <div className="text-lg font-semibold">${tree.totalNetworkEarnings.toFixed(2)}</div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid gap-4 md:grid-cols-3 mb-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold">{tree.miniInfluencers.length}</div>
                          <div className="text-sm text-muted-foreground">Mini Influencers</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">{tree.totalNetworkActivities}</div>
                          <div className="text-sm text-muted-foreground">Total Activities</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold">
                            {tree.miniInfluencers.filter(m => m.status === 'active').length}
                          </div>
                          <div className="text-sm text-muted-foreground">Active Minis</div>
                        </div>
                      </div>
                      
                      {tree.miniInfluencers.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Mini Influencers</h4>
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3">
                            {tree.miniInfluencers.slice(0, 6).map((mini) => (
                              <div key={mini.id} className="flex items-center justify-between p-2 border rounded">
                                <div>
                                  <div className="font-medium text-sm">{mini.name}</div>
                                  <div className="text-xs text-muted-foreground">${mini.totalEarnings.toFixed(2)}</div>
                                </div>
                                {getStatusBadge(mini.status)}
                              </div>
                            ))}
                          </div>
                          {tree.miniInfluencers.length > 6 && (
                            <div className="text-sm text-muted-foreground mt-2">
                              +{tree.miniInfluencers.length - 6} more mini influencers
                            </div>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="disputes" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5" />
                Dispute Cases
              </CardTitle>
              <CardDescription>
                Review and resolve commission and payout disputes
              </CardDescription>
            </CardHeader>
            <CardContent>
              {disputeCases.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-medium">No Active Disputes</h3>
                  <p className="text-muted-foreground">All disputes have been resolved</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {disputeCases.map((dispute) => (
                    <Card key={dispute.id} className="border-l-4 border-l-orange-500">
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">
                              {dispute.type === 'commission' ? 'Commission Dispute' : 'Payout Issue'}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              Amount: ${dispute.amount.toFixed(2)} • Status: {dispute.status}
                            </div>
                            {dispute.reason && (
                              <div className="text-sm text-muted-foreground mt-1">
                                Reason: {dispute.reason}
                              </div>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              Review
                            </Button>
                            <Button variant="outline" size="sm">
                              Resolve
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Audit Logs
              </CardTitle>
              <CardDescription>
                Track all administrative actions and system changes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {Array.isArray(adminLogs) && adminLogs.length > 0 ? (
                  adminLogs.map((log, index) => (
                    <div key={log.id || index} className="flex items-center justify-between p-3 border rounded">
                      <div>
                        <div className="font-medium">
                          {log.action ? log.action.replace('_', ' ').toUpperCase() : 'UNKNOWN ACTION'}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Target: {log.targetType || 'Unknown'} ({log.targetId || 'N/A'})
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {log.timestamp ? 
                            (log.timestamp.seconds ? 
                              new Date(log.timestamp.seconds * 1000).toLocaleString() :
                              new Date(log.timestamp).toLocaleString()
                            ) : 
                            'Unknown time'
                          }
                        </div>
                      </div>
                      <Badge variant="outline">{log.performedBy || 'Unknown'}</Badge>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">No Audit Logs</h3>
                    <p className="text-muted-foreground">No administrative actions recorded yet</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Influencer Status</DialogTitle>
            <DialogDescription>
              Change the status of {selectedInfluencer?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="new-status">New Status</Label>
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
              <Label htmlFor="reason">Reason (Optional)</Label>
              <Textarea
                id="reason"
                placeholder="Enter reason for status change..."
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}