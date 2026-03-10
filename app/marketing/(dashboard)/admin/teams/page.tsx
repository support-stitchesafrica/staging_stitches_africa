/**
 * Marketing Dashboard - Team Management Page
 * Super Admin page for managing all teams
 * Requirements: 6.3, 7.1, 7.2
 */

'use client';

import { useState, useEffect } from 'react';
import { SuperAdminGuard } from '@/components/marketing/MarketingAuthGuard';
import { TeamManagementInterface } from '@/components/marketing/team/TeamManagementInterface';
import { TeamStructureVisualization } from '@/components/marketing/team/TeamStructureVisualization';
import { useMarketingAuth } from '@/contexts/MarketingAuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Users, BarChart3 } from 'lucide-react';

interface TeamHierarchy
{
    team: {
        id: string;
        name: string;
        description?: string;
    };
    lead: {
        userId: string;
        name: string;
        email: string;
        role: string;
    } | null;
    members: Array<{
        userId: string;
        name: string;
        email: string;
        role: string;
    }>;
}

export default function TeamManagementPage()
{
    const { marketingUser } = useMarketingAuth();
    const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
    const [teamHierarchy, setTeamHierarchy] = useState<TeamHierarchy | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() =>
    {
        if (selectedTeamId)
        {
            loadTeamHierarchy(selectedTeamId);
        }
    }, [selectedTeamId]);

    const loadTeamHierarchy = async (teamId: string) =>
    {
        try
        {
            setLoading(true);
            const response = await fetch(`/api/marketing/teams/${teamId}`);

            if (response.ok)
            {
                const data = await response.json();
                setTeamHierarchy(data.team);
            }
        } catch (error)
        {
            console.error('Failed to load team hierarchy:', error);
        } finally
        {
            setLoading(false);
        }
    };

    return (
        <SuperAdminGuard>
            <div className="container mx-auto py-6 space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
                    <p className="text-muted-foreground">
                        Create and manage teams, assign team leads and members
                    </p>
                </div>

                <Tabs defaultValue="management" className="space-y-4">
                    <TabsList>
                        <TabsTrigger value="management">
                            <Users className="mr-2 h-4 w-4" />
                            Team Management
                        </TabsTrigger>
                        <TabsTrigger value="analytics">
                            <BarChart3 className="mr-2 h-4 w-4" />
                            Team Analytics
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="management" className="space-y-4">
                        <TeamManagementInterface
                            currentUserId={marketingUser?.uid || ''}
                            currentUserRole={marketingUser?.role || ''}
                        />
                    </TabsContent>

                    <TabsContent value="analytics" className="space-y-4">
                        <Card>
                            <CardHeader>
                                <CardTitle>Team Analytics</CardTitle>
                                <CardDescription>
                                    View performance metrics and insights for all teams
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="text-center py-12 text-muted-foreground">
                                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Team analytics coming soon</p>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Team Structure Visualization */}
                {teamHierarchy && (
                    <TeamStructureVisualization hierarchy={teamHierarchy} />
                )}
            </div>
        </SuperAdminGuard>
    );
}