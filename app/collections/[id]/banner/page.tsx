"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Save, Image as ImageIcon, Plus, X, Search, Package } from "lucide-react";
import { useCollectionsAuth } from "@/contexts/CollectionsAuthContext";
import { toast } from "sonner";
import Link from "next/link";
import Image from "next/image";
import { collectionRepository, productRepository } from "@/lib/firestore";
import { ProductCollection, CollectionProduct } from "@/types/collections";
import { Product } from "@/types";
import { storage } from "@/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { FreeShippingToggle } from "@/components/collections/FreeShippingToggle";
import { getUserProducts } from "@/lib/collections/product-service";

interface ResolvedProduct {
  id: string;
  title: string;
  image?: string;
  source: "marketplace" | "collection";
}

function ProductPickerDialog({
  open, onClose, currentProductIds, userId, onAdd,
}: {
  open: boolean;
  onClose: () => void;
  currentProductIds: string[];
  userId: string;
  onAdd: (ids: string[]) => void;
}) {
  const [tab, setTab] = useState<"marketplace" | "my-products">("marketplace");
  const [marketplaceProducts, setMarketplaceProducts] = useState<Product[]>([]);
  const [myProducts, setMyProducts] = useState<CollectionProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    setSelected(new Set());
    setSearch("");
    setLoading(true);
    Promise.all([productRepository.getAllWithTailorInfo(), getUserProducts(userId)])
      .then(([mp, my]) => { setMarketplaceProducts(mp); setMyProducts(my); })
      .catch(() => toast.error("Failed to load products"))
      .finally(() => setLoading(false));
  }, [open, userId]);

  const currentSet = useMemo(() => new Set(currentProductIds), [currentProductIds]);

  const filteredMarketplace = useMemo(
    () => marketplaceProducts.filter((p) => {
      const q = search.toLowerCase();
      return !currentSet.has("marketplace:" + p.product_id) &&
        (p.title.toLowerCase().includes(q) || (p.category ?? "").toLowerCase().includes(q));
    }),
    [marketplaceProducts, search, currentSet]
  );

  const filteredMy = useMemo(
    () => myProducts.filter((p) => {
      const q = search.toLowerCase();
      return !currentSet.has("collection:" + p.id) &&
        (p.title.toLowerCase().includes(q) || p.brandName.toLowerCase().includes(q));
    }),
    [myProducts, search, currentSet]
  );

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  if (!open) return null;
  const visibleProducts = tab === "marketplace" ? filteredMarketplace : filteredMy;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Add Products</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <div className="flex border-b px-4">
          {(["marketplace", "my-products"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={"py-2 px-4 text-sm font-medium border-b-2 transition-colors " + (tab === t ? "border-purple-600 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700")}>
              {t === "marketplace" ? "Marketplace" : "My Products"}
            </button>
          ))}
        </div>
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32"><Loader2 className="w-6 h-6 animate-spin text-purple-600" /></div>
          ) : visibleProducts.length === 0 ? (
            <p className="text-center text-sm text-gray-500 py-8">No products found</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {visibleProducts.map((p) => {
                const rawId = tab === "marketplace"
                  ? "marketplace:" + (p as Product).product_id
                  : "collection:" + (p as CollectionProduct).id;
                const img = tab === "marketplace"
                  ? (p as Product).images?.[0]
                  : (p as CollectionProduct).images?.[0];
                const isSel = selected.has(rawId);
                return (
                  <button key={rawId} onClick={() => toggle(rawId)}
                    className={"relative text-left rounded-lg border-2 overflow-hidden transition-all " + (isSel ? "border-purple-600 ring-2 ring-purple-100" : "border-gray-200 hover:border-gray-300")}>
                    {isSel && (
                      <div className="absolute top-1.5 right-1.5 z-10 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
                        <Plus className="w-3 h-3 text-white rotate-45" />
                      </div>
                    )}
                    <div className="aspect-square bg-gray-100">
                      {img ? <img src={img} alt={p.title} className="w-full h-full object-cover" />
                        : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>}
                    </div>
                    <div className="p-2"><p className="text-xs font-medium text-gray-900 line-clamp-2">{p.title}</p></div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
        <div className="p-4 border-t flex items-center justify-between">
          <span className="text-sm text-gray-500">{selected.size} product{selected.size !== 1 ? "s" : ""} selected</span>
          <div className="flex gap-2">
            <button onClick={onClose} className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50">Cancel</button>
            <button onClick={() => { onAdd(Array.from(selected)); onClose(); }} disabled={selected.size === 0}
              className="px-4 py-2 text-sm bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {selected.size > 0 ? "Add (" + selected.size + ")" : "Add"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CollectionBannerPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useCollectionsAuth();
  const collectionId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [collection, setCollection] = useState<any>(null);
  const [bannerImage, setBannerImage] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [isFreeShipping, setIsFreeShipping] = useState(false);
  const [productIds, setProductIds] = useState<string[]>([]);
  const [productDetails, setProductDetails] = useState<ResolvedProduct[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!collectionId || !user) return;
    setLoading(true);
    collectionRepository.getById(collectionId)
      .then((data) => {
        if (!data) { toast.error("Collection not found"); router.push("/collections"); return; }
        setCollection(data);
        if (data.thumbnail) setBannerPreview(data.thumbnail);
        if (data.title) setTitle(data.title);
        if (data.description) setDescription(data.description);
        if (data.isFreeShipping !== undefined) setIsFreeShipping(data.isFreeShipping);
        setProductIds(data.productIds ?? []);
      })
      .catch(() => toast.error("Failed to load collection"))
      .finally(() => setLoading(false));
  }, [collectionId, user, router]);

  useEffect(() => {
    if (!productIds.length || !user) { setProductDetails([]); return; }
    setLoadingProducts(true);
    Promise.all([productRepository.getAllWithTailorInfo(), getUserProducts(user.uid)])
      .then(([allMp, allMy]) => {
        const mpMap = new Map(allMp.map((p) => [p.product_id, p]));
        const myMap = new Map(allMy.map((p) => [p.id, p]));
        setProductDetails(
          productIds.map((rawId): ResolvedProduct => {
            if (rawId.startsWith("marketplace:")) {
              const id = rawId.slice("marketplace:".length);
              const p = mpMap.get(id);
              return { id: rawId, title: p?.title ?? id, image: p?.images?.[0], source: "marketplace" };
            }
            const id = rawId.startsWith("collection:") ? rawId.slice("collection:".length) : rawId;
            const p = myMap.get(id);
            return { id: rawId, title: p?.title ?? id, image: p?.images?.[0], source: "collection" };
          })
        );
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [productIds, user]);

  const handleRemoveProduct = (rawId: string) =>
    setProductIds((prev) => prev.filter((id) => id !== rawId));

  const handleAddProducts = (newIds: string[]) =>
    setProductIds((prev) => {
      const existing = new Set(prev);
      return [...prev, ...newIds.filter((id) => !existing.has(id))];
    });

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Please select an image file"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Image size must be less than 5MB"); return; }
    setBannerImage(file);
    const reader = new FileReader();
    reader.onloadend = () => setBannerPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!user) { toast.error("You must be logged in"); return; }
    setSaving(true);
    try {
      let thumbnailUrl = bannerPreview;
      if (bannerImage) {
        const storageRef = ref(storage, "collections/" + user.uid + "/" + collectionId + "/banner-" + Date.now() + ".jpg");
        await uploadBytes(storageRef, bannerImage);
        thumbnailUrl = await getDownloadURL(storageRef);
      }
      const collectionTitle = title.trim() || collection?.name || "Untitled Collection";
      const updateData: Partial<ProductCollection> = {
        name: collectionTitle, title: collectionTitle,
        description: description.trim(), isFreeShipping, productIds,
      };
      if (thumbnailUrl) {
        updateData.thumbnail = thumbnailUrl;
        updateData.published = true;
        updateData.publishedAt = new Date();
      }
      await collectionRepository.update(collectionId, updateData);
      toast.success(thumbnailUrl ? "Collection published successfully!" : "Settings saved successfully!");
      router.push("/collections");
    } catch {
      toast.error("Failed to save collection");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-purple-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading collection...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <Link href="/collections" className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />Back to Collections
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Edit Collection</h1>
          <p className="text-gray-600">Update your collection products, banner, and settings</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Products</h2>
              <p className="text-sm text-gray-500 mt-0.5">{productIds.length} product{productIds.length !== 1 ? "s" : ""} in this collection</p>
            </div>
            <button onClick={() => setShowPicker(true)}
              className="inline-flex items-center gap-2 px-3 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors">
              <Plus className="w-4 h-4" />Add Products
            </button>
          </div>
          {loadingProducts ? (
            <div className="flex items-center justify-center h-24"><Loader2 className="w-5 h-5 animate-spin text-purple-600" /></div>
          ) : productDetails.length === 0 ? (
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center">
              <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
              <p className="text-sm text-gray-500">No products yet. Click Add Products to get started.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {productDetails.map((p) => (
                <div key={p.id} className="relative group rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                  <div className="aspect-square bg-gray-100">
                    {p.image ? <img src={p.image} alt={p.title} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center"><Package className="w-8 h-8 text-gray-300" /></div>}
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-900 line-clamp-2">{p.title}</p>
                    <span className="text-[10px] text-gray-400 capitalize">{p.source}</span>
                  </div>
                  <button onClick={() => handleRemoveProduct(p.id)}
                    className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white rounded-full p-0.5 shadow"
                    aria-label="Remove product">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Banner Image</h2>
          {bannerPreview ? (
            <div className="space-y-4">
              <div className="relative aspect-[21/9] rounded-lg overflow-hidden border-2 border-gray-200">
                <Image src={bannerPreview} alt="Banner preview" fill className="object-cover" />
              </div>
              <button onClick={() => { setBannerImage(null); setBannerPreview(""); }}
                className="text-sm text-red-600 hover:text-red-700 font-medium">Remove Image</button>
            </div>
          ) : (
            <label className="block">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-purple-400 transition-colors cursor-pointer">
                <ImageIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-sm text-gray-600 mb-2">Click to upload or drag and drop</p>
                <p className="text-xs text-gray-500">PNG, JPG up to 5MB (Recommended: 2100x900px)</p>
              </div>
              <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" />
            </label>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Banner Details</h2>
          <div className="space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Title (Optional)</label>
              <input type="text" id="title" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Summer Collection 2024" maxLength={50}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-black" />
              <p className="mt-1 text-xs text-gray-500">{title.length}/50 characters</p>
            </div>
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description (Optional)</label>
              <textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g., Discover our latest summer styles" rows={3} maxLength={150}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-black" />
              <p className="mt-1 text-xs text-gray-500">{description.length}/150 characters</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Shipping Settings</h2>
          <FreeShippingToggle value={isFreeShipping} onChange={setIsFreeShipping} disabled={saving} />
        </div>

        <div className="flex gap-4">
          <button onClick={() => { toast.info("Collection saved as draft."); router.push("/collections"); }}
            disabled={saving}
            className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50">
            Skip for Now
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-purple-600 text-white font-semibold rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50">
            {saving ? <><Loader2 className="w-5 h-5 animate-spin" />Saving...</> : <><Save className="w-5 h-5" />Save Settings</>}
          </button>
        </div>
      </div>

      {user && (
        <ProductPickerDialog
          open={showPicker}
          onClose={() => setShowPicker(false)}
          currentProductIds={productIds}
          userId={user.uid}
          onAdd={handleAddProducts}
        />
      )}
    </div>
  );
}
