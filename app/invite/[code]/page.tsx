"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function InvitePage() {
	const params = useParams();
	const code = params.code as string;
	const [deviceType, setDeviceType] = useState<
		"android" | "ios" | "desktop" | "unknown"
	>("unknown");
	const [sessionId, setSessionId] = useState("");

	// App Store Links
	const ANDROID_URL =
		"https://play.google.com/store/apps/details?id=com.stitchesAfricaLimited.app"; // Replace with actual ID
	const IOS_URL = "https://apps.apple.com/ng/app/stitches-africa/id6753875161"; // Replace with actual ID

	useEffect(() => {
		// 1. Generate or Retrieve Session ID
		let sid = sessionStorage.getItem("referralSessionId");
		if (!sid) {
			sid = uuidv4();
			sessionStorage.setItem("referralSessionId", sid);
		}
		setSessionId(sid);

		// 2. Detect Device
		const userAgent = navigator.userAgent.toLowerCase();
		let type: "android" | "ios" | "desktop" | "unknown" = "desktop";

		if (/android/.test(userAgent)) {
			type = "android";
		} else if (/iphone|ipad|ipod/.test(userAgent)) {
			type = "ios";
		}
		setDeviceType(type);

		// 3. Track Click
		trackEvent(code, "click", sid, type);
	}, [code]);

	const trackEvent = async (
		referralCode: string,
		eventType: "click" | "download",
		sid: string,
		dtype: string,
	) => {
		console.log(
			`Tracking ${eventType} for code: ${referralCode} (Device: ${dtype})`,
		);
		try {
			const response = await fetch("/api/referral/track", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					code: referralCode,
					eventType,
					sessionId: sid,
					deviceType: dtype,
				}),
			});

			const data = await response.json();

			if (!response.ok || !data.success) {
				console.error("Tracking API Error:", data.error);
				if (data.error?.code === "INVALID_INPUT") {
					console.warn(
						"POSSIBLE CAUSE: The referral code does not exist in the database.",
					);
				}
			} else {
				console.log("Tracking success!");
			}
		} catch (error) {
			console.error("Tracking network failed:", error);
		}
	};

	const handleDownload = async (platform: "android" | "ios") => {
		console.log("Download button clicked:", platform);
		// Await the tracking to ensure the backend captures the IP before redirection
		await trackEvent(code, "download", sessionId, deviceType);

		if (platform === "android") {
			window.location.href = ANDROID_URL;
		} else {
			window.location.href = IOS_URL;
		}
	};

	return (
		<div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
			{/* Branding */}
			<div className="mb-12">
				<img
					src="/Stitches-Africa-Logo-06.png"
					alt="Stitches Africa"
					className="h-24 w-auto object-contain bg-white rounded-xl p-2"
				/>
			</div>

			<div className="max-w-md w-full bg-white rounded-2xl p-8 text-center shadow-xl">
				<h1 className="text-2xl font-bold mb-4 text-gray-900">
					You've been invited correctly!
				</h1>
				<p className="text-gray-600 mb-8">
					Join Stitches Africa to shop premium fashion. Use this referral link
					to get started.
				</p>

				{/* Dynamic Buttons based on device, or show both */}
				<div className="space-y-4">
					{(deviceType === "ios" ||
						deviceType === "desktop" ||
						deviceType === "unknown") && (
						<button
							onClick={() => handleDownload("ios")}
							className="w-full flex items-center justify-center gap-3 bg-black text-white p-4 rounded-xl hover:bg-gray-800 transition-all transform active:scale-95"
						>
							<svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
								<path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78.79.05 2.1-.71 3.52-.59 1.14.09 2.13.56 2.89 1.55-2.58 1.57-2.14 5.38.38 6.46-.38.85-.92 1.88-1.87 2.77zm-5-17.5c.67-.84 1.15-2.04.99-3.24-1.12.08-2.45.74-3.1 1.5-.59.69-1.08 1.83-.93 3.05 1.23.09 2.37-.53 3.04-1.31z" />
							</svg>
							<div className="text-left">
								<div className="text-xs">Download on the</div>
								<div className="text-lg font-bold">App Store</div>
							</div>
						</button>
					)}

					{(deviceType === "android" ||
						deviceType === "desktop" ||
						deviceType === "unknown") && (
						<button
							onClick={() => handleDownload("android")}
							className="w-full flex items-center justify-center gap-3 bg-black text-white p-4 rounded-xl hover:bg-gray-800 transition-all transform active:scale-95"
						>
							<svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
								<path d="M3.483 4.293L1.587 1.011c-.131-.227-.053-.518.174-.649.227-.132.518-.054.649.173L4.35 3.869c1.685-.756 3.57-1.196 5.65-1.196 2.08 0 3.965.44 5.65 1.196l1.939-3.334c.131-.227.422-.305.649-.173.227.132.305.422.174.649L16.517 4.293c3.085 1.625 5.255 4.676 5.462 8.354H2.021C2.228 8.969 4.398 5.918 7.483 4.293zM6.5 10c.828 0 1.5-.672 1.5-1.5S7.328 7 6.5 7 5 7.672 5 8.5 5.672 10 6.5 10zm11 0c.828 0 1.5-.672 1.5-1.5S18.328 7 17.5 7c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5zM2.021 13.647h19.957c-.207 3.678-2.377 6.729-5.462 8.354-2.827 1.492-6.105 1.492-8.932 0-3.085-1.625-5.255-4.676-5.462-8.354z" />
							</svg>
							<div className="text-left">
								<div className="text-xs">GET IT ON</div>
								<div className="text-lg font-bold">Google Play</div>
							</div>
						</button>
					)}
				</div>
			</div>

			{/* Footer */}
			<div className="mt-12 text-gray-500 text-sm">
				© {new Date().getFullYear()} Stitches Africa. All rights reserved.
			</div>
		</div>
	);
}
