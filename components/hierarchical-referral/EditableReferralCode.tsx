'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { copyToClipboard } from '@/lib/hierarchical-referral/utils/clipboard';
import { Copy, Pencil, Check, X, CheckCircle, Loader2 } from 'lucide-react';

interface EditableReferralCodeProps
{
    code: string;
    token: string;
    onUpdated: (newCode: string) => void;
}

export function EditableReferralCode({ code, token, onUpdated }: EditableReferralCodeProps)
{
    const [isEditing, setIsEditing] = useState(false);
    const [value, setValue] = useState(code);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    const handleSave = async () =>
    {
        const trimmed = value.trim().toUpperCase().replace(/\s+/g, '_');
        if (trimmed === code) { setIsEditing(false); return; }

        setIsSaving(true);
        setError(null);
        try
        {
            const res = await fetch('/api/hierarchical-referral/codes/update', {
                method: 'PATCH',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldCode: code, newCode: trimmed })
            });
            const data = await res.json();
            if (data.success)
            {
                onUpdated(data.data.code);
                setIsEditing(false);
            } else
            {
                setError(data.error || 'Failed to update code');
            }
        } catch
        {
            setError('Network error. Please try again.');
        } finally
        {
            setIsSaving(false);
        }
    };

    const handleCancel = () =>
    {
        setValue(code);
        setError(null);
        setIsEditing(false);
    };

    const handleCopy = () =>
    {
        copyToClipboard(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (isEditing)
    {
        return (
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <Input
                        value={value}
                        onChange={e => { setValue(e.target.value.toUpperCase()); setError(null); }}
                        className="font-mono font-bold text-base h-10"
                        placeholder="e.g. MYCODE2024"
                        maxLength={30}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
                    />
                    <Button size="sm" onClick={handleSave} disabled={isSaving} className="shrink-0">
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </Button>
                    <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isSaving} className="shrink-0">
                        <X className="h-4 w-4" />
                    </Button>
                </div>
                {error && <p className="text-xs text-red-500">{error}</p>}
                <p className="text-xs text-gray-400">Letters, numbers, hyphens and underscores only (3–30 chars)</p>
            </div>
        );
    }

    return (
        <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-3">
            <code className="flex-1 text-lg font-mono font-bold text-gray-900">{code}</code>
            <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy">
                {copied ? <CheckCircle className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setValue(code); setIsEditing(true); }} title="Edit">
                <Pencil className="h-4 w-4" />
            </Button>
        </div>
    );
}
