"use client";

import { useEffect, useRef, useState } from "react";
import { Search, Filter, ChevronsUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getTailorWorks, TailorWork } from "@/admin-services/getTailorWorks";
import LoadingSpinner from "@/components/LoadingSpinner";
import Link from "next/link";
import { toast } from "sonner";
import {
  WEAR_CATEGORY_PRESETS,
  canonicalWearCategoriesString,
  parseStoredWearCategories,
  presetSelectionFromStored,
  sortWearCategories,
  storedHasNonPresetWearCategories,
} from "@/lib/wear-category-presets";

export type InventoryAuthTokenGetter = () => Promise<string | null>;

const ITEMS_PER_PAGE = 20;

const WEAR_CATEGORY_PATCH_DEFAULT = "/api/admin/inventory/wear-category";

type WearCategoryInventoryCellProps = {
  documentId: string;
  wearCategory: string;
  onSaved: (value: string) => void;
  getAuthToken: InventoryAuthTokenGetter;
  wearCategoryPatchUrl?: string;
};

function wearCategoryTriggerLabel(storedRaw: string, saving: boolean): string {
  if (saving) return "Saving…";
  const presetsInStore = presetSelectionFromStored(storedRaw);
  const all = parseStoredWearCategories(storedRaw);
  if (presetsInStore.length === 0 && all.length > 0) {
    const head = all.slice(0, 2).join(", ");
    const more = all.length > 2 ? ` +${all.length - 2}` : "";
    return `Legacy: ${head}${more}`;
  }
  if (presetsInStore.length === 0) return "Sub-categories";
  if (presetsInStore.length <= 2) return presetsInStore.join(", ");
  return `${presetsInStore.slice(0, 2).join(", ")} +${presetsInStore.length - 2}`;
}

function WearCategoryInventoryCell({
  documentId,
  wearCategory,
  onSaved,
  getAuthToken,
  wearCategoryPatchUrl = WEAR_CATEGORY_PATCH_DEFAULT,
}: WearCategoryInventoryCellProps) {
  const [selected, setSelected] = useState<string[]>(() =>
    presetSelectionFromStored(wearCategory),
  );
  const [saving, setSaving] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wearCategoryRef = useRef(wearCategory);
  wearCategoryRef.current = wearCategory;

  useEffect(() => {
    setSelected(presetSelectionFromStored(wearCategory));
  }, [wearCategory]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const persist = async (cats: string[]) => {
    const nextCanon = canonicalWearCategoriesString(cats);
    const storedCanon = canonicalWearCategoriesString(wearCategoryRef.current);
    if (nextCanon === storedCanon) return;

    const token = await getAuthToken();
    if (!token) {
      toast.error("Not signed in. Please log in again.");
      setSelected(presetSelectionFromStored(wearCategoryRef.current));
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(wearCategoryPatchUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ documentId, wear_categories: cats }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || res.statusText);
      }
      const persisted =
        typeof data.wear_category === "string" ? data.wear_category : nextCanon;
      onSaved(persisted);
      toast.success("Sub-categories updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
      setSelected(presetSelectionFromStored(wearCategoryRef.current));
    } finally {
      setSaving(false);
    }
  };

  const queuePersist = (cats: string[]) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      void persist(cats);
    }, 450);
  };

  const handleTogglePreset = (value: string) => {
    setSelected((prev) => {
      const next = prev.includes(value)
        ? prev.filter((x) => x !== value)
        : sortWearCategories([...prev, value]);
      if (next.length === 0) {
        toast.error("Keep at least one sub-category.");
        return prev;
      }
      queuePersist(next);
      return next;
    });
  };

  const storedRaw = wearCategory.trim();
  const hasLegacyMixed = storedHasNonPresetWearCategories(storedRaw);

  return (
    <div className="flex min-w-[220px] max-w-[280px] flex-col gap-1.5 py-1">
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            role="combobox"
            disabled={saving}
            className="h-9 w-full justify-between px-2 text-xs font-normal"
          >
            <span className="truncate text-left">
              {wearCategoryTriggerLabel(wearCategory, saving)}
            </span>
            <ChevronsUpDown className="ml-1 size-3.5 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <div className="max-h-64 overflow-y-auto space-y-1">
            {WEAR_CATEGORY_PRESETS.map((opt) => {
              const id = `${documentId}-wc-${encodeURIComponent(opt.value)}`;
              return (
                <div
                  key={opt.value}
                  className="flex items-center gap-2 rounded-sm px-1 py-0.5 hover:bg-muted/60"
                >
                  <Checkbox
                    id={id}
                    checked={selected.includes(opt.value)}
                    disabled={saving}
                    onCheckedChange={() => handleTogglePreset(opt.value)}
                  />
                  <Label
                    htmlFor={id}
                    className="flex-1 cursor-pointer text-xs font-normal leading-tight"
                  >
                    {opt.value}
                  </Label>
                </div>
              );
            })}
          </div>
          <p className="mt-2 border-t pt-2 text-[11px] text-muted-foreground">
            Changes save automatically after you stop clicking for a moment.
          </p>
        </PopoverContent>
      </Popover>
      {hasLegacyMixed && (
        <p className="text-[11px] text-muted-foreground leading-snug">
          Stored value included non-preset text. Choosing presets replaces it entirely.
        </p>
      )}
    </div>
  );
}

export type TailorWorksInventoryViewProps = {
  getAuthToken: InventoryAuthTokenGetter;
  wearCategoryPatchUrl?: string;
  /** Outer wrapper classes (marketing vs admin shells) */
  className?: string;
};

export function TailorWorksInventoryView({
  getAuthToken,
  wearCategoryPatchUrl = WEAR_CATEGORY_PATCH_DEFAULT,
  className,
}: TailorWorksInventoryViewProps) {
  const [inventoryData, setInventoryData] = useState<TailorWork[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const data = await getTailorWorks();
        setInventoryData(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to fetch tailor works:", error);
      } finally {
        setLoading(false);
      }
    };

    void fetchInventory();
  }, []);

  const getStockStatus = (quantity?: number) => {
    if (typeof quantity !== "number") return "Unknown";
    return quantity <= 5 ? "Low Stock" : "In Stock";
  };

  const filteredData = inventoryData.filter((item) => {
    const title = item?.title ?? "";
    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase());

    const stockStatus = getStockStatus(item?.wear_quantity);
    const matchesStatus =
      statusFilter === "all" ||
      stockStatus.toLowerCase().replace(" ", "-") === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = filteredData.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className={className}>
      <div className="rounded-lg border border-gray-200 bg-white shadow-sm dark:border-gray-200 dark:bg-white">
        <div className="border-b border-gray-200 p-4 sm:p-6 dark:border-gray-200">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-900">Inventory</h2>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-36 border-gray-200 bg-white text-gray-900 dark:border-gray-200 dark:bg-white dark:text-gray-900">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="in-stock">In Stock</SelectItem>
                  <SelectItem value="low-stock">Low Stock</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="search"
                  placeholder="Search products..."
                  className="border-gray-200 bg-white pl-10 text-gray-900 placeholder:text-gray-400 dark:border-gray-200 dark:bg-white dark:text-gray-900"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              <Button className="bg-purple-600 hover:bg-purple-700 w-full sm:w-auto">
                Add Product
              </Button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto bg-white dark:bg-white">
          {loading ? (
            <LoadingSpinner />
          ) : paginatedData.length === 0 ? (
            <div className="p-6 text-gray-500 dark:text-gray-500">No products found.</div>
          ) : (
            <>
              <Table className="min-w-[640px] bg-white sm:min-w-full dark:bg-white">
                <TableHeader className="border-gray-200 bg-white dark:border-gray-200 dark:bg-white">
                  <TableRow className="border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-200 dark:bg-white dark:hover:bg-gray-50">
                    <TableHead className="font-medium text-gray-500 dark:text-gray-500">
                      PRODUCT NAME
                    </TableHead>
                    <TableHead className="font-medium text-gray-500 dark:text-gray-500">
                      SKU
                    </TableHead>
                    <TableHead className="font-medium text-gray-500 dark:text-gray-500">
                      AVAILABLE UNITS
                    </TableHead>
                    <TableHead className="font-medium text-gray-500 dark:text-gray-500">
                      RESERVED UNITS
                    </TableHead>
                    <TableHead className="font-medium text-gray-500 dark:text-gray-500">
                      STATUS
                    </TableHead>
                    <TableHead className="min-w-[240px] font-medium text-gray-500 dark:text-gray-500">
                      SUB-CATEGORIES
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="bg-white dark:bg-white">
                  {paginatedData.map((item) => {
                    const status = getStockStatus(item?.wear_quantity);

                    return (
                      <TableRow
                        key={item.documentId}
                        className="border-gray-200 bg-white hover:bg-gray-50 dark:border-gray-200 dark:bg-white dark:hover:bg-gray-50"
                      >
                        <TableCell className="font-medium text-gray-900 dark:text-gray-900">
                          <Link
                            href={`/shops/products/${item.product_id ?? item.documentId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-purple-700 hover:text-purple-900 hover:underline dark:text-purple-700 dark:hover:text-purple-900"
                          >
                            {item?.title ?? "Untitled"}
                          </Link>
                        </TableCell>
                        <TableCell className="text-gray-600 dark:text-gray-600">
                          {(item?.product_id ?? "UNKNOWN").slice(0, 8).toUpperCase()}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-900">
                          {item?.wear_quantity ?? 0}
                        </TableCell>
                        <TableCell className="text-gray-900 dark:text-gray-900">0</TableCell>
                        <TableCell className="bg-white dark:bg-white">
                          <Badge
                            variant={status === "In Stock" ? "default" : "secondary"}
                            className={
                              status === "In Stock"
                                ? "bg-green-100 text-green-800 hover:bg-green-100 dark:bg-green-100 dark:text-green-800 dark:hover:bg-green-100"
                                : "bg-orange-100 text-orange-800 hover:bg-orange-100 dark:bg-orange-100 dark:text-orange-800 dark:hover:bg-orange-100"
                            }
                          >
                            {status === "Low Stock" && "⚠ "}
                            {status}
                          </Badge>
                        </TableCell>
                        <TableCell className="align-top bg-white dark:bg-white">
                          <WearCategoryInventoryCell
                            documentId={item.documentId}
                            wearCategory={item.wear_category ?? ""}
                            getAuthToken={getAuthToken}
                            wearCategoryPatchUrl={wearCategoryPatchUrl}
                            onSaved={(value) =>
                              setInventoryData((prev) =>
                                prev.map((p) =>
                                  p.documentId === item.documentId
                                    ? { ...p, wear_category: value }
                                    : p,
                                ),
                              )
                            }
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>

              <div className="flex justify-between items-center border-t border-gray-200 bg-white p-4 dark:border-gray-200 dark:bg-white">
                <Button
                  variant="outline"
                  className="border-gray-200 bg-white text-gray-900 dark:border-gray-200 dark:bg-white dark:text-gray-900"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  Previous
                </Button>
                <span className="text-gray-600 dark:text-gray-600">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  className="border-gray-200 bg-white text-gray-900 dark:border-gray-200 dark:bg-white dark:text-gray-900"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  Next
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
