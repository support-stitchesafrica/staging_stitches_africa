"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { formatDistanceToNowStrict } from "date-fns";
import { Boxes, Package } from "lucide-react";
import { getTailorActivities, TailorActivity } from "@/admin-services/getTailorActivities";

function formatValue(message: string, value: string | number) {
  if (message.toLowerCase().includes("order")) {
    const amount = parseFloat(String(value));
    return isNaN(amount) ? value : `$${amount.toLocaleString()}`;
  }
  if (message.toLowerCase().includes("inventory")) {
    return `${value} units`;
  }
  return value;
}

function formatTimeAgo(timestamp: string) {
  try {
    const date = new Date(timestamp);
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch {
    return timestamp;
  }
}

export function RecentTailorActivity() {
  const [activities, setActivities] = useState<TailorActivity[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const data = await getTailorActivities();
      setActivities(data);
    };
    fetchData();
  }, []);

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg lg:text-xl text-gray-900 dark:text-gray-100">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
            No activity found
          </p>
        ) : (
          <div className="space-y-4">
            {activities.slice(0, 5).map((activity) => (
              <div
                key={activity.id}
                className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <Avatar className="w-8 h-8 flex-shrink-0">
                  {activity.message.toLowerCase().includes("order") ? (
                    <div className="w-full h-full flex items-center justify-center rounded-full bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400">
                      <Package className="w-4 h-4" />
                    </div>
                  ) : activity.message.toLowerCase().includes("inventory") ? (
                    <div className="w-full h-full flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400">
                      <Boxes className="w-4 h-4" />
                    </div>
                  ) : (
                    <AvatarFallback className="bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-400 text-xs font-medium">
                      {activity.name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {activity.name}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    {activity.message}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatValue(activity.message, activity.value ?? "")}</span>
                    <span>{formatTimeAgo(activity.timestamp)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
