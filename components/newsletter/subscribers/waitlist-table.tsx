"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { MoreVertical, Trash2, MapPin } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { format } from "date-fns"
import type { WaitingListEntry } from "@/lib/firebase/waiting-list"

interface WaitingListTableProps {
  waitingList: WaitingListEntry[]
  onDelete: (entry: WaitingListEntry) => void
  selectedEntries: string[]
  onSelectEntry: (id: string, selected: boolean) => void
  onSelectAll: (selected: boolean) => void
}

export function WaitingListTable({
  waitingList,
  onDelete,
  selectedEntries,
  onSelectEntry,
  onSelectAll,
}: WaitingListTableProps) {
  const allSelected = waitingList.length > 0 && selectedEntries.length === waitingList.length

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-12">
              <Checkbox
                checked={allSelected}
                onCheckedChange={(checked) => onSelectAll(!!checked)}
                aria-label="Select all entries"
              />
            </TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {waitingList.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                No entries found
              </TableCell>
            </TableRow>
          ) : (
            waitingList.map((entry) => (
              <TableRow key={entry.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedEntries.includes(entry.id)}
                    onCheckedChange={(checked) => onSelectEntry(entry.id, !!checked)}
                    aria-label={`Select ${entry?.name || entry.email}`}
                  />
                </TableCell>
                <TableCell className="font-medium">{entry.name || 'N/A'}</TableCell>
                <TableCell>{entry.email}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm">{entry.location || entry.city || entry.country || 'Unknown'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className="text-xs">
                    {entry.createdAt 
                      ? format(entry.createdAt.toDate(), 'MMM dd, yyyy')
                      : 'No date'
                    }
                  </Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => onDelete(entry)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
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