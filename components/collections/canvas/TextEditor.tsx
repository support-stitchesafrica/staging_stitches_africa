'use client';

import { useState, useEffect } from 'react';
import { fabric } from 'fabric';
import { Type, Bold } from 'lucide-react';

interface TextEditorProps
{
    selectedElement: fabric.Object | null;
    onUpdate: () => void;
}

const FONT_FAMILIES = [
    'Arial',
    'Helvetica',
    'Times New Roman',
    'Georgia',
    'Courier New',
    'Verdana',
    'Impact',
    'Comic Sans MS',
];

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 36, 40, 48, 56, 64, 72, 96];

export function TextEditor({ selectedElement, onUpdate }: TextEditorProps)
{
    const [fontSize, setFontSize] = useState<number>(24);
    const [fontFamily, setFontFamily] = useState<string>('Arial');
    const [color, setColor] = useState<string>('#000000');
    const [fontWeight, setFontWeight] = useState<string>('normal');

    // Check if selected element is text
    const isTextElement = selectedElement && (selectedElement.type === 'text' || selectedElement.type === 'i-text');

    // Update state when selection changes
    useEffect(() =>
    {
        if (isTextElement)
        {
            const textObj = selectedElement as fabric.IText;
            setFontSize(textObj.fontSize || 24);
            setFontFamily(textObj.fontFamily || 'Arial');
            setColor(textObj.fill as string || '#000000');
            setFontWeight(textObj.fontWeight as string || 'normal');
        }
    }, [selectedElement, isTextElement]);

    // Handle font size change
    const handleFontSizeChange = (newSize: number) =>
    {
        if (!isTextElement) return;

        const textObj = selectedElement as fabric.IText;
        textObj.set({ fontSize: newSize });
        textObj.canvas?.renderAll();
        setFontSize(newSize);
        onUpdate();
    };

    // Handle font family change
    const handleFontFamilyChange = (newFamily: string) =>
    {
        if (!isTextElement) return;

        const textObj = selectedElement as fabric.IText;
        textObj.set({ fontFamily: newFamily });
        textObj.canvas?.renderAll();
        setFontFamily(newFamily);
        onUpdate();
    };

    // Handle color change
    const handleColorChange = (newColor: string) =>
    {
        if (!isTextElement) return;

        const textObj = selectedElement as fabric.IText;
        textObj.set({ fill: newColor });
        textObj.canvas?.renderAll();
        setColor(newColor);
        onUpdate();
    };

    // Handle font weight toggle
    const handleFontWeightToggle = () =>
    {
        if (!isTextElement) return;

        const textObj = selectedElement as fabric.IText;
        const newWeight = fontWeight === 'bold' ? 'normal' : 'bold';
        textObj.set({ fontWeight: newWeight });
        textObj.canvas?.renderAll();
        setFontWeight(newWeight);
        onUpdate();
    };

    if (!isTextElement)
    {
        return null;
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4">
            <div className="flex items-center gap-2 mb-3">
                <Type className="w-5 h-5 text-gray-600" />
                <h3 className="text-sm font-semibold text-gray-900">Text Properties</h3>
            </div>

            <div className="space-y-3">
                {/* Font Family */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Font Family
                    </label>
                    <select
                        value={fontFamily}
                        onChange={(e) => handleFontFamilyChange(e.target.value)}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {FONT_FAMILIES.map((font) => (
                            <option key={font} value={font} style={{ fontFamily: font }}>
                                {font}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Font Size */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Font Size
                    </label>
                    <select
                        value={fontSize}
                        onChange={(e) => handleFontSizeChange(Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        {FONT_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size}px
                            </option>
                        ))}
                    </select>
                </div>

                {/* Color */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Color
                    </label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => handleColorChange(e.target.value)}
                            className="w-12 h-10 border border-gray-300 rounded-lg cursor-pointer"
                        />
                        <input
                            type="text"
                            value={color}
                            onChange={(e) => handleColorChange(e.target.value)}
                            className="flex-1 px-3 py-2 border-2 border-gray-300 rounded-lg text-sm bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                            placeholder="#000000"
                        />
                    </div>
                </div>

                {/* Font Weight */}
                <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                        Style
                    </label>
                    <button
                        onClick={handleFontWeightToggle}
                        className={`flex items-center gap-2 px-3 py-2 border rounded-lg text-sm transition-colors ${fontWeight === 'bold'
                            ? 'bg-blue-50 border-blue-500 text-blue-700'
                            : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                            }`}
                    >
                        <Bold className="w-4 h-4" />
                        Bold
                    </button>
                </div>
            </div>
        </div>
    );
}
