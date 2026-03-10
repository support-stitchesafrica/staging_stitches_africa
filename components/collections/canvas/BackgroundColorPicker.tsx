'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Palette, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface BackgroundColorPickerProps
{
    currentColor: string;
    onColorChange: (color: string) => void;
}

const PRESET_COLORS = [
    '#FFFFFF', // White
    '#F3F4F6', // Gray 100
    '#E5E7EB', // Gray 200
    '#FEF3C7', // Yellow 100
    '#FEE2E2', // Red 100
    '#DBEAFE', // Blue 100
    '#D1FAE5', // Green 100
    '#E9D5FF', // Purple 100
    '#FCE7F3', // Pink 100
    '#000000', // Black
    '#1F2937', // Gray 800
    '#3B82F6', // Blue 500
    '#10B981', // Green 500
    '#F59E0B', // Yellow 500
    '#EF4444', // Red 500
    '#8B5CF6', // Purple 500
    '#EC4899', // Pink 500
];

export function BackgroundColorPicker({
    currentColor,
    onColorChange,
}: BackgroundColorPickerProps)
{
    const [customColor, setCustomColor] = useState(currentColor);
    const [isExpanded, setIsExpanded] = useState(false);

    const handlePresetClick = (color: string) =>
    {
        onColorChange(color);
        setCustomColor(color);
    };

    const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    {
        const color = e.target.value;
        setCustomColor(color);
        onColorChange(color);
    };

    return (
        <Card className="bg-white border border-gray-200 rounded-lg shadow-sm">
            {/* Header - Always visible */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <Palette className="h-5 w-5 text-purple-600" />
                    <div className="text-left">
                        <h3 className="text-sm font-semibold text-gray-900">Background</h3>
                        <div className="flex items-center gap-2 mt-1">
                            <div
                                className="w-4 h-4 rounded border border-gray-300"
                                style={{ backgroundColor: currentColor }}
                            />
                            <span className="text-xs text-gray-500">{currentColor}</span>
                        </div>
                    </div>
                </div>
                {isExpanded ? (
                    <ChevronUp className="w-4 h-4 text-gray-500" />
                ) : (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                )}
            </button>

            {/* Content - Collapsible */}
            {isExpanded && (
                <div className="px-4 pb-4 space-y-4 border-t border-gray-100 pt-4">
                    {/* Preset Colors */}
                    <div>
                        <label className="text-xs font-medium text-gray-700 mb-2 block">Preset Colors</label>
                        <div className="grid grid-cols-6 gap-2">
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    onClick={() => handlePresetClick(color)}
                                    className="relative w-10 h-10 rounded-lg border-2 hover:scale-110 transition-transform"
                                    style={{
                                        backgroundColor: color,
                                        borderColor: currentColor === color ? '#3B82F6' : '#E5E7EB',
                                    }}
                                    title={color}
                                >
                                    {currentColor === color && (
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Check
                                                className="h-5 w-5"
                                                style={{
                                                    color: color === '#FFFFFF' || color.startsWith('#F') ? '#000000' : '#FFFFFF',
                                                }}
                                            />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Custom Color Input */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-700">Custom Color</label>
                        <div className="flex gap-2">
                            <Input
                                type="color"
                                value={customColor}
                                onChange={handleCustomColorChange}
                                className="w-16 h-10 p-1 cursor-pointer"
                            />
                            <Input
                                type="text"
                                value={customColor}
                                onChange={(e) =>
                                {
                                    setCustomColor(e.target.value);
                                }}
                                onBlur={() => onColorChange(customColor)}
                                placeholder="#FFFFFF"
                                className="flex-1"
                            />
                        </div>
                    </div>
                </div>
            )}
        </Card>
    );
}
