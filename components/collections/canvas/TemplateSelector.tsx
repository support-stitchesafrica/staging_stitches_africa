'use client';

import React, { useState } from 'react';
import { Template } from '@/types/collections';
import { TEMPLATES, getTemplatesByProductCount } from '@/lib/collections/templates';
import
    {
        Dialog,
        DialogContent,
        DialogDescription,
        DialogHeader,
        DialogTitle,
        DialogTrigger,
    } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { LayoutTemplate, Check } from 'lucide-react';

interface TemplateSelectorProps
{
    productCount: number;
    onSelectTemplate: (template: Template) => void;
    disabled?: boolean;
}

export function TemplateSelector({
    productCount,
    onSelectTemplate,
    disabled = false,
}: TemplateSelectorProps)
{
    const [open, setOpen] = useState(false);
    const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);

    // Filter templates based on available product count
    const availableTemplates = getTemplatesByProductCount(productCount);
    const allTemplates = TEMPLATES;

    const handleSelectTemplate = (template: Template) =>
    {
        setSelectedTemplateId(template.id);
        onSelectTemplate(template);
        setOpen(false);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    disabled={disabled || productCount === 0}
                    className="gap-2"
                >
                    <LayoutTemplate className="h-4 w-4" />
                    Templates
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle>Choose a Template</DialogTitle>
                    <DialogDescription>
                        Select a pre-designed layout for your collection. Templates with more product
                        slots than you have products will be disabled.
                    </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[500px] pr-4">
                    <div className="grid grid-cols-2 gap-4">
                        {allTemplates.map((template) =>
                        {
                            const isAvailable = template.productSlots <= productCount;
                            const isSelected = selectedTemplateId === template.id;

                            return (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    isAvailable={isAvailable}
                                    isSelected={isSelected}
                                    onSelect={() => handleSelectTemplate(template)}
                                />
                            );
                        })}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

interface TemplateCardProps
{
    template: Template;
    isAvailable: boolean;
    isSelected: boolean;
    onSelect: () => void;
}

function TemplateCard({
    template,
    isAvailable,
    isSelected,
    onSelect,
}: TemplateCardProps)
{
    return (
        <button
            onClick={onSelect}
            disabled={!isAvailable}
            className={`
        relative group rounded-lg border-2 p-4 text-left transition-all
        ${isAvailable
                    ? 'hover:border-primary hover:shadow-md cursor-pointer'
                    : 'opacity-50 cursor-not-allowed'
                }
        ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200'}
      `}
        >
            {/* Template Preview */}
            <div className="relative aspect-[3/2] mb-3 bg-gray-100 rounded overflow-hidden">
                <TemplatePreview template={template} />

                {/* Selected indicator */}
                {isSelected && (
                    <div className="absolute top-2 right-2 bg-primary text-white rounded-full p-1">
                        <Check className="h-4 w-4" />
                    </div>
                )}

                {/* Unavailable overlay */}
                {!isAvailable && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                        <span className="text-white text-sm font-medium">
                            Needs {template.productSlots} products
                        </span>
                    </div>
                )}
            </div>

            {/* Template Info */}
            <div>
                <h3 className="font-semibold text-sm mb-1">{template.name}</h3>
                <p className="text-xs text-gray-500">
                    {template.productSlots} product{template.productSlots !== 1 ? 's' : ''}
                </p>
            </div>
        </button>
    );
}

interface TemplatePreviewProps
{
    template: Template;
}

function TemplatePreview({ template }: TemplatePreviewProps)
{
    const { layout } = template;
    const { dimensions, backgroundColor, elements } = layout;

    // Calculate scale to fit preview
    const previewWidth = 300;
    const scale = previewWidth / dimensions.width;
    const previewHeight = dimensions.height * scale;

    return (
        <div
            className="w-full h-full relative"
            style={{
                backgroundColor,
            }}
        >
            <svg
                viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
                className="w-full h-full"
                preserveAspectRatio="xMidYMid meet"
            >
                {elements.map((element) =>
                {
                    if (element.type === 'image')
                    {
                        return (
                            <rect
                                key={element.id}
                                x={element.position.x}
                                y={element.position.y}
                                width={element.size.width}
                                height={element.size.height}
                                fill="#d1d5db"
                                stroke="#9ca3af"
                                strokeWidth="2"
                                rx="4"
                            />
                        );
                    } else if (element.type === 'text')
                    {
                        return (
                            <text
                                key={element.id}
                                x={element.position.x}
                                y={element.position.y + (element.fontSize || 16)}
                                fontSize={element.fontSize || 16}
                                fontFamily={element.fontFamily || 'Arial'}
                                fontWeight={element.fontWeight || 'normal'}
                                fill={element.color || '#000000'}
                            >
                                {element.text || 'Text'}
                            </text>
                        );
                    }
                    return null;
                })}
            </svg>
        </div>
    );
}
