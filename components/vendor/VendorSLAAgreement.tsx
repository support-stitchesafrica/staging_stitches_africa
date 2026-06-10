"use client";

import { Button } from "@/components/ui/button";
import
{
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { VendorSLAContent } from "@/components/vendor/VendorSLAContent";

interface VendorSLAAgreementProps
{
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onAccept: () => void;
	onDecline: () => void;
	brandName?: string;
	businessAddress?: string;
}

export function VendorSLAAgreement({
	open,
	onOpenChange,
	onAccept,
	onDecline,
	brandName = "[VENDOR BRAND NAME]",
	businessAddress = "[VENDOR BUSINESS ADDRESS]",
}: VendorSLAAgreementProps)
{
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] p-0 overflow-hidden">
				<div className="flex flex-col h-full max-h-[95vh]">
					<DialogHeader className="px-6 pt-6 pb-4 border-b bg-gradient-to-r from-gray-50 to-white shrink-0">
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 rounded-full bg-black/5 flex items-center justify-center">
								<FileText className="h-6 w-6 text-black" />
							</div>
							<div>
								<DialogTitle className="text-2xl font-bold text-gray-900">
									Vendor Platform Agreement
								</DialogTitle>
								<DialogDescription className="text-sm text-gray-600 mt-1">
									Please review and accept the terms to continue
								</DialogDescription>
							</div>
						</div>
					</DialogHeader>

					<div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
						<VendorSLAContent
							brandName={brandName}
							businessAddress={businessAddress}
							showAcceptanceNotice
						/>
					</div>

					<div className="px-6 py-4 border-t bg-gray-50 shrink-0 flex flex-row gap-3">
						<Button
							variant="outline"
							onClick={onDecline}
							className="flex-1 sm:flex-none"
						>
							Decline
						</Button>
						<Button
							onClick={onAccept}
							className="flex-1 sm:flex-none bg-black hover:bg-gray-800"
						>
							Accept Agreement
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}
