import { mintsoftCreateOrder } from "@/lib/integrations/mintsoft/api";
import { MintsoftOrder } from "@/types/mintsoft";

/** @deprecated Use mintsoftCreateOrder from lib/integrations/mintsoft/api */
export const createMissionLogixOrder = async (order: MintsoftOrder) => {
	try {
		return await mintsoftCreateOrder(order);
	} catch (error: unknown) {
		const err = error as { response?: { data?: unknown }; message?: string };
		console.error(
			"Mission Logix Error:",
			err?.response?.data || err?.message,
		);
		throw error;
	}
};
