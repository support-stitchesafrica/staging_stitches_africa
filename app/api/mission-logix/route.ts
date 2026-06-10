import { handleMintsoftPush } from "@/lib/integrations/mintsoft/handler";

/** @deprecated Prefer POST /api/integrations/mintsoft/push-order — same behavior. */
export async function POST(req: Request) {
	return handleMintsoftPush(req);
}
