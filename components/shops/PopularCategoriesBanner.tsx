"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { WEAR_CATEGORY_PRESETS } from "@/lib/wear-category-presets";

type BannerItem =
	| { kind: "link"; label: string; href: string; imageSrc: string }
	| {
			kind: "subcategory";
			label: string;
			/** Exact `WEAR_CATEGORY_PRESETS` value — stored in `wear_category` */
			value: string;
			imageSrc: string;
	  };

/** Sub-categories shown on the home banner (subset of presets; images are marketing-only). */
const BANNER_PRESET_KEYS = ["Accessories", "Tops", "Skirts", "Pants"] as const;

const BANNER_SUB_IMAGES: Record<(typeof BANNER_PRESET_KEYS)[number], string> = {
	Accessories:
		"https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&h=500&fit=crop&q=80",
	Tops:
		"https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop&q=80",
	Skirts:
		"https://images.unsplash.com/photo-1542253325-ff745fd4617a?w=400&h=500&fit=crop&q=80",
	Pants:
		"https://images.unsplash.com/photo-1588260663276-cb3abbb60f96?w=400&h=500&fit=crop&q=80",
};

function buildBannerSubcategories(): BannerItem[] {
	return BANNER_PRESET_KEYS.map((key) => {
		const preset = WEAR_CATEGORY_PRESETS.find((p) => p.value === key);
		if (!preset) {
			throw new Error(
				`PopularCategoriesBanner: "${key}" is not in WEAR_CATEGORY_PRESETS`,
			);
		}
		return {
			kind: "subcategory",
			label: preset.value,
			value: preset.value,
			imageSrc: BANNER_SUB_IMAGES[key],
		};
	});
}

const CATEGORIES: BannerItem[] = [
	{
		kind: "link",
		label: "Brands",
		href: "/shops/brands",
		imageSrc:
			"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop&q=80",
	},
	{
		kind: "link",
		label: "Women",
		href: "/shops/products?category=women",
		imageSrc:
			"https://images.unsplash.com/photo-1761090617068-f1b3257d27ad?w=400&h=500&fit=crop&q=80",
	},
	{
		kind: "link",
		label: "Men",
		href: "/shops/products?category=men",
		imageSrc:
			"https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=500&fit=crop&q=80",
	},
	...buildBannerSubcategories(),
];

function itemHref(item: BannerItem): string {
	if (item.kind === "link") return item.href;
	return `/shops/products?subcategory=${encodeURIComponent(item.value)}`;
}

export const PopularCategoriesBanner: React.FC = () =>
{
	return (
		<section
			className="my-12"
			aria-label="Popular shopping categories"
		>
			<div className="container-responsive py-6 sm:py-8">
				<div className="mb-4 flex items-end justify-between gap-4">
					<div>
						<h2 className="text-lg font-semibold tracking-tight text-gray-900 sm:text-2xl">
							Popular categories
						</h2>
						{/* <p className="mt-0.5 text-sm text-gray-500">
							Browse styles shoppers open most often
						</p> */}
					</div>
				</div>

				<div className="-mx-1 flex gap-3 overflow-x-auto pb-1 sm:mx-0 sm:grid sm:gap-4 md:grid-cols-4 lg:grid-cols-7">
					{CATEGORIES.map((cat) => (
						<Link
							key={`${cat.kind}-${cat.label}`}
							href={itemHref(cat)}
							className="group relative flex w-[36vw] max-w-[140px] shrink-0 flex-col overflow-hidden rounded-xl border border-gray-200/80 bg-white shadow-sm transition hover:border-gray-300 hover:shadow-md sm:w-auto sm:max-w-none"
						>
							<div className="relative aspect-[3/4] w-full overflow-hidden">
								<Image
									src={cat.imageSrc}
									alt={cat.label}
									fill
									className="object-cover transition duration-300 group-hover:scale-105"
									sizes="(max-width: 640px) 36vw, (max-width: 1024px) 25vw, 12vw"
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
								<span className="absolute bottom-0 left-0 right-0 px-3 py-3 text-center text-sm font-semibold text-white drop-shadow-sm sm:text-base">
									{cat.label}
								</span>
							</div>
						</Link>
					))}
				</div>
			</div>
		</section>
	);
};

export default PopularCategoriesBanner;
