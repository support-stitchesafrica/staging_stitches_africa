"use client"

import React, { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select"
import { subCollectService } from "@/lib/firebase/collections"
import { toast } from "sonner"

interface AddSubscriberDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function AddSubscriberDialog({ open, onOpenChange, onSuccess }: AddSubscriberDialogProps) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [folders, setFolders] = useState<any[]>([])
  const [folderId, setFolderId] = useState("")
  const [newFolder, setNewFolder] = useState("")
  const [folderDescription, setFolderDescription] = useState("")

  // Fetch existing folders
  useEffect(() => {
    async function fetchFolders() {
      try {
        const data = await subCollectService.getFolders()
        setFolders(data)
      } catch (err) {
        console.error(err)
      }
    }
    if (open) fetchFolders()
  }, [open])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!folderId && !newFolder.trim()) {
      toast.error("Please select an existing folder or create a new one.")
      return
    }

    setLoading(true)
    try {
      let targetFolderId = folderId

      // Create a new folder if user entered one
      if (!targetFolderId && newFolder.trim()) {
        targetFolderId = await subCollectService.createFolder({
          name: newFolder.trim(),
          description: folderDescription.trim(),
        })
      }

      await subCollectService.addSubscriber(targetFolderId, {
        email,
        firstName,
        lastName,
        status: "active",
      })

      toast.success("Subscriber added successfully!")

      setEmail("")
      setFirstName("")
      setLastName("")
      setFolderId("")
      setNewFolder("")
      setFolderDescription("")
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error(error)
      toast.error("Failed to add subscriber. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-serif">Add New Subscriber</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Folder Selection */}
            <div className="space-y-2">
              <Label>Existing Folder</Label>
              <Select value={folderId} onValueChange={setFolderId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select existing folder" />
                </SelectTrigger>
                <SelectContent>
                  {folders.map((folder) => (
                    <SelectItem key={folder.id} value={folder.id}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* New Folder Name */}
            <div className="space-y-2">
              <Label>Or Create New Folder</Label>
              <Input
                placeholder="Enter new folder name"
                value={newFolder}
                onChange={(e) => {
                  setNewFolder(e.target.value)
                  setFolderId("") // reset selected folder
                }}
              />
            </div>

            {/* Folder Description */}
            {newFolder.trim() && (
              <div className="space-y-2">
                <Label>Folder Description</Label>
                <Input
                  placeholder="Enter folder description"
                  value={folderDescription}
                  onChange={(e) => setFolderDescription(e.target.value)}
                />
              </div>
            )}

          <div className="space-y-2">
              <Label>First Name Address *</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Last Name Address *</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="John"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </div>

            {/* Subscriber Email */}
            <div className="space-y-2">
              <Label>Email Address *</Label>
              <Input
                id="email"
                type="email"
                placeholder="subscriber@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Adding..." : "Add Subscriber"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
