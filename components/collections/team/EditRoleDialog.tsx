'use client';

import React, { useState, useEffect } from 'react';
import { Loader2, UserCog, AlertTriangle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import
{
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import
{
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CollectionsRole, CollectionsUser } from '@/lib/collections/types';
import { DialogErrorBoundary } from './DialogErrorBoundary';
import { handleError, parseApiError } from '@/lib/collections/errors';

interface EditRoleDialogProps
{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: CollectionsUser | null;
    onSuccess?: () => void;
}

const ROLE_DESCRIPTIONS: Record<CollectionsRole, string> = {
    superadmin: 'Full access to all features including team management',
    editor: 'Can create, edit, and delete collections',
    viewer: 'Read-only access to view collections',
};

const ROLE_LABELS: Record<CollectionsRole, string> = {
    superadmin: 'Super Admin',
    editor: 'Editor',
    viewer: 'Viewer',
};

export function EditRoleDialog({ open, onOpenChange, user, onSuccess }: EditRoleDialogProps)
{
    const [selectedRole, setSelectedRole] = useState<CollectionsRole | ''>('');
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);
    const [showWarning, setShowWarning] = useState(false);

    // Initialize selected role when user changes
    useEffect(() =>
    {
        if (user)
        {
            setSelectedRole(user.role);
            setShowWarning(false);
            setApiError(null);
        }
    }, [user]);

    // Show warning when downgrading from superadmin
    useEffect(() =>
    {
        if (user && user.role === 'superadmin' && selectedRole && selectedRole !== 'superadmin')
        {
            setShowWarning(true);
        } else
        {
            setShowWarning(false);
        }
    }, [selectedRole, user]);

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        setApiError(null);

        if (!user || !selectedRole)
        {
            return;
        }

        // Check if role hasn't changed
        if (selectedRole === user.role)
        {
            toast.info('No changes made', {
                description: 'The role is already set to this value',
            });
            onOpenChange(false);
            return;
        }

        setIsLoading(true);

        // Store original role for rollback
        const originalRole = user.role;

        // Optimistic update - update UI immediately
        const optimisticUpdate = { ...user, role: selectedRole };

        try
        {
            const response = await fetch(`/api/collections/team/members/${user.uid}/role`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    role: selectedRole,
                }),
            });

            const data = await response.json();

            if (!response.ok)
            {
                throw new Error(data.error || 'Failed to update role');
            }

            if (!data.success)
            {
                throw new Error(data.error || 'Failed to update role');
            }

            // Success
            toast.success('Role updated!', {
                description: `${user.fullName}'s role has been changed to ${ROLE_LABELS[selectedRole]}`,
                duration: 5000,
            });

            // Close dialog
            onOpenChange(false);

            // Call success callback
            if (onSuccess)
            {
                onSuccess();
            }
        } catch (error)
        {
            // Use error handling utilities
            const errorMessage = handleError(error, {
                action: 'update_role',
                userId: user.uid,
                newRole: selectedRole,
            });

            // Rollback optimistic update
            setSelectedRole(originalRole);

            setApiError(errorMessage);
            toast.error('Role update failed', {
                description: errorMessage,
                duration: 5000,
            });
        } finally
        {
            setIsLoading(false);
        }
    };

    const handleOpenChange = (newOpen: boolean) =>
    {
        if (!isLoading)
        {
            if (!newOpen)
            {
                // Reset state when closing
                setSelectedRole(user?.role || '');
                setApiError(null);
                setShowWarning(false);
            }
            onOpenChange(newOpen);
        }
    };

    if (!user)
    {
        return null;
    }

    const hasChanges = selectedRole !== user.role;

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogErrorBoundary onClose={() => handleOpenChange(false)}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserCog className="size-5" />
                            Edit Team Member Role
                        </DialogTitle>
                        <DialogDescription>
                            Change the role and permissions for this team member. This will take effect immediately.
                        </DialogDescription>
                    </DialogHeader>

                    <form onSubmit={handleSubmit}>
                        <div className="grid gap-4 py-4">
                            {apiError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="size-4" />
                                    <AlertDescription>{apiError}</AlertDescription>
                                </Alert>
                            )}

                            {showWarning && (
                                <Alert variant="destructive">
                                    <AlertTriangle className="size-4" />
                                    <AlertTitle>Warning: Downgrading Super Admin</AlertTitle>
                                    <AlertDescription>
                                        You are about to remove Super Admin privileges from this user. They will lose
                                        access to team management and other admin features. This action cannot be undone
                                        without another Super Admin.
                                    </AlertDescription>
                                </Alert>
                            )}

                            {/* User Information */}
                            <div className="rounded-lg border bg-muted/50 p-4">
                                <div className="grid gap-2">
                                    <div>
                                        <p className="text-sm font-medium">Name</p>
                                        <p className="text-sm text-muted-foreground">{user.fullName}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Email</p>
                                        <p className="text-sm text-muted-foreground">{user.email}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium">Current Role</p>
                                        <p className="text-sm text-muted-foreground">{ROLE_LABELS[user.role]}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Role Selection */}
                            <div className="grid gap-2">
                                <Label htmlFor="role">
                                    New Role <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={selectedRole}
                                    onValueChange={(value) =>
                                    {
                                        setSelectedRole(value as CollectionsRole);
                                        if (apiError)
                                        {
                                            setApiError(null);
                                        }
                                    }}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="role" className="w-full">
                                        <SelectValue placeholder="Select a role" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="superadmin">
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="font-medium">Super Admin</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {ROLE_DESCRIPTIONS.superadmin}
                                                </span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="editor">
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="font-medium">Editor</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {ROLE_DESCRIPTIONS.editor}
                                                </span>
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="viewer">
                                            <div className="flex flex-col items-start gap-0.5">
                                                <span className="font-medium">Viewer</span>
                                                <span className="text-xs text-muted-foreground">
                                                    {ROLE_DESCRIPTIONS.viewer}
                                                </span>
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => handleOpenChange(false)}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isLoading || !hasChanges}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <UserCog className="size-4" />
                                        Update Role
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogErrorBoundary>
            </DialogContent>
        </Dialog>
    );
}
