/**
 * Team Management Interface Component
 * Provides UI for creating, editing, and managing teams
 * Requirements: 6.3, 7.1, 7.2
 */

'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Users,
    Plus,
    Edit,
    Trash2,
    UserPlus,
    UserMinus,
    Shield,
    AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { useMarketingUsersOptimized } from '@/lib/marketing/useMarketingUsersOptimized';
import { useMarketingTeamsOptimized } from '@/lib/marketing/useMarketingTeamsOptimized';

interface Team {
    id: string;
    name: string;
    description?: string;
    leadUserId: string;
    leadName?: string;
    memberUserIds: string[];
    isActive: boolean;
    createdAt: any;
}

interface User {
    id: string;
    name: string;
    email: string;
    role: string;
    teamId?: string;
}

interface TeamManagementInterfaceProps {
    currentUserId: string;
    currentUserRole: string;
}

export function TeamManagementInterface({
    currentUserId,
    currentUserRole
}: TeamManagementInterfaceProps) {
    const { toast } = useToast();
    const { marketingUser, refreshUser } = useMarketingAuth();
    
    // Use optimized user data hook
    const { users, loading: usersLoading, error: usersError, refresh: refreshUsers } = useMarketingUsersOptimized({
        autoLoad: true
    });
    
    // Use optimized team data hook
    const { teams, loading: teamsLoading, error: teamsError, refresh: refreshTeams } = useMarketingTeamsOptimized({
        autoLoad: true,
        includePerformance: true
    });
    
    const [loading, setLoading] = useState(false);
    const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [isMemberDialogOpen, setIsMemberDialogOpen] = useState(false);

    // Form states
    const [teamName, setTeamName] = useState('');
    const [teamDescription, setTeamDescription] = useState('');
    const [selectedLeadId, setSelectedLeadId] = useState('');
    const [selectedMemberId, setSelectedMemberId] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Refresh data from hooks
            refreshUsers();
            refreshTeams();
        } catch (error) {
            console.error('Failed to load data:', error);
            toast({
                title: 'Error',
                description: 'Failed to load team data',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateTeam = async () => {
        if (!teamName.trim() || !selectedLeadId) {
            toast({
                title: 'Validation Error',
                description: 'Please provide team name and select a team lead',
                variant: 'destructive'
            });
            return;
        }

        try {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            
            let idToken = await currentUser.getIdToken();

            let response = await fetch('/api/marketing/teams', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    name: teamName,
                    description: teamDescription,
                    leadUserId: selectedLeadId
                })
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch('/api/marketing/teams', {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        name: teamName,
                        description: teamDescription,
                        leadUserId: selectedLeadId
                    })
                });
            }

            if (!response.ok) {
                throw new Error('Failed to create team');
            }

            toast({
                title: 'Success',
                description: 'Team created successfully'
            });

            // Reset form and reload
            setTeamName('');
            setTeamDescription('');
            setSelectedLeadId('');
            setIsCreateDialogOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to create team:', error);
            toast({
                title: 'Error',
                description: 'Failed to create team',
                variant: 'destructive'
            });
        }
    };

    const handleUpdateTeam = async () => {
        if (!selectedTeam || !teamName.trim()) {
            return;
        }

        try {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            
            let idToken = await currentUser.getIdToken();

            let response = await fetch(`/api/marketing/teams/${selectedTeam.id}`, {
                method: 'PUT',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    name: teamName,
                    description: teamDescription,
                    leadUserId: selectedLeadId || selectedTeam.leadUserId
                })
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(`/api/marketing/teams/${selectedTeam.id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        name: teamName,
                        description: teamDescription,
                        leadUserId: selectedLeadId || selectedTeam.leadUserId
                    })
                });
            }

            if (!response.ok) {
                throw new Error('Failed to update team');
            }

            toast({
                title: 'Success',
                description: 'Team updated successfully'
            });

            setIsEditDialogOpen(false);
            setSelectedTeam(null);
            loadData();
        } catch (error) {
            console.error('Failed to update team:', error);
            toast({
                title: 'Error',
                description: 'Failed to update team',
                variant: 'destructive'
            });
        }
    };

    const handleAddMember = async () => {
        if (!selectedTeam || !selectedMemberId) {
            return;
        }

        try {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            
            let idToken = await currentUser.getIdToken();

            let response = await fetch(`/api/marketing/teams/${selectedTeam.id}/members`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                },
                body: JSON.stringify({
                    userId: selectedMemberId
                })
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(`/api/marketing/teams/${selectedTeam.id}/members`, {
                    method: 'POST',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${idToken}`
                    },
                    body: JSON.stringify({
                        userId: selectedMemberId
                    })
                });
            }

            if (!response.ok) {
                throw new Error('Failed to add member');
            }

            toast({
                title: 'Success',
                description: 'Member added to team successfully'
            });

            setSelectedMemberId('');
            setIsMemberDialogOpen(false);
            loadData();
        } catch (error) {
            console.error('Failed to add member:', error);
            toast({
                title: 'Error',
                description: 'Failed to add member to team',
                variant: 'destructive'
            });
        }
    };

    const handleRemoveMember = async (teamId: string, userId: string) => {
        if (!confirm('Are you sure you want to remove this member from the team?')) {
            return;
        }

        try {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            
            let idToken = await currentUser.getIdToken();

            let response = await fetch(`/api/marketing/teams/${teamId}/members/${userId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(`/api/marketing/teams/${teamId}/members/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }

            if (!response.ok) {
                throw new Error('Failed to remove member');
            }

            toast({
                title: 'Success',
                description: 'Member removed from team successfully'
            });

            loadData();
        } catch (error) {
            console.error('Failed to remove member:', error);
            toast({
                title: 'Error',
                description: 'Failed to remove member from team',
                variant: 'destructive'
            });
        }
    };

    const handleDeleteTeam = async (teamId: string) => {
        if (!confirm('Are you sure you want to delete this team? This action cannot be undone.')) {
            return;
        }

        try {
            // Get Firebase ID token for authentication
            const { auth } = await import('@/firebase');
            const currentUser = auth.currentUser;
            if (!currentUser) {
                throw new Error('Not authenticated');
            }
            
            let idToken = await currentUser.getIdToken();

            let response = await fetch(`/api/marketing/teams/${teamId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            
            // If we get a 401, try refreshing the token
            if (response.status === 401) {
                await refreshUser();
                idToken = await currentUser.getIdToken(true); // Force refresh
                response = await fetch(`/api/marketing/teams/${teamId}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${idToken}`
                    }
                });
            }

            if (!response.ok) {
                throw new Error('Failed to delete team');
            }

            toast({
                title: 'Success',
                description: 'Team deleted successfully'
            });

            loadData();
        } catch (error) {
            console.error('Failed to delete team:', error);
            toast({
                title: 'Error',
                description: 'Failed to delete team',
                variant: 'destructive'
            });
        }
    };

    const openEditDialog = (team: Team) => {
        setSelectedTeam(team);
        setTeamName(team.name);
        setTeamDescription(team.description || '');
        setSelectedLeadId(team.leadUserId);
        setIsEditDialogOpen(true);
    };

    const openMemberDialog = (team: Team) => {
        setSelectedTeam(team);
        setSelectedMemberId('');
        setIsMemberDialogOpen(true);
    };

    const getTeamLeads = () => {
        return users.filter(u => u.role === 'team_lead');
    };

    const getAvailableMembers = () => {
        if (!selectedTeam) return [];
        return users.filter(u =>
            u.role === 'team_member' &&
            !selectedTeam.memberUserIds.includes(u.id) &&
            u.id !== selectedTeam.leadUserId
        );
    };

    const getTeamMembers = (team: Team) => {
        return users.filter(u => team.memberUserIds.includes(u.id));
    };

    const canManageTeams = currentUserRole === 'super_admin';

    if (loading || teamsLoading || usersLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Team Management</h2>
                    <p className="text-muted-foreground">
                        Create and manage teams, assign team leads and members
                    </p>
                </div>
                {canManageTeams && (
                    <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Team
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Create New Team</DialogTitle>
                                <DialogDescription>
                                    Create a new team and assign a team lead
                                </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="team-name">Team Name</Label>
                                    <Input
                                        id="team-name"
                                        value={teamName}
                                        onChange={(e) => setTeamName(e.target.value)}
                                        placeholder="Enter team name"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="team-description">Description (Optional)</Label>
                                    <Textarea
                                        id="team-description"
                                        value={teamDescription}
                                        onChange={(e) => setTeamDescription(e.target.value)}
                                        placeholder="Enter team description"
                                        rows={3}
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="team-lead">Team Lead</Label>
                                    <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select team lead" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {getTeamLeads().map(user => (
                                                <SelectItem key={user.id} value={user.id}>
                                                    {user.name} ({user.email})
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                                    Cancel
                                </Button>
                                <Button onClick={handleCreateTeam}>
                                    Create Team
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}
            </div>

            {/* Teams List */}
            {teams.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium mb-2">No teams yet</h3>
                        <p className="text-muted-foreground text-center mb-4">
                            Create your first team to start organizing your marketing operations
                        </p>
                        {canManageTeams && (
                            <Button onClick={() => setIsCreateDialogOpen(true)}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create First Team
                            </Button>
                        )}
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {teams.map(team => (
                        <Card key={team.id}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <CardTitle className="flex items-center gap-2">
                                            {team.name}
                                            {!team.isActive && (
                                                <Badge variant="secondary">Inactive</Badge>
                                            )}
                                        </CardTitle>
                                        <CardDescription className="mt-1">
                                            {team.description || 'No description'}
                                        </CardDescription>
                                    </div>
                                    {canManageTeams && (
                                        <div className="flex gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => openEditDialog(team)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteTeam(team.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {/* Team Lead */}
                                    <div>
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Team Lead</span>
                                        </div>
                                        <div className="pl-6">
                                            <p className="text-sm">{team.leadName || 'Unknown'}</p>
                                        </div>
                                    </div>

                                    {/* Team Members */}
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span className="text-sm font-medium">Members</span>
                                                <Badge variant="secondary">{team.memberUserIds.length}</Badge>
                                            </div>
                                            {canManageTeams && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openMemberDialog(team)}
                                                >
                                                    <UserPlus className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        <div className="pl-6 space-y-1">
                                            {getTeamMembers(team).length === 0 ? (
                                                <p className="text-sm text-muted-foreground">No members yet</p>
                                            ) : (
                                                getTeamMembers(team).map(member => (
                                                    <div key={member.id} className="flex items-center justify-between">
                                                        <p className="text-sm">{member.name}</p>
                                                        {canManageTeams && (
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleRemoveMember(team.id, member.id)}
                                                            >
                                                                <UserMinus className="h-3 w-3" />
                                                            </Button>
                                                        )}
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Edit Team Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Team</DialogTitle>
                        <DialogDescription>
                            Update team information and leadership
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="edit-team-name">Team Name</Label>
                            <Input
                                id="edit-team-name"
                                value={teamName}
                                onChange={(e) => setTeamName(e.target.value)}
                                placeholder="Enter team name"
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-team-description">Description</Label>
                            <Textarea
                                id="edit-team-description"
                                value={teamDescription}
                                onChange={(e) => setTeamDescription(e.target.value)}
                                placeholder="Enter team description"
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="edit-team-lead">Team Lead</Label>
                            <Select value={selectedLeadId} onValueChange={setSelectedLeadId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team lead" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getTeamLeads().map(user => (
                                        <SelectItem key={user.id} value={user.id}>
                                            {user.name} ({user.email})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleUpdateTeam}>
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Add Member Dialog */}
            <Dialog open={isMemberDialogOpen} onOpenChange={setIsMemberDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Add Team Member</DialogTitle>
                        <DialogDescription>
                            Add a new member to {selectedTeam?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div>
                            <Label htmlFor="member-select">Select Member</Label>
                            <Select value={selectedMemberId} onValueChange={setSelectedMemberId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select team member" />
                                </SelectTrigger>
                                <SelectContent>
                                    {getAvailableMembers().length === 0 ? (
                                        <div className="p-2 text-sm text-muted-foreground">
                                            No available members
                                        </div>
                                    ) : (
                                        getAvailableMembers().map(user => (
                                            <SelectItem key={user.id} value={user.id}>
                                                {user.name} ({user.email})
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        {getAvailableMembers().length === 0 && (
                            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                                <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                <p className="text-sm text-yellow-800">
                                    All available team members are already assigned to teams or there are no team members with the appropriate role.
                                </p>
                            </div>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsMemberDialogOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            onClick={handleAddMember}
                            disabled={!selectedMemberId}
                        >
                            Add Member
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
