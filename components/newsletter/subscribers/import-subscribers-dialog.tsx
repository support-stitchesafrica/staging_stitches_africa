"use client"

import React, { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, FileText, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { subscriberService, listService } from "@/lib/firebase/collections"

interface ImportSubscribersDialogProps
{
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function ImportSubscribersDialog({ open, onOpenChange, onSuccess }: ImportSubscribersDialogProps)
{
  const [loading, setLoading] = useState(false)
  const [csvData, setCsvData] = useState("")
  const [file, setFile] = useState<File | null>(null)
  const [lists, setLists] = useState<{ id: string; name: string }[]>([])
  const [selectedList, setSelectedList] = useState("")
  const [customList, setCustomList] = useState("")
  const { toast } = useToast()

  // Load lists when dialog opens
  useEffect(() =>
  {
    if (open)
    {
      listService.getAll().then((data) =>
      {
        const normalized = data.map((list: any) => ({
          id: list.id,
          name: list.name || "Untitled List",
        }))
        setLists(normalized)
      }).catch((err) => console.error("Failed to load lists:", err))
    }
  }, [open])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) =>
  {
    const uploadedFile = e.target.files?.[0]
    if (uploadedFile)
    {
      const extension = uploadedFile.name.split(".").pop()?.toLowerCase()

      // Only accept CSV files to avoid chunk loading issues
      if (extension !== "csv")
      {
        toast({
          title: "❌ Unsupported File Type",
          description: "Please upload a CSV file only. Convert XLSX files to CSV format first.",
          variant: "destructive",
        })
        return
      }

      setFile(uploadedFile)
      setCsvData("") // clear textarea if file is chosen
    }
  }

  // Simple CSV parser without external dependencies
  const parseCSV = (text: string): string[][] =>
  {
    const lines = text.trim().split('\n')
    const result: string[][] = []

    for (const line of lines)
    {
      if (line.trim())
      {
        // Handle quoted fields and commas within quotes
        const row: string[] = []
        let current = ''
        let inQuotes = false

        for (let i = 0; i < line.length; i++)
        {
          const char = line[i]

          if (char === '"')
          {
            inQuotes = !inQuotes
          } else if (char === ',' && !inQuotes)
          {
            row.push(current.trim())
            current = ''
          } else
          {
            current += char
          }
        }

        // Add the last field
        row.push(current.trim())
        result.push(row)
      }
    }

    return result
  }

  // Parse CSV data
  const parseData = async (): Promise<string[][]> =>
  {
    if (file)
    {
      const text = await file.text()
      return parseCSV(text)
    } else
    {
      return parseCSV(csvData)
    }
  }

  const validateEmail = (email: string): boolean =>
  {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleImport = async (e: React.FormEvent) =>
  {
    e.preventDefault()
    setLoading(true)

    try
    {
      let listId = selectedList

      // Create new list if needed
      if (!listId && customList.trim())
      {
        listId = await listService.create({
          name: customList.trim(),
          description: "",
          subscriberCount: 0,
        })
      }

      if (!listId) throw new Error("Please select or create a list")

      const rows = await parseData()
      if (rows.length === 0) throw new Error("No data found to import")

      const headers = rows[0].map((h) => h.toLowerCase().trim())
      const emailIndex = headers.indexOf("email")

      // Support multiple variations of name columns
      const firstNameIndex = headers.findIndex(h =>
        h === "firstname" || h === "first_name" || h === "fname" || h === "first name"
      )
      const lastNameIndex = headers.findIndex(h =>
        h === "lastname" || h === "last_name" || h === "lname" || h === "last name"
      )

      if (emailIndex === -1) throw new Error("File must contain an 'email' column")

      let imported = 0
      let skipped = 0
      const errors: string[] = []

      for (let i = 1; i < rows.length; i++)
      {
        const row = rows[i]
        if (!row || row.length === 0) continue

        const email = row[emailIndex]?.trim()
        const firstName = firstNameIndex !== -1 ? row[firstNameIndex]?.trim() || "" : ""
        const lastName = lastNameIndex !== -1 ? row[lastNameIndex]?.trim() || "" : ""

        if (email && validateEmail(email))
        {
          try
          {
            await subscriberService.create({
              email,
              firstName,
              lastName,
              lists: [listId],
              status: "active",
            })
            imported++
          } catch (error)
          {
            const errorMsg = error instanceof Error ? error.message : "Unknown error"
            errors.push(`${email}: ${errorMsg}`)
            skipped++
          }
        } else
        {
          skipped++
          if (email)
          {
            errors.push(`${email}: Invalid email format`)
          }
        }
      }

      // Show detailed results
      const listName = customList || lists.find((l) => l.id === listId)?.name
      let description = `${imported} subscribers imported to ${listName}`

      if (skipped > 0)
      {
        description += `, ${skipped} skipped`
      }

      if (errors.length > 0 && errors.length <= 5)
      {
        description += `\n\nErrors:\n${errors.slice(0, 5).join('\n')}`
      } else if (errors.length > 5)
      {
        description += `\n\n${errors.length} errors occurred. Check console for details.`
        console.warn("Import errors:", errors)
      }

      toast({
        title: imported > 0 ? "✅ Import Completed" : "⚠️ Import Issues",
        description,
        variant: imported > 0 ? "default" : "destructive",
      })

      // Reset form only if some imports succeeded
      if (imported > 0)
      {
        setCsvData("")
        setFile(null)
        setCustomList("")
        setSelectedList("")
        onSuccess()
        onOpenChange(false)
      }
    } catch (error)
    {
      toast({
        title: "❌ Import Failed",
        description: error instanceof Error ? error.message : "Failed to import subscribers.",
        variant: "destructive",
      })
    } finally
    {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif">Import Subscribers</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleImport}>
          <div className="space-y-4 py-4">
            {/* List selection */}
            <div className="space-y-2">
              <Label>Select Existing List</Label>
              <Select value={selectedList} onValueChange={setSelectedList}>
                <SelectTrigger>
                  <SelectValue placeholder="-- Select List --" />
                </SelectTrigger>
                <SelectContent>
                  {lists.map((list) => (
                    <SelectItem key={list.id} value={list.id}>
                      {list.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* New list creation */}
            <div className="space-y-2">
              <Label>Or Create New List</Label>
              <Input
                placeholder="e.g. October Subscribers"
                value={customList}
                onChange={(e) =>
                {
                  setCustomList(e.target.value)
                  setSelectedList("")
                }}
              />
            </div>

            {/* File Upload */}
            <div className="space-y-2">
              <Label>Upload CSV File</Label>
              <Input
                type="file"
                accept=".csv"
                onChange={handleFileChange}
              />
              <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="text-xs text-blue-800">
                  <p className="font-medium mb-1">CSV Format Required</p>
                  <p>Upload a CSV file with columns: <strong>email</strong> (required), <strong>firstName</strong>, <strong>lastName</strong> (optional)</p>
                  <p className="mt-1">For XLSX files, please convert to CSV format first.</p>
                </div>
              </div>
            </div>

            {/* CSV Paste Alternative */}
            <div className="space-y-2">
              <Label>Or Paste CSV Data</Label>
              <Textarea
                placeholder="email,firstName,lastName&#10;john@example.com,John,Doe&#10;jane@example.com,Jane,Smith"
                value={csvData}
                onChange={(e) =>
                {
                  setCsvData(e.target.value)
                  setFile(null)
                }}
                rows={8}
                className="font-mono text-sm"
              />
            </div>

            {/* Preview */}
            {(csvData || file) && (
              <div className="space-y-2">
                <Label>Preview</Label>
                <div className="p-3 bg-gray-50 border rounded-lg">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <FileText className="h-4 w-4" />
                    {file ? `File: ${file.name}` : `${csvData.split('\n').length} lines of CSV data`}
                  </div>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || (!csvData.trim() && !file) || (!selectedList && !customList)}
            >
              <Upload className="mr-2 h-4 w-4" />
              {loading ? "Importing..." : "Import Subscribers"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}