"use client";

/**
 * Email Change Detector Component
 * 
 * Automatically detects when a user's email has been updated in Firebase Auth
 * (after clicking verification link) and syncs it to Firestore collections.
 * 
 * Add this component to your vendor layout or any page that should detect
 * email changes automatically.
 */

import { useEmailChangeDetection } from "@/hooks/useEmailChangeDetection";

export function EmailChangeDetector() {
	useEmailChangeDetection();
	return null; // This component doesn't render anything
}

