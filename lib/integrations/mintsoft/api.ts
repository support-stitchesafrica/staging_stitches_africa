import { mintsoftClient } from "@/lib/mintsoft";

import type {
	MintsoftConnectAction,
	MintsoftNewOrderResult,
	MintsoftOrderRecord,
	MintsoftOrderStatus,
	MintsoftStockLevel,
} from "@/lib/integrations/mintsoft/types-api";
import type { MintsoftOrder } from "@/types/mintsoft";

export async function mintsoftCreateOrder(
	order: MintsoftOrder,
): Promise<MintsoftNewOrderResult[]> {
	const { data } = await mintsoftClient.put<MintsoftNewOrderResult[]>(
		"/api/Order",
		order,
	);
	return Array.isArray(data) ? data : [data as MintsoftNewOrderResult];
}

export async function mintsoftRegisterConnectActions(
	mintsoftOrderId: number,
	action: MintsoftConnectAction,
): Promise<void> {
	await mintsoftClient.put(`/api/Order/${mintsoftOrderId}/ConnectActions`, action);
}

export async function mintsoftGetOrder(
	mintsoftOrderId: number,
): Promise<MintsoftOrderRecord> {
	const { data } = await mintsoftClient.get<MintsoftOrderRecord>(
		`/api/Order/${mintsoftOrderId}`,
	);
	return data;
}

export async function mintsoftSearchOrderByNumber(
	orderNumber: string,
): Promise<MintsoftOrderRecord[]> {
	const { data } = await mintsoftClient.get<MintsoftOrderRecord[]>(
		"/api/Order/Search",
		{
			params: {
				OrderNumber: orderNumber,
				exactMatch: true,
				includeOrderItems: false,
			},
		},
	);
	return Array.isArray(data) ? data : [];
}

export async function mintsoftGetStockLevels(params?: {
	sku?: string;
	warehouseId?: number;
}): Promise<MintsoftStockLevel[]> {
	const { data } = await mintsoftClient.get<MintsoftStockLevel[]>(
		"/api/Product/StockLevels",
		{
			params: {
				SKU: params?.sku,
				WarehouseId: params?.warehouseId,
				Breakdown: false,
			},
		},
	);
	return Array.isArray(data) ? data : [];
}

export async function mintsoftGetStockLevelsUpdatedSince(
	fromDateIso: string,
): Promise<number[]> {
	const { data } = await mintsoftClient.get<number[]>(
		"/api/Product/StockLevels/UpdatedSince",
		{ params: { FromDate: fromDateIso } },
	);
	return Array.isArray(data) ? data : [];
}

export async function mintsoftGetOrderStatuses(): Promise<MintsoftOrderStatus[]> {
	const { data } = await mintsoftClient.get<MintsoftOrderStatus[]>(
		"/api/Order/Statuses",
	);
	return Array.isArray(data) ? data : [];
}
