'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

interface CollectionCreationDialogProps
{
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (name: string) => void;
    selectedCount: number;
}

export function CollectionCreationDialog({
    isOpen,
    onClose,
    onSubmit,
    selectedCount,
}: CollectionCreationDialogProps)
{
    const [name, setName] = useState('');
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleSubmit = (e: React.FormEvent) =>
    {
        e.preventDefault();

        if (!name.trim())
        {
            setError('Collection name is required');
            return;
        }

        if (name.length > 100)
        {
            setError('Collection name must be less than 100 characters');
            return;
        }

        onSubmit(name.trim());
        setName('');
        setError('');
    };

    const handleClose = () =>
    {
        setName('');
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black bg-opacity-50"
                onClick={handleClose}
            />

            {/* Dialog */}
            <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Create Collection</h2>
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <p className="text-sm text-gray-600 mb-4">
                            You have selected {selectedCount} product{selectedCount !== 1 ? 's' : ''} for this collection.
                        </p>

                        <label htmlFor="collection-name" className="block text-sm font-medium text-gray-700 mb-2">
                            Collection Name
                        </label>
                        <input
                            id="collection-name"
                            type="text"
                            value={name}
                            onChange={(e) =>
                            {
                                setName(e.target.value);
                                setError('');
                            }}
                            placeholder="e.g., Summer Collection 2024"
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            autoFocus
                        />
                        {error && (
                            <p className="mt-2 text-sm text-red-600">{error}</p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 justify-end">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                        >
                            Create Collection
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
