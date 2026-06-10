import type { SizeGuide } from "@/types/size-guide";
import { GuideStatusBadge } from "./GuideStatusBadge";

interface VersionHistoryListProps
{
    versions: SizeGuide[];
    /** The currently live (approved) guide id, if any */
    liveGuideId?: string;
}

function formatDate(timestamp: { toDate?: () => Date } | Date | null | undefined): string
{
    if (!timestamp) return "—";
    const date =
        typeof (timestamp as any).toDate === "function"
            ? (timestamp as any).toDate()
            : timestamp instanceof Date
                ? timestamp
                : new Date(timestamp as any);
    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

export function VersionHistoryList({ versions, liveGuideId }: VersionHistoryListProps)
{
    if (!versions || versions.length === 0)
    {
        return (
            <p className="text-sm text-gray-500 italic py-4 text-center">
                No version history yet.
            </p>
        );
    }

    // Sort descending by version number
    const sorted = [...versions].sort((a, b) => b.version - a.version);

    return (
        <div className="divide-y divide-gray-100">
            {sorted.map((guide) =>
            {
                const isLive = guide.id === liveGuideId || guide.status === "approved";
                return (
                    <div
                        key={guide.id}
                        className={`flex items-center justify-between py-3 px-1 ${isLive ? "bg-green-50 rounded-lg px-3" : ""
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-semibold text-gray-800 w-16">
                                v{guide.version}
                            </span>
                            <div>
                                <p className="text-sm text-gray-700 font-medium">{guide.title}</p>
                                <p className="text-xs text-gray-500">
                                    {guide.submitted_at
                                        ? `Submitted ${formatDate(guide.submitted_at)}`
                                        : `Created ${formatDate(guide.created_at)}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {isLive && (
                                <span className="text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-full px-2 py-0.5">
                                    Live
                                </span>
                            )}
                            <GuideStatusBadge status={guide.status} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
