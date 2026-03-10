"use client";

import React from 'react';
import { formatDistanceToNow } from 'date-fns';
import { User, Calendar, Globe, UserCheck, Eye, UserX } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardAction } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { VvipShopperCardProps } from '@/types/vvip';

/**
 * VvipShopperCard Component
 * 
 * Displays VVIP shopper information with role-based action buttons.
 * Requirements: 2.2, 2.3, 2.4, 2.5, 2.6
 */
export function VvipShopperCard({ 
  shopper, 
  userRole, 
  onViewProfile, 
  onRevokeVvip 
}: VvipShopperCardProps) {
  // Format the creation date
  const createdDate = shopper.vvip_created_at?.toDate?.() || 
                     (shopper.vvip_created_at as any)?.seconds ? 
                     new Date((shopper.vvip_created_at as any).seconds * 1000) : 
                     new Date();

  // Determine if user can perform actions based on role
  const canViewProfile = userRole === 'super_admin' || userRole === 'bdm';
  const canRevokeVvip = userRole === 'super_admin' || userRole === 'bdm';

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {shopper.firstName} {shopper.lastName}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{shopper.email}</p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            VVIP
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Shopper Details */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <Globe className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Country:</span>
            <span className="font-medium">{shopper.country}</span>
          </div>
          
          <div className="flex items-center space-x-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Added:</span>
            <span className="font-medium">
              {formatDistanceToNow(createdDate, { addSuffix: true })}
            </span>
          </div>
        </div>

        {/* Creator Information */}
        {shopper.createdByName && (
          <div className="flex items-center space-x-2 text-sm">
            <UserCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">Created by:</span>
            <span className="font-medium">{shopper.createdByName}</span>
          </div>
        )}

        {/* Action Buttons */}
        {(canViewProfile || canRevokeVvip) && (
          <div className="flex space-x-2 pt-2 border-t">
            {canViewProfile && onViewProfile && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onViewProfile(shopper.userId)}
                className="flex-1"
              >
                <Eye className="w-4 h-4 mr-2" />
                View Profile
              </Button>
            )}
            
            {canRevokeVvip && onRevokeVvip && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRevokeVvip(shopper.userId)}
                className="flex-1"
              >
                <UserX className="w-4 h-4 mr-2" />
                Revoke VVIP
              </Button>
            )}
          </div>
        )}

        {/* Read-only indicator for team members */}
        {userRole === 'team_member' && (
          <div className="text-xs text-muted-foreground text-center py-2 border-t">
            Read-only access
          </div>
        )}
      </CardContent>
    </Card>
  );
}