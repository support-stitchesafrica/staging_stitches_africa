'use client';

import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import { CanvasState, CanvasElement } from '@/types/collections';

// Type definitions for fabric
type FabricCanvas = any;
type FabricObject = any;
type FabricImage = any;
type FabricIText = any;
type FabricText = any;
type FabricEvent = any;

// State to hold dynamically imported fabric
let fabric: any = null;

interface CanvasEditorProps
{
    collectionId: string;
    initialState?: CanvasState;
    onStateChange?: (state: CanvasState) => void;
    onSave?: (state: CanvasState) => Promise<void>;
    canvasWidth?: number;
    canvasHeight?: number;
}

export interface CanvasEditorRef
{
    addProductImage: (imageUrl: string, productId?: string, productSource?: 'marketplace' | 'collection') => void;
    addTextElement: (text?: string) => void;
    getCanvasState: () => CanvasState;
    deleteSelected: () => void;
    duplicateSelected: () => void;
    hasSelection: () => boolean;
    getSelectedElement: () => fabric.Object | null;
    applyTemplate: (templateState: CanvasState, productImages: Array<{ imageUrl: string; productId: string; productSource?: 'marketplace' | 'collection' }>) => void;
    clearCanvas: () => void;
    exportToImage: (format?: 'png' | 'jpeg', quality?: number) => string;
    exportToBlob: (format?: 'png' | 'jpeg', quality?: number) => Promise<Blob | null>;
    setBackgroundColor: (color: string) => void;
    lockElement: () => void;
    unlockElement: () => void;
    isElementLocked: () => boolean;
    alignLeft: () => void;
    alignCenter: () => void;
    alignRight: () => void;
    alignTop: () => void;
    alignMiddle: () => void;
    alignBottom: () => void;
    flipHorizontal: () => void;
    flipVertical: () => void;
    rotate90: () => void;
    bringToFront: () => void;
    sendToBack: () => void;
}

const DEFAULT_CANVAS_WIDTH = 1200;
const DEFAULT_CANVAS_HEIGHT = 800;

export const CanvasEditor = forwardRef<CanvasEditorRef, CanvasEditorProps>(({
    collectionId,
    initialState,
    onStateChange,
    onSave,
    canvasWidth = DEFAULT_CANVAS_WIDTH,
    canvasHeight = DEFAULT_CANVAS_HEIGHT,
}, ref) =>
{
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [hasActiveSelection, setHasActiveSelection] = useState(false);
    const [currentDimensions, setCurrentDimensions] = useState({ width: canvasWidth, height: canvasHeight });
    const [displayScale, setDisplayScale] = useState(1);

    // Calculate display scale to fit canvas in viewport while maintaining aspect ratio
    useEffect(() =>
    {
        const calculateScale = () =>
        {
            if (typeof window === 'undefined')
            {
                setDisplayScale(1);
                return;
            }

            // Maximum display dimensions (viewport constraints)
            // Use 70% of viewport width and 60% of viewport height, with max limits
            const maxDisplayWidth = Math.min(window.innerWidth * 0.7, 1200);
            const maxDisplayHeight = Math.min(window.innerHeight * 0.6, 800);

            // Calculate scale to fit both width and height constraints while maintaining aspect ratio
            const scaleX = maxDisplayWidth / canvasWidth;
            const scaleY = maxDisplayHeight / canvasHeight;
            // Use the smaller scale to ensure it fits in both dimensions
            const scale = Math.min(scaleX, scaleY);

            setDisplayScale(scale);
        };

        calculateScale();

        // Recalculate on window resize
        window.addEventListener('resize', calculateScale);
        return () => window.removeEventListener('resize', calculateScale);
    }, [canvasWidth, canvasHeight]);

    // Update canvas dimensions when props change
    useEffect(() =>
    {
        if (fabricCanvasRef.current && (canvasWidth !== currentDimensions.width || canvasHeight !== currentDimensions.height))
        {
            fabricCanvasRef.current.setDimensions({
                width: canvasWidth,
                height: canvasHeight,
            });
            setCurrentDimensions({ width: canvasWidth, height: canvasHeight });
            fabricCanvasRef.current.renderAll();

            // Trigger state change
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    }, [canvasWidth, canvasHeight]);

    // Initialize Fabric.js canvas
    useEffect(() =>
    {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        // Create Fabric.js canvas instance
        const canvas = new fabric.Canvas(canvasRef.current, {
            width: canvasWidth,
            height: canvasHeight,
            backgroundColor: initialState?.backgroundColor || '#ffffff',
            selection: true,
            preserveObjectStacking: true,
            renderOnAddRemove: true,
            enableRetinaScaling: true,
        });

        fabricCanvasRef.current = canvas;
        setIsInitialized(true);

        // Initial render
        canvas.renderAll();

        // Enable dragging for all objects
        canvas.on('object:moving', (e: FabricEvent) =>
        {
            const obj = e.target;
            if (!obj) return;

            // Add visual feedback during move
            obj.set({
                opacity: 0.8,
            });

            // Keep objects within canvas bounds
            const bound = obj.getBoundingRect();

            if (bound.left < 0)
            {
                obj.left = Math.max(obj.left || 0, obj.left! - bound.left);
            }
            if (bound.top < 0)
            {
                obj.top = Math.max(obj.top || 0, obj.top! - bound.top);
            }
            if (bound.left + bound.width > canvasWidth)
            {
                obj.left = Math.min(obj.left || 0, canvasWidth - bound.width + (obj.left! - bound.left));
            }
            if (bound.top + bound.height > canvasHeight)
            {
                obj.top = Math.min(obj.top || 0, canvasHeight - bound.height + (obj.top! - bound.top));
            }

            canvas.renderAll();
        });

        // Update state when object is moved
        canvas.on('object:moved', (e: FabricEvent) =>
        {
            const obj = e.target;
            if (obj)
            {
                // Reset opacity after move
                obj.set({
                    opacity: 1,
                });
                canvas.renderAll();
            }

            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        });

        // Enable scaling with aspect ratio lock for images
        canvas.on('object:scaling', (e: any) =>
        {
            const obj = e.target;
            if (!obj) return;

            // Add visual feedback during scaling
            obj.set({
                opacity: 0.8,
            });

            // For images, maintain aspect ratio
            if (obj.type === 'image')
            {
                const img = obj as fabric.Image;

                // Lock aspect ratio by using uniform scaling
                if (img.scaleX !== img.scaleY)
                {
                    const scale = Math.max(img.scaleX || 1, img.scaleY || 1);
                    img.scaleX = scale;
                    img.scaleY = scale;
                }
            }

            // Keep objects within canvas bounds during resize
            const bound = obj.getBoundingRect();

            if (bound.left < 0 || bound.top < 0 ||
                bound.left + bound.width > canvasWidth ||
                bound.top + bound.height > canvasHeight)
            {
                // Revert to previous scale if out of bounds
                obj.scaleX = (obj as any).lastScaleX || obj.scaleX;
                obj.scaleY = (obj as any).lastScaleY || obj.scaleY;
            }
            else
            {
                // Store current scale for potential revert
                (obj as any).lastScaleX = obj.scaleX;
                (obj as any).lastScaleY = obj.scaleY;
            }

            canvas.renderAll();
        });

        // Update state when object is scaled
        canvas.on('object:scaled', (e: any) =>
        {
            const obj = e.target;
            if (obj)
            {
                // Reset opacity after scaling
                obj.set({
                    opacity: 1,
                });
                canvas.renderAll();
            }

            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        });

        // Update state when object is rotated
        canvas.on('object:rotated', (e: any) =>
        {
            const obj = e.target;
            if (obj)
            {
                canvas.renderAll();
            }

            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        });

        // Add visual feedback during rotation
        canvas.on('object:rotating', (e: any) =>
        {
            const obj = e.target;
            if (obj)
            {
                obj.set({
                    opacity: 0.8,
                });
                canvas.renderAll();
            }
        });

        // Track selection changes
        canvas.on('selection:created', (e: any) =>
        {
            setHasActiveSelection(true);
            canvas.renderAll();
        });

        canvas.on('selection:updated', (e: any) =>
        {
            setHasActiveSelection(true);
            canvas.renderAll();
        });

        canvas.on('selection:cleared', () =>
        {
            setHasActiveSelection(false);
            canvas.renderAll();
        });

        // Handle mouse events for better interaction feedback
        canvas.on('mouse:over', (e: any) =>
        {
            if (e.target && e.target.selectable)
            {
                // Add hover effect
                e.target.set({
                    borderColor: '#3b82f6',
                    cornerColor: '#3b82f6',
                });
                canvas.renderAll();

                // Change cursor to indicate interactivity
                canvas.defaultCursor = 'pointer';
            }
        });

        canvas.on('mouse:out', (e: any) =>
        {
            if (e.target && e.target.selectable)
            {
                // Remove hover effect if not selected
                if (canvas.getActiveObject() !== e.target)
                {
                    e.target.set({
                        borderColor: '#2563eb',
                        cornerColor: '#2563eb',
                    });
                }
                canvas.renderAll();

                // Reset cursor
                canvas.defaultCursor = 'default';
            }
        });

        // Handle text editing
        canvas.on('text:changed', () =>
        {
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        });

        // Handle text editing mode
        canvas.on('text:editing:entered', () =>
        {
            canvas.renderAll();
        });

        canvas.on('text:editing:exited', () =>
        {
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        });

        // Enable double-click to edit text
        canvas.on('mouse:dblclick', (e: any) =>
        {
            const target = e.target;
            if (target && (target.type === 'i-text' || target.type === 'text'))
            {
                const textObj = target as fabric.IText;
                textObj.enterEditing();
                textObj.selectAll();
                canvas.renderAll();
            }
        });

        // Load initial state if provided
        if (initialState && initialState.elements.length > 0)
        {
            loadCanvasState(canvas, initialState);
        }

        // Cleanup on unmount
        return () =>
        {
            canvas.dispose();
            fabricCanvasRef.current = null;
        };
    }, []);

    // Load canvas state from data
    const loadCanvasState = (canvas: fabric.Canvas, state: CanvasState) =>
    {
        canvas.clear();
        canvas.backgroundColor = state.backgroundColor;

        state.elements.forEach((element) =>
        {
            if (element.type === 'image' && element.imageUrl)
            {
                fabric.Image.fromURL(
                    element.imageUrl,
                    (img: fabric.Image) =>
                    {
                        // Store element ID, product ID, and product source for tracking
                        (img as any).elementId = element.id;
                        (img as any).productId = element.productId;
                        (img as any).productSource = element.productSource;

                        img.set({
                            left: element.position.x,
                            top: element.position.y,
                            scaleX: element.size.width / (img.width || 1),
                            scaleY: element.size.height / (img.height || 1),
                            angle: element.rotation,
                            selectable: true,
                            hasControls: true,
                            hasBorders: true,
                            cornerSize: 12,
                            cornerColor: '#2563eb',
                            cornerStyle: 'circle',
                            borderColor: '#2563eb',
                            borderScaleFactor: 2,
                            transparentCorners: false,
                            lockUniScaling: false,
                        });

                        // Show corner controls for resizing and rotation
                        img.setControlsVisibility({
                            mt: false,
                            mb: false,
                            ml: false,
                            mr: false,
                            bl: true,
                            br: true,
                            tl: true,
                            tr: true,
                            mtr: true, // rotation control
                        });

                        canvas.add(img);
                        canvas.renderAll();
                    },
                    { crossOrigin: 'anonymous' }
                );
            } else if (element.type === 'text' && element.text)
            {
                const text = new fabric.IText(element.text, {
                    left: element.position.x,
                    top: element.position.y,
                    fontSize: element.fontSize || 24,
                    fontFamily: element.fontFamily || 'Arial',
                    fill: element.color || '#000000',
                    fontWeight: element.fontWeight || 'normal',
                    angle: element.rotation,
                    selectable: true,
                    hasControls: true,
                    hasBorders: true,
                    cornerSize: 12,
                    cornerColor: '#2563eb',
                    cornerStyle: 'circle',
                    borderColor: '#2563eb',
                    borderScaleFactor: 2,
                    transparentCorners: false,
                    editable: true,
                    lockUniScaling: false,
                });

                // Store element ID for tracking
                (text as any).elementId = element.id;

                canvas.add(text);
            }
        });

        canvas.renderAll();
    };

    // Add product image to canvas
    const addProductImage = (imageUrl: string, productId?: string, productSource?: 'marketplace' | 'collection') =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        fabric.Image.fromURL(
            imageUrl,
            (img: fabric.Image) =>
            {
                const elementId = `element-${Date.now()}-${Math.random()}`;

                // Store element ID, product ID, and product source
                (img as any).elementId = elementId;
                (img as any).productId = productId;
                (img as any).productSource = productSource;

                // Position in center of canvas
                const scale = Math.min(200 / (img.width || 1), 200 / (img.height || 1));

                img.set({
                    left: (canvasWidth - (img.width || 0) * scale) / 2,
                    top: (canvasHeight - (img.height || 0) * scale) / 2,
                    scaleX: scale,
                    scaleY: scale,
                    selectable: true,
                    hasControls: true,
                    hasBorders: true,
                    cornerSize: 12,
                    cornerColor: '#2563eb',
                    cornerStyle: 'circle',
                    borderColor: '#2563eb',
                    borderScaleFactor: 2,
                    transparentCorners: false,
                    lockUniScaling: false,
                });

                // Show corner controls for resizing and rotation
                img.setControlsVisibility({
                    mt: false,
                    mb: false,
                    ml: false,
                    mr: false,
                    bl: true,
                    br: true,
                    tl: true,
                    tr: true,
                    mtr: true, // rotation control
                });

                canvas.add(img);
                canvas.setActiveObject(img);
                canvas.renderAll();

                // Trigger state change
                if (onStateChange)
                {
                    const state = getCanvasState();
                    onStateChange(state);
                }
            },
            { crossOrigin: 'anonymous' }
        );
    };

    // Get current canvas state
    const getCanvasState = (): CanvasState =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas)
        {
            return {
                elements: [],
                backgroundColor: '#ffffff',
                dimensions: { width: canvasWidth, height: canvasHeight },
            };
        }

        const elements: CanvasElement[] = [];
        const objects = canvas.getObjects();

        objects.forEach((obj, index) =>
        {
            const elementId = (obj as any).elementId || `element-${Date.now()}-${index}`;

            if (obj.type === 'image')
            {
                const img = obj as fabric.Image;
                elements.push({
                    id: elementId,
                    type: 'image',
                    position: { x: img.left || 0, y: img.top || 0 },
                    size: {
                        width: (img.width || 0) * (img.scaleX || 1),
                        height: (img.height || 0) * (img.scaleY || 1),
                    },
                    rotation: img.angle || 0,
                    zIndex: index,
                    imageUrl: (img as any)._originalElement?.src || '',
                    productId: (img as any).productId,
                    productSource: (img as any).productSource,
                });
            } else if (obj.type === 'text' || obj.type === 'i-text')
            {
                const text = obj as fabric.Text;
                elements.push({
                    id: elementId,
                    type: 'text',
                    position: { x: text.left || 0, y: text.top || 0 },
                    size: {
                        width: text.width || 0,
                        height: text.height || 0,
                    },
                    rotation: text.angle || 0,
                    zIndex: index,
                    text: text.text || '',
                    fontSize: text.fontSize || 24,
                    fontFamily: text.fontFamily || 'Arial',
                    color: text.fill as string || '#000000',
                    fontWeight: text.fontWeight as string || 'normal',
                });
            }
        });

        return {
            elements,
            backgroundColor: canvas.backgroundColor as string || '#ffffff',
            dimensions: { width: canvasWidth, height: canvasHeight },
        };
    };

    // Handle save
    const handleSave = async () =>
    {
        if (!onSave) return;

        setIsSaving(true);
        try
        {
            const state = getCanvasState();
            await onSave(state);
        } catch (error)
        {
            console.error('Failed to save canvas:', error);
        } finally
        {
            setIsSaving(false);
        }
    };

    // Delete selected object
    const deleteSelected = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            canvas.remove(activeObject);
            canvas.renderAll();

            // Trigger state change
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Duplicate selected object
    const duplicateSelected = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            activeObject.clone((cloned: fabric.Object) =>
            {
                const elementId = `element-${Date.now()}-${Math.random()}`;
                (cloned as any).elementId = elementId;

                // Copy product ID if it's an image
                if ((activeObject as any).productId)
                {
                    (cloned as any).productId = (activeObject as any).productId;
                }

                cloned.set({
                    left: (cloned.left || 0) + 20,
                    top: (cloned.top || 0) + 20,
                });

                canvas.add(cloned);
                canvas.setActiveObject(cloned);
                canvas.renderAll();

                // Trigger state change
                if (onStateChange)
                {
                    const state = getCanvasState();
                    onStateChange(state);
                }
            });
        }
    };

    // Add text element to canvas
    const addTextElement = (text: string = 'Double-click to edit') =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const elementId = `element-${Date.now()}-${Math.random()}`;

        const textObj = new fabric.IText(text, {
            left: canvasWidth / 2 - 100,
            top: canvasHeight / 2 - 20,
            fontSize: 32,
            fontFamily: 'Arial',
            fill: '#000000',
            fontWeight: 'normal',
            selectable: true,
            hasControls: true,
            hasBorders: true,
            cornerSize: 12,
            cornerColor: '#2563eb',
            cornerStyle: 'circle',
            borderColor: '#2563eb',
            borderScaleFactor: 2,
            transparentCorners: false,
            editable: true,
            lockUniScaling: false,
        });

        // Store element ID for tracking
        (textObj as any).elementId = elementId;

        canvas.add(textObj);
        canvas.setActiveObject(textObj);
        canvas.renderAll();

        // Trigger state change
        if (onStateChange)
        {
            const state = getCanvasState();
            onStateChange(state);
        }
    };

    // Check if there's a selection
    const hasSelection = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return false;
        return !!canvas.getActiveObject();
    };

    // Get selected element
    const getSelectedElement = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return null;
        return canvas.getActiveObject();
    };

    // Apply template to canvas
    const applyTemplate = (
        templateState: CanvasState,
        productImages: Array<{ imageUrl: string; productId: string; productSource?: 'marketplace' | 'collection' }>
    ) =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Clear existing canvas
        canvas.clear();
        canvas.backgroundColor = templateState.backgroundColor;

        // Update canvas dimensions to match template
        if (templateState.dimensions)
        {
            canvas.setDimensions({
                width: templateState.dimensions.width,
                height: templateState.dimensions.height,
            });
            setCurrentDimensions({
                width: templateState.dimensions.width,
                height: templateState.dimensions.height,
            });
        }

        // Track product image index
        let productIndex = 0;

        // Add elements from template
        templateState.elements.forEach((element) =>
        {
            if (element.type === 'image')
            {
                // Replace placeholder with actual product image
                if (productIndex < productImages.length)
                {
                    const product = productImages[productIndex];
                    productIndex++;

                    fabric.Image.fromURL(
                        product.imageUrl,
                        (img: fabric.Image) =>
                        {
                            // Store element ID, product ID, and product source
                            (img as any).elementId = element.id;
                            (img as any).productId = product.productId;
                            (img as any).productSource = product.productSource;

                            // Calculate scale to fit image into placeholder (contain mode)
                            // This ensures the entire image fits within the slot while maintaining aspect ratio
                            const imgWidth = img.width || 1;
                            const imgHeight = img.height || 1;
                            const targetWidth = element.size.width;
                            const targetHeight = element.size.height;

                            // Use the smaller scale to ensure entire image fits within the placeholder
                            const scaleX = targetWidth / imgWidth;
                            const scaleY = targetHeight / imgHeight;
                            const scale = Math.min(scaleX, scaleY);

                            // Calculate position to center the image in the placeholder
                            const scaledWidth = imgWidth * scale;
                            const scaledHeight = imgHeight * scale;
                            const left = element.position.x + (targetWidth - scaledWidth) / 2;
                            const top = element.position.y + (targetHeight - scaledHeight) / 2;

                            img.set({
                                left: left,
                                top: top,
                                scaleX: scale,
                                scaleY: scale,
                                angle: element.rotation,
                                selectable: true,
                                hasControls: true,
                                hasBorders: true,
                                cornerSize: 12,
                                cornerColor: '#2563eb',
                                cornerStyle: 'circle',
                                borderColor: '#2563eb',
                                borderScaleFactor: 2,
                                transparentCorners: false,
                                lockUniScaling: false,
                            });

                            // Show corner controls for resizing and rotation
                            img.setControlsVisibility({
                                mt: false,
                                mb: false,
                                ml: false,
                                mr: false,
                                bl: true,
                                br: true,
                                tl: true,
                                tr: true,
                                mtr: true, // rotation control
                            });

                            canvas.add(img);
                            canvas.renderAll();

                            // Trigger state change after last image loads
                            if (productIndex === productImages.length && onStateChange)
                            {
                                const state = getCanvasState();
                                onStateChange(state);
                            }
                        },
                        { crossOrigin: 'anonymous' }
                    );
                }
            } else if (element.type === 'text' && element.text)
            {
                const text = new fabric.IText(element.text, {
                    left: element.position.x,
                    top: element.position.y,
                    fontSize: element.fontSize || 24,
                    fontFamily: element.fontFamily || 'Arial',
                    fill: element.color || '#000000',
                    fontWeight: element.fontWeight || 'normal',
                    angle: element.rotation,
                    selectable: true,
                    hasControls: true,
                    hasBorders: true,
                    cornerSize: 12,
                    cornerColor: '#2563eb',
                    cornerStyle: 'circle',
                    borderColor: '#2563eb',
                    borderScaleFactor: 2,
                    transparentCorners: false,
                    editable: true,
                    lockUniScaling: false,
                });

                // Store element ID for tracking
                (text as any).elementId = element.id;

                canvas.add(text);
            }
        });

        canvas.renderAll();

        // Trigger state change
        if (onStateChange)
        {
            const state = getCanvasState();
            onStateChange(state);
        }
    };

    // Clear canvas
    const clearCanvas = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        canvas.clear();
        canvas.backgroundColor = '#ffffff';
        canvas.renderAll();

        // Trigger state change
        if (onStateChange)
        {
            const state = getCanvasState();
            onStateChange(state);
        }
    };

    // Set background color
    const setBackgroundColor = (color: string) =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        canvas.backgroundColor = color;
        canvas.renderAll();

        // Trigger state change
        if (onStateChange)
        {
            const state = getCanvasState();
            onStateChange(state);
        }
    };

    // Export canvas to image (data URL)
    const exportToImage = (format: 'png' | 'jpeg' = 'png', quality: number = 0.8): string =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return '';

        // Deselect all objects before export
        canvas.discardActiveObject();
        canvas.renderAll();

        // Export to data URL
        const dataURL = canvas.toDataURL({
            format: format,
            quality: quality,
            multiplier: 1, // Use 1 for original size, or adjust for different resolutions
        });

        return dataURL;
    };

    // Export canvas to Blob for upload
    const exportToBlob = async (format: 'png' | 'jpeg' = 'png', quality: number = 0.8): Promise<Blob | null> =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return null;

        // Deselect all objects before export
        canvas.discardActiveObject();
        canvas.renderAll();

        return new Promise((resolve) =>
        {
            const dataURL = canvas.toDataURL({
                format: format,
                quality: quality,
                multiplier: 1,
            });

            // Convert data URL to Blob
            fetch(dataURL)
                .then(res => res.blob())
                .then(blob => resolve(blob))
                .catch(err =>
                {
                    console.error('Error converting canvas to blob:', err);
                    resolve(null);
                });
        });
    };

    // Lock element
    const lockElement = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            activeObject.set({
                lockMovementX: true,
                lockMovementY: true,
                lockRotation: true,
                lockScalingX: true,
                lockScalingY: true,
                selectable: true,
                hasControls: false,
            });
            canvas.renderAll();
        }
    };

    // Unlock element
    const unlockElement = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            activeObject.set({
                lockMovementX: false,
                lockMovementY: false,
                lockRotation: false,
                lockScalingX: false,
                lockScalingY: false,
                selectable: true,
                hasControls: true,
            });
            canvas.renderAll();
        }
    };

    // Check if element is locked
    const isElementLocked = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return false;

        const activeObject = canvas.getActiveObject();
        if (!activeObject) return false;

        return activeObject.lockMovementX === true;
    };

    // Align left
    const alignLeft = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            activeObject.set({ left: 0 });
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Align center horizontally
    const alignCenter = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            activeObject.set({ left: (canvasWidth - (activeObject.width || 0) * (activeObject.scaleX || 1)) / 2 });
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Align right
    const alignRight = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            activeObject.set({ left: canvasWidth - (activeObject.width || 0) * (activeObject.scaleX || 1) });
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Align top
    const alignTop = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            activeObject.set({ top: 0 });
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Align middle vertically
    const alignMiddle = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            activeObject.set({ top: (canvasHeight - (activeObject.height || 0) * (activeObject.scaleY || 1)) / 2 });
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Align bottom
    const alignBottom = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            activeObject.set({ top: canvasHeight - (activeObject.height || 0) * (activeObject.scaleY || 1) });
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Flip horizontal
    const flipHorizontal = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            activeObject.set({ flipX: !activeObject.flipX });
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Flip vertical
    const flipVertical = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            activeObject.set({ flipY: !activeObject.flipY });
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Rotate 90 degrees
    const rotate90 = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            const currentAngle = activeObject.angle || 0;
            activeObject.set({ angle: (currentAngle + 90) % 360 });
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Bring to front
    const bringToFront = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            canvas.bringToFront(activeObject);
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Send to back
    const sendToBack = () =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const activeObject = canvas.getActiveObject();
        if (activeObject)
        {
            canvas.sendToBack(activeObject);
            canvas.renderAll();
            if (onStateChange)
            {
                const state = getCanvasState();
                onStateChange(state);
            }
        }
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        addProductImage,
        addTextElement,
        getCanvasState,
        deleteSelected,
        duplicateSelected,
        hasSelection,
        getSelectedElement,
        applyTemplate,
        clearCanvas,
        exportToImage,
        exportToBlob,
        setBackgroundColor,
        lockElement,
        unlockElement,
        isElementLocked,
        alignLeft,
        alignCenter,
        alignRight,
        alignTop,
        alignMiddle,
        alignBottom,
        flipHorizontal,
        flipVertical,
        rotate90,
        bringToFront,
        sendToBack,
    }));

    // Listen for canvas changes
    useEffect(() =>
    {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !onStateChange) return;

        const handleChange = () =>
        {
            const state = getCanvasState();
            onStateChange(state);
        };

        canvas.on('object:modified', handleChange);
        canvas.on('object:added', handleChange);
        canvas.on('object:removed', handleChange);

        return () =>
        {
            canvas.off('object:modified', handleChange);
            canvas.off('object:added', handleChange);
            canvas.off('object:removed', handleChange);
        };
    }, [onStateChange]);

    return (
        <div className="flex flex-col gap-4 p-6 bg-gradient-to-br from-slate-50 via-white to-slate-50 rounded-2xl w-full max-w-full shadow-xl border-2 border-slate-200">
            {/* Canvas Container - contained within section */}
            <div className="w-full flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-50 rounded-xl p-6 border-2 border-slate-200 shadow-inner">
                <div
                    className="border-4 border-slate-300 shadow-2xl rounded-xl bg-white overflow-hidden relative"
                    style={{
                        width: `${currentDimensions.width * displayScale}px`,
                        height: `${currentDimensions.height * displayScale}px`,
                        maxWidth: '100%',
                        maxHeight: '70vh',
                        aspectRatio: `${currentDimensions.width} / ${currentDimensions.height}`,
                    }}
                >
                    {/* Canvas corner indicators */}
                    <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-blue-500 rounded-tl-lg z-10"></div>
                    <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-blue-500 rounded-tr-lg z-10"></div>
                    <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-blue-500 rounded-bl-lg z-10"></div>
                    <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-blue-500 rounded-br-lg z-10"></div>

                    <canvas
                        ref={canvasRef}
                        width={currentDimensions.width}
                        height={currentDimensions.height}
                        style={{
                            display: 'block',
                            width: '100%',
                            height: '100%',
                            objectFit: 'contain',
                        }}
                    />
                </div>
            </div>

            {/* Canvas Info and Save Button */}
            <div className="flex items-center justify-between px-3 py-2 bg-gradient-to-r from-slate-100 to-slate-50 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="text-xs text-slate-600 font-semibold bg-white px-3 py-1.5 rounded-lg shadow-sm border border-slate-200">
                        <span className="text-slate-400">Canvas:</span> {currentDimensions.width} × {currentDimensions.height}px
                    </div>
                    {hasActiveSelection && (
                        <div className="text-xs text-blue-600 font-semibold bg-blue-50 px-3 py-1.5 rounded-lg shadow-sm border border-blue-200 animate-pulse">
                            Element Selected
                        </div>
                    )}
                </div>

                {onSave && (
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-5 py-2 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 text-white text-sm rounded-xl hover:from-blue-700 hover:via-blue-800 hover:to-indigo-800 disabled:opacity-50 shadow-lg hover:shadow-xl transition-all duration-200 font-semibold hover:scale-105 active:scale-95"
                    >
                        {isSaving ? 'Saving...' : 'Quick Save'}
                    </button>
                )}
            </div>
        </div>
    );
});

CanvasEditor.displayName = 'CanvasEditor';
