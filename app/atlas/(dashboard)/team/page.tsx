"use client"

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserPlus, Edit, Ban, Check, Search, AlertCircle, Mail, XCircle, RefreshCw, Clock } from "lucide-react";
import { toast } from "sonner";
import { DataTableGA, ColumnDef } from "@/components/analytics/DataTableGA";
import { RoleGuard } from "@/components/atlas/auth/RoleGuard";
import { useAtlasAuth } from "@/contexts/AtlasAuthContext";
import { AtlasUser, AtlasRole } from "@/lib/atlas/types";
import { AtlasInvitation } from "@/lib/atlas/invitation-service";
import { collection, onSnapshot, query, orderBy, Unsubscribe } from "firebase/firestore";
import { db } from "@/firebase";
import LoadingSpinner from "@/components/LoadingSpinner";
import { AddUserDialog } from "@/components/atlas/team/AddUserDialog";
import { EditRoleDialog } from "@/components/atlas/team/EditRoleDialog";
import { TeamErrorBoundary } from "@/components/atlas/team/TeamErrorBoundary";
import { TeamLoadingState } from "@/components/atlas/team/TeamLoadingState";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import
{
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const Team = () =>
{
    const { atlasUser } = useAtlasAuth();
    const [teamMembers, setTeamMembers] = useState<AtlasUser[]>([]);
    const [invitations, setInvitations] = useState<AtlasInvitation[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showAddUserDialog, setShowAddUserDialog] = useState(false);
    const [showEditRoleDialog, setShowEditRoleDialog] = useState(false);
    const [selectedUser, setSelectedUser] = useState<AtlasUser | null>(null);
    const [processingUserId, setProcessingUserId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Real-time Firestore listener for team members and invitations
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
                const teamMembersQuery = query(
                    collection(db, "atlasUsers"),
                    orderBy("createdAt", "desc")
                );

                unsubscribeMembers = onSnapshot(
                    teamMembersQuery,
                    (snapshot) =>
                    {
                        try
                        {
                            const members: AtlasUser[] = [];
                            snapshot.forEach((doc) =>
                            {
                                const data = doc.data();
                                members.push({
                                    uid: data.uid,
                                    email: data.email,
                                    fullName: data.fullName,
                                    role: data.role,
                                    isAtlasUser: data.isAtlasUser,
                                    createdAt: data.createdAt,
                                    updatedAt: data.updatedAt,
                                    invitedBy: data.invitedBy,
                                } as AtlasUser);
                            });
                            setTeamMembers(members);
                            setError(null);
                            setLoading(false);
                        } catch (err)
                        {
                            console.error("Error processing team members:", err);
                            setError("Failed to process team member data");
                            toast.error("Error loading team members", {
                                description: "There was a problem processing the team data"
                            });
                            setLoading(false);
                        }
                    },
                    (error) =>
                    {
                        console.error("Error fetching team members:", error);

                        // Provide more specific error messages
                        let errorMessage = "Failed to load team members";
                        if (error.code === "permission-denied")
                        {
                            errorMessage = "You don't have permission to view team members";
                        }
                        else if (error.code === "unavailable")
                        {
                            errorMessage = "Unable to connect to the database. Please check your connection.";
                        }

                        setError(errorMessage);
                        toast.error("Database Error", {
                            description: errorMessage
                        });
                        setLoading(false);
                    }
                );

                // Listen to invitations
                const invitationsQuery = query(
                    collection(db, "atlasInvitations"),
                    orderBy("createdAt", "desc")
                );

                unsubscribeInvitations = onSnapshot(
                    invitationsQuery,
                    (snapshot) =>
                    {
                        const invites: AtlasInvitation[] = [];
                        snapshot.forEach((doc) =>
                        {
                            invites.push({ id: doc.id, ...doc.data() } as AtlasInvitation);
                        });
                        setInvitations(invites);
                    },
                    (err) =>
                    {
                        console.error("Error listening to invitations:", err);
                        toast.error("Invitation Sync Error", {
                            description: "Failed to sync invitation data.",
                        });
                    }
                );
            } catch (err)
            {
                console.error("Error setting up listeners:", err);
                setError("Failed to initialize team management. Please refresh the page.");
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
        if (!searchQuery.trim()) return teamMembers;

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
        const active = teamMembers.filter((m) => m.isAtlasUser).length;
        const pending = invitations.filter((inv) => inv.status === 'pending').length;

        return { total, active, pending };
    }, [teamMembers, invitations]);

    // Format role for display
    const formatRole = (role: AtlasRole): string =>
    {
        const roleMap: Record<AtlasRole, string> = {
            superadmin: "Super Admin",
            founder: "Founder",
            sales_lead: "Sales Lead",
            brand_lead: "Brand Lead",
            logistics_lead: "Logistics Lead",
        };
        return roleMap[role] || role;
    };

    // Format date for display
    const formatDate = (timestamp: any): string =>
    {
        if (!timestamp) return "N/A";
        try
        {
            const date = timestamp.toDate();
            return date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            });
        } catch (error)
        {
            return "N/A";
        }
    };

    // Get role badge color
    const getRoleBadgeColor = (role: AtlasRole): string =>
    {
        const colorMap: Record<AtlasRole, string> = {
            superadmin: "bg-ga-blue text-white hover:bg-ga-blue/90",
            founder: "bg-purple-600 text-white hover:bg-purple-700",
            sales_lead: "bg-ga-green text-white hover:bg-ga-green/90",
            brand_lead: "bg-orange-600 text-white hover:bg-orange-700",
            logistics_lead: "bg-indigo-600 text-white hover:bg-indigo-700",
        };
        return colorMap[role] || "bg-ga-surface text-ga-primary border border-ga hover:bg-ga-surface/80";
    };

    // Handle user deactivation
    const handleDeactivateUser = async (user: AtlasUser) =>
    {
        if (user.uid === atlasUser?.uid)
        {
            toast.error("Cannot deactivate yourself", {
                description: "You cannot deactivate your own account"
            });
            return;
        }

        setProcessingUserId(user.uid);

        try
        {
            const idToken = await atlasUser?.uid ? (await (await import("@/firebase")).auth.currentUser?.getIdToken()) : null;

            if (!idToken)
            {
                throw new Error("Authentication token not available");
            }

            const response = await fetch(`/api/atlas/team/members/${user.uid}/deactivate`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success)
            {
                throw new Error(data.error || "Failed to deactivate user");
            }

            toast.success("User deactivated", {
                description: `${user.fullName} has been deactivated successfully`
            });
        } catch (error: any)
        {
            console.error("Error deactivating user:", error);
            toast.error("Deactivation failed", {
                description: error.message || "Failed to deactivate user"
            });
        } finally
        {
            setProcessingUserId(null);
        }
    };

    // Handle user reactivation
    const handleReactivateUser = async (user: AtlasUser) =>
    {
        setProcessingUserId(user.uid);

        try
        {
            const idToken = await atlasUser?.uid ? (await (await import("@/firebase")).auth.currentUser?.getIdToken()) : null;

            if (!idToken)
            {
                throw new Error("Authentication token not available");
            }

            const response = await fetch(`/api/atlas/team/members/${user.uid}/reactivate`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${idToken}`
                }
            });

            const data = await response.json();

            if (!response.ok || !data.success)
            {
                throw new Error(data.error || "Failed to reactivate user");
            }

            toast.success("User reactivated", {
                description: `${user.fullName} has been reactivated successfully`
            });
        } catch (error: any)
        {
            console.error("Error reactivating user:", error);
            toast.error("Reactivation failed", {
                description: error.message || "Failed to reactivate user"
            });
        } finally
        {
            setProcessingUserId(null);
        }
    };

    // Handle resend invitation
    const handleResendInvitation = async (invitation: AtlasInvitation) =>
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

            const response = await fetch('/api/atlas/team/invite/resend', {
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
    const handleRevokeInvitation = async (invitation: AtlasInvitation) =>
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

            const response = await fetch('/api/atlas/team/invite/revoke', {
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

    // Define columns for DataTableGA
    const columns: ColumnDef<AtlasUser>[] = [
        {
            key: "fullName",
            header: "Name",
            accessor: (row) => (
                <div className="flex items-center gap-2">
                    <span className="font-medium text-ga-primary">{row.fullName}</span>
                    {row.uid === atlasUser?.uid && (
                        <Badge className="bg-ga-surface text-ga-secondary text-xs border border-ga">
                            You
                        </Badge>
                    )}
                </div>
            ),
            sortable: true,
        },
        {
            key: "email",
            header: "Email",
            accessor: (row) => <span className="text-ga-secondary">{row.email}</span>,
            sortable: true,
        },
        {
            key: "role",
            header: "Role",
            accessor: (row) => (
                <Badge className={getRoleBadgeColor(row.role)}>
                    {formatRole(row.role)}
                </Badge>
            ),
            sortable: true,
        },
        {
            key: "isAtlasUser",
            header: "Status",
            accessor: (row) => (
                <Badge
                    className={
                        row.isAtlasUser
                            ? "bg-ga-green text-white hover:bg-ga-green/90"
                            : "bg-ga-red text-white hover:bg-ga-red/90"
                    }
                >
                    {row.isAtlasUser ? "Active" : "Deactivated"}
                </Badge>
            ),
            sortable: true,
        },
        {
            key: "createdAt",
            header: "Created",
            accessor: (row) => <span className="text-ga-secondary">{formatDate(row.createdAt)}</span>,
            sortable: true,
        },
        {
            key: "actions",
            header: "Actions",
            accessor: (row) => (
                <div className="flex gap-2 justify-end">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() =>
                        {
                            setSelectedUser(row);
                            setShowEditRoleDialog(true);
                        }}
                        title="Edit role"
                        className="hover:bg-ga-surface hover:border-ga-blue transition-ga-base"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>

                    <Button
                        variant={row.isAtlasUser ? "destructive" : "default"}
                        size="icon"
                        disabled={processingUserId === row.uid || row.uid === atlasUser?.uid}
                        onClick={() => row.isAtlasUser ? handleDeactivateUser(row) : handleReactivateUser(row)}
                        title={
                            row.uid === atlasUser?.uid
                                ? "Cannot modify your own account"
                                : row.isAtlasUser
                                    ? "Deactivate user"
                                    : "Reactivate user"
                        }
                        className={
                            row.isAtlasUser
                                ? "bg-ga-red hover:bg-ga-red/90 text-white transition-ga-base disabled:opacity-50"
                                : "bg-ga-green hover:bg-ga-green/90 text-white transition-ga-base disabled:opacity-50"
                        }
                    >
                        {processingUserId === row.uid ? (
                            <LoadingSpinner />
                        ) : row.isAtlasUser ? (
                            <Ban className="h-4 w-4" />
                        ) : (
                            <Check className="h-4 w-4" />
                        )}
                    </Button>
                </div>
            ),
            sortable: false,
        },
    ];

    // Show loading state
    if (loading)
    {
        return (
            <RoleGuard allowedRoles={["superadmin"]}>
                <TeamErrorBoundary>
                    <TeamLoadingState message="Loading team members..." variant="page" />
                </TeamErrorBoundary>
            </RoleGuard>
        );
    }

    // Show error state
    if (error)
    {
        return (
            <RoleGuard allowedRoles={["superadmin"]}>
                <TeamErrorBoundary>
                    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
                        <div className="w-16 h-16 bg-ga-red/10 rounded-full flex items-center justify-center">
                            <AlertCircle className="w-8 h-8 text-ga-red" />
                        </div>
                        <div className="text-center space-y-2">
                            <h3 className="text-lg font-semibold text-ga-primary">
                                Unable to Load Team Members
                            </h3>
                            <p className="text-sm text-ga-secondary max-w-md">
                                {error}
                            </p>
                        </div>
                        <Button
                            onClick={() => window.location.reload()}
                            className="gap-2 bg-ga-blue hover:bg-ga-blue/90 text-white"
                        >
                            Retry
                        </Button>
                    </div>
                </TeamErrorBoundary>
            </RoleGuard>
        );
    }

    return (
        <RoleGuard allowedRoles={["superadmin"]}>
            <TeamErrorBoundary>
                <div className="space-y-6 page-transition">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-3xl font-bold text-ga-primary">Team Access & Roles</h2>
                            <p className="text-ga-secondary mt-1">
                                Manage user access and permissions
                            </p>
                        </div>

                        <Button
                            onClick={() => setShowAddUserDialog(true)}
                            className="gap-2 bg-ga-blue hover:bg-ga-blue/90 text-white transition-ga-base shadow-ga-card hover:shadow-ga-card-hover"
                        >
                            <UserPlus className="h-4 w-4" />
                            Add User
                        </Button>
                    </div>

                    {/* Search and Filter Section */}
                    <div className="bg-ga-background border border-ga rounded-lg p-4 shadow-ga-card">
                        <div className="flex items-center gap-2">
                            <Search className="h-5 w-5 text-ga-secondary" />
                            <Input
                                type="text"
                                placeholder="Search by name, email, or role..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-ga-background border-ga focus:border-ga-blue transition-ga-base"
                            />
                        </div>
                    </div>

                    {/* Team Members Stats */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-ga-background border border-ga rounded-lg p-4 shadow-ga-card">
                            <div className="text-ga-secondary text-sm font-medium">Total Members</div>
                            <div className="text-2xl font-bold text-ga-primary mt-1">
                                {stats.total}
                            </div>
                        </div>
                        <div className="bg-ga-background border border-ga rounded-lg p-4 shadow-ga-card">
                            <div className="text-ga-secondary text-sm font-medium">Active Members</div>
                            <div className="text-2xl font-bold text-ga-green mt-1">
                                {stats.active}
                            </div>
                        </div>
                        <div className="bg-ga-background border border-ga rounded-lg p-4 shadow-ga-card">
                            <div className="text-ga-secondary text-sm font-medium">Pending Invitations</div>
                            <div className="text-2xl font-bold text-yellow-600 mt-1">
                                {stats.pending}
                            </div>
                        </div>
                    </div>

                    {/* Pending Invitations Table */}
                    {filteredInvitations.length > 0 && (
                        <Card className="bg-ga-background border-ga shadow-ga-card">
                            <CardHeader>
                                <CardTitle className="text-ga-primary">Pending Invitations</CardTitle>
                                <CardDescription className="text-ga-secondary">
                                    {filteredInvitations.length} pending {filteredInvitations.length === 1 ? 'invitation' : 'invitations'}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-ga-surface border-ga hover:bg-ga-surface">
                                                <TableHead className="font-semibold text-ga-primary">Name</TableHead>
                                                <TableHead className="font-semibold text-ga-primary">Email</TableHead>
                                                <TableHead className="font-semibold text-ga-primary">Role</TableHead>
                                                <TableHead className="font-semibold text-ga-primary">Expires</TableHead>
                                                <TableHead className="font-semibold text-ga-primary">Sent</TableHead>
                                                <TableHead className="text-right font-semibold text-ga-primary">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredInvitations.map((invitation) => (
                                                <TableRow key={invitation.id} className="border-ga hover:bg-ga-surface/50 transition-ga-base">
                                                    <TableCell className="font-medium text-ga-primary">{invitation.name}</TableCell>
                                                    <TableCell className="text-ga-secondary">{invitation.email}</TableCell>
                                                    <TableCell>
                                                        <Badge className={getRoleBadgeColor(invitation.role)}>
                                                            {formatRole(invitation.role)}
                                                        </Badge>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center gap-1 text-ga-secondary">
                                                            <Clock className="h-3 w-3" />
                                                            <span className="text-sm">{formatDate(invitation.expiresAt)}</span>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-ga-secondary">{formatDate(invitation.createdAt)}</TableCell>
                                                    <TableCell className="text-right">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleResendInvitation(invitation)}
                                                                disabled={actionLoading === invitation.id}
                                                                className="hover:bg-ga-blue/10 hover:text-ga-blue hover:border-ga-blue transition-ga-base"
                                                            >
                                                                {actionLoading === invitation.id ? (
                                                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                                                ) : (
                                                                    <Mail className="h-3 w-3 mr-1" />
                                                                )}
                                                                Resend
                                                            </Button>
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => handleRevokeInvitation(invitation)}
                                                                disabled={actionLoading === invitation.id}
                                                                className="text-ga-red hover:bg-ga-red/10 hover:text-ga-red hover:border-ga-red transition-ga-base"
                                                            >
                                                                {actionLoading === invitation.id ? (
                                                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                                                ) : (
                                                                    <XCircle className="h-3 w-3 mr-1" />
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
                    {filteredMembers.length === 0 && searchQuery ? (
                        <div className="bg-ga-background border border-ga rounded-lg p-8 text-center shadow-ga-card">
                            <p className="text-ga-secondary">
                                No team members found matching "{searchQuery}"
                            </p>
                        </div>
                    ) : (
                        <DataTableGA
                            columns={columns}
                            data={filteredMembers}
                            sortable={true}
                            pagination={true}
                            pageSize={10}
                        />
                    )}

                    {/* Add User Dialog */}
                    <AddUserDialog
                        open={showAddUserDialog}
                        onOpenChange={setShowAddUserDialog}
                        onSuccess={() =>
                        {
                            // The real-time listener will automatically update the team members list
                            // No need to manually refresh
                        }}
                    />

                    {/* Edit Role Dialog */}
                    <EditRoleDialog
                        open={showEditRoleDialog}
                        onOpenChange={setShowEditRoleDialog}
                        user={selectedUser}
                        onSuccess={() =>
                        {
                            // The real-time listener will automatically update the team members list
                            // No need to manually refresh
                        }}
                    />
                </div>
            </TeamErrorBoundary>
        </RoleGuard>
    );
};

export default Team;
