'use client';

import { lazy, Suspense } from 'react';
import
{
    Copy,
    Trash2,
    Undo,
    Redo,
    Type,
    Save,
    Upload,
    Image as ImageIcon,
    Layers,
    ZoomIn,
    ZoomOut,
    Maximize2,
    Lock,
    Unlock,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignVerticalJustifyCenter,
    AlignHorizontalJustifyCenter,
    FlipHorizontal,
    FlipVertical,
    RotateCw,
    Palette,
    Grid3x3,
    Eye,
    EyeOff,
    UploadCloud
} from 'lucide-react';
import { Template } from '@/types/collections';

// Lazy load TemplateSelector for better performance
const TemplateSelector = lazy(() =>
    import('./TemplateSelector').then((mod) => ({ default: mod.TemplateSelector }))
);

// Wrapper component with Suspense
function TemplateSelectorLazy(props: any)
{
    return (
        <Suspense fallback={<div className="w-20 h-8 bg-gray-100 animate-pulse rounded" />}>
            <TemplateSelector {...props} />
        </Suspense>
    );
}

interface CanvasToolbarProps
{
    onDuplicate?: () => void;
    onDelete?: () => void;
    onUndo?: () => void;
    onRedo?: () => void;
    onAddText?: () => void;
    onAddImage?: () => void;
    onUploadImage?: () => void;
    onSave?: () => void;
    onPublish?: () => void;
    onTemplateSelect?: (template: Template) => void;
    onBringToFront?: () => void;
    onSendToBack?: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onResetZoom?: () => void;
    onLockElement?: () => void;
    onUnlockElement?: () => void;
    onAlignLeft?: () => void;
    onAlignCenter?: () => void;
    onAlignRight?: () => void;
    onAlignTop?: () => void;
    onAlignMiddle?: () => void;
    onAlignBottom?: () => void;
    onFlipHorizontal?: () => void;
    onFlipVertical?: () => void;
    onRotate?: () => void;
    onToggleGrid?: () => void;
    onToggleGuides?: () => void;
    canUndo?: boolean;
    canRedo?: boolean;
    hasSelection?: boolean;
    isLocked?: boolean;
    isSaving?: boolean;
    productCount?: number;
    showGrid?: boolean;
    showGuides?: boolean;
    zoomLevel?: number;
}

export function CanvasToolbar({
    onDuplicate,
    onDelete,
    onUndo,
    onRedo,
    onAddText,
    onAddImage,
    onUploadImage,
    onSave,
    onPublish,
    onTemplateSelect,
    onBringToFront,
    onSendToBack,
    onZoomIn,
    onZoomOut,
    onResetZoom,
    onLockElement,
    onUnlockElement,
    onAlignLeft,
    onAlignCenter,
    onAlignRight,
    onAlignTop,
    onAlignMiddle,
    onAlignBottom,
    onFlipHorizontal,
    onFlipVertical,
    onRotate,
    onToggleGrid,
    onToggleGuides,
    canUndo = false,
    canRedo = false,
    hasSelection = false,
    isLocked = false,
    isSaving = false,
    productCount = 0,
    showGrid = false,
    showGuides = false,
    zoomLevel = 100,
}: CanvasToolbarProps)
{
    return (
        <div className="flex flex-wrap items-center gap-2 p-3 bg-gradient-to-r from-slate-50 via-white to-slate-50 border-2 border-slate-200 rounded-2xl shadow-xl backdrop-blur-sm">
            {/* Undo/Redo */}
            <div className="flex items-center gap-1 pr-3 border-r-2 border-slate-200">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="p-2.5 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-blue-600 hover:scale-105 active:scale-95"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo className="w-5 h-5" />
                </button>
                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="p-2.5 hover:bg-gradient-to-br hover:from-blue-50 hover:to-indigo-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-blue-600 hover:scale-105 active:scale-95"
                    title="Redo (Ctrl+Y)"
                >
                    <Redo className="w-5 h-5" />
                </button>
            </div>

            {/* Add Elements */}
            <div className="flex items-center gap-1 pr-3 border-r-2 border-slate-200">
                {onAddImage && (
                    <button
                        onClick={onAddImage}
                        className="p-2.5 hover:bg-gradient-to-br hover:from-blue-50 hover:to-cyan-50 hover:shadow-lg rounded-xl transition-all duration-200 text-blue-600 hover:text-blue-700 hover:scale-105 active:scale-95"
                        title="Add Product Image"
                    >
                        <ImageIcon className="w-5 h-5" />
                    </button>
                )}
                {onUploadImage && (
                    <button
                        onClick={onUploadImage}
                        className="p-2.5 hover:bg-gradient-to-br hover:from-emerald-50 hover:to-teal-50 hover:shadow-lg rounded-xl transition-all duration-200 text-emerald-600 hover:text-emerald-700 hover:scale-105 active:scale-95"
                        title="Upload Custom Image"
                    >
                        <UploadCloud className="w-5 h-5" />
                    </button>
                )}
                <button
                    onClick={onAddText}
                    className="p-2.5 hover:bg-gradient-to-br hover:from-purple-50 hover:to-pink-50 hover:shadow-lg rounded-xl transition-all duration-200 text-purple-600 hover:text-purple-700 hover:scale-105 active:scale-95"
                    title="Add Text"
                >
                    <Type className="w-5 h-5" />
                </button>
            </div>

            {/* Element Actions */}
            <div className="flex items-center gap-1 pr-3 border-r-2 border-slate-200">
                <button
                    onClick={onDuplicate}
                    disabled={!hasSelection}
                    className="p-2.5 hover:bg-gradient-to-br hover:from-green-50 hover:to-emerald-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-green-600 hover:scale-105 active:scale-95"
                    title="Duplicate (Ctrl+D)"
                >
                    <Copy className="w-5 h-5" />
                </button>
                <button
                    onClick={onDelete}
                    disabled={!hasSelection}
                    className="p-2.5 hover:bg-gradient-to-br hover:from-red-50 hover:to-rose-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-red-600 hover:text-red-700 hover:scale-105 active:scale-95"
                    title="Delete (Delete)"
                >
                    <Trash2 className="w-5 h-5" />
                </button>
            </div>

            {/* Alignment Tools */}
            {(onAlignLeft || onAlignCenter || onAlignRight || onAlignTop || onAlignMiddle || onAlignBottom) && (
                <div className="flex items-center gap-1 pr-3 border-r-2 border-slate-200">
                    {onAlignLeft && (
                        <button
                            onClick={onAlignLeft}
                            disabled={!hasSelection}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-amber-600 hover:scale-105 active:scale-95"
                            title="Align Left"
                        >
                            <AlignLeft className="w-5 h-5" />
                        </button>
                    )}
                    {onAlignCenter && (
                        <button
                            onClick={onAlignCenter}
                            disabled={!hasSelection}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-amber-600 hover:scale-105 active:scale-95"
                            title="Align Center Horizontally"
                        >
                            <AlignHorizontalJustifyCenter className="w-5 h-5" />
                        </button>
                    )}
                    {onAlignRight && (
                        <button
                            onClick={onAlignRight}
                            disabled={!hasSelection}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-amber-600 hover:scale-105 active:scale-95"
                            title="Align Right"
                        >
                            <AlignRight className="w-5 h-5" />
                        </button>
                    )}
                    {onAlignMiddle && (
                        <button
                            onClick={onAlignMiddle}
                            disabled={!hasSelection}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-amber-50 hover:to-orange-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-amber-600 hover:scale-105 active:scale-95"
                            title="Align Center Vertically"
                        >
                            <AlignVerticalJustifyCenter className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {/* Transform Tools */}
            {(onFlipHorizontal || onFlipVertical || onRotate) && (
                <div className="flex items-center gap-1 pr-3 border-r-2 border-slate-200">
                    {onFlipHorizontal && (
                        <button
                            onClick={onFlipHorizontal}
                            disabled={!hasSelection}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-teal-600 hover:scale-105 active:scale-95"
                            title="Flip Horizontal"
                        >
                            <FlipHorizontal className="w-5 h-5" />
                        </button>
                    )}
                    {onFlipVertical && (
                        <button
                            onClick={onFlipVertical}
                            disabled={!hasSelection}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-teal-600 hover:scale-105 active:scale-95"
                            title="Flip Vertical"
                        >
                            <FlipVertical className="w-5 h-5" />
                        </button>
                    )}
                    {onRotate && (
                        <button
                            onClick={onRotate}
                            disabled={!hasSelection}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-teal-50 hover:to-cyan-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-teal-600 hover:scale-105 active:scale-95"
                            title="Rotate 90°"
                        >
                            <RotateCw className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {/* Layer Controls */}
            {(onBringToFront || onSendToBack || onLockElement || onUnlockElement) && (
                <div className="flex items-center gap-1 pr-3 border-r-2 border-slate-200">
                    {onBringToFront && (
                        <button
                            onClick={onBringToFront}
                            disabled={!hasSelection}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-indigo-600 hover:scale-105 active:scale-95"
                            title="Bring to Front"
                        >
                            <Layers className="w-5 h-5" />
                        </button>
                    )}
                    {onSendToBack && (
                        <button
                            onClick={onSendToBack}
                            disabled={!hasSelection}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-indigo-600 hover:scale-105 active:scale-95"
                            title="Send to Back"
                        >
                            <Layers className="w-5 h-5 rotate-180" />
                        </button>
                    )}
                    {(onLockElement || onUnlockElement) && (
                        <button
                            onClick={isLocked ? onUnlockElement : onLockElement}
                            disabled={!hasSelection}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50 hover:shadow-lg rounded-xl transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed text-slate-700 hover:text-indigo-600 hover:scale-105 active:scale-95"
                            title={isLocked ? "Unlock Element" : "Lock Element"}
                        >
                            {isLocked ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            )}

            {/* View Controls */}
            {(onToggleGrid || onToggleGuides) && (
                <div className="flex items-center gap-1 pr-3 border-r-2 border-slate-200">
                    {onToggleGrid && (
                        <button
                            onClick={onToggleGrid}
                            className={`p-2.5 hover:shadow-lg rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${showGrid
                                ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700'
                                : 'hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 text-slate-700 hover:text-slate-900'
                                }`}
                            title="Toggle Grid"
                        >
                            <Grid3x3 className="w-5 h-5" />
                        </button>
                    )}
                    {onToggleGuides && (
                        <button
                            onClick={onToggleGuides}
                            className={`p-2.5 hover:shadow-lg rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 ${showGuides
                                ? 'bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-700'
                                : 'hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 text-slate-700 hover:text-slate-900'
                                }`}
                            title="Toggle Guides"
                        >
                            {showGuides ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                        </button>
                    )}
                </div>
            )}

            {/* Zoom Controls */}
            {(onZoomIn || onZoomOut || onResetZoom) && (
                <div className="flex items-center gap-1 pr-3 border-r-2 border-slate-200">
                    {onZoomOut && (
                        <button
                            onClick={onZoomOut}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 hover:shadow-lg rounded-xl transition-all duration-200 text-slate-700 hover:text-slate-900 hover:scale-105 active:scale-95"
                            title="Zoom Out"
                        >
                            <ZoomOut className="w-5 h-5" />
                        </button>
                    )}
                    <div className="px-2 py-1 bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg text-xs font-semibold text-slate-700 min-w-[60px] text-center">
                        {zoomLevel}%
                    </div>
                    {onResetZoom && (
                        <button
                            onClick={onResetZoom}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 hover:shadow-lg rounded-xl transition-all duration-200 text-slate-700 hover:text-slate-900 hover:scale-105 active:scale-95"
                            title="Reset Zoom"
                        >
                            <Maximize2 className="w-5 h-5" />
                        </button>
                    )}
                    {onZoomIn && (
                        <button
                            onClick={onZoomIn}
                            className="p-2.5 hover:bg-gradient-to-br hover:from-slate-50 hover:to-slate-100 hover:shadow-lg rounded-xl transition-all duration-200 text-slate-700 hover:text-slate-900 hover:scale-105 active:scale-95"
                            title="Zoom In"
                        >
                            <ZoomIn className="w-5 h-5" />
                        </button>
                    )}
                </div>
            )}

            {/* Templates */}
            {onTemplateSelect && (
                <div className="flex items-center gap-1 pr-3 border-r-2 border-slate-200">
                    <TemplateSelectorLazy
                        productCount={productCount}
                        onSelectTemplate={onTemplateSelect}
                    />
                </div>
            )}

            {/* Save/Publish */}
            <div className="flex items-center gap-2 ml-auto">
                {onSave && (
                    <button
                        onClick={onSave}
                        disabled={isSaving}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed font-semibold hover:scale-105 active:scale-95"
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                )}
                {onPublish && (
                    <button
                        onClick={onPublish}
                        className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white rounded-xl hover:from-green-700 hover:via-emerald-700 hover:to-teal-700 transition-all duration-200 shadow-lg hover:shadow-xl font-semibold hover:scale-105 active:scale-95"
                    >
                        <Upload className="w-4 h-4" />
                        Publish
                    </button>
                )}
            </div>
        </div>
    );
}
