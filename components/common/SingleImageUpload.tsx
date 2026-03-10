"use client";

import { useCallback, useRef, useState, useEffect } from "react";
import Image from "next/image";
import { Upload, X, Loader2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";

interface SingleImageUploadProps {
	label: string;
	value?: string; // Existing URL
	onChange: (file: File | null) => void;
	onRemove?: () => void;
	className?: string;
	helperText?: string;
}

export function SingleImageUpload({
	label,
	value,
	onChange,
	onRemove,
	className = "",
	helperText,
}: SingleImageUploadProps) {
	const [preview, setPreview] = useState<string | null>(value || null);
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		setPreview(value || null);
	}, [value]);

	const handleFile = useCallback(
		(file: File) => {
			// Validation
			if (!file.type.startsWith("image/")) {
				toast.error("Please upload an image file");
				return;
			}

			if (file.size > 5 * 1024 * 1024) {
				toast.error("Image must be less than 5MB");
				return;
			}

			const reader = new FileReader();
			reader.onloadend = () => {
				setPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
			onChange(file);
		},
		[onChange]
	);

	const onDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const onDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const onDrop = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
		if (e.dataTransfer.files?.[0]) {
			handleFile(e.dataTransfer.files[0]);
		}
	};

	const handleRemove = (e: React.MouseEvent) => {
		e.stopPropagation();
		setPreview(null);
		if (fileInputRef.current) fileInputRef.current.value = "";
		onChange(null);
		onRemove?.();
	};

	return (
		<div className={className}>
			<label className="block text-sm font-semibold text-gray-900 mb-2">
				{label}
			</label>

			<div
				onClick={() => fileInputRef.current?.click()}
				onDragOver={onDragOver}
				onDragLeave={onDragLeave}
				onDrop={onDrop}
				className={`
          relative w-full aspect-video rounded-xl border-2 border-dashed
          flex flex-col items-center justify-center cursor-pointer transition-all
          ${
						isDragging
							? "border-black bg-gray-50"
							: "border-gray-200 hover:border-black/50 hover:bg-gray-50"
					}
          ${preview ? "bg-gray-100 border-solid border-gray-200" : "bg-white"}
        `}
			>
				{preview ? (
					<>
						<Image
							src={preview}
							alt={label}
							fill
							className="object-cover rounded-lg"
						/>
						<button
							onClick={handleRemove}
							className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-sm"
							type="button"
						>
							<X className="w-4 h-4" />
						</button>
					</>
				) : (
					<div className="text-center p-6">
						<div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
							<Upload className="w-6 h-6 text-gray-400" />
						</div>
						<p className="text-sm font-medium text-gray-900">
							Click to upload or drag and drop
						</p>
						<p className="text-xs text-gray-500 mt-1">
							PNG, JPG, WebP up to 5MB
						</p>
					</div>
				)}
			</div>

			{helperText && <p className="mt-2 text-xs text-gray-500">{helperText}</p>}

			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				className="hidden"
				onChange={(e) => {
					if (e.target.files?.[0]) handleFile(e.target.files[0]);
				}}
			/>
		</div>
	);
}
