"use client";

import { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Building2, User, MapPin } from "lucide-react";

interface KycUpdateModalProps {
	open: boolean;
	onClose: () => void;
	onContinue: (selectedItems: {
		company: boolean;
		identity: boolean;
		address: boolean;
	}) => void;
}

export function KycUpdateModal({
	open,
	onClose,
	onContinue,
}: KycUpdateModalProps) {
	const [selected, setSelected] = useState({
		company: false,
		identity: false,
		address: false,
	});

	const handleCheckboxChange = (field: keyof typeof selected) => {
		setSelected((prev) => ({ ...prev, [field]: !prev[field] }));
	};

	const handleContinue = () => {
		// Validate at least one is selected
		if (!selected.company && !selected.identity && !selected.address) {
			return; // Disabled state prevents this, but just in case
		}
		onContinue(selected);
		// Reset selections
		setSelected({ company: false, identity: false, address: false });
	};

	const handleCancel = () => {
		setSelected({ company: false, identity: false, address: false });
		onClose();
	};

	const isAnySelected =
		selected.company || selected.identity || selected.address;

	return (
		<Dialog open={open} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle className="text-xl">
						Select KYC Items to Update
					</DialogTitle>
					<DialogDescription>
						Choose which parts of your KYC information you want to update. You
						can select one or multiple items.
					</DialogDescription>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Company Verification */}
					<div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition">
						<Checkbox
							id="company"
							checked={selected.company}
							onCheckedChange={() => handleCheckboxChange("company")}
						/>
						<div className="flex-1">
							<Label
								htmlFor="company"
								className="flex items-center gap-2 cursor-pointer"
							>
								<Building2 className="h-4 w-4 text-blue-600" />
								<span className="font-medium">Company Verification</span>
							</Label>
							<p className="text-sm text-gray-500 mt-1">
								Update company registration details and documents
							</p>
						</div>
					</div>

					{/* Identity Verification */}
					<div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition">
						<Checkbox
							id="identity"
							checked={selected.identity}
							onCheckedChange={() => handleCheckboxChange("identity")}
						/>
						<div className="flex-1">
							<Label
								htmlFor="identity"
								className="flex items-center gap-2 cursor-pointer"
							>
								<User className="h-4 w-4 text-green-600" />
								<span className="font-medium">Identity Verification</span>
							</Label>
							<p className="text-sm text-gray-500 mt-1">
								Update your personal identity documents
							</p>
						</div>
					</div>

					{/* Company Address */}
					<div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-gray-50 transition">
						<Checkbox
							id="address"
							checked={selected.address}
							onCheckedChange={() => handleCheckboxChange("address")}
						/>
						<div className="flex-1">
							<Label
								htmlFor="address"
								className="flex items-center gap-2 cursor-pointer"
							>
								<MapPin className="h-4 w-4 text-purple-600" />
								<span className="font-medium">Company Address</span>
							</Label>
							<p className="text-sm text-gray-500 mt-1">
								Update your business address and proof of address
							</p>
						</div>
					</div>
				</div>

				{!isAnySelected && (
					<p className="text-sm text-amber-600 bg-amber-50 p-2 rounded">
						Please select at least one item to update
					</p>
				)}

				<DialogFooter className="gap-2 sm:gap-0">
					<Button variant="outline" onClick={handleCancel}>
						Cancel
					</Button>
					<Button
						onClick={handleContinue}
						disabled={!isAnySelected}
						className="bg-emerald-600 hover:bg-emerald-700"
					>
						Continue
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
