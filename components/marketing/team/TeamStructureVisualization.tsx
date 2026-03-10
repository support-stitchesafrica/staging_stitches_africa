/**
 * Team Structure Visualization Component
 * Displays team hierarchy in a visual format
 * Requirements: 6.3, 7.1, 7.2
 */

'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Users, User } from 'lucide-react';

interface TeamMember
{
    userId: string;
    name: string;
    email: string;
    role: string;
}

interface TeamHierarchy
{
    team: {
        id: string;
        name: string;
        description?: string;
    };
    lead: TeamMember | null;
    members: TeamMember[];
}

interface TeamStructureVisualizationProps
{
    hierarchy: TeamHierarchy;
}

export function TeamStructureVisualization({ hierarchy }: TeamStructureVisualizationProps)
{
    const { team, lead, members } = hierarchy;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Team Structure: {team.name}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {/* Team Lead */}
                    {lead && (
                        <div className="relative">
                            <div className="flex items-center gap-3 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                                <div className="flex-shrink-0">
                                    <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                                        <Shield className="h-6 w-6 text-white" />
                                    </div>
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-semibold text-lg">{lead.name}</h3>
                                        <Badge className="bg-blue-600">Team Lead</Badge>
                                    </div>
                                    <p className="text-sm text-gray-600">{lead.email}</p>
                                </div>
                            </div>

                            {/* Connection line to members */}
                            {members.length > 0 && (
                                <div className="absolute left-6 top-full w-0.5 h-6 bg-gray-300"></div>
                            )}
                        </div>
                    )}

                    {/* Team Members */}
                    {members.length > 0 && (
                        <div className="relative pl-8">
                            {/* Horizontal line */}
                            <div className="absolute left-6 top-0 w-2 h-0.5 bg-gray-300"></div>

                            <div className="space-y-3">
                                {members.map((member, index) => (
                                    <div key={member.userId} className="relative">
                                        {/* Vertical line connector */}
                                        {index < members.length - 1 && (
                                            <div className="absolute -left-8 top-0 w-0.5 h-full bg-gray-300"></div>
                                        )}
                                        {index === members.length - 1 && (
                                            <div className="absolute -left-8 top-0 w-0.5 h-6 bg-gray-300"></div>
                                        )}

                                        {/* Horizontal connector */}
                                        <div className="absolute -left-8 top-6 w-8 h-0.5 bg-gray-300"></div>

                                        {/* Member card */}
                                        <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                                            <div className="flex-shrink-0">
                                                <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                                                    <User className="h-5 w-5 text-gray-600" />
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-medium">{member.name}</h4>
                                                    <Badge variant="secondary" className="text-xs">
                                                        {member.role.replace('_', ' ')}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-gray-600">{member.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Empty state */}
                    {members.length === 0 && lead && (
                        <div className="text-center py-6 text-gray-500">
                            <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">No team members assigned yet</p>
                        </div>
                    )}

                    {/* Team stats */}
                    <div className="pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-center">
                            <div>
                                <p className="text-2xl font-bold text-blue-600">1</p>
                                <p className="text-sm text-gray-600">Team Lead</p>
                            </div>
                            <div>
                                <p className="text-2xl font-bold text-gray-700">{members.length}</p>
                                <p className="text-sm text-gray-600">Team Members</p>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
