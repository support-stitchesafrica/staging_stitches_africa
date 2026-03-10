import React, { useState } from "react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CompleteProfileModalProps {
	isOpen: boolean;
	onComplete: (fullName: string) => Promise<void>;
	loading: boolean;
}

export const CompleteProfileModal: React.FC<CompleteProfileModalProps> = ({
	isOpen,
	onComplete,
	loading,
}) => {
	const [fullName, setFullName] = useState("");
	const [error, setError] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError("");

		if (!fullName.trim()) {
			setError("Please enter your full name");
			return;
		}

		try {
			await onComplete(fullName);
		} catch (err) {
			setError("Failed to update profile. Please try again.");
		}
	};

	return (
		<Dialog open={isOpen}>
			<DialogContent
				className="sm:max-w-md"
				onInteractOutside={(e) => e.preventDefault()}
				onEscapeKeyDown={(e) => e.preventDefault()}
			>
				<DialogHeader>
					<DialogTitle>Complete Your Profile</DialogTitle>
					<DialogDescription>
						Please provide your full name to finish setting up your referral
						account.
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit} className="space-y-4 py-4">
					<div className="grid w-full gap-1.5">
						<Label htmlFor="fullName">Full Name</Label>
						<Input
							id="fullName"
							value={fullName}
							onChange={(e) => setFullName(e.target.value)}
							placeholder="Enter your full name"
							disabled={loading}
							autoFocus
						/>
						{error && <p className="text-sm text-red-500">{error}</p>}
					</div>

					<div className="flex justify-end gap-3 pt-2">
						<Button
							type="submit"
							disabled={loading}
							className="w-full bg-black text-white hover:bg-gray-800"
						>
							{loading ? "Setting up..." : "Complete Setup"}
						</Button>
					</div>
				</form>
			</DialogContent>
		</Dialog>
	);
};
