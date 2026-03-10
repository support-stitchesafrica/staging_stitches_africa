"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface SafeImageProps {
	src: string | undefined | null;
	alt: string;
	fill?: boolean;
	width?: number;
	height?: number;
	className?: string;
	sizes?: string;
	priority?: boolean;
	fallbackSrc?: string;
	placeholder?: "blur" | "empty";
	blurDataURL?: string;
	onError?: (e: React.SyntheticEvent<HTMLImageElement, Event>) => void;
	onClick?: () => void;
}

// Check if URL is from Firebase Storage
const isFirebaseStorageUrl = (url: string): boolean => {
	if (!url) return false;
	return (
		url.includes("firebasestorage.googleapis.com") ||
		url.includes("firebase.storage") ||
		url.includes("storage.googleapis.com")
	);
};

// Utility function to normalize image URLs for mobile compatibility
const normalizeImageUrl = (
	url: string | undefined | null,
	fallback: string = "/placeholder-product.svg"
): string => {
	if (!url || url.trim() === "") {
		return fallback;
	}

	const trimmed = url.trim();

	// If already absolute URL, return as is
	if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
		return trimmed;
	}

	// If relative path starting with /, return as is (will work with Next.js)
	if (trimmed.startsWith("/")) {
		return trimmed;
	}

	// Otherwise, treat as relative and add leading slash
	return `/${trimmed}`;
};

/**
 * SafeImage component with error handling and mobile compatibility
 * Automatically handles broken images and normalizes URLs
 */
export const SafeImage: React.FC<SafeImageProps> = ({
	src,
	alt,
	fill = false,
	width,
	height,
	className = "",
	sizes,
	priority = false,
	fallbackSrc = "/placeholder-product.svg",
	placeholder = "empty",
	blurDataURL,
	onError,
	onClick,
}) => {
	const [imgSrc, setImgSrc] = useState(normalizeImageUrl(src, fallbackSrc));
	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState(true);

	useEffect(() => {
		// Reset when src changes
		const normalized = normalizeImageUrl(src, fallbackSrc);
		setImgSrc(normalized);
		setHasError(false);
		setIsLoading(true);
	}, [src, fallbackSrc]);

	const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
		if (!hasError) {
			setHasError(true);
			const fallback = normalizeImageUrl(
				fallbackSrc,
				"/placeholder-product.svg"
			);
			setImgSrc(fallback);
		}
		// Call custom error handler if provided
		onError?.(e);
	};

	const handleLoad = () => {
		setIsLoading(false);
	};

	// Show placeholder if error and fallback also failed
	if (
		hasError &&
		imgSrc === fallbackSrc &&
		imgSrc === "/placeholder-product.svg"
	) {
		return (
			<div
				className={`bg-gray-200 flex items-center justify-center text-gray-400 ${
					fill ? "absolute inset-0" : ""
				} ${className}`}
			>
				<span className="text-xs sm:text-sm">No Image</span>
			</div>
		);
	}

	// Use native img tag for Firebase Storage URLs to avoid Next.js optimization issues
	const useNativeImg = isFirebaseStorageUrl(imgSrc);

	if (useNativeImg) {
		// Use native img tag for Firebase Storage URLs
		const imgStyle: React.CSSProperties = fill
			? {
					position: "absolute",
					inset: 0,
					width: "100%",
					height: "100%",
					objectFit: className.includes("object-contain") ? "contain" : "cover",
			  }
			: {
					width: width ? `${width}px` : "auto",
					height: height ? `${height}px` : "auto",
			  };

		return (
			<div className={fill ? "relative w-full h-full" : ""}>
				<img
					src={imgSrc}
					alt={alt}
					className={`${className} ${
						isLoading ? "opacity-0" : "opacity-100"
					} transition-opacity duration-300`}
					style={imgStyle}
					onError={handleError}
					onLoad={handleLoad}
					onClick={onClick}
					loading={priority ? "eager" : "lazy"}
					decoding="async"
					crossOrigin="anonymous"
				/>
				{isLoading && (
					<div
						className={`absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
					>
						<div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
					</div>
				)}
			</div>
		);
	}

	// Use Next.js Image for non-Firebase URLs
	const imageProps: any = {
		src: imgSrc,
		alt,
		className: `${className} ${
			isLoading ? "opacity-0" : "opacity-100"
		} transition-opacity duration-300`,
		onError: handleError,
		onLoad: handleLoad,
		priority: priority,
		placeholder: placeholder,
	};

	if (blurDataURL) {
		imageProps.blurDataURL = blurDataURL;
	}

	if (onClick) {
		imageProps.onClick = onClick;
	}

	if (fill) {
		imageProps.fill = true;
		if (sizes) imageProps.sizes = sizes;
	} else {
		if (width) imageProps.width = width;
		if (height) imageProps.height = height;
	}

	return (
		<div className={fill ? "relative w-full h-full" : ""}>
			<Image {...imageProps} />
			{isLoading && (
				<div
					className={`absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center ${className}`}
				>
					<div className="w-6 h-6 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
				</div>
			)}
		</div>
	);
};
