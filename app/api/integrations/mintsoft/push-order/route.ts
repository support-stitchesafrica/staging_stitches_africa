import { handleMintsoftPush } from "@/lib/integrations/mintsoft/handler";

export async function POST(req: Request) {
	return handleMintsoftPush(req);
}
