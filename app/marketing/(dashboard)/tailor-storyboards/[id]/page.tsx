import { EditStoryboardClient } from "./EditStoryboardClient";

export default async function EditStoryboardPage({
	params,
}: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await params;

	return <EditStoryboardClient id={id} />;
}
