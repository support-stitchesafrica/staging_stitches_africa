"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Activities, getAllActivities } from "@/admin-services/getAllActivities";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { Boxes, Package } from "lucide-react";

const getStatusColor = (status: string) =>
{
  switch (status)
  {
    case "completed":
      return "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400";
    case "pending":
      return "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400";
    case "cancelled":
      return "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-400";
    case "processing":
      return "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-400";
    default:
      return "bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-400";
  }
};

function formatValue(message: string, value: string | number)
{
  if (message.toLowerCase().includes("order"))
  {
    const amount = parseFloat(String(value));
    return isNaN(amount) ? value : `$${amount.toLocaleString()}`;
  }

  if (message.toLowerCase().includes("inventory"))
  {
    return `${value} units`;
  }

  return value;
}

function formatTimeAgo(timestamp: string)
{
  try
  {
    const date = new Date(timestamp);
    return formatDistanceToNowStrict(date, { addSuffix: true });
  } catch
  {
    return timestamp;
  }
}

export function RecentActivity()
{
  const [activities, setActivities] = useState<Activities[]>([]);

  useEffect(() =>
  {
    const fetch = async () =>
    {
      const data = await getAllActivities();
      setActivities(data);
    };
    fetch();
  }, []);

  return (
    <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg lg:text-xl text-gray-900 dark:text-gray-100">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
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
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                    {activity.name}
                  </p>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  {activity.message}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{formatValue(activity.message, activity.value)}</span>
                  <span>{formatTimeAgo(activity.timestamp)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
