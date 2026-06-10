"use client";

import { useEffect } from "react";

/** Clears lingering Workbox registrations so localhost dev does not precache stale hashed _next/static assets (404). */
export function UnregisterStaleServiceWorkers()
{
	useEffect(() =>
	{
		if (process.env.NODE_ENV !== "development") return;
		if (typeof window === "undefined") return;

		const { hostname } = window.location;
		if (hostname !== "localhost" && hostname !== "127.0.0.1") return;

		if (!("serviceWorker" in navigator)) return;

		void navigator.serviceWorker.getRegistrations().then((regs) =>
		{
			for (const r of regs)
			{
				void r.unregister();
			}
		});
	}, []);

	return null;
}
