'use client';

import { Badge } from '@/components/ui/badge';
import { Users, Crown, TrendingUp, ChevronDown } from 'lucide-react';

export interface TreeNode
{
    id: string;
    name: string;
    email: string;
    status: string;
    totalEarnings: number;
    referralCode?: string;
    children?: TreeNode[];
}

interface ReferralTreeProps
{
    mother: {
        name: string;
        masterReferralCode?: string;
        referralCode?: string;
        totalEarnings: number;
    };
    miniInfluencers: TreeNode[];
}

function MiniCard({ node, index, depth = 0 }: { node: TreeNode; index: number; depth?: number })
{
    const hasChildren = node.children && node.children.length > 0;

    return (
        <div className="flex flex-col items-center">
            {/* Connector up */}
            <div className="w-0.5 h-6 bg-gray-300" />

            <div className={`relative rounded-xl px-4 py-3 shadow text-center border-2 ${depth === 0 ? 'w-44' : 'w-40'
                } ${node.status === 'active'
                    ? 'bg-white border-green-200'
                    : 'bg-gray-50 border-gray-200 opacity-60'
                }`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                    <Users className={`h-4 w-4 ${depth === 0 ? 'text-purple-500' : 'text-indigo-400'}`} />
                    <span className="text-xs font-bold text-gray-500">#{index + 1}</span>
                </div>
                <p className="font-semibold text-sm text-gray-900 truncate">{node.name}</p>
                <p className="text-xs text-gray-400 truncate">{node.email}</p>
                {node.referralCode && (
                    <code className="mt-1 block bg-gray-100 rounded px-1.5 py-0.5 text-xs font-mono text-gray-600 truncate">
                        {node.referralCode}
                    </code>
                )}
                <div className="mt-2 flex items-center justify-between">
                    <Badge
                        variant={node.status === 'active' ? 'default' : 'secondary'}
                        className={`text-xs px-1.5 py-0 ${node.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : ''}`}
                    >
                        {node.status}
                    </Badge>
                    <span className="text-xs font-medium text-gray-700 flex items-center gap-0.5">
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        ₦{node.totalEarnings.toLocaleString()}
                    </span>
                </div>
                {hasChildren && (
                    <div className="mt-1 flex items-center justify-center gap-1 text-xs text-indigo-500">
                        <ChevronDown className="h-3 w-3" />
                        <span>{node.children!.length} sub</span>
                    </div>
                )}
            </div>

            {/* Children sub-tree */}
            {hasChildren && (
                <div className="flex flex-col items-center w-full">
                    <div className="w-0.5 h-4 bg-gray-200" />
                    {node.children!.length > 1 && (
                        <div
                            className="h-0.5 bg-gray-200"
                            style={{ width: `${Math.min(node.children!.length * 160, 700)}px` }}
                        />
                    )}
                    <div className="flex flex-wrap justify-center gap-3 mt-0">
                        {node.children!.map((child, ci) => (
                            <MiniCard key={child.id} node={child} index={ci} depth={depth + 1} />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

function countAll(nodes: TreeNode[]): number
{
    return nodes.reduce((acc, n) => acc + 1 + countAll(n.children ?? []), 0);
}

export function ReferralTree({ mother, miniInfluencers }: ReferralTreeProps)
{
    const total = countAll(miniInfluencers);
    const active = miniInfluencers.filter(m => m.status === 'active').length;

    return (
        <div className="w-full overflow-x-auto">
            <div className="min-w-[320px] flex flex-col items-center gap-0 py-4">

                {/* Mother node */}
                <div className="flex flex-col items-center">
                    <div className="relative bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-2xl px-6 py-4 shadow-lg w-64 text-center">
                        <Crown className="h-5 w-5 mx-auto mb-1 text-yellow-300" />
                        <p className="font-bold text-lg leading-tight">{mother.name}</p>
                        <p className="text-blue-200 text-xs mt-0.5">
                            {mother.masterReferralCode ? 'Mother Influencer' : 'Mini Influencer'}
                        </p>
                        {(mother.masterReferralCode || mother.referralCode) && (
                            <code className="mt-2 block bg-blue-800/50 rounded px-2 py-1 text-xs font-mono">
                                {mother.masterReferralCode || mother.referralCode}
                            </code>
                        )}
                        <p className="mt-2 text-sm font-semibold text-yellow-300">
                            ₦{mother.totalEarnings.toLocaleString()}
                        </p>
                    </div>

                    {miniInfluencers.length > 0 && (
                        <div className="w-0.5 h-8 bg-gray-300" />
                    )}
                </div>

                {/* Mini influencers row */}
                {miniInfluencers.length > 0 ? (
                    <div className="flex flex-col items-center w-full">
                        {miniInfluencers.length > 1 && (
                            <div
                                className="h-0.5 bg-gray-300"
                                style={{ width: `${Math.min(miniInfluencers.length * 180, 900)}px` }}
                            />
                        )}
                        <div className="flex flex-wrap justify-center gap-4 mt-0">
                            {miniInfluencers.map((mini, i) => (
                                <MiniCard key={mini.id} node={mini} index={i} depth={0} />
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="mt-2 text-center text-sm text-gray-400 bg-gray-50 rounded-xl px-6 py-4 border border-dashed border-gray-200 w-64">
                        <Users className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        No Mini Influencers yet. Generate a sub-code and share it to grow your network.
                    </div>
                )}

                {/* Summary */}
                {total > 0 && (
                    <div className="mt-6 flex gap-4 text-center">
                        <div className="bg-green-50 rounded-lg px-4 py-2">
                            <p className="text-xs text-gray-500">Active</p>
                            <p className="text-lg font-bold text-green-700">{active}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg px-4 py-2">
                            <p className="text-xs text-gray-500">Inactive</p>
                            <p className="text-lg font-bold text-gray-500">{miniInfluencers.length - active}</p>
                        </div>
                        <div className="bg-blue-50 rounded-lg px-4 py-2">
                            <p className="text-xs text-gray-500">Total Network</p>
                            <p className="text-lg font-bold text-blue-700">{total}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
