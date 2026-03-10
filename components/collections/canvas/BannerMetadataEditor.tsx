'use client';

import { useState, useEffect } from 'react';
import { Tag, Type, FileText, ChevronDown, ChevronUp } from 'lucide-react';

interface BannerMetadataEditorProps
{
    badge?: string;
    title?: string;
    description?: string;
    onUpdate: (data: { badge?: string; title?: string; description?: string }) => void;
}

export function BannerMetadataEditor({
    badge,
    title,
    description,
    onUpdate,
}: BannerMetadataEditorProps)
{
    const [localBadge, setLocalBadge] = useState(badge || '');
    const [localTitle, setLocalTitle] = useState(title || '');
    const [localDescription, setLocalDescription] = useState(description || '');
    const [isExpanded, setIsExpanded] = useState(false);

    useEffect(() =>
    {
        setLocalBadge(badge || '');
        setLocalTitle(title || '');
        setLocalDescription(description || '');
    }, [badge, title, description]);

    const handleBadgeChange = (value: string) =>
    {
        setLocalBadge(value);
        onUpdate({ badge: value, title: localTitle, description: localDescription });
    };

    const handleTitleChange = (value: string) =>
    {
        setLocalTitle(value);
        onUpdate({ badge: localBadge, title: value, description: localDescription });
    };

    const handleDescriptionChange = (value: string) =>
    {
        setLocalDescription(value);
        onUpdate({ badge: localBadge, title: localTitle, description: value });
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Tag className="w-5 h-5 text-purple-600" />
                    <h3 className="text-sm font-semibold text-gray-900">Banner Display</h3>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
            </button>

            {/* Content - Collapsible */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mt-3">
                        Customize how this collection appears on the landing page banner
                    </p>

                    {/* Badge */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Badge Text
                        </label>
                        <input
                            type="text"
                            value={localBadge}
                            onChange={(e) => handleBadgeChange(e.target.value)}
                            placeholder="e.g., Featured Collection, New Arrivals"
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            maxLength={50}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            {localBadge.length}/50 characters
                        </p>
                    </div>

                    {/* Title */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Display Title
                        </label>
                        <input
                            type="text"
                            value={localTitle}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            placeholder="Leave empty to use collection name"
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                            maxLength={100}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            {localTitle.length}/100 characters
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                            Description
                        </label>
                        <textarea
                            value={localDescription}
                            onChange={(e) => handleDescriptionChange(e.target.value)}
                            placeholder="Describe this collection..."
                            rows={3}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                            maxLength={250}
                        />
                        <p className="text-xs text-gray-400 mt-1">
                            {localDescription.length}/250 characters
                        </p>
                    </div>

                    {/* Preview */}
                    <div className="pt-3 border-t border-gray-100">
                        <p className="text-xs font-medium text-gray-700 mb-2">Preview:</p>
                        <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                            {localBadge && (
                                <div className="inline-block">
                                    <span className="px-3 py-1 bg-black text-white text-xs font-medium rounded-full">
                                        {localBadge}
                                    </span>
                                </div>
                            )}
                            {localTitle && (
                                <h4 className="text-sm font-bold text-gray-900">
                                    {localTitle}
                                </h4>
                            )}
                            {localDescription && (
                                <p className="text-xs text-gray-600">
                                    {localDescription}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
