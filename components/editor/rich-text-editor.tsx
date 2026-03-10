"use client"

import { useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator"
import { Toggle } from "@/components/ui/toggle"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link,
  ImageIcon,
  Code,
  Heading1,
  Heading2,
  Heading3,
} from "lucide-react"

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder = "Start writing..." }: RichTextEditorProps) {
  const [editorContent, setEditorContent] = useState(content)

  const handleContentChange = useCallback(
    (newContent: string) => {
      setEditorContent(newContent)
      onChange(newContent)
    },
    [onChange],
  )

  const insertText = (before: string, after = "") => {
    const textarea = document.getElementById("editor-textarea") as HTMLTextAreaElement
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selectedText = editorContent.substring(start, end)
    const newText = editorContent.substring(0, start) + before + selectedText + after + editorContent.substring(end)

    handleContentChange(newText)

    // Restore cursor position
    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + before.length, end + before.length)
    }, 0)
  }

  const formatText = (format: string) => {
    switch (format) {
      case "bold":
        insertText("**", "**")
        break
      case "italic":
        insertText("*", "*")
        break
      case "underline":
        insertText("<u>", "</u>")
        break
      case "strikethrough":
        insertText("~~", "~~")
        break
      case "h1":
        insertText("# ")
        break
      case "h2":
        insertText("## ")
        break
      case "h3":
        insertText("### ")
        break
      case "quote":
        insertText("> ")
        break
      case "code":
        insertText("`", "`")
        break
      case "link":
        insertText("[", "](url)")
        break
      case "image":
        insertText("![alt text](", ")")
        break
      case "ul":
        insertText("- ")
        break
      case "ol":
        insertText("1. ")
        break
    }
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 dark:bg-gray-800 p-2">
        <div className="flex flex-wrap items-center gap-1">
          {/* Text Formatting */}
          <div className="flex items-center gap-1">
            <Toggle size="sm" onClick={() => formatText("bold")} aria-label="Bold">
              <Bold className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" onClick={() => formatText("italic")} aria-label="Italic">
              <Italic className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" onClick={() => formatText("underline")} aria-label="Underline">
              <Underline className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" onClick={() => formatText("strikethrough")} aria-label="Strikethrough">
              <Strikethrough className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Headings */}
          <div className="flex items-center gap-1">
            <Toggle size="sm" onClick={() => formatText("h1")} aria-label="Heading 1">
              <Heading1 className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" onClick={() => formatText("h2")} aria-label="Heading 2">
              <Heading2 className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" onClick={() => formatText("h3")} aria-label="Heading 3">
              <Heading3 className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Lists */}
          <div className="flex items-center gap-1">
            <Toggle size="sm" onClick={() => formatText("ul")} aria-label="Bullet List">
              <List className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" onClick={() => formatText("ol")} aria-label="Numbered List">
              <ListOrdered className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" onClick={() => formatText("quote")} aria-label="Quote">
              <Quote className="h-4 w-4" />
            </Toggle>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Insert */}
          <div className="flex items-center gap-1">
            <Toggle size="sm" onClick={() => formatText("link")} aria-label="Link">
              <Link className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" onClick={() => formatText("image")} aria-label="Image">
              <ImageIcon className="h-4 w-4" />
            </Toggle>
            <Toggle size="sm" onClick={() => formatText("code")} aria-label="Code">
              <Code className="h-4 w-4" />
            </Toggle>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        <textarea
          id="editor-textarea"
          value={editorContent}
          onChange={(e) => handleContentChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[400px] p-4 resize-none border-0 focus:outline-none focus:ring-0 bg-transparent"
        />
      </div>

      {/* Footer */}
      <div className="border-t bg-gray-50 dark:bg-gray-800 p-2 text-xs text-gray-500 dark:text-gray-400">
        <div className="flex items-center justify-between">
          <span>Supports Markdown formatting</span>
          <span>{editorContent.length} characters</span>
        </div>
      </div>
    </div>
  )
}
