import { handleMintsoftOrderWebhook } from "@/lib/integrations/mintsoft/webhook-handler";

export async function POST(req: Request) {
	return handleMintsoftOrderWebhook(req, "despatched");
}
