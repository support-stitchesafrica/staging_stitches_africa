import { NextRequest, NextResponse } from "next/server";
import { estimateProductDimensions } from "@/lib/ai/dimension-estimator";
import type { DimensionAnalysisInput } from "@/lib/ai/types";
import { countVisionImageUrls } from "@/lib/ai/vision-image-urls";

function parseBody(body: Record<string, unknown>): DimensionAnalysisInput {
  const wearRaw = body.wearCategories ?? body.wearCategory;
  let wearCategories: string[] | undefined;
  if (Array.isArray(wearRaw)) {
    wearCategories = wearRaw.filter((x): x is string => typeof x === "string");
  } else if (typeof wearRaw === "string" && wearRaw.trim()) {
    wearCategories = wearRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  const sizesRaw = body.sizes;
  const sizes = Array.isArray(sizesRaw)
    ? sizesRaw
        .map((s) => (typeof s === "string" ? s : (s as { size?: string })?.size))
        .filter((x): x is string => typeof x === "string" && x.length > 0)
    : undefined;

  const productType = body.productType;
  const category = body.category;
  const sizingApproach = body.sizingApproach;

  return {
    title: typeof body.title === "string" ? body.title : undefined,
    description:
      typeof body.description === "string" ? body.description : undefined,
    imageUrls: Array.isArray(body.imageUrls)
      ? body.imageUrls.filter((u): u is string => typeof u === "string")
      : undefined,
    productType:
      productType === "bespoke" || productType === "ready-to-wear"
        ? productType
        : undefined,
    category:
      category === "men" ||
      category === "women" ||
      category === "kids" ||
      category === "unisex"
        ? category
        : undefined,
    wearCategories,
    sizes,
    sizingApproach:
      sizingApproach === "clothing" || sizingApproach === "footwear"
        ? sizingApproach
        : undefined,
  };
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Record<string, unknown>;
    const input = parseBody(body);

    const hasTitle = typeof input.title === "string" && input.title.trim().length > 0;
    const hasImages =
      Array.isArray(input.imageUrls) && input.imageUrls.length > 0;

    if (!hasTitle && !hasImages) {
      return NextResponse.json(
        { error: "title or imageUrls is required" },
        { status: 400 }
      );
    }

    console.info("[dimensions] API request", {
      imagesReceived: input.imageUrls?.length ?? 0,
      imagesVisionReady: countVisionImageUrls(input.imageUrls),
      hasTitle,
      hasImages,
    });

    const startedAt = Date.now();
    const { estimate, source, reason } = await estimateProductDimensions(input);

    console.info("[dimensions] API response", {
      source,
      reason: reason ?? null,
      matchedCategory: estimate.matchedCategory,
      durationMs: Date.now() - startedAt,
    });

    return NextResponse.json({ estimate });
  } catch {
    return NextResponse.json(
      { error: "Dimension estimation failed" },
      { status: 500 }
    );
  }
}
