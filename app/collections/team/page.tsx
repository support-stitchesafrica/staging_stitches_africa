'use client';

import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, orderBy, Unsubscribe } from 'firebase/firestore';
import { db } from '@/firebase';
import { useCollectionsAuth } from '@/contexts/CollectionsAuthContext';
import { RoleGuard } from '@/components/collections/auth/RoleGuard';
import { TeamErrorBoundary } from '@/components/collections/team/TeamErrorBoundary';
import { TeamLoadingState } from '@/components/collections/team/TeamLoadingState';
import { AddUserDialog } from '@/components/collections/team/AddUserDialog';
import { EditRoleDialog } from '@/components/collections/team/EditRoleDialog';
import { CollectionsUser, CollectionsRole } from '@/lib/collections/types';
import { CollectionsInvitation } from '@/lib/collections/invitation-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import
{
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import
{
    UserPlus,
    Search,
    Users,
    UserCheck,
    Clock,
    Edit,
    UserX,
    UserCheck2,
    AlertCircle,
    RefreshCw,
    Mail,
    XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Team Management Page
 * Allows Super Admins to manage team members, roles, and access
 */
function TeamManagementContent()
{
    const { collectionsUser } = useCollectionsAuth();
    const [teamMembers, setTeamMembers] = useState<CollectionsUser[]>([]);
    const [invitations, setInvitations] = useState<CollectionsInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [addUserDialogOpen, setAddUserDialogOpen] = useState(false);
    const [editRoleDialogOpen, setEditRoleDialogOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<CollectionsUser | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Set up real-time listener for team members and invitations
    useEffect(() =>
    {
        let unsubscribeMembers: Unsubscribe | null = null;
        let unsubscribeInvitations: Unsubscribe | null = null;

        const setupListeners = () =>
        {
            try
            {
                setLoading(true);
                setError(null);

                // Listen to team members
                const membersQuery = query(
                    collection(db, 'collectionsUsers'),
                    orderBy('createdAt', 'desc')
                );

                unsubscribeMembers = onSnapshot(
                    membersQuery,
                    (snapshot) =>
                    {
                        const members: CollectionsUser[] = [];
                        snapshot.forEach((doc) =>
                        {
                            members.push({ uid: doc.id, ...doc.data() } as CollectionsUser);
                        });
                        setTeamMembers(members);
                        setLoading(false);
                    },
                    (err) =>
                    {
                        console.error('Error listening to team members:', err);
                        setError('Failed to load team members. Please try again.');
                        setLoading(false);
                        toast.error('Connection Error', {
                            description: 'Failed to sync team member data. Please refresh the page.',
                        });
                    }
                );

                // Listen to invitations
                const invitationsQuery = query(
                    collection(db, 'collectionsInvitations'),
                    orderBy('createdAt', 'desc')
                );

                unsubscribeInvitations = onSnapshot(
                    invitationsQuery,
                    (snapshot) =>
                    {
                        const invites: CollectionsInvitation[] = [];
                        snapshot.forEach((doc) =>
                        {
                            invites.push({ id: doc.id, ...doc.data() } as CollectionsInvitation);
                        });
                        setInvitations(invites);
                    },
                    (err) =>
                    {
                        console.error('Error listening to invitations:', err);
                        toast.error('Invitation Sync Error', {
                            description: 'Failed to sync invitation data.',
                        });
                    }
                );
            } catch (err)
            {
                console.error('Error setting up listeners:', err);
                setError('Failed to initialize team management. Please refresh the page.');
                setLoading(false);
            }
        };

        setupListeners();

        return () =>
        {
            if (unsubscribeMembers)
            {
                unsubscribeMembers();
            }
            if (unsubscribeInvitations)
            {
                unsubscribeInvitations();
            }
        };
    }, []);

    // Filter team members and invitations based on search query
    const filteredMembers = useMemo(() =>
    {
        if (!searchQuery.trim())
        {
            return teamMembers;
        }

        const query = searchQuery.toLowerCase();
        return teamMembers.filter(
            (member) =>
                member.fullName.toLowerCase().includes(query) ||
                member.email.toLowerCase().includes(query) ||
                member.role.toLowerCase().includes(query)
        );
    }, [teamMembers, searchQuery]);

    const filteredInvitations = useMemo(() =>
    {
        if (!searchQuery.trim())
        {
            return invitations.filter((inv) => inv.status === 'pending');
        }

        const query = searchQuery.toLowerCase();
        return invitations.filter(
            (inv) =>
                inv.status === 'pending' &&
                (inv.name.toLowerCase().includes(query) ||
                    inv.email.toLowerCase().includes(query) ||
                    inv.role.toLowerCase().includes(query))
        );
    }, [invitations, searchQuery]);

    // Calculate summary statistics
    const stats = useMemo(() =>
    {
        const total = teamMembers.length;
        const active = teamMembers.filter((m) => m.isCollectionsUser).length;
        const pending = invitations.filter((inv) => inv.status === 'pending').length;

        return { total, active, pending };
    }, [teamMembers, invitations]);

    // Handle deactivate user
    const handleDeactivate = async (user: CollectionsUser) =>
    {
        if (user.uid === collectionsUser?.uid)
        {
            toast.error('Cannot deactivate yourself', {
                description: 'You cannot deactivate your own account.',
            });
            return;
        }

        setActionLoading(user.uid);

        try
        {
            const response = await fetch(`/api/collections/team/members/${user.uid}/deactivate`, {
                method: 'PATCH',
            });

            const data = await response.json();

            if (!response.ok || !data.success)
            {
                throw new Error(data.error || 'Failed to deactivate user');
            }

            toast.success('User deactivated', {
                description: `${user.fullName} has been deactivated successfully.`,
            });
        } catch (error)
        {
            console.error('Error deactivating user:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to deactivate user';
            toast.error('Deactivation failed', {
                description: errorMessage,
            });
        } finally
        {
            setActionLoading(null);
        }
    };

    // Handle reactivate user
    const handleReactivate = async (user: CollectionsUser) =>
    {
        setActionLoading(user.uid);

        try
        {
            const response = await fetch(`/api/collections/team/members/${user.uid}/reactivate`, {
                method: 'PATCH',
            });

            const data = await response.json();

            if (!response.ok || !data.success)
            {
                throw new Error(data.error || 'Failed to reactivate user');
            }

            toast.success('User reactivated', {
                description: `${user.fullName} has been reactivated successfully.`,
            });
        } catch (error)
        {
            console.error('Error reactivating user:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to reactivate user';
            toast.error('Reactivation failed', {
                description: errorMessage,
            });
        } finally
        {
            setActionLoading(null);
        }
    };

    // Handle edit role
    const handleEditRole = (user: CollectionsUser) =>
    {
        setSelectedUser(user);
        setEditRoleDialogOpen(true);
    };

    // Handle resend invitation
    const handleResendInvitation = async (invitation: CollectionsInvitation) =>
    {
        setActionLoading(invitation.id);

        try
        {
            // Get Firebase ID token
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;

            if (!currentUser)
            {
                throw new Error('Not authenticated');
            }

            const idToken = await currentUser.getIdToken();

            const response = await fetch('/api/collections/team/invite/resend', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    invitationId: invitation.id,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success)
            {
                throw new Error(data.error || 'Failed to resend invitation');
            }

            toast.success('Invitation resent', {
                description: `A new invitation email has been sent to ${invitation.email}`,
            });
        } catch (error)
        {
            console.error('Error resending invitation:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to resend invitation';
            toast.error('Resend failed', {
                description: errorMessage,
            });
        } finally
        {
            setActionLoading(null);
        }
    };

    // Handle revoke invitation
    const handleRevokeInvitation = async (invitation: CollectionsInvitation) =>
    {
        setActionLoading(invitation.id);

        try
        {
            // Get Firebase ID token
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;

            if (!currentUser)
            {
                throw new Error('Not authenticated');
            }

            const idToken = await currentUser.getIdToken();

            const response = await fetch('/api/collections/team/invite/revoke', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    invitationId: invitation.id,
                }),
            });

            const data = await response.json();

            if (!response.ok || !data.success)
            {
                throw new Error(data.error || 'Failed to revoke invitation');
            }

            toast.success('Invitation revoked', {
                description: `The invitation for ${invitation.email} has been revoked`,
            });
        } catch (error)
        {
            console.error('Error revoking invitation:', error);
            const errorMessage = error instanceof Error ? error.message : 'Failed to revoke invitation';
            toast.error('Revoke failed', {
                description: errorMessage,
            });
        } finally
        {
            setActionLoading(null);
        }
    };

    // Handle retry on error
    const handleRetry = () =>
    {
        window.location.reload();
    };

    // Role badge styling
    const getRoleBadgeVariant = (role: CollectionsRole): 'default' | 'secondary' | 'outline' =>
    {
        switch (role)
        {
            case 'superadmin':
                return 'default';
            case 'editor':
                return 'secondary';
            case 'viewer':
                return 'outline';
            default:
                return 'outline';
        }
    };

    // Role display names
    const roleDisplayNames: Record<CollectionsRole, string> = {
        superadmin: 'Super Admin',
        editor: 'Editor',
        viewer: 'Viewer',
    };

    // Format date
    const formatDate = (timestamp: any): string =>
    {
        if (!timestamp) return 'N/A';
        try
        {
            const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            });
        } catch
        {
            return 'N/A';
        }
    };

    // Show loading state
    if (loading)
    {
        return <TeamLoadingState variant="page" message="Loading team members..." />;
    }

    // Show error state
    if (error)
    {
        return (
            <div className="flex min-h-[400px] items-center justify-center p-6">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="size-4" />
                    <AlertDescription className="mt-2">
                        <p className="mb-4">{error}</p>
                        <Button onClick={handleRetry} variant="outline" size="sm">
                            <RefreshCw className="size-4 mr-2" />
                            Retry
                        </Button>
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Team Management</h1>
                    <p className="text-gray-600 mt-1">
                        Manage team members, roles, and access to the Collections system
                    </p>
                </div>
                <Button onClick={() => setAddUserDialogOpen(true)} className="flex items-center gap-2">
                    <UserPlus className="size-4" />
                    Add User
                </Button>
            </div>

            {/* Summary Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-white border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700">Total Members</CardTitle>
                        <Users className="size-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                        <p className="text-xs text-gray-500 mt-1">All team members</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700">Active Members</CardTitle>
                        <UserCheck className="size-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.active}</div>
                        <p className="text-xs text-gray-500 mt-1">Currently active</p>
                    </CardContent>
                </Card>

                <Card className="bg-white border-gray-200">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-700">Pending Invitations</CardTitle>
                        <Clock className="size-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">{stats.pending}</div>
                        <p className="text-xs text-gray-500 mt-1">Awaiting acceptance</p>
                    </CardContent>
                </Card>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    type="text"
                    placeholder="Search by name, email, or role..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Pending Invitations Table */}
            {filteredInvitations.length > 0 && (
                <Card className="bg-white border-gray-200">
                    <CardHeader>
                        <CardTitle className="text-gray-900">Pending Invitations</CardTitle>
                        <CardDescription className="text-gray-600">
                            {filteredInvitations.length} pending {filteredInvitations.length === 1 ? 'invitation' : 'invitations'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-700">Name</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Email</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Role</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Expires</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Sent</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredInvitations.map((invitation) => (
                                        <TableRow key={invitation.id} className="hover:bg-gray-50 transition-colors">
                                            <TableCell className="font-medium text-gray-900">{invitation.name}</TableCell>
                                            <TableCell className="text-gray-600">{invitation.email}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getRoleBadgeVariant(invitation.role)}
                                                    className={
                                                        invitation.role === 'superadmin'
                                                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                            : invitation.role === 'editor'
                                                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                                : 'bg-gray-100 text-gray-700 border-gray-200'
                                                    }
                                                >
                                                    {roleDisplayNames[invitation.role]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 text-gray-600">
                                                    <Clock className="size-3" />
                                                    <span className="text-sm">{formatDate(invitation.expiresAt)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-gray-600">{formatDate(invitation.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleResendInvitation(invitation)}
                                                        disabled={actionLoading === invitation.id}
                                                        className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                                                    >
                                                        {actionLoading === invitation.id ? (
                                                            <RefreshCw className="size-3 mr-1 animate-spin" />
                                                        ) : (
                                                            <Mail className="size-3 mr-1" />
                                                        )}
                                                        Resend
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleRevokeInvitation(invitation)}
                                                        disabled={actionLoading === invitation.id}
                                                        className="text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                                    >
                                                        {actionLoading === invitation.id ? (
                                                            <RefreshCw className="size-3 mr-1 animate-spin" />
                                                        ) : (
                                                            <XCircle className="size-3 mr-1" />
                                                        )}
                                                        Revoke
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Team Members Table */}
            <Card className="bg-white border-gray-200">
                <CardHeader>
                    <CardTitle className="text-gray-900">Team Members</CardTitle>
                    <CardDescription className="text-gray-600">
                        {filteredMembers.length} {filteredMembers.length === 1 ? 'member' : 'members'} found
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {filteredMembers.length === 0 && filteredInvitations.length === 0 ? (
                        <div className="text-center py-12">
                            <Users className="size-12 text-muted-foreground mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No members found</h3>
                            <p className="text-gray-600 mb-4">
                                {searchQuery
                                    ? 'Try adjusting your search query'
                                    : 'Get started by inviting your first team member'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={() => setAddUserDialogOpen(true)}>
                                    <UserPlus className="size-4 mr-2" />
                                    Invite Team Member
                                </Button>
                            )}
                        </div>
                    ) : filteredMembers.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-gray-600">No active members match your search</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50">
                                        <TableHead className="font-semibold text-gray-700">Name</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Email</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Role</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Status</TableHead>
                                        <TableHead className="font-semibold text-gray-700">Created</TableHead>
                                        <TableHead className="text-right font-semibold text-gray-700">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredMembers.map((member) => (
                                        <TableRow key={member.uid} className="hover:bg-gray-50 transition-colors">
                                            <TableCell className="font-medium text-gray-900">{member.fullName}</TableCell>
                                            <TableCell className="text-gray-600">{member.email}</TableCell>
                                            <TableCell>
                                                <Badge
                                                    variant={getRoleBadgeVariant(member.role)}
                                                    className={
                                                        member.role === 'superadmin'
                                                            ? 'bg-purple-100 text-purple-700 border-purple-200'
                                                            : member.role === 'editor'
                                                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                                                : 'bg-gray-100 text-gray-700 border-gray-200'
                                                    }
                                                >
                                                    {roleDisplayNames[member.role]}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                {member.isCollectionsUser ? (
                                                    <Badge variant="default" className="bg-green-600 hover:bg-green-700">
                                                        <UserCheck2 className="size-3 mr-1" />
                                                        Active
                                                    </Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-gray-600 border-gray-300">
                                                        <UserX className="size-3 mr-1" />
                                                        Inactive
                                                    </Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-gray-600">{formatDate(member.createdAt)}</TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => handleEditRole(member)}
                                                        disabled={actionLoading === member.uid}
                                                        className="hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300"
                                                    >
                                                        <Edit className="size-3 mr-1" />
                                                        Edit
                                                    </Button>
                                                    {member.isCollectionsUser ? (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeactivate(member)}
                                                            disabled={
                                                                actionLoading === member.uid || member.uid === collectionsUser?.uid
                                                            }
                                                            className="text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-300"
                                                        >
                                                            {actionLoading === member.uid ? (
                                                                <RefreshCw className="size-3 mr-1 animate-spin" />
                                                            ) : (
                                                                <UserX className="size-3 mr-1" />
                                                            )}
                                                            Deactivate
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleReactivate(member)}
                                                            disabled={actionLoading === member.uid}
                                                            className="text-green-600 hover:bg-green-50 hover:text-green-700 hover:border-green-300"
                                                        >
                                                            {actionLoading === member.uid ? (
                                                                <RefreshCw className="size-3 mr-1 animate-spin" />
                                                            ) : (
                                                                <UserCheck2 className="size-3 mr-1" />
                                                            )}
                                                            Reactivate
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Dialogs */}
            <AddUserDialog
                open={addUserDialogOpen}
                onOpenChange={setAddUserDialogOpen}
                onSuccess={() =>
                {
                    // Real-time listener will automatically update the list
                }}
            />

            <EditRoleDialog
                open={editRoleDialogOpen}
                onOpenChange={setEditRoleDialogOpen}
                user={selectedUser}
                onSuccess={() =>
                {
                    // Real-time listener will automatically update the list
                }}
            />
        </div>
    );
}

/**
 * Team Management Page with Role Guard
 * Only accessible to Super Admins
 */
export default function TeamManagementPage()
{
    return (
        <RoleGuard allowedRoles={['superadmin']}>
            <TeamErrorBoundary>
                <TeamManagementContent />
            </TeamErrorBoundary>
        </RoleGuard>
    );
}
