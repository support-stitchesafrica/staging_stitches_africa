import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";
import {
	WEAR_CATEGORY_PRESET_VALUES,
	serializeWearCategories,
	sortWearCategories,
	parseStoredWearCategories,
} from "@/lib/wear-category-presets";

const SUPER_ADMIN_EMAIL = "admin@stitchesafrica.com";

const MARKETING_INVENTORY_ROLES = new Set([
	"super_admin",
	"team_lead",
	"bdm",
	"team_member",
]);

/**
 * Admin dashboard users OR active marketing_users may edit catalogue wear_category.
 */
async function assertInventoryEditor(uid: string, email?: string | null) {
	const adminSnap = await adminDb.collection("admins").doc(uid).get();
	if (adminSnap.exists) {
		const role = adminSnap.data()?.role as string | undefined;
		if (role === "admin" || role === "superadmin") return;
	}
	const em = email?.toLowerCase() ?? "";
	if (em === SUPER_ADMIN_EMAIL.toLowerCase()) return;

	const marketingSnap = await adminDb.collection("marketing_users").doc(uid).get();
	if (!marketingSnap.exists) {
		throw new Error("FORBIDDEN");
	}
	const data = marketingSnap.data();
	if (data?.isActive === false) {
		throw new Error("FORBIDDEN");
	}
	const mRole = data?.role as string | undefined;
	if (mRole && MARKETING_INVENTORY_ROLES.has(mRole)) {
		return;
	}
	throw new Error("FORBIDDEN");
}

function normalizePresetListFromBody(body: Record<string, unknown>): string[] | null {
	let rawList: unknown[] | null = null;
	if (Array.isArray(body.wear_categories)) rawList = body.wear_categories;
	else if (Array.isArray(body.wear_category)) rawList = body.wear_category as unknown[];
	else if (typeof body.wear_category === "string") {
		rawList = parseStoredWearCategories(body.wear_category);
	}
	if (!rawList) return null;

	const out: string[] = [];
	const seen = new Set<string>();
	for (const item of rawList) {
		if (typeof item !== "string") continue;
		const t = item.trim();
		if (!t || t.length > 160) continue;
		if (!WEAR_CATEGORY_PRESET_VALUES.has(t)) continue;
		if (seen.has(t)) continue;
		seen.add(t);
		out.push(t);
	}
	if (out.length === 0) return null;
	return sortWearCategories(out);
}

/**
 * PATCH /api/admin/inventory/wear-category
 * Body: { documentId: string; wear_categories: string[] } (preferred)
 *   or { wear_category: string | string[] }
 * Persists multiple presets as a comma-separated `wear_category` string.
 * Updates `tailor_works` and matching `tailor_works_local` (if present).
 * Auth: Firebase ID token for admin (admins collection) or marketing (`marketing_users`,
 * active user with role super_admin | team_lead | bdm | team_member).
 */
export async function PATCH(request: NextRequest) {
	try {
		const authHeader = request.headers.get("authorization");
		if (!authHeader?.startsWith("Bearer ")) {
			return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
		}
		const idToken = authHeader.slice("Bearer ".length).trim();
		let decoded: { uid: string; email?: string };
		try {
			decoded = await adminAuth.verifyIdToken(idToken);
		} catch {
			return NextResponse.json({ error: "Invalid token" }, { status: 401 });
		}

		await assertInventoryEditor(decoded.uid, decoded.email);

		const body = (await request.json()) as Record<string, unknown>;
		const documentId =
			typeof body.documentId === "string" && body.documentId.trim()
				? body.documentId.trim()
				: typeof body.productId === "string" && body.productId.trim()
					? body.productId.trim()
					: null;

		if (!documentId) {
			return NextResponse.json(
				{ error: "documentId or productId is required" },
				{ status: 400 },
			);
		}

		const normalized = normalizePresetListFromBody(body);
		if (!normalized) {
			return NextResponse.json(
				{
					error:
						"Provide at least one valid preset in wear_categories (or wear_category as a non-empty preset list)",
				},
				{ status: 400 },
			);
		}

		const wear_category = serializeWearCategories(normalized);

		const mainRef = adminDb.collection("tailor_works").doc(documentId);
		const mainSnap = await mainRef.get();
		if (!mainSnap.exists) {
			return NextResponse.json({ error: "Product not found" }, { status: 404 });
		}

		const patch = {
			wear_category,
			updatedAt: FieldValue.serverTimestamp(),
		};

		await mainRef.update(patch);

		const localRef = adminDb.collection("tailor_works_local").doc(documentId);
		const localSnap = await localRef.get();
		if (localSnap.exists) {
			await localRef.update(patch);
		}

		return NextResponse.json({
			success: true,
			wear_category,
			wear_categories: normalized,
		});
	} catch (e: unknown) {
		const msg = e instanceof Error ? e.message : "Server error";
		if (msg === "FORBIDDEN") {
			return NextResponse.json({ error: "Forbidden" }, { status: 403 });
		}
		console.error("wear-category PATCH:", e);
		return NextResponse.json({ error: msg }, { status: 500 });
	}
}
