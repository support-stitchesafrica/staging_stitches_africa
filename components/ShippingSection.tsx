"use client";
import React, { useState } from "react";

interface ShippingData {
	tierKey: string;
	manualOverride: boolean;
	actualWeightKg?: number;
	lengthCm?: number;
	widthCm?: number;
	heightCm?: number;
}

interface ShippingSectionProps {
	shipping: ShippingData;
	setShipping: React.Dispatch<React.SetStateAction<ShippingData>>;
}

// ✅ Default shipping dimensions for predefined tiers
const DEFAULT_TIER_DIMENSIONS: Record<
	string,
	{
		actualWeightKg: number;
		lengthCm: number;
		widthCm: number;
		heightCm: number;
	}
> = {
	tier_small: { actualWeightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 5 },
	tier_medium: { actualWeightKg: 2.5, lengthCm: 30, widthCm: 25, heightCm: 10 },
	tier_large: { actualWeightKg: 5, lengthCm: 40, widthCm: 30, heightCm: 15 },
	tier_xl: { actualWeightKg: 8, lengthCm: 50, widthCm: 40, heightCm: 20 },
	tier_xxl: { actualWeightKg: 12, lengthCm: 60, widthCm: 50, heightCm: 25 },
};

// ✅ Helper — clean and prepare shipping data before sending to DB
export const cleanShippingData = (shipping: ShippingData) => {
	const base = {
		tierKey: shipping.tierKey,
		manualOverride: shipping.manualOverride,
	};

	// Use predefined dimensions when not using manual override
	if (!shipping.manualOverride) {
		const defaults = DEFAULT_TIER_DIMENSIONS[shipping.tierKey];
		return defaults ? { ...base, ...defaults } : base;
	}

	// Manual override mode — only include user-entered values
	const cleanData: Record<string, any> = { ...base };
	if (shipping.actualWeightKg)
		cleanData.actualWeightKg = shipping.actualWeightKg;
	if (shipping.lengthCm) cleanData.lengthCm = shipping.lengthCm;
	if (shipping.widthCm) cleanData.widthCm = shipping.widthCm;
	if (shipping.heightCm) cleanData.heightCm = shipping.heightCm;

	return cleanData;
};

// ✅ Validation function
export const validateShippingData = (shipping: ShippingData) => {
	if (!shipping.tierKey) {
		return "Please select a shipping tier.";
	}

	if (shipping.manualOverride) {
		if (
			!shipping.actualWeightKg ||
			!shipping.lengthCm ||
			!shipping.widthCm ||
			!shipping.heightCm
		) {
			return "Please enter all shipping dimensions and weight.";
		}

		if (
			shipping.actualWeightKg <= 0 ||
			shipping.lengthCm <= 0 ||
			shipping.widthCm <= 0 ||
			shipping.heightCm <= 0
		) {
			return "Shipping values must be greater than zero.";
		}
	}

	return null;
};

const ShippingSection: React.FC<ShippingSectionProps> = ({
	shipping,
	setShipping,
}) => {
	const [error, setError] = useState<string | null>(null);

	const tiers = [
		{
			key: "tier_small",
			label: "Small (≤ 1kg)",
			description: "Accessories, scarves",
		},
		{
			key: "tier_medium",
			label: "Medium (1.1–2.5kg)",
			description: "Dresses, tops",
		},
		{
			key: "tier_large",
			label: "Large (2.6–5kg)",
			description: "Two-piece outfits",
		},
		{ key: "tier_xl", label: "XL (5.1–8kg)", description: "Heavier garments" },
		{
			key: "tier_xxl",
			label: "XXL (8.1–12kg)",
			description: "Bulkier or wholesale",
		},
	];

	// Handle tier selection — automatically apply defaults if not manual
	const handleTierChange = (tierKey: string) => {
		setShipping((prev) => {
			if (!prev.manualOverride && DEFAULT_TIER_DIMENSIONS[tierKey]) {
				return { ...prev, tierKey, ...DEFAULT_TIER_DIMENSIONS[tierKey] };
			}
			return { ...prev, tierKey };
		});
	};

	// Validate whenever user toggles manual override or selects tier
	React.useEffect(() => {
		const validationError = validateShippingData(shipping);
		setError(validationError);
	}, [shipping]);

	return (
		<div className="border rounded-2xl p-5 mt-4 bg-white shadow-sm">
			<h3 className="text-lg font-semibold mb-3">Weight & Dimensions Details</h3>

			<label className="block text-sm font-medium mb-1">
				Select Weight & Dimensions Tier *
			</label>
			<select
				className="w-full border rounded-lg p-2 text-sm"
				value={shipping.tierKey}
				onChange={(e) => handleTierChange(e.target.value)}
			>
				<option value="">Select Tier</option>
				{tiers.map((t) => (
					<option key={t.key} value={t.key}>
						{t.label} — {t.description}
					</option>
				))}
			</select>

			<div className="flex items-center mt-4">
				<input
					type="checkbox"
					id="manualOverride"
					checked={shipping.manualOverride}
					onChange={(e) =>
						setShipping({
							...shipping,
							manualOverride: e.target.checked,
							...(e.target.checked
								? {}
								: DEFAULT_TIER_DIMENSIONS[shipping.tierKey] || {}),
						})
					}
					className="mr-2"
				/>
				<label htmlFor="manualOverride" className="text-sm">
					Enable Manual Override
				</label>
			</div>

			{shipping.manualOverride && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
					<div>
						<label className="text-xs font-medium">Weight (kg)</label>
						<input
							type="number"
							min="0"
							step="0.1"
							className="w-full border rounded-lg p-2 text-sm"
							value={shipping.actualWeightKg || ""}
							onChange={(e) =>
								setShipping({
									...shipping,
									actualWeightKg: Number(e.target.value) || undefined,
								})
							}
						/>
					</div>
					<div>
						<label className="text-xs font-medium">Length (cm)</label>
						<input
							type="number"
							min="0"
							className="w-full border rounded-lg p-2 text-sm"
							value={shipping.lengthCm || ""}
							onChange={(e) =>
								setShipping({
									...shipping,
									lengthCm: Number(e.target.value) || undefined,
								})
							}
						/>
					</div>
					<div>
						<label className="text-xs font-medium">Width (cm)</label>
						<input
							type="number"
							min="0"
							className="w-full border rounded-lg p-2 text-sm"
							value={shipping.widthCm || ""}
							onChange={(e) =>
								setShipping({
									...shipping,
									widthCm: Number(e.target.value) || undefined,
								})
							}
						/>
					</div>
					<div>
						<label className="text-xs font-medium">Height (cm)</label>
						<input
							type="number"
							min="0"
							className="w-full border rounded-lg p-2 text-sm"
							value={shipping.heightCm || ""}
							onChange={(e) =>
								setShipping({
									...shipping,
									heightCm: Number(e.target.value) || undefined,
								})
							}
						/>
					</div>
				</div>
			)}

			{error && <p className="text-red-500 text-sm mt-3">⚠️ {error}</p>}
		</div>
	);
};

export default ShippingSection;
