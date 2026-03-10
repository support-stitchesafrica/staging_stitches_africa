"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import
{
	CanvasEditor,
	CanvasEditorRef,
} from "@/components/collections/canvas/CanvasEditor";
import { CanvasToolbar } from "@/components/collections/canvas/CanvasToolbar";
import { TextEditor } from "@/components/collections/canvas/TextEditor";
import { PublishDialog } from "@/components/collections/PublishDialog";
import { ProductImageSelector } from "@/components/collections/canvas/ProductImageSelector";
import { ImageUploadDialog } from "@/components/collections/canvas/ImageUploadDialog";
import { BackgroundColorPicker } from "@/components/collections/canvas/BackgroundColorPicker";
import
{
	CanvasSizeSelector,
	CanvasSize,
	CANVAS_SIZES,
} from "@/components/collections/canvas/CanvasSizeSelector";
import { BannerMetadataEditor } from "@/components/collections/canvas/BannerMetadataEditor";
import { useCanvasEditor } from "@/hooks/useCanvasEditor";
import { collectionRepository, productRepository } from "@/lib/firestore";
import
{
	ProductCollection,
	CanvasState,
	CanvasElement,
	CollectionProduct,
} from "@/types/collections";
import { Product } from "@/types";
import { Loader2, ArrowLeft, Eye } from "lucide-react";
import toast from "react-hot-toast";
import
{
	publishCollection,
	getPublishStatus,
} from "@/lib/collections/publish-service";
import { getProductById } from "@/lib/collections/product-service";
import { RoleGuard } from "@/components/collections/auth/RoleGuard";
import { useCollectionsAuth } from "@/contexts/CollectionsAuthContext";

// Unified product interface for canvas editor
interface UnifiedProduct
{
	id: string;
	title: string;
	images: string[];
	source: 'marketplace' | 'collection';
	// Store the original ID with prefix for saving back to Firestore
	originalId: string;
}

export default function CanvasEditorPage()
{
	const params = useParams();
	const router = useRouter();
	const collectionId = params.id as string;
	const { hasPermission } = useCollectionsAuth();

	// Check permissions
	const canEdit = hasPermission("canEditCollections");
	const isViewer = !canEdit;

	const [collection, setCollection] = useState<ProductCollection | null>(null);
	const [products, setProducts] = useState<UnifiedProduct[]>([]);
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [saveStatus, setSaveStatus] = useState<
		"saved" | "saving" | "unsaved" | "error"
	>("saved");
	const [lastSaved, setLastSaved] = useState<Date | null>(null);
	const [hasSelection, setHasSelection] = useState(false);
	const [selectedElement, setSelectedElement] = useState<any>(null);
	const [publishDialogOpen, setPublishDialogOpen] = useState(false);
	const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
	const [hasExistingPublished, setHasExistingPublished] = useState(false);
	const [existingPublishedName, setExistingPublishedName] =
		useState<string>("");
	const [showImageSelector, setShowImageSelector] = useState(false);
	const [showImageUpload, setShowImageUpload] = useState(false);
	const [showColorPicker, setShowColorPicker] = useState(false);
	const [backgroundColor, setBackgroundColor] = useState("#ffffff");
	const [canvasSize, setCanvasSize] = useState({ width: 1200, height: 800 });
	const [bannerMetadata, setBannerMetadata] = useState({
		badge: "",
		title: "",
		description: "",
	});
	const [isElementLocked, setIsElementLocked] = useState(false);
	const [showGrid, setShowGrid] = useState(false);
	const [showGuides, setShowGuides] = useState(false);
	const [zoomLevel, setZoomLevel] = useState(100);

	const canvasEditorRef = useRef<CanvasEditorRef>(null);
	const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);
	const saveInProgressRef = useRef(false);

	const {
		canvasState,
		isDirty,
		addToHistory,
		markClean,
		canUndo,
		canRedo,
		undo,
		redo,
	} = useCanvasEditor({
		initialState: collection?.canvasState,
	});

	// Load collection and products
	useEffect(() =>
	{
		const loadData = async () =>
		{
			try
			{
				setLoading(true);

				// Load collection
				const collectionData = await collectionRepository.getById(collectionId);
				if (!collectionData)
				{
					toast.error("Collection not found");
					router.push("/collections");
					return;
				}

				setCollection(collectionData);

				// Load banner metadata
				setBannerMetadata({
					badge: collectionData.badge || "",
					title: collectionData.title || "",
					description: collectionData.description || "",
				});

				// Load products from both marketplace and collection sources
				const unifiedProducts: UnifiedProduct[] = [];

				for (const productId of collectionData.productIds)
				{
					// Parse product ID to determine source
					let source: 'marketplace' | 'collection' = 'marketplace';
					let actualId = productId;

					if (productId.startsWith('collection:'))
					{
						source = 'collection';
						actualId = productId.replace('collection:', '');
					}
					else if (productId.startsWith('marketplace:'))
					{
						source = 'marketplace';
						actualId = productId.replace('marketplace:', '');
					}

					// Load product based on source
					if (source === 'collection')
					{
						const collectionProduct = await getProductById(actualId);
						if (collectionProduct)
						{
							unifiedProducts.push({
								id: actualId,
								title: collectionProduct.title,
								images: collectionProduct.images,
								source: 'collection',
								originalId: productId, // Store original ID with prefix
							});
						}
					}
					else
					{
						const marketplaceProduct = await productRepository.getById(actualId);
						if (marketplaceProduct)
						{
							unifiedProducts.push({
								id: actualId,
								title: marketplaceProduct.title,
								images: Array.isArray(marketplaceProduct.images)
									? marketplaceProduct.images
									: [],
								source: 'marketplace',
								originalId: productId, // Store original ID with prefix
							});
						}
					}
				}

				setProducts(unifiedProducts);

				// Initialize canvas with product images if no canvas state exists
				if (
					!collectionData.canvasState ||
					collectionData.canvasState.elements.length === 0
				)
				{
					const initialElements = await createInitialCanvasElements(
						unifiedProducts
					);
					const initialState: CanvasState = {
						elements: initialElements,
						backgroundColor: "#ffffff",
						dimensions: { width: 1200, height: 800 },
					};
					addToHistory(initialState);
				}
			} catch (error)
			{
				console.error("Failed to load collection:", error);
				toast.error("Failed to load collection");
			} finally
			{
				setLoading(false);
			}
		};

		if (collectionId)
		{
			loadData();
		}
	}, [collectionId, router]);

	// Create initial canvas elements from products
	const createInitialCanvasElements = async (
		products: UnifiedProduct[]
	): Promise<CanvasElement[]> =>
	{
		const elements: CanvasElement[] = [];
		const gridCols = Math.ceil(Math.sqrt(products.length));
		const spacing = 50;
		const imageSize = 200;

		products.forEach((product, index) =>
		{
			const row = Math.floor(index / gridCols);
			const col = index % gridCols;

			const imageUrl =
				Array.isArray(product.images) && product.images.length > 0
					? product.images[0]
					: "";

			if (imageUrl)
			{
				elements.push({
					id: `element-${Date.now()}-${index}`,
					type: "image",
					position: {
						x: 100 + col * (imageSize + spacing),
						y: 100 + row * (imageSize + spacing),
					},
					size: {
						width: imageSize,
						height: imageSize,
					},
					rotation: 0,
					zIndex: index,
					imageUrl,
					productId: product.id,
					productSource: product.source, // Store product source
				});
			}
		});

		return elements;
	};

	// Serialize canvas state to JSON and save to Firestore
	const saveCanvasState = useCallback(
		async (
			state: CanvasState,
			showToast: boolean = false
		): Promise<boolean> =>
		{
			if (!collection || saveInProgressRef.current) return false;

			try
			{
				saveInProgressRef.current = true;
				setSaving(true);
				setSaveStatus("saving");

				// Serialize canvas state to JSON
				const serializedState = JSON.parse(JSON.stringify(state));

				// Update collection document in Firestore with canvas state and banner metadata
				await collectionRepository.update(collectionId, {
					canvasState: serializedState,
					badge: bannerMetadata.badge || undefined,
					title: bannerMetadata.title || undefined,
					description: bannerMetadata.description || undefined,
					updatedAt: new Date(),
				});

				// Update state
				markClean();
				setLastSaved(new Date());
				setSaveStatus("saved");

				if (showToast)
				{
					toast.success("Canvas saved successfully");
				}

				return true;
			} catch (error)
			{
				console.error("Failed to save canvas:", error);
				setSaveStatus("error");

				if (showToast)
				{
					toast.error("Failed to save canvas. Please try again.");
				}

				return false;
			} finally
			{
				setSaving(false);
				saveInProgressRef.current = false;
			}
		},
		[collection, collectionId, markClean, bannerMetadata]
	);

	// Handle manual save
	const handleManualSave = async () =>
	{
		if (isViewer)
		{
			toast.error(
				"Permission denied: You do not have permission to save changes."
			);
			return;
		}

		if (!canvasEditorRef.current) return;

		const state = canvasEditorRef.current.getCanvasState();
		await saveCanvasState(state, true);
	};

	// Handle save (for backward compatibility)
	const handleSave = async (state: CanvasState) =>
	{
		await saveCanvasState(state, false);
	};

	// Handle state change
	const handleStateChange = (state: CanvasState) =>
	{
		// Viewers cannot save changes
		if (isViewer)
		{
			return;
		}

		addToHistory(state);
		setSaveStatus("unsaved");

		// Update selection state
		if (canvasEditorRef.current)
		{
			setHasSelection(canvasEditorRef.current.hasSelection());
			setSelectedElement(canvasEditorRef.current.getSelectedElement());
			setIsElementLocked(canvasEditorRef.current.isElementLocked());
		}

		// Reset auto-save timer
		if (autoSaveTimerRef.current)
		{
			clearTimeout(autoSaveTimerRef.current);
		}

		// Set new auto-save timer (30 seconds)
		autoSaveTimerRef.current = setTimeout(() =>
		{
			if (canvasEditorRef.current)
			{
				const currentState = canvasEditorRef.current.getCanvasState();
				saveCanvasState(currentState, false);
			}
		}, 30000); // 30 seconds
	};

	// Handle text property update
	const handleTextUpdate = () =>
	{
		if (canvasEditorRef.current)
		{
			const state = canvasEditorRef.current.getCanvasState();
			addToHistory(state);
		}
	};

	// Handle duplicate
	const handleDuplicate = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.duplicateSelected();
		}
	};

	// Handle delete
	const handleDelete = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.deleteSelected();
		}
	};

	// Handle add text
	const handleAddText = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.addTextElement();
		}
	};

	// Handle add image - open image selector
	const handleAddImage = () =>
	{
		setShowImageSelector(true);
	};

	// Handle upload image - open upload dialog
	const handleUploadImage = () =>
	{
		setShowImageUpload(true);
	};

	// Handle image selection from selector
	const handleSelectImage = (imageUrl: string, productId: string, productSource?: 'marketplace' | 'collection') =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.addProductImage(imageUrl, productId, productSource);
			setShowImageSelector(false);
			toast.success("Image added to canvas");
		}
	};

	// Handle uploaded image
	const handleImageUploaded = (imageUrl: string) =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.addProductImage(imageUrl);
			toast.success("Custom image added to canvas");
		}
	};

	// Handle background color change
	const handleBackgroundColorChange = (color: string) =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.setBackgroundColor(color);
			setBackgroundColor(color);
		}
	};

	// Handle canvas size change
	const handleCanvasSizeChange = (size: CanvasSize) =>
	{
		const confirm = window.confirm(
			`Change canvas size to ${size.name} (${size.width}×${size.height}px)? This will resize the canvas.`
		);
		if (confirm)
		{
			// Update canvas size
			setCanvasSize({ width: size.width, height: size.height });

			// Update canvas state dimensions if editor is ready
			if (canvasEditorRef.current)
			{
				const currentState = canvasEditorRef.current.getCanvasState();
				const updatedState = {
					...currentState,
					dimensions: { width: size.width, height: size.height },
				};
				// The CanvasEditor will handle the resize via props
			}

			toast.success(
				`Canvas resized to ${size.name} (${size.width}×${size.height}px)`
			);
		}
	};

	// Handle banner metadata update
	const handleBannerMetadataUpdate = (data: {
		badge?: string;
		title?: string;
		description?: string;
	}) =>
	{
		setBannerMetadata({
			badge: data.badge || "",
			title: data.title || "",
			description: data.description || "",
		});
		setSaveStatus("unsaved");
	};

	// Handle lock/unlock
	const handleLockElement = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.lockElement();
			setIsElementLocked(true);
			toast.success("Element locked");
		}
	};

	const handleUnlockElement = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.unlockElement();
			setIsElementLocked(false);
			toast.success("Element unlocked");
		}
	};

	// Handle alignment
	const handleAlignLeft = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.alignLeft();
		}
	};

	const handleAlignCenter = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.alignCenter();
		}
	};

	const handleAlignRight = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.alignRight();
		}
	};

	const handleAlignTop = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.alignTop();
		}
	};

	const handleAlignMiddle = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.alignMiddle();
		}
	};

	const handleAlignBottom = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.alignBottom();
		}
	};

	// Handle transforms
	const handleFlipHorizontal = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.flipHorizontal();
		}
	};

	const handleFlipVertical = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.flipVertical();
		}
	};

	const handleRotate = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.rotate90();
		}
	};

	// Handle layer order
	const handleBringToFront = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.bringToFront();
		}
	};

	const handleSendToBack = () =>
	{
		if (canvasEditorRef.current)
		{
			canvasEditorRef.current.sendToBack();
		}
	};

	// Handle view options
	const handleToggleGrid = () =>
	{
		setShowGrid(!showGrid);
		toast.success(showGrid ? "Grid hidden" : "Grid shown");
	};

	const handleToggleGuides = () =>
	{
		setShowGuides(!showGuides);
		toast.success(showGuides ? "Guides hidden" : "Guides shown");
	};

	// Handle zoom
	const handleZoomIn = () =>
	{
		setZoomLevel((prev) => Math.min(prev + 10, 200));
	};

	const handleZoomOut = () =>
	{
		setZoomLevel((prev) => Math.max(prev - 10, 50));
	};

	const handleResetZoom = () =>
	{
		setZoomLevel(100);
	};

	// Handle template selection
	const handleTemplateSelect = (template: any) =>
	{
		if (!canvasEditorRef.current) return;

		// Confirm if canvas has content
		const currentState = canvasEditorRef.current.getCanvasState();
		if (currentState.elements.length > 0)
		{
			const confirm = window.confirm(
				"Applying a template will replace your current design. Continue?"
			);
			if (!confirm) return;
		}

		// Prepare product images for template
		const productImages = products
			.map((product) => ({
				imageUrl:
					Array.isArray(product.images) && product.images.length > 0
						? product.images[0]
						: "",
				productId: product.id,
				productSource: product.source,
			}))
			.filter((p) => p.imageUrl);

		// Apply template
		canvasEditorRef.current.applyTemplate(template.layout, productImages);

		toast.success(`Applied ${template.name} template`);
	};

	// Handle publish - open dialog with preview
	const handlePublish = async () =>
	{
		if (isViewer)
		{
			toast.error(
				"Permission denied: You do not have permission to publish collections."
			);
			return;
		}

		console.log("Publish button clicked!");
		if (!canvasEditorRef.current)
		{
			console.error("Canvas editor ref is null");
			return;
		}

		try
		{
			console.log("Saving canvas state before publish...");
			// Save current state first
			const state = canvasEditorRef.current.getCanvasState();
			const saved = await saveCanvasState(state, false);

			if (!saved)
			{
				toast.error("Please save your changes before publishing");
				return;
			}

			console.log("Generating preview image...");
			// Generate preview image
			const previewUrl = canvasEditorRef.current.exportToImage("png", 0.85);
			setPreviewImageUrl(previewUrl);

			console.log("Checking publish status...");
			// Check for existing published collection
			const publishStatus = await getPublishStatus(collectionId);
			setHasExistingPublished(publishStatus.hasOtherPublished);
			setExistingPublishedName(
				publishStatus.otherPublishedCollection?.name || ""
			);

			console.log("Opening publish dialog...");
			// Open publish dialog
			setPublishDialogOpen(true);
		} catch (error)
		{
			console.error("Error preparing publish:", error);
			toast.error("Failed to prepare publish dialog");
		}
	};

	// Handle confirm publish
	const handleConfirmPublish = async () =>
	{
		if (!canvasEditorRef.current) return;

		try
		{
			// Export canvas to blob
			const blob = await canvasEditorRef.current.exportToBlob("png", 0.85);

			if (!blob)
			{
				throw new Error("Failed to generate preview image");
			}

			// Publish collection
			const result = await publishCollection(collectionId, blob);

			if (result.success)
			{
				toast.success(result.message);

				// Update local collection state
				if (collection)
				{
					setCollection({
						...collection,
						published: true,
						publishedAt: new Date(),
					});
				}

				// Redirect to collections page after a short delay
				setTimeout(() =>
				{
					router.push("/collections");
				}, 1500);
			} else
			{
				throw new Error(result.message);
			}
		} catch (error)
		{
			console.error("Error publishing collection:", error);
			throw error; // Re-throw to be handled by PublishDialog
		}
	};

	// Handle back navigation
	const handleBack = () =>
	{
		if (isDirty)
		{
			const confirm = window.confirm(
				"You have unsaved changes. Are you sure you want to leave?"
			);
			if (!confirm) return;
		}
		router.push("/collections");
	};

	// Cleanup auto-save timer on unmount
	useEffect(() =>
	{
		return () =>
		{
			if (autoSaveTimerRef.current)
			{
				clearTimeout(autoSaveTimerRef.current);
			}
		};
	}, []);

	// Keyboard shortcuts
	useEffect(() =>
	{
		const handleKeyDown = (e: KeyboardEvent) =>
		{
			// Ctrl+Z for undo
			if (e.ctrlKey && e.key === "z" && !e.shiftKey)
			{
				e.preventDefault();
				undo();
			}
			// Ctrl+Y or Ctrl+Shift+Z for redo
			else if (
				(e.ctrlKey && e.key === "y") ||
				(e.ctrlKey && e.shiftKey && e.key === "z")
			)
			{
				e.preventDefault();
				redo();
			}
			// Ctrl+D for duplicate
			else if (e.ctrlKey && e.key === "d")
			{
				e.preventDefault();
				handleDuplicate();
			}
			// Ctrl+S for save
			else if (e.ctrlKey && e.key === "s")
			{
				e.preventDefault();
				handleManualSave();
			}
			// Delete or Backspace for delete
			else if (e.key === "Delete" || e.key === "Backspace")
			{
				e.preventDefault();
				handleDelete();
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [undo, redo, handleDuplicate, handleDelete, handleManualSave]);

	if (loading)
	{
		return (
			<div className="flex items-center justify-center min-h-screen">
				<Loader2 className="w-8 h-8 animate-spin text-blue-600" />
			</div>
		);
	}

	if (!collection)
	{
		return (
			<div className="flex items-center justify-center min-h-screen">
				<p className="text-gray-600">Collection not found</p>
			</div>
		);
	}

	return (
		<RoleGuard allowedRoles={["superadmin", "editor", "viewer"]}>
			<div className="min-h-screen bg-gray-50">
				{/* Header */}
				<header className="bg-white border-b border-gray-200 sticky top-0 z-10">
					<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
						<div className="flex items-center justify-between">
							<div className="flex items-center gap-4">
								<button
									onClick={handleBack}
									className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-700 hover:text-gray-900"
									title="Go back to collections"
								>
									<ArrowLeft className="w-5 h-5" />
									<span className="hidden sm:inline font-medium">Back</span>
								</button>
								<div className="border-l border-gray-300 pl-4">
									<div className="flex items-center gap-2">
										<h1 className="text-xl sm:text-2xl font-bold text-gray-900">
											{collection.name}
										</h1>
										{isViewer && (
											<span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-md">
												<Eye className="w-3 h-3" />
												Read-Only
											</span>
										)}
									</div>
									<p className="text-xs sm:text-sm text-gray-600">
										{products.length} product{products.length !== 1 ? "s" : ""}
									</p>
								</div>
							</div>

							<div className="flex items-center gap-2">
								{/* Save status indicator */}
								{saveStatus === "saving" && (
									<div className="flex items-center gap-2 text-sm text-blue-600">
										<Loader2 className="w-4 h-4 animate-spin" />
										<span>Saving...</span>
									</div>
								)}
								{saveStatus === "saved" && lastSaved && (
									<span className="text-sm text-green-600">
										Saved {new Date(lastSaved).toLocaleTimeString()}
									</span>
								)}
								{saveStatus === "unsaved" && (
									<span className="text-sm text-amber-600">
										Unsaved changes
									</span>
								)}
								{saveStatus === "error" && (
									<span className="text-sm text-red-600">Save failed</span>
								)}
							</div>
						</div>
					</div>
				</header>

				{/* Canvas Editor */}
				<main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
					<div className="space-y-4">
						{/* Toolbar */}
						<CanvasToolbar
							onDuplicate={handleDuplicate}
							onDelete={handleDelete}
							onUndo={undo}
							onRedo={redo}
							onAddText={handleAddText}
							onAddImage={handleAddImage}
							onUploadImage={handleUploadImage}
							onSave={handleManualSave}
							onPublish={handlePublish}
							onTemplateSelect={handleTemplateSelect}
							onBringToFront={handleBringToFront}
							onSendToBack={handleSendToBack}
							onLockElement={handleLockElement}
							onUnlockElement={handleUnlockElement}
							onAlignLeft={handleAlignLeft}
							onAlignCenter={handleAlignCenter}
							onAlignRight={handleAlignRight}
							onAlignTop={handleAlignTop}
							onAlignMiddle={handleAlignMiddle}
							onAlignBottom={handleAlignBottom}
							onFlipHorizontal={handleFlipHorizontal}
							onFlipVertical={handleFlipVertical}
							onRotate={handleRotate}
							onZoomIn={handleZoomIn}
							onZoomOut={handleZoomOut}
							onResetZoom={handleResetZoom}
							onToggleGrid={handleToggleGrid}
							onToggleGuides={handleToggleGuides}
							canUndo={canUndo}
							canRedo={canRedo}
							hasSelection={hasSelection}
							isLocked={isElementLocked}
							isSaving={saving}
							productCount={products.length}
							showGrid={showGrid}
							showGuides={showGuides}
							zoomLevel={zoomLevel}
						/>

						{/* Canvas and Sidebars - Responsive Layout */}
						<div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
							{/* Canvas - Centered and takes more space */}
							<div className="lg:col-span-9 flex justify-center">
								<div className="w-full max-w-5xl">
									<CanvasEditor
										ref={canvasEditorRef}
										collectionId={collectionId}
										initialState={collection.canvasState}
										onStateChange={handleStateChange}
										onSave={handleSave}
										canvasWidth={canvasSize.width}
										canvasHeight={canvasSize.height}
									/>
								</div>
							</div>

							{/* Right Sidebar - Always visible but components are conditional */}
							<div className="lg:col-span-3 space-y-4">
								{/* Banner Metadata Editor - Always show */}
								<BannerMetadataEditor
									badge={bannerMetadata.badge}
									title={bannerMetadata.title}
									description={bannerMetadata.description}
									onUpdate={handleBannerMetadataUpdate}
								/>

								{/* Canvas Size Selector - Always show */}
								<CanvasSizeSelector
									currentSize={canvasSize}
									onSizeChange={handleCanvasSizeChange}
								/>

								{/* Text Editor - Only show when text is selected */}
								{selectedElement &&
									(selectedElement.type === "text" ||
										selectedElement.type === "i-text") && (
										<TextEditor
											selectedElement={selectedElement}
											onUpdate={handleTextUpdate}
										/>
									)}

								{/* Background Color Picker - Always show */}
								<BackgroundColorPicker
									currentColor={backgroundColor}
									onColorChange={handleBackgroundColorChange}
								/>
							</div>
						</div>
					</div>
				</main>

				{/* Product Image Selector Modal */}
				{showImageSelector && (
					<ProductImageSelector
						products={products}
						onSelectImage={handleSelectImage}
						onClose={() => setShowImageSelector(false)}
					/>
				)}

				{/* Image Upload Dialog */}
				{showImageUpload && (
					<ImageUploadDialog
						collectionId={collectionId}
						userId={collection?.createdBy}
						onImageUploaded={handleImageUploaded}
						onClose={() => setShowImageUpload(false)}
					/>
				)}

				{/* Publish Dialog */}
				<PublishDialog
					open={publishDialogOpen}
					onOpenChange={setPublishDialogOpen}
					onConfirm={handleConfirmPublish}
					previewImageUrl={previewImageUrl}
					hasExistingPublished={hasExistingPublished}
					existingPublishedName={existingPublishedName}
				/>
			</div>
		</RoleGuard>
	);
}
