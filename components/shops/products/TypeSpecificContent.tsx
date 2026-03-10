"use client";

import React from "react";
import { Product } from "@/types";
import {
	getTypeSpecificContent,
	shouldShowFeature,
	getTypeSpecificStyling,
} from "@/lib/utils/product-type-utils";
import {
	Scissors,
	Info,
	Clock,
	Palette,
	Ruler,
	CircleAlert,
	CircleCheck,
	Package,
	ChevronDown,
	ChevronUp,
} from "lucide-react";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface TypeSpecificContentProps {
	product: Product;
}

export const TypeSpecificContent: React.FC<TypeSpecificContentProps> = ({
	product,
}) => {
	const { t } = useLanguage();
	const typeContent = getTypeSpecificContent(product);
	const styling = getTypeSpecificStyling(product);
	const isBespoke = product.type === "bespoke";

	return (
		<div className="space-y-6">
			{/* Type-specific warnings */}
			{typeContent.warnings.length > 0 && (
				<div
					className={`p-4 rounded-lg border-l-4 ${
						isBespoke
							? "bg-purple-50 border-purple-400"
							: "bg-blue-50 border-blue-400"
					}`}
				>
					<div className="flex items-start gap-3">
						<CircleAlert
							className={`mt-0.5 ${styling.textClasses}`}
							size={18}
						/>
						<div className="space-y-1">
							{typeContent.warnings.map((warning, index) => (
								<p key={index} className={`text-sm ${styling.accentClasses}`}>
									{warning}
								</p>
							))}
						</div>
					</div>
				</div>
			)}

			{/* Bespoke-specific content */}
			{isBespoke && product.bespokeOptions && (
				<BespokeContent product={product} styling={styling} />
			)}

			{/* Ready-to-wear specific content */}
			{!isBespoke && product.rtwOptions && (
				<ReadyToWearContent product={product} styling={styling} />
			)}

			{/* Type-specific actions */}
			{typeContent.actions.length > 0 && (
				<div className="flex flex-wrap gap-3">
					{typeContent.actions
						.filter((action) => action.visible)
						.map((action) => (
							<button
								key={action.id}
								className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
									action.variant === "primary"
										? `${styling.sectionClasses} ${styling.textClasses} hover:opacity-90`
										: action.variant === "secondary"
											? `border border-gray-300 text-gray-700 hover:bg-gray-50`
											: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200"
								}`}
								onClick={() => handleActionClick(action.action)}
							>
								{action.label}
							</button>
						))}
				</div>
			)}
		</div>
	);
};

const BespokeContent: React.FC<{ product: Product; styling: any }> = ({
	product,
	styling,
}) => {
	const { t } = useLanguage();
	const { bespokeOptions } = product;
	if (!bespokeOptions) return null;

	return (
		<div className="space-y-4">
			{/* Customization Options */}
			{shouldShowFeature(product, "customization-options") &&
				bespokeOptions.customization && (
					<div className={`p-4 rounded-lg ${styling.sectionClasses}`}>
						<h3
							className={`text-lg font-semibold ${styling.textClasses} flex items-center gap-2 mb-3`}
						>
							<Palette size={18} /> {t.productPage.customizationOptions}
						</h3>
						<div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
							{Object.entries(bespokeOptions.customization).map(
								([key, value]) => (
									<div key={key} className="flex justify-between">
										<span className={`font-medium ${styling.accentClasses}`}>
											{key
												.replace(/([A-Z])/g, " $1")
												.replace(/^./, (str) => str.toUpperCase())}
											:
										</span>
										<span className="text-gray-600">{String(value)}</span>
									</div>
								),
							)}
						</div>
					</div>
				)}

			{/* Fabric Choices */}
			{shouldShowFeature(product, "fabric-choices") &&
				bespokeOptions.fabricChoices && (
					<div className={`p-4 rounded-lg ${styling.sectionClasses}`}>
						<h3
							className={`text-lg font-semibold ${styling.textClasses} flex items-center gap-2 mb-3`}
						>
							<Package size={18} /> {t.productPage.availableFabrics}
						</h3>
						<div className="flex flex-wrap gap-2">
							{bespokeOptions.fabricChoices.map((fabric, index) => (
								<span
									key={index}
									className="px-3 py-1 bg-white text-purple-700 border border-purple-200 rounded-full text-sm hover:bg-purple-50 cursor-pointer transition-colors"
								>
									{fabric}
								</span>
							))}
						</div>
					</div>
				)}

			{/* Style Options */}
			{shouldShowFeature(product, "style-options") &&
				bespokeOptions.styleOptions && (
					<div className={`p-4 rounded-lg ${styling.sectionClasses}`}>
						<h3
							className={`text-lg font-semibold ${styling.textClasses} flex items-center gap-2 mb-3`}
						>
							<Scissors size={18} /> {t.productPage.styleVariations}
						</h3>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
							{bespokeOptions.styleOptions.map((style, index) => (
								<div
									key={index}
									className="p-3 bg-white border border-purple-200 rounded-lg text-center text-sm hover:bg-purple-50 cursor-pointer transition-colors"
								>
									{style}
								</div>
							))}
						</div>
					</div>
				)}

			{/* Measurements Required */}
			{shouldShowFeature(product, "measurements-required") &&
				bespokeOptions.measurementsRequired && (
					<div className={`p-4 rounded-lg ${styling.sectionClasses}`}>
						<h3
							className={`text-lg font-semibold ${styling.textClasses} flex items-center gap-2 mb-3`}
						>
							<Ruler size={18} /> {t.productPage.requiredMeasurements}
						</h3>
						<div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
							{bespokeOptions.measurementsRequired.map((measurement, index) => (
								<div
									key={index}
									className="flex items-center gap-2 p-2 bg-white border border-purple-200 rounded text-sm"
								>
									<CircleCheck size={14} className="text-purple-600" />
									<span>{measurement}</span>
								</div>
							))}
						</div>
					</div>
				)}

			{/* Production Information */}
			{/* {shouldShowFeature(product, 'production-time') && bespokeOptions.productionTime && (
        <div className={`p-4 rounded-lg ${styling.sectionClasses}`}>
          <h3 className={`text-lg font-semibold ${styling.textClasses} flex items-center gap-2 mb-3`}>
            <Clock size={18} /> Production Timeline
          </h3>
          <div className="space-y-2 text-sm">
            
            {bespokeOptions.depositAllowed !== undefined && (
              <div className="flex justify-between">
                <span className={`font-medium ${styling.accentClasses}`}>Deposit Payment:</span>
                <span className={bespokeOptions.depositAllowed ? 'text-green-600' : 'text-gray-600'}>
                  {bespokeOptions.depositAllowed ? 'Available' : 'Not Available'}
                </span>
              </div>
            )}
            {bespokeOptions.notesEnabled !== undefined && (
              <div className="flex justify-between">
                <span className={`font-medium ${styling.accentClasses}`}>Custom Notes:</span>
                <span className={bespokeOptions.notesEnabled ? 'text-green-600' : 'text-gray-600'}>
                  {bespokeOptions.notesEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            )}
          </div>
        </div>
      )} */}

			{/* Care Instructions */}
			{shouldShowFeature(product, "care-instructions") &&
				bespokeOptions.careInstructions && (
					<div className={`p-4 rounded-lg ${styling.sectionClasses}`}>
						<h3
							className={`text-lg font-semibold ${styling.textClasses} flex items-center gap-2 mb-3`}
						>
							<Info size={18} /> {t.productPage.careInstructions}
						</h3>
						<p className="text-sm text-gray-600 leading-relaxed">
							{bespokeOptions.careInstructions}
						</p>
					</div>
				)}

			{/* Finishing Options */}
			{bespokeOptions.finishingOptions &&
				bespokeOptions.finishingOptions.length > 0 && (
					<div className={`p-4 rounded-lg ${styling.sectionClasses}`}>
						<h3
							className={`text-lg font-semibold ${styling.textClasses} flex items-center gap-2 mb-3`}
						>
							<CircleCheck size={18} /> {t.productPage.finishingOptions}
						</h3>
						<div className="flex flex-wrap gap-2">
							{bespokeOptions.finishingOptions.map((finish, index) => (
								<span
									key={index}
									className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
								>
									{finish}
								</span>
							))}
						</div>
					</div>
				)}
		</div>
	);
};

const ReadyToWearContent: React.FC<{ product: Product; styling: any }> = ({
	product,
	styling,
}) => {
	const { t } = useLanguage();
	const { rtwOptions } = product;
	if (!rtwOptions) return null;

	return (
		<div className="space-y-4">
			{/* Size Guide Table */}
			{product.metric_size_guide &&
				product.metric_size_guide.rows.length > 0 && (
					<CollapsibleSizeGuide product={product} styling={styling} />
				)}

			{/* Ready-to-Wear Benefits */}
			<div className={`p-4 rounded-lg ${styling.sectionClasses}`}>
				<h3
					className={`text-lg font-semibold ${styling.textClasses} flex items-center gap-2 mb-3`}
				>
					<CircleCheck size={18} /> {t.productPage.readyToWearBenefits}
				</h3>
				<div className="space-y-2 text-sm">
					<div className="flex items-center gap-2">
						<CircleCheck size={14} className="text-green-600" />
						<span className="text-gray-600">
							{t.productPage.benefitImmediateAvailability}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<CircleCheck size={14} className="text-green-600" />
						<span className="text-gray-600">
							{t.productPage.benefitStandardSizing}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<CircleCheck size={14} className="text-green-600" />
						<span className="text-gray-600">
							{t.productPage.benefitQuickShipping}
						</span>
					</div>
					<div className="flex items-center gap-2">
						<CircleCheck size={14} className="text-green-600" />
						<span className="text-gray-600">
							{t.productPage.benefitEasyReturns}
						</span>
					</div>
				</div>
			</div>
		</div>
	);
};

// Helper function to handle action clicks
const handleActionClick = (action: string) => {
	switch (action) {
	
		case "measurements":
			// Handle measurements submission
			console.log("Submit measurements clicked");
			break;
		case "size-guide":
			// Handle size guide display
			console.log("Size guide clicked");
			break;
		default:
			console.log(`Action ${action} clicked`);
	}
};

function CollapsibleSizeGuide({
	product,
	styling,
}: {
	product: Product;
	styling: any;
}) {
	const { t } = useLanguage();
	const [isOpen, setIsOpen] = useState(false);

	if (!product.metric_size_guide) return null;

	return (
		<div className="rounded-lg  border border-gray-200 overflow-hidden">
			<button
				onClick={() => setIsOpen(!isOpen)}
				className="w-full flex items-center !bg-white justify-between p-4 hover:bg-gray-100 transition-colors"
			>
				<h3
					className={`text-lg font-semibold ${styling.textClasses} flex items-center gap-2`}
				>
					<Ruler size={18} /> {t.productPage.sizeGuide}
				</h3>
				{isOpen ? (
					<ChevronUp className="h-5 w-5 text-gray-500" />
				) : (
					<ChevronDown className="h-5 w-5 text-gray-500" />
				)}
			</button>

			{isOpen && (
				<div className="border-t border-gray-200">
					<div className="overflow-x-auto">
						<table className="w-full text-sm text-left border-collapse">
							<thead className="text-xs text-gray-700 uppercase bg-gray-100">
								<tr>
									<th className="px-4 py-2 border-b border-gray-200 whitespace-nowrap">
										Size
									</th>
									{product.metric_size_guide.columns.map((col) => (
										<th
											key={col.id}
											className="px-4 py-2 border-b border-gray-200 whitespace-nowrap"
										>
											{col.label}
										</th>
									))}
								</tr>
							</thead>
							<tbody>
								{product.metric_size_guide.rows.map((row, index) => (
									<tr
										key={index}
										className="bg-white border-b border-gray-100 hover:bg-gray-50"
									>
										<td className="px-4 py-2 font-medium text-gray-900 sticky left-0 bg-white hover:bg-gray-50">
											{row.sizeLabel}
										</td>
										{product.metric_size_guide!.columns.map((col) => (
											<td key={col.id} className="px-4 py-2">
												{row.values[col.id] || "-"}
											</td>
										))}
									</tr>
								))}
							</tbody>
						</table>
					</div>
				</div>
			)}
		</div>
	);
}
