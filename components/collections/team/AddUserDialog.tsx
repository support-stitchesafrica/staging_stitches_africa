'use client';

import React, { useState } from 'react';
import { Loader2, UserPlus, AlertCircle } from 'lucide-react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import
{
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CollectionsRole } from '@/lib/collections/types';
import { DialogErrorBoundary } from './DialogErrorBoundary';
import
{
    validateEmail,
    validateRole,
    validateRequiredFields,
    parseApiError,
    handleError,
} from '@/lib/collections/errors';
import { useCollectionsAuth } from '@/contexts/CollectionsAuthContext';

interface AddUserDialogProps
{
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
}

interface FormData
{
    fullName: string;
    email: string;
    role: CollectionsRole | '';
}

interface FormErrors
{
    fullName?: string;
    email?: string;
    role?: string;
}

const ROLE_DESCRIPTIONS: Record<CollectionsRole, string> = {
    superadmin: 'Full access to all features including team management',
    editor: 'Can create, edit, and delete collections',
    viewer: 'Read-only access to view collections',
};

export function AddUserDialog({ open, onOpenChange, onSuccess }: AddUserDialogProps)
{
    const { user } = useCollectionsAuth();
    const [formData, setFormData] = useState<FormData>({
        fullName: '',
        email: '',
        role: '',
    });
    const [errors, setErrors] = useState<FormErrors>({});
    const [isLoading, setIsLoading] = useState(false);
    const [apiError, setApiError] = useState<string | null>(null);

    const validateForm = (): boolean =>
    {
        const newErrors: FormErrors = {};

        // Validate required fields
        const requiredFieldsError = validateRequiredFields(
            { fullName: formData.fullName, email: formData.email, role: formData.role },
            ['fullName', 'email', 'role']
        );

        if (requiredFieldsError)
        {
            if (!formData.fullName.trim())
            {
                newErrors.fullName = 'Full name is required';
            }
            if (!formData.email.trim())
            {
                newErrors.email = 'Email is required';
            }
            if (!formData.role)
            {
                newErrors.role = 'Please select a role';
            }
        }

        // Validate email format
        if (formData.email.trim())
        {
            const emailError = validateEmail(formData.email.trim());
            if (emailError)
            {
                newErrors.email = emailError.message;
            }
        }

        // Validate role
        if (formData.role)
        {
            const roleError = validateRole(formData.role);
            if (roleError)
            {
                newErrors.role = roleError.message;
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) =>
    {
        e.preventDefault();
        setApiError(null);

        if (!validateForm())
        {
            return;
        }

        setIsLoading(true);

        try
        {
            // Get Firebase ID token for authentication
            if (!user)
            {
                throw new Error('You must be logged in to send invitations');
            }

            const idToken = await user.getIdToken();

            const response = await fetch('/api/collections/team/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`,
                },
                body: JSON.stringify({
                    fullName: formData.fullName.trim(),
                    email: formData.email.trim().toLowerCase(),
                    role: formData.role,
                }),
            });

            const data = await response.json();

            if (!response.ok)
            {
                throw new Error(data.error || 'Failed to send invitation');
            }

            if (!data.success)
            {
                throw new Error(data.error || 'Failed to send invitation');
            }

            // Success
            toast.success('Invitation sent!', {
                description: `An invitation has been sent to ${formData.email}`,
                duration: 5000,
            });

            // Reset form
            setFormData({
                fullName: '',
                email: '',
                role: '',
            });
            setErrors({});

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
                action: 'invite_user',
                email: formData.email,
            });

            setApiError(errorMessage);
            toast.error('Invitation failed', {
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
                // Reset form when closing
                setFormData({
                    fullName: '',
                    email: '',
                    role: '',
                });
                setErrors({});
                setApiError(null);
            }
            onOpenChange(newOpen);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogErrorBoundary onClose={() => handleOpenChange(false)}>
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <UserPlus className="size-5" />
                            Invite Team Member
                        </DialogTitle>
                        <DialogDescription>
                            Send an invitation to add a new member to your Collections team. They will receive an
                            email with instructions to set up their account.
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

                            {/* Full Name Field */}
                            <div className="grid gap-2">
                                <Label htmlFor="fullName">
                                    Full Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="fullName"
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.fullName}
                                    onChange={(e) =>
                                    {
                                        setFormData({ ...formData, fullName: e.target.value });
                                        if (errors.fullName)
                                        {
                                            setErrors({ ...errors, fullName: undefined });
                                        }
                                    }}
                                    aria-invalid={!!errors.fullName}
                                    disabled={isLoading}
                                    autoComplete="name"
                                />
                                {errors.fullName && (
                                    <p className="text-sm text-destructive">{errors.fullName}</p>
                                )}
                            </div>

                            {/* Email Field */}
                            <div className="grid gap-2">
                                <Label htmlFor="email">
                                    Email Address <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    value={formData.email}
                                    onChange={(e) =>
                                    {
                                        setFormData({ ...formData, email: e.target.value });
                                        if (errors.email)
                                        {
                                            setErrors({ ...errors, email: undefined });
                                        }
                                    }}
                                    aria-invalid={!!errors.email}
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                                {errors.email && (
                                    <p className="text-sm text-destructive">{errors.email}</p>
                                )}
                            </div>

                            {/* Role Field */}
                            <div className="grid gap-2">
                                <Label htmlFor="role">
                                    Role <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={formData.role}
                                    onValueChange={(value) =>
                                    {
                                        setFormData({ ...formData, role: value as CollectionsRole });
                                        if (errors.role)
                                        {
                                            setErrors({ ...errors, role: undefined });
                                        }
                                    }}
                                    disabled={isLoading}
                                >
                                    <SelectTrigger id="role" aria-invalid={!!errors.role} className="w-full">
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
                                {errors.role && (
                                    <p className="text-sm text-destructive">{errors.role}</p>
                                )}
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
                            <Button type="submit" disabled={isLoading}>
                                {isLoading ? (
                                    <>
                                        <Loader2 className="size-4 animate-spin" />
                                        Sending...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="size-4" />
                                        Send Invitation
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
