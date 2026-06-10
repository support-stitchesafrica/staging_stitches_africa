import type { Product } from "@/types";

/** Whether the current browser session can see test products on the storefront. */
export function canViewTestProducts(): boolean {
	if (typeof window === "undefined") return false;

	const isVendor = Boolean(localStorage.getItem("tailorUID"));
	if (isVendor) return true;

	const adminRole = localStorage.getItem("adminRole");
	return adminRole === "admin" || adminRole === "superadmin";
}

export function filterTestProducts<T extends Pick<Product, "isTest">>(
	products: T[],
	canView: boolean,
): T[] {
	if (canView) return products;
	return products.filter((product) => product.isTest !== true);
}
