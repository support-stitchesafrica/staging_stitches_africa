"use client"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreVertical, Mail, Trash2, UserX } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import type { Subscriber } from "@/lib/firebase/collections"
import { format } from "date-fns"

interface SubscriberTableProps {
  subscribers: Subscriber[]
  onDelete: (subscriber: Subscriber) => void
  onUnsubscribe: (subscriber: Subscriber) => void
  selectedSubscribers: string[]
  onSelectSubscriber: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
}

export function SubscriberTable({
  subscribers,
  onDelete,
  onUnsubscribe,
  selectedSubscribers,
  onSelectSubscriber,
  onSelectAll,
}: SubscriberTableProps) {
  const allSelected = subscribers.length > 0 && selectedSubscribers.length === subscribers.length

  const getStatusBadge = (status: Subscriber["status"]) => {
    const variants = {
      active: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      unsubscribed: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
      bounced: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    }

    return (
      <Badge variant="secondary" className={variants[status]}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox checked={allSelected} onCheckedChange={onSelectAll} />
            </TableHead>
            <TableHead className="min-w-[200px]">Email</TableHead>
            <TableHead className="min-w-[100px]">Status</TableHead>
            <TableHead className="hidden sm:table-cell min-w-[120px]">Date Added</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subscribers.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center">
                <p className="text-muted-foreground">No subscribers found</p>
              </TableCell>
            </TableRow>
          ) : (
            subscribers.map((subscriber) => (
              <TableRow key={subscriber.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedSubscribers.includes(subscriber.id!)}
                    onCheckedChange={(checked) => onSelectSubscriber(subscriber.id!, checked as boolean)}
                  />
                </TableCell>
                <TableCell className="font-medium">{subscriber.email}</TableCell>
                <TableCell>{getStatusBadge(subscriber.status)}</TableCell>
                <TableCell className="hidden sm:table-cell text-sm text-muted-foreground">
                  {subscriber.createdAt?.toDate ? format(subscriber.createdAt.toDate(), "MMM d, yyyy") : "-"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem>
                        <Mail className="mr-2 h-4 w-4" />
                        Send Email
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onUnsubscribe(subscriber)}>
                        <UserX className="mr-2 h-4 w-4" />
                        Unsubscribe
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => onDelete(subscriber)} className="text-destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
