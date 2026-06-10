import { TrackOrderPage } from '@/components/track-order/TrackOrderPage';

export const dynamic = 'force-dynamic';

interface PageProps
{
    params: Promise<{ slug?: string[] }>;
}

export default async function Page({ params }: PageProps)
{
    const { slug } = await params;
    const initialOrderId = slug?.[0] ?? undefined;

    return <TrackOrderPage initialOrderId={initialOrderId} />;
}
