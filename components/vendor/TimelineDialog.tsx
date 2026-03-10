"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Clock } from "lucide-react";

interface TimelineDialogProps {
  events: {
    date: string;
    time: string;
    description: string;
    serviceArea: { description: string }[];
  }[];
}

export default function TimelineDialog({ events }: TimelineDialogProps) {
  // sort by latest first
  const sortedEvents = [...(events ?? [])].sort((a, b) => {
    const dateA = new Date(`${a.date}T${a.time}`);
    const dateB = new Date(`${b.date}T${b.time}`);
    return dateB.getTime() - dateA.getTime();
  });

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Track Order
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" /> DHL Tracking Timeline
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px] pr-4">
          <div className="relative border-l border-gray-300 dark:border-gray-700 ml-4 space-y-6">
            {sortedEvents.map((event, idx) => (
              <div key={idx} className="ml-4 relative">
                {/* Dot */}
                <span className="absolute -left-6 top-2 w-3 h-3 rounded-full bg-blue-500"></span>
                <p className="text-sm font-semibold">
                  {event.date} {event.time}
                </p>
                <p className="text-sm">{event.description}</p>
                {event.serviceArea?.[0]?.description && (
                  <p className="text-xs text-gray-500">
                    Location: {event.serviceArea[0].description}
                  </p>
                )}
                {idx < sortedEvents.length - 1 && (
                  <Separator className="my-2 opacity-40" />
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
