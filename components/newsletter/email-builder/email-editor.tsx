import type React from "react"
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import
{
  LinkIcon,
  ImageIcon,
  Type,
  AlignLeft,
  Minus,
  Space,
  Share2,
  Video,
  Code,
  GripVertical,
  Trash2,
  Copy,
  MoveUp,
  MoveDown,
  Settings,
  Palette,
  Columns,
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  Youtube,
  Mail,
  Music,
  Camera,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Block, BlockStyles, TemplateStyles } from "@/lib/firebase/collections"
import { ImageUploadButton } from "./image-upload-button"
import { ImageUploadZone } from "./image-upload-zone"
import { emailImageUploadService } from "@/lib/services/emailImageUpload"

// Helper function to ensure URLs have https:// protocol
function normalizeUrl(url: string): string
{
  if (!url || url.trim() === "") return url
  const trimmed = url.trim()
  // If it already has a protocol, return as is
  if (trimmed.match(/^https?:\/\//i)) return trimmed
  // If it starts with //, add https:
  if (trimmed.startsWith("//")) return `https:${trimmed}`
  // Otherwise add https://
  return `https://${trimmed}`
}

interface EmailEditorProps
{
  content: string
  onChange: (content: string) => void
  initialBlocks?: Block[]
  initialTemplateStyles?: TemplateStyles
}

// Custom TikTok icon component
const TikTokIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-.88-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43V7.83a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.04.74z" />
  </svg>
)

// Custom Pinterest icon component
const PinterestIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="currentColor"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z" />
  </svg>
)

const getSocialIcon = (platform: string) =>
{
  switch (platform.toLowerCase())
  {
    case "facebook":
      return Facebook
    case "twitter":
      return Twitter
    case "instagram":
      return Instagram
    case "linkedin":
      return Linkedin
    case "youtube":
      return Youtube
    case "mail":
      return Mail
    case "tiktok":
      return TikTokIcon
    case "pinterest":
      return PinterestIcon
    default:
      return Share2
  }
}

const validateSocialUrl = (platform: string, url: string): { valid: boolean; error?: string } =>
{
  if (!url || url.trim() === '')
  {
    return { valid: false, error: 'URL is required' }
  }

  const patterns = {
    facebook: /^https?:\/\/(www\.)?facebook\.com\/[\w.-]+/,
    twitter: /^https?:\/\/(www\.)?(twitter\.com|x\.com)\/[\w.-]+/,
    instagram: /^https?:\/\/(www\.)?instagram\.com\/[\w.-]+/,
    linkedin: /^https?:\/\/(www\.)?linkedin\.com\/(in|company)\/[\w.-]+/,
    youtube: /^https?:\/\/(www\.)?youtube\.com\/(channel|c|user)\/[\w.-]+/,
    tiktok: /^https?:\/\/(www\.)?tiktok\.com\/@[\w.-]+/,
    pinterest: /^https?:\/\/(www\.)?pinterest\.com\/[\w.-]+/,
    mail: /^mailto:[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/
  }

  const pattern = patterns[platform.toLowerCase() as keyof typeof patterns]
  if (!pattern)
  {
    return { valid: true } // Allow any URL for unknown platforms
  }

  if (!pattern.test(url))
  {
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1)
    let expectedFormat = ''

    switch (platform.toLowerCase())
    {
      case 'tiktok':
        expectedFormat = 'https://tiktok.com/@yourhandle'
        break
      case 'pinterest':
        expectedFormat = 'https://pinterest.com/yourprofile'
        break
      case 'facebook':
        expectedFormat = 'https://facebook.com/yourpage'
        break
      case 'twitter':
        expectedFormat = 'https://twitter.com/yourhandle or https://x.com/yourhandle'
        break
      case 'instagram':
        expectedFormat = 'https://instagram.com/yourhandle'
        break
      case 'linkedin':
        expectedFormat = 'https://linkedin.com/in/yourprofile'
        break
      case 'youtube':
        expectedFormat = 'https://youtube.com/channel/yourchannel'
        break
      case 'mail':
        expectedFormat = 'mailto:your@email.com'
        break
      default:
        expectedFormat = `https://${platform}.com/yourprofile`
    }

    return {
      valid: false,
      error: `Please enter a valid ${platformName} URL (e.g., ${expectedFormat})`
    }
  }

  return { valid: true }
}

export function EmailEditor({ content, onChange, initialBlocks, initialTemplateStyles }: EmailEditorProps)
{
  const [blocks, setBlocks] = useState<Block[]>([])
  const [selectedBlock, setSelectedBlock] = useState<string | null>(null)
  const [selectedColumnBlock, setSelectedColumnBlock] = useState<{ parentId: string; columnIndex: number; blockId: string } | null>(null)
  const [viewMode, setViewMode] = useState<"edit" | "preview" | "code">("edit")
  const [templateStyles, setTemplateStyles] = useState<TemplateStyles>({
    backgroundColor: "#f5f5f5",
    backgroundImage: "",
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
    fontFamily: "Arial, sans-serif",
    fontSize: "16px",
    lineHeight: "1.6",
    primaryColor: "#1a1a1a",
    secondaryColor: "#666666",
    maxWidth: "600px",
    padding: "20px",
    borderRadius: "0px",
  })
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null)
  const [uploadStates, setUploadStates] = useState<Record<string, {
    isUploading: boolean;
    progress: number;
    error: string | null;
    success?: boolean;
    fileName?: string;
    fileSize?: number;
    uploadedAt?: Date;
  }>>({})
  const [uploadingBlocks, setUploadingBlocks] = useState<Set<string>>(new Set())
  const [socialValidationErrors, setSocialValidationErrors] = useState<Record<string, string>>({})

  useEffect(() =>
  {
    if (initialBlocks && initialBlocks.length > 0)
    {
      setBlocks(initialBlocks)
    } else if (blocks.length === 0)
    {
      setBlocks([
        {
          id: "1",
          type: "heading",
          content: "Welcome to Our Newsletter",
          styles: { textAlign: "center", fontSize: "32px", color: "#1a1a1a", fontWeight: "bold" },
        },
        {
          id: "2",
          type: "text",
          content: "This is your newsletter content. Click to edit and customize.",
          styles: { fontSize: "16px", color: "#666666", padding: "16px 0" },
        },
      ])
    }

    if (initialTemplateStyles)
    {
      setTemplateStyles(initialTemplateStyles)
    }
  }, [initialBlocks, initialTemplateStyles])

  useEffect(() =>
  {
    if (blocks.length > 0)
    {
      const html = generateHTML(blocks, templateStyles)
      const data = JSON.stringify({ blocks, templateStyles, html })
      onChange(data)
    }
  }, [blocks, templateStyles])

  const addBlock = (type: Block["type"], columnCount?: number) =>
  {
    const newBlock: Block = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type),
    }

    if (type === "columns" && columnCount)
    {
      newBlock.columnCount = columnCount
      newBlock.columns = Array.from({ length: columnCount }, (): Block[] => [])
    }

    setBlocks([...blocks, newBlock])
    setSelectedBlock(newBlock.id)
  }

  const getDefaultContent = (type: Block["type"]): string =>
  {
    switch (type)
    {
      case "heading":
        return "New Heading"
      case "text":
        return "Add your text content here. You can format it with different styles."
      case "button":
        return "Click Here"
      case "image":
        return "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=600&h=400&fit=crop"
      case "video":
        return "https://www.youtube.com/embed/dQw4w9WgXcQ"
      case "code":
        return "<div>Your HTML code here</div>"
      case "social":
        return JSON.stringify([
          { platform: "facebook", url: "https://facebook.com" },
          { platform: "twitter", url: "https://twitter.com" },
          { platform: "instagram", url: "https://instagram.com" },
          { platform: "linkedin", url: "https://linkedin.com" },
          { platform: "tiktok", url: "https://tiktok.com/@yourhandle" },
          { platform: "pinterest", url: "https://pinterest.com/yourprofile" },
        ])
      case "columns":
        return ""
      default:
        return ""
    }
  }

  const getDefaultStyles = (type: Block["type"]): BlockStyles =>
  {
    switch (type)
    {
      case "heading":
        return { fontSize: "28px", color: "#1a1a1a", textAlign: "left", fontWeight: "bold", padding: "16px 0" }
      case "text":
        return { fontSize: "16px", color: "#666666", textAlign: "left", padding: "8px 0" }
      case "button":
        return {
          backgroundColor: "#1a1a1a",
          color: "#ffffff",
          padding: "12px 32px",
          textAlign: "center",
          borderRadius: "4px",
          fontSize: "16px",
          fontWeight: "600",
        }
      case "spacer":
        return { padding: "24px 0" }
      case "divider":
        return { padding: "16px 0" }
      default:
        return {}
    }
  }

  const updateBlock = (id: string, updates: Partial<Block>) =>
  {
    setBlocks(blocks.map((block) => (block.id === id ? { ...block, ...updates } : block)))
  }

  // Upload handling functions
  const handleImageUpload = async (blockId: string, file: File) =>
  {
    // Set upload state
    setUploadStates(prev => ({
      ...prev,
      [blockId]: { isUploading: true, progress: 0, error: null }
    }))
    setUploadingBlocks(prev => new Set(prev).add(blockId))

    try
    {
      const uploadedUrl = await emailImageUploadService.uploadImage(
        file,
        undefined, // userId - can be added later if needed
        (progress) =>
        {
          setUploadStates(prev => ({
            ...prev,
            [blockId]: { ...prev[blockId], progress }
          }))
        },
        (error) =>
        {
          setUploadStates(prev => ({
            ...prev,
            [blockId]: { isUploading: false, progress: 0, error }
          }))
        },
        (url) =>
        {
          // Update block with uploaded image URL and metadata
          updateBlock(blockId, {
            content: url,
            uploadMetadata: {
              originalFileName: file.name,
              uploadedAt: new Date(),
              fileSize: file.size
            }
          })

          // Clear upload state
          setUploadStates(prev =>
          {
            const newState = { ...prev }
            delete newState[blockId]
            return newState
          })
          setUploadingBlocks(prev =>
          {
            const newSet = new Set(prev)
            newSet.delete(blockId)
            return newSet
          })
        }
      )
    } catch (error)
    {
      setUploadStates(prev => ({
        ...prev,
        [blockId]: {
          isUploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      }))
      setUploadingBlocks(prev =>
      {
        const newSet = new Set(prev)
        newSet.delete(blockId)
        return newSet
      })
    }
  }

  const handleColumnImageUpload = async (columnBlockId: string, columnIndex: number, blockId: string, file: File) =>
  {
    const uploadKey = `${columnBlockId}-${columnIndex}-${blockId}`

    // Set upload state
    setUploadStates(prev => ({
      ...prev,
      [uploadKey]: { isUploading: true, progress: 0, error: null }
    }))
    setUploadingBlocks(prev => new Set(prev).add(uploadKey))

    try
    {
      const uploadedUrl = await emailImageUploadService.uploadImage(
        file,
        undefined, // userId - can be added later if needed
        (progress) =>
        {
          setUploadStates(prev => ({
            ...prev,
            [uploadKey]: { ...prev[uploadKey], progress }
          }))
        },
        (error) =>
        {
          setUploadStates(prev => ({
            ...prev,
            [uploadKey]: { isUploading: false, progress: 0, error }
          }))
        },
        (url) =>
        {
          // Update column block with uploaded image URL and metadata
          updateColumnBlock(columnBlockId, columnIndex, blockId, {
            content: url,
            uploadMetadata: {
              originalFileName: file.name,
              uploadedAt: new Date(),
              fileSize: file.size
            }
          })

          // Clear upload state
          setUploadStates(prev =>
          {
            const newState = { ...prev }
            delete newState[uploadKey]
            return newState
          })
          setUploadingBlocks(prev =>
          {
            const newSet = new Set(prev)
            newSet.delete(uploadKey)
            return newSet
          })
        }
      )
    } catch (error)
    {
      setUploadStates(prev => ({
        ...prev,
        [uploadKey]: {
          isUploading: false,
          progress: 0,
          error: error instanceof Error ? error.message : 'Upload failed'
        }
      }))
      setUploadingBlocks(prev =>
      {
        const newSet = new Set(prev)
        newSet.delete(uploadKey)
        return newSet
      })
    }
  }

  // Enhanced state management utility functions
  const clearUploadError = (blockId: string) =>
  {
    setUploadStates(prev =>
    {
      const newState = { ...prev }
      if (newState[blockId])
      {
        newState[blockId] = { ...newState[blockId], error: null }
      }
      return newState
    })
  }

  const cancelUpload = (blockId: string) =>
  {
    emailImageUploadService.cancelUpload()
    setUploadStates(prev =>
    {
      const newState = { ...prev }
      delete newState[blockId]
      return newState
    })
    setUploadingBlocks(prev =>
    {
      const newSet = new Set(prev)
      newSet.delete(blockId)
      return newSet
    })
  }

  const getUploadState = (blockId: string) =>
  {
    return uploadStates[blockId] || {
      isUploading: false,
      progress: 0,
      error: null,
      success: false,
      fileName: undefined,
      fileSize: undefined,
      uploadedAt: undefined
    }
  }

  const isBlockUploading = (blockId: string) =>
  {
    return uploadingBlocks.has(blockId)
  }

  // Enhanced updateBlock function with upload metadata support
  const updateBlockWithMetadata = (id: string, updates: Partial<Block>, preserveUploadMetadata: boolean = false) =>
  {
    setBlocks(blocks.map((block) =>
    {
      if (block.id === id)
      {
        const updatedBlock = { ...block, ...updates }
        // Preserve existing upload metadata if requested and not being overridden
        if (preserveUploadMetadata && block.uploadMetadata && !updates.uploadMetadata)
        {
          updatedBlock.uploadMetadata = block.uploadMetadata
        }
        return updatedBlock
      }
      return block
    }))
  }

  const addBlockToColumn = (columnBlockId: string, columnIndex: number, blockType: Block["type"]) =>
  {
    setBlocks(
      blocks.map((block) =>
      {
        if (block.id === columnBlockId && block.columns)
        {
          const newBlock: Block = {
            id: `${Date.now()}-${columnIndex}`,
            type: blockType,
            content: getDefaultContent(blockType),
            styles: getDefaultStyles(blockType),
          }
          const newColumns = [...block.columns]
          newColumns[columnIndex] = [...newColumns[columnIndex], newBlock]
          return { ...block, columns: newColumns }
        }
        return block
      }),
    )
  }

  const updateColumnBlock = (columnBlockId: string, columnIndex: number, blockId: string, updates: Partial<Block>) =>
  {
    setBlocks(
      blocks.map((block) =>
      {
        if (block.id === columnBlockId && block.columns)
        {
          const newColumns = [...block.columns]
          newColumns[columnIndex] = newColumns[columnIndex].map((b) => (b.id === blockId ? { ...b, ...updates } : b))
          return { ...block, columns: newColumns }
        }
        return block
      }),
    )
  }

  const deleteColumnBlock = (columnBlockId: string, columnIndex: number, blockId: string) =>
  {
    setBlocks(
      blocks.map((block) =>
      {
        if (block.id === columnBlockId && block.columns)
        {
          const newColumns = [...block.columns]
          newColumns[columnIndex] = newColumns[columnIndex].filter((b: { id: string }) => b.id !== blockId)
          return { ...block, columns: newColumns }
        }
        return block
      }),
    )
  }

  const duplicateBlock = (id: string) =>
  {
    const blockToDuplicate = blocks.find((b) => b.id === id)
    if (blockToDuplicate)
    {
      const newBlock = { ...blockToDuplicate, id: Date.now().toString() }
      const index = blocks.findIndex((b) => b.id === id)
      const newBlocks = [...blocks]
      newBlocks.splice(index + 1, 0, newBlock)
      setBlocks(newBlocks)
    }
  }

  const deleteBlock = (id: string) =>
  {
    setBlocks(blocks.filter((block) => block.id !== id))
    if (selectedBlock === id) setSelectedBlock(null)
  }

  const moveBlock = (id: string, direction: "up" | "down") =>
  {
    const index = blocks.findIndex((b) => b.id === id)
    if (index === -1) return
    if (direction === "up" && index === 0) return
    if (direction === "down" && index === blocks.length - 1) return

    const newBlocks = [...blocks]
    const targetIndex = direction === "up" ? index - 1 : index + 1
      ;[newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]]
    setBlocks(newBlocks)
  }

  const handleDragStart = (id: string) =>
  {
    setDraggedBlock(id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) =>
  {
    e.preventDefault()
    if (!draggedBlock || draggedBlock === id) return

    const draggedIndex = blocks.findIndex((b) => b.id === draggedBlock)
    const targetIndex = blocks.findIndex((b) => b.id === id)

    const newBlocks = [...blocks]
    const [removed] = newBlocks.splice(draggedIndex, 1)
    newBlocks.splice(targetIndex, 0, removed)
    setBlocks(newBlocks)
  }

  const handleDragEnd = () =>
  {
    setDraggedBlock(null)
  }

  const generateHTML = (blocks: Block[], styles: TemplateStyles) =>
  {
    const backgroundStyle = styles.backgroundImage
      ? `background-image: url(${styles.backgroundImage}); background-size: ${styles.backgroundSize || 'cover'}; background-position: ${styles.backgroundPosition || 'center'}; background-repeat: ${styles.backgroundRepeat || 'no-repeat'};`
      : `background-color: ${styles.backgroundColor || '#f5f5f5'};`

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { 
      margin: 0; 
      padding: 0; 
      ${backgroundStyle}
      font-family: ${styles.fontFamily || 'Arial, sans-serif'}; 
      font-size: ${styles.fontSize || '16px'};
      line-height: ${styles.lineHeight || '1.6'};
    }
    .email-container { 
      max-width: ${styles.maxWidth || '600px'}; 
      margin: 0 auto; 
      background-color: #ffffff; 
      padding: ${styles.padding || '20px'};
      border-radius: ${styles.borderRadius || '0px'};
    }
    img { max-width: 100%; height: auto; display: block; }
    a { text-decoration: none; }
    table { border-collapse: collapse; width: 100%; }
    td { padding: 0; vertical-align: top; }
  </style>
</head>
<body>
  <div class="email-container">
    ${blocks.map((block) => generateBlockHTML(block, styles)).join("")}
  </div>
</body>
</html>
    `.trim()
  }

  const generateBlockHTML = (block: Block, templateStyles: TemplateStyles): string =>
  {
    const styles = block.styles || {}
    const styleString = Object.entries(styles)
      .filter(([key, value]) => value !== "" && value !== null && value !== undefined)
      .map(([key, value]) => `${key.replace(/([A-Z])/g, "-$1").toLowerCase()}: ${value}`)
      .join("; ")

    switch (block.type)
    {
      case "heading":
        return `<h1 style="${styleString}">${block.content}</h1>`
      case "text":
        return `<p style="${styleString}">${block.content}</p>`
      case "image":
        return `<div style="text-align: ${styles.textAlign || "center"}; ${styles.padding ? `padding: ${styles.padding};` : ""}">
          <img src="${block.content}" alt="Newsletter image" style="max-width: 100%; height: auto; ${styles.borderRadius ? `border-radius: ${styles.borderRadius};` : ""}" />
        </div>`
      case "button":
        return `<div style="text-align: ${styles.textAlign || "center"}; padding: 16px 0;">
          <a href="${block.link || "#"}" style="display: inline-block; ${styleString}; text-decoration: none;">${block.content}</a>
        </div>`
      case "divider":
        return `<div style="${styles.padding ? `padding: ${styles.padding};` : "padding: 16px 0;"}">
          <hr style="border: none; border-top: 1px solid #e0e0e0; margin: 0;" />
        </div>`
      case "spacer":
        return `<div style="${styles.padding ? `padding: ${styles.padding};` : "padding: 24px 0;"}"></div>`
      case "social":
        try
        {
          const socialLinks = JSON.parse(block.content)
          const socialIcons = socialLinks
            .map(
              (link: { platform: string; url: string }) =>
              {
                // Use email-safe inline SVG icons or reliable hosted images
                const getSocialIconHtml = (platform: string) =>
                {
                  const iconColor = styles.color || "#1877f2"
                  const iconSize = styles.fontSize || "32px"
                  const iconSizeNum = parseInt(iconSize) || 32

                  switch (platform.toLowerCase())
                  {
                    case 'facebook':
                      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}">
                        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                      </svg>`
                    case 'twitter':
                      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}">
                        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                      </svg>`
                    case 'instagram':
                      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                      </svg>`
                    case 'linkedin':
                      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}">
                        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                      </svg>`
                    case 'youtube':
                      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                      </svg>`
                    case 'tiktok':
                      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}">
                        <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                      </svg>`
                    case 'pinterest':
                      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}">
                        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.174-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.402.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.357-.629-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24.009 12.017 24c6.624 0 11.99-5.367 11.99-11.987C24.007 5.367 18.641.001 12.017.001z"/>
                      </svg>`
                    case 'mail':
                      return `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="${iconColor}">
                        <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-.904.732-1.636 1.636-1.636h3.819l6.545 4.91 6.545-4.91h3.819A1.636 1.636 0 0 1 24 5.457z"/>
                      </svg>`
                    default:
                      return `<div style="width: ${iconSize}; height: ${iconSize}; background: ${iconColor}; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: white; font-size: 12px; font-weight: bold;">${platform.charAt(0).toUpperCase()}</div>`
                  }
                }

                return `<a href="${link.url}" style="display: inline-block; margin: 0 8px; text-decoration: none;">
                  ${getSocialIconHtml(link.platform)}
                </a>`
              }
            )
            .join("")
          return `<div style="text-align: ${styles.textAlign || "center"}; padding: ${styles.padding || "16px 0"};">${socialIcons}</div>`
        } catch
        {
          return ""
        }
      case "video":
        return `<div style="text-align: center; padding: 16px 0;">
          <iframe width="560" height="315" src="${block.content}" frameborder="0" allowfullscreen style="max-width: 100%;"></iframe>
        </div>`
      case "code":
        return block.content
      case "columns":
        if (block.columns && block.columns.length > 0)
        {
          const columnWidth = `${100 / block.columns.length}%`
          return `<table width="100%" cellpadding="0" cellspacing="0" style="padding: 16px 0;">
            <tr>
              ${block.columns
              .map(
                (column: Block[]) => `
                <td width="${columnWidth}" style="vertical-align: top; padding: 0 8px;">
                  ${column.map((b) => generateBlockHTML(b, templateStyles)).join("")}
                </td>
              `,
              )
              .join("")}
            </tr>
          </table>`
        }
        return ""
      default:
        return ""
    }
  }

  const renderBlock = (block: Block, index: number) => (
    <div
      key={block.id}
      draggable
      onDragStart={() => handleDragStart(block.id)}
      onDragOver={(e) => handleDragOver(e, block.id)}
      onDragEnd={handleDragEnd}
      className={cn(
        "group relative cursor-move rounded-lg border-2 p-4 transition-all",
        selectedBlock === block.id ? "border-primary bg-accent" : "border-transparent hover:border-border",
        draggedBlock === block.id && "opacity-50",
      )}
      onClick={() =>
      {
        setSelectedBlock(block.id)
        setSelectedColumnBlock(null)
      }}
    >
      <div className="absolute left-2 top-2 opacity-0 group-hover:opacity-100">
        <GripVertical className="h-4 w-4 text-muted-foreground" />
      </div>

      {/* Block Content Preview */}
      <div className="ml-6">
        {block.type === "heading" && (
          <h2 style={{ ...block.styles } as React.CSSProperties} className="font-bold">
            {block.content}
          </h2>
        )}
        {block.type === "text" && <p style={{ ...block.styles } as React.CSSProperties}>{block.content}</p>}
        {block.type === "image" && (
          <ImageUploadZone
            onImageUploaded={(url) => updateBlock(block.id, { content: url })}
            onUploadProgress={(progress) =>
            {
              setUploadStates(prev => ({
                ...prev,
                [block.id]: { ...prev[block.id], progress }
              }))
            }}
            onUploadError={(error) =>
            {
              setUploadStates(prev => ({
                ...prev,
                [block.id]: { isUploading: false, progress: 0, error }
              }))
            }}
            disabled={uploadingBlocks.has(block.id)}
          >
            <img src={block.content || "/placeholder.svg"} alt="Content" className="max-w-full rounded" />
          </ImageUploadZone>
        )}
        {block.type === "button" && (
          <div style={{ textAlign: block.styles?.textAlign || "center" }}>
            <button style={{ ...block.styles, border: "none", cursor: "pointer" } as React.CSSProperties}>{block.content}</button>
          </div>
        )}
        {block.type === "divider" && <hr className="border-t border-border" />}
        {block.type === "spacer" && (
          <div className="flex items-center justify-center text-xs text-muted-foreground">
            Spacer ({block.styles?.padding || "24px"})
          </div>
        )}
        {block.type === "social" && (
          <div className="flex justify-center gap-2">
            {(() =>
            {
              try
              {
                const socialLinks = JSON.parse(block.content)
                return socialLinks.map((link: { platform: string; url: string }, i: number) =>
                {
                  const Icon = getSocialIcon(link.platform)
                  return (
                    <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-80 transition-opacity">
                      <Icon className="h-4 w-4" />
                    </a>
                  )
                })
              } catch
              {
                return null
              }
            })()}
          </div>
        )}
        {block.type === "video" && block.content && (
          <div className="aspect-video bg-muted rounded overflow-hidden">
            <iframe
              src={block.content}
              className="w-full h-full"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}
        {block.type === "code" && (
          <div className="rounded bg-muted p-2 font-mono text-xs">{block.content.substring(0, 50)}...</div>
        )}
        {block.type === "columns" && block.columns && (
          <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${block.columns.length}, 1fr)` }}>
            {block.columns.map((column: any[], colIndex: number) => (
              <div key={colIndex} className="rounded border border-dashed border-border p-2 min-h-[100px]">
                <div className="text-xs text-muted-foreground mb-2">Column {colIndex + 1}</div>
                {column.map((colBlock) => (
                  <div
                    key={colBlock.id}
                    className={cn(
                      "mb-2 p-2 rounded text-sm cursor-pointer transition-colors group/colblock relative",
                      selectedColumnBlock?.blockId === colBlock.id
                        ? "bg-primary/20 ring-2 ring-primary"
                        : "bg-accent/50 hover:bg-accent"
                    )}
                    onClick={(e) =>
                    {
                      e.stopPropagation()
                      setSelectedColumnBlock({ parentId: block.id, columnIndex: colIndex, blockId: colBlock.id })
                      setSelectedBlock(null)
                    }}
                  >
                    {colBlock.type === "heading" && <div className="font-bold">{colBlock.content}</div>}
                    {colBlock.type === "text" && <div className="line-clamp-2">{colBlock.content}</div>}
                    {colBlock.type === "image" && (
                      <ImageUploadZone
                        onImageUploaded={(url) => updateColumnBlock(block.id, colIndex, colBlock.id, { content: url })}
                        onUploadProgress={(progress) =>
                        {
                          const uploadKey = `${block.id}-${colIndex}-${colBlock.id}`
                          setUploadStates(prev => ({
                            ...prev,
                            [uploadKey]: { ...prev[uploadKey], progress }
                          }))
                        }}
                        onUploadError={(error) =>
                        {
                          const uploadKey = `${block.id}-${colIndex}-${colBlock.id}`
                          setUploadStates(prev => ({
                            ...prev,
                            [uploadKey]: { isUploading: false, progress: 0, error }
                          }))
                        }}
                        disabled={uploadingBlocks.has(`${block.id}-${colIndex}-${colBlock.id}`)}
                        className="min-h-[60px]"
                      >
                        <img src={colBlock.content} alt="" className="max-w-full h-auto rounded" />
                      </ImageUploadZone>
                    )}
                    {colBlock.type === "button" && (
                      <button className="text-xs px-2 py-1 rounded" style={{ backgroundColor: colBlock.styles?.backgroundColor, color: colBlock.styles?.color }}>
                        {colBlock.content}
                      </button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-5 w-5 absolute top-1 right-1 opacity-0 group-hover/colblock:opacity-100"
                      onClick={(e) =>
                      {
                        e.stopPropagation()
                        deleteColumnBlock(block.id, colIndex, colBlock.id)
                      }}
                    >
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                ))}
                <Select onValueChange={(type) => addBlockToColumn(block.id, colIndex, type as Block["type"])}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue placeholder="+ Add block" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="heading">Heading</SelectItem>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="image">Image</SelectItem>
                    <SelectItem value="button">Button</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Block Actions */}
      <div className="absolute right-2 top-2 flex gap-1 opacity-0 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) =>
          {
            e.stopPropagation()
            moveBlock(block.id, "up")
          }}
          disabled={index === 0}
        >
          <MoveUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) =>
          {
            e.stopPropagation()
            moveBlock(block.id, "down")
          }}
          disabled={index === blocks.length - 1}
        >
          <MoveDown className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) =>
          {
            e.stopPropagation()
            duplicateBlock(block.id)
          }}
        >
          <Copy className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-destructive"
          onClick={(e) =>
          {
            e.stopPropagation()
            deleteBlock(block.id)
          }}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )

  const selectedBlockData = blocks.find((b) => b.id === selectedBlock)

  const selectedColumnBlockData = selectedColumnBlock
    ? blocks
      .find((b) => b.id === selectedColumnBlock.parentId)
      ?.columns?.[selectedColumnBlock.columnIndex]
      ?.find((b: { id: string }) => b.id === selectedColumnBlock.blockId)
    : null

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr_320px]">
      {/* Block Palette */}
      <Card className="h-fit">
        <CardContent className="p-4">
          <h3 className="mb-4 text-lg font-semibold">Add Blocks</h3>
          <div className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => addBlock("heading")}
            >
              <Type className="h-4 w-4" />
              Heading
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => addBlock("text")}
            >
              <AlignLeft className="h-4 w-4" />
              Text
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => addBlock("image")}
            >
              <ImageIcon className="h-4 w-4" />
              Image
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => addBlock("button")}
            >
              <LinkIcon className="h-4 w-4" />
              Button
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => addBlock("divider")}
            >
              <Minus className="h-4 w-4" />
              Divider
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => addBlock("spacer")}
            >
              <Space className="h-4 w-4" />
              Spacer
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => addBlock("social")}
            >
              <Share2 className="h-4 w-4" />
              Social Links
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => addBlock("video")}
            >
              <Video className="h-4 w-4" />
              Video
            </Button>
            <Button
              variant="outline"
              className="w-full justify-start gap-2"
              onClick={() => addBlock("code")}
            >
              <Code className="h-4 w-4" />
              Custom HTML
            </Button>

            <div className="pt-2 border-t">
              <Label className="text-xs font-semibold mb-2 block">Column Layouts</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="h-auto py-2 flex-col gap-1"
                  onClick={() => addBlock("columns", 1)}
                >
                  <Columns className="h-4 w-4" />
                  <span className="text-xs">1 Col</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-2 flex-col gap-1"
                  onClick={() => addBlock("columns", 2)}
                >
                  <Columns className="h-4 w-4" />
                  <span className="text-xs">2 Cols</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-2 flex-col gap-1"
                  onClick={() => addBlock("columns", 3)}
                >
                  <Columns className="h-4 w-4" />
                  <span className="text-xs">3 Cols</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-auto py-2 flex-col gap-1"
                  onClick={() => addBlock("columns", 4)}
                >
                  <Columns className="h-4 w-4" />
                  <span className="text-xs">4 Cols</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Canvas */}
      <Card>
        <CardContent className="p-6">
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
            <TabsList className="mb-4">
              <TabsTrigger value="edit">Edit</TabsTrigger>
              <TabsTrigger value="preview">Preview</TabsTrigger>
              <TabsTrigger value="code">HTML</TabsTrigger>
            </TabsList>

            <TabsContent value="edit" className="space-y-2">
              {blocks.length === 0 && (
                <div className="flex h-64 items-center justify-center rounded-lg border-2 border-dashed">
                  <p className="text-sm text-muted-foreground">Add blocks to start building your email</p>
                </div>
              )}
              {blocks.map((block, index) => renderBlock(block, index))}
            </TabsContent>

            <TabsContent value="preview">
              <div
                className="rounded-lg border border-border overflow-hidden"
                style={{
                  backgroundColor: templateStyles.backgroundColor,
                  backgroundImage: templateStyles.backgroundImage ? `url(${templateStyles.backgroundImage})` : 'none',
                  backgroundSize: templateStyles.backgroundSize || 'cover',
                  backgroundPosition: templateStyles.backgroundPosition || 'center',
                  backgroundRepeat: templateStyles.backgroundRepeat || 'no-repeat',
                  minHeight: '400px'
                }}
              >
                <div
                  className="mx-auto bg-white"
                  style={{
                    maxWidth: templateStyles.maxWidth,
                    padding: templateStyles.padding || '20px',
                    borderRadius: templateStyles.borderRadius || '0px',
                    fontFamily: templateStyles.fontFamily,
                    fontSize: templateStyles.fontSize,
                    lineHeight: templateStyles.lineHeight
                  }}
                >
                  {blocks.map((block, index) => (
                    <div key={block.id} dangerouslySetInnerHTML={{ __html: generateBlockHTML(block, templateStyles) }} />
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="code">
              <Textarea value={generateHTML(blocks, templateStyles)} readOnly className="font-mono text-xs" rows={20} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Properties Panel */}
      <Card className="h-fit">
        <CardContent className="p-4">
          <Tabs defaultValue="block">
            <TabsList className="mb-4 w-full">
              <TabsTrigger value="block" className="flex-1">
                <Settings className="mr-2 h-4 w-4" />
                Block
              </TabsTrigger>
              <TabsTrigger value="template" className="flex-1">
                <Palette className="mr-2 h-4 w-4" />
                Style
              </TabsTrigger>
            </TabsList>

            <TabsContent value="block" className="space-y-4">
              {selectedColumnBlockData ? (
                <>
                  <div className="text-xs text-muted-foreground mb-2 p-2 bg-accent rounded">
                    Editing block in column
                  </div>
                  <div className="space-y-2">
                    <Label>Content</Label>
                    {selectedColumnBlockData.type === "image" ? (
                      <div className="space-y-2">
                        <Input
                          value={selectedColumnBlockData.content}
                          onChange={(e) => updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, { content: e.target.value })}
                          placeholder="Image URL"
                        />
                        <div className="text-xs text-muted-foreground text-center">or</div>
                        <ImageUploadButton
                          onImageUploaded={(url) =>
                          {
                            updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, {
                              content: url,
                              uploadMetadata: {
                                originalFileName: 'uploaded-image',
                                uploadedAt: new Date(),
                                fileSize: 0
                              }
                            })
                          }}
                          onUploadProgress={(progress) =>
                          {
                            const uploadKey = `${selectedColumnBlock!.parentId}-${selectedColumnBlock!.columnIndex}-${selectedColumnBlock!.blockId}`
                            setUploadStates(prev => ({
                              ...prev,
                              [uploadKey]: {
                                ...prev[uploadKey],
                                progress: Math.round(progress),
                                isUploading: true,
                                error: null
                              }
                            }))
                          }}
                          onUploadError={(error) =>
                          {
                            const uploadKey = `${selectedColumnBlock!.parentId}-${selectedColumnBlock!.columnIndex}-${selectedColumnBlock!.blockId}`
                            setUploadStates(prev => ({
                              ...prev,
                              [uploadKey]: { isUploading: false, progress: 0, error }
                            }))
                          }}
                          currentImageUrl={selectedColumnBlockData.content}
                          disabled={uploadingBlocks.has(`${selectedColumnBlock!.parentId}-${selectedColumnBlock!.columnIndex}-${selectedColumnBlock!.blockId}`)}
                        />
                        {(() =>
                        {
                          const uploadKey = `${selectedColumnBlock!.parentId}-${selectedColumnBlock!.columnIndex}-${selectedColumnBlock!.blockId}`
                          const uploadState = getUploadState(uploadKey)
                          return (
                            <>
                              {/* Upload progress indicator */}
                              {uploadState.isUploading && (
                                <div className="text-xs text-muted-foreground">
                                  Uploading... {uploadState.progress}%
                                </div>
                              )}
                              {/* Error handling */}
                              {uploadState.error && (
                                <div className="space-y-1">
                                  <p className="text-xs text-destructive">{uploadState.error}</p>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => clearUploadError(uploadKey)}
                                    className="h-6 text-xs"
                                  >
                                    Dismiss
                                  </Button>
                                </div>
                              )}
                              {/* Upload metadata display */}
                              {selectedColumnBlockData.uploadMetadata && (
                                <div className="text-xs text-muted-foreground space-y-1">
                                  <div>Uploaded: {selectedColumnBlockData.uploadMetadata.originalFileName}</div>
                                  {selectedColumnBlockData.uploadMetadata.uploadedAt && (
                                    <div>Date: {new Date(selectedColumnBlockData.uploadMetadata.uploadedAt).toLocaleDateString()}</div>
                                  )}
                                </div>
                              )}
                            </>
                          )
                        })()}
                      </div>
                    ) : selectedColumnBlockData.type === "code" ? (
                      <Textarea
                        value={selectedColumnBlockData.content}
                        onChange={(e) => updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, { content: e.target.value })}
                        rows={5}
                        className="font-mono text-xs"
                      />
                    ) : (
                      <Textarea
                        value={selectedColumnBlockData.content}
                        onChange={(e) => updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, { content: e.target.value })}
                        rows={3}
                      />
                    )}
                  </div>

                  {selectedColumnBlockData.type === "button" && (
                    <div className="space-y-2">
                      <Label>Link URL</Label>
                      <Input
                        value={selectedColumnBlockData.link || ""}
                        onChange={(e) => updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, { link: e.target.value })}
                        onBlur={(e) =>
                        {
                          // Normalize URL when user finishes typing
                          const normalized = normalizeUrl(e.target.value)
                          if (normalized !== e.target.value)
                          {
                            updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, { link: normalized })
                          }
                        }}
                        placeholder="https://example.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        URLs will automatically get https:// added if missing
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Text Align</Label>
                    <div className="flex gap-2">
                      {(["left", "center", "right"] as const).map((align) => (
                        <Button
                          key={align}
                          variant={selectedColumnBlockData.styles?.textAlign === align ? "default" : "outline"}
                          size="sm"
                          className="flex-1"
                          onClick={() =>
                            updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, {
                              styles: { ...selectedColumnBlockData.styles, textAlign: align },
                            })
                          }
                        >
                          {align}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Font Size</Label>
                    <Input
                      value={selectedColumnBlockData.styles?.fontSize || "16px"}
                      onChange={(e) =>
                        updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, {
                          styles: { ...selectedColumnBlockData.styles, fontSize: e.target.value },
                        })
                      }
                      placeholder="16px"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Text Color</Label>
                    <div className="flex gap-2">
                      <Input
                        type="color"
                        value={selectedColumnBlockData.styles?.color || "#000000"}
                        onChange={(e) =>
                          updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, {
                            styles: { ...selectedColumnBlockData.styles, color: e.target.value },
                          })
                        }
                        className="w-16"
                      />
                      <Input
                        value={selectedColumnBlockData.styles?.color || "#000000"}
                        onChange={(e) =>
                          updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, {
                            styles: { ...selectedColumnBlockData.styles, color: e.target.value },
                          })
                        }
                        placeholder="#000000"
                      />
                    </div>
                  </div>

                  {selectedColumnBlockData.type === "button" && (
                    <div className="space-y-2">
                      <Label>Background Color</Label>
                      <div className="flex gap-2">
                        <Input
                          type="color"
                          value={selectedColumnBlockData.styles?.backgroundColor || "#000000"}
                          onChange={(e) =>
                            updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, {
                              styles: { ...selectedColumnBlockData.styles, backgroundColor: e.target.value },
                            })
                          }
                          className="w-16"
                        />
                        <Input
                          value={selectedColumnBlockData.styles?.backgroundColor || "#000000"}
                          onChange={(e) =>
                            updateColumnBlock(selectedColumnBlock!.parentId, selectedColumnBlock!.columnIndex, selectedColumnBlock!.blockId, {
                              styles: { ...selectedColumnBlockData.styles, backgroundColor: e.target.value },
                            })
                          }
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  )}
                </>
              ) : selectedBlockData ? (
                <>
                  {selectedBlockData.type === "columns" && (
                    <div className="space-y-2">
                      <Label>Column Count</Label>
                      <Select
                        value={selectedBlockData!.columnCount?.toString() || "2"}
                        onValueChange={(value) =>
                        {
                          const count = parseInt(value)
                          const newColumns = Array.from({ length: count }, (_, i) =>
                            selectedBlockData.columns?.[i] || []
                          )
                          updateBlock(selectedBlockData.id, { columnCount: count, columns: newColumns })
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 Column</SelectItem>
                          <SelectItem value="2">2 Columns</SelectItem>
                          <SelectItem value="3">3 Columns</SelectItem>
                          <SelectItem value="4">4 Columns</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Content</Label>
                    {selectedBlockData.type === "image" ? (
                      <div className="space-y-2">
                        <Input
                          value={selectedBlockData.content}
                          onChange={(e) => updateBlock(selectedBlockData.id, { content: e.target.value })}
                          placeholder="Image URL"
                        />
                        <div className="text-xs text-muted-foreground text-center">or</div>
                        <ImageUploadButton
                          onImageUploaded={(url) =>
                          {
                            updateBlock(selectedBlockData.id, {
                              content: url,
                              uploadMetadata: {
                                originalFileName: 'uploaded-image',
                                uploadedAt: new Date(),
                                fileSize: 0
                              }
                            })
                          }}
                          onUploadProgress={(progress) =>
                          {
                            setUploadStates(prev => ({
                              ...prev,
                              [selectedBlockData.id]: {
                                ...prev[selectedBlockData.id],
                                progress: Math.round(progress),
                                isUploading: true,
                                error: null
                              }
                            }))
                          }}
                          onUploadError={(error) =>
                          {
                            setUploadStates(prev => ({
                              ...prev,
                              [selectedBlockData.id]: { isUploading: false, progress: 0, error }
                            }))
                          }}
                          currentImageUrl={selectedBlockData.content}
                          disabled={isBlockUploading(selectedBlockData.id)}
                        />
                        {/* Upload progress indicator */}
                        {getUploadState(selectedBlockData.id).isUploading && (
                          <div className="text-xs text-muted-foreground">
                            Uploading... {getUploadState(selectedBlockData.id).progress}%
                          </div>
                        )}
                        {/* Error handling with retry option */}
                        {getUploadState(selectedBlockData.id).error && (
                          <div className="space-y-1">
                            <p className="text-xs text-destructive">{getUploadState(selectedBlockData.id).error}</p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => clearUploadError(selectedBlockData.id)}
                              className="h-6 text-xs"
                            >
                              Dismiss
                            </Button>
                          </div>
                        )}
                        {/* Upload metadata display */}
                        {selectedBlockData.uploadMetadata && (
                          <div className="text-xs text-muted-foreground space-y-1">
                            <div>Uploaded: {selectedBlockData.uploadMetadata.originalFileName}</div>
                            {selectedBlockData.uploadMetadata.uploadedAt && (
                              <div>Date: {new Date(selectedBlockData.uploadMetadata.uploadedAt).toLocaleDateString()}</div>
                            )}
                          </div>
                        )}
                      </div>
                    ) : selectedBlockData.type === "video" ? (
                      <Input
                        value={selectedBlockData.content}
                        onChange={(e) => updateBlock(selectedBlockData.id, { content: e.target.value })}
                        placeholder="Video embed URL (YouTube, Vimeo)"
                      />
                    ) : selectedBlockData.type === "social" ? (
                      <div className="space-y-3">
                        {(() =>
                        {
                          try
                          {
                            const socialLinks = JSON.parse(selectedBlockData.content)
                            return socialLinks.map((link: { platform: string; url: string }, index: number) =>
                            {
                              const Icon = getSocialIcon(link.platform)
                              return (
                                <div key={index} className="space-y-2 p-3 border rounded-lg">
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <Label className="capitalize">{link.platform}</Label>
                                  </div>
                                  <div className="space-y-1">
                                    <Input
                                      value={link.url}
                                      onChange={(e) =>
                                      {
                                        const newUrl = e.target.value
                                        const validationKey = `${selectedBlockData.id}-${index}`

                                        // Clear previous validation error
                                        setSocialValidationErrors(prev =>
                                        {
                                          const newErrors = { ...prev }
                                          delete newErrors[validationKey]
                                          return newErrors
                                        })

                                        // Update the URL
                                        const newLinks = [...socialLinks]
                                        newLinks[index] = { ...link, url: newUrl }
                                        updateBlock(selectedBlockData.id, { content: JSON.stringify(newLinks) })

                                        // Validate URL if not empty
                                        if (newUrl.trim())
                                        {
                                          const validation = validateSocialUrl(link.platform, newUrl)
                                          if (!validation.valid)
                                          {
                                            setSocialValidationErrors(prev => ({
                                              ...prev,
                                              [validationKey]: validation.error || 'Invalid URL'
                                            }))
                                          }
                                        }
                                      }}
                                      placeholder={(() =>
                                      {
                                        switch (link.platform.toLowerCase())
                                        {
                                          case 'tiktok':
                                            return 'https://tiktok.com/@yourhandle'
                                          case 'pinterest':
                                            return 'https://pinterest.com/yourprofile'
                                          case 'facebook':
                                            return 'https://facebook.com/yourpage'
                                          case 'twitter':
                                            return 'https://twitter.com/yourhandle'
                                          case 'instagram':
                                            return 'https://instagram.com/yourhandle'
                                          case 'linkedin':
                                            return 'https://linkedin.com/in/yourprofile'
                                          case 'youtube':
                                            return 'https://youtube.com/channel/yourchannel'
                                          case 'mail':
                                            return 'mailto:your@email.com'
                                          default:
                                            return `https://${link.platform}.com/yourpage`
                                        }
                                      })()}
                                      className={socialValidationErrors[`${selectedBlockData.id}-${index}`] ? 'border-destructive' : ''}
                                    />
                                    {socialValidationErrors[`${selectedBlockData.id}-${index}`] && (
                                      <p className="text-xs text-destructive">
                                        {socialValidationErrors[`${selectedBlockData.id}-${index}`]}
                                      </p>
                                    )}
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="w-full text-destructive"
                                    onClick={() =>
                                    {
                                      const newLinks = socialLinks.filter((_: any, i: number) => i !== index)
                                      updateBlock(selectedBlockData.id, { content: JSON.stringify(newLinks) })
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 mr-2" />
                                    Remove
                                  </Button>
                                </div>
                              )
                            })
                          } catch
                          {
                            return <p className="text-sm text-muted-foreground">Invalid social links data</p>
                          }
                        })()}
                        <Select
                          onValueChange={(platform) =>
                          {
                            try
                            {
                              const socialLinks = JSON.parse(selectedBlockData.content)
                              const newLinks = [...socialLinks, { platform, url: `https://${platform}.com` }]
                              updateBlock(selectedBlockData.id, { content: JSON.stringify(newLinks) })
                            } catch
                            {
                              updateBlock(selectedBlockData.id, { content: JSON.stringify([{ platform, url: `https://${platform}.com` }]) })
                            }
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="+ Add social platform" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="facebook">Facebook</SelectItem>
                            <SelectItem value="twitter">Twitter</SelectItem>
                            <SelectItem value="instagram">Instagram</SelectItem>
                            <SelectItem value="linkedin">LinkedIn</SelectItem>
                            <SelectItem value="youtube">YouTube</SelectItem>
                            <SelectItem value="tiktok">TikTok</SelectItem>
                            <SelectItem value="pinterest">Pinterest</SelectItem>
                            <SelectItem value="mail">Email</SelectItem>
                          </SelectContent>
                        </Select>

                        <div className="space-y-2 pt-2 border-t">
                          <Label>Social Icon Styling</Label>
                          <div className="space-y-2">
                            <div>
                              <Label className="text-xs">Icon Size</Label>
                              <Input
                                value={selectedBlockData.styles?.fontSize || "32px"}
                                onChange={(e) =>
                                  updateBlock(selectedBlockData.id, {
                                    styles: { ...selectedBlockData.styles, fontSize: e.target.value },
                                  })
                                }
                                placeholder="32px"
                              />
                            </div>
                            <div>
                              <Label className="text-xs">Icon Color</Label>
                              <div className="flex gap-2">
                                <Input
                                  type="color"
                                  value={selectedBlockData.styles?.color || "#1877f2"}
                                  onChange={(e) =>
                                    updateBlock(selectedBlockData.id, {
                                      styles: { ...selectedBlockData.styles, color: e.target.value },
                                    })
                                  }
                                  className="w-16"
                                />
                                <Input
                                  value={selectedBlockData.styles?.color || "#1877f2"}
                                  onChange={(e) =>
                                    updateBlock(selectedBlockData.id, {
                                      styles: { ...selectedBlockData.styles, color: e.target.value },
                                    })
                                  }
                                  placeholder="#1877f2"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : selectedBlockData.type === "code" ? (
                      <Textarea
                        value={selectedBlockData.content}
                        onChange={(e) => updateBlock(selectedBlockData.id, { content: e.target.value })}
                        rows={5}
                        className="font-mono text-xs"
                      />
                    ) : selectedBlockData.type !== "divider" && selectedBlockData.type !== "spacer" && selectedBlockData.type !== "columns" ? (
                      <Textarea
                        value={selectedBlockData.content}
                        onChange={(e) => updateBlock(selectedBlockData.id, { content: e.target.value })}
                        rows={3}
                      />
                    ) : null}
                  </div>

                  {selectedBlockData.type === "button" && (
                    <div className="space-y-2">
                      <Label>Link URL</Label>
                      <Input
                        value={selectedBlockData.link || ""}
                        onChange={(e) => updateBlock(selectedBlockData.id, { link: e.target.value })}
                        onBlur={(e) =>
                        {
                          // Normalize URL when user finishes typing
                          const normalized = normalizeUrl(e.target.value)
                          if (normalized !== e.target.value)
                          {
                            updateBlock(selectedBlockData.id, { link: normalized })
                          }
                        }}
                        placeholder="https://example.com"
                      />
                      <p className="text-xs text-muted-foreground">
                        URLs will automatically get https:// added if missing
                      </p>
                    </div>
                  )}

                  {selectedBlockData.type !== "divider" && selectedBlockData.type !== "spacer" && selectedBlockData.type !== "columns" && selectedBlockData.type !== "social" && (
                    <>
                      <div className="space-y-2">
                        <Label>Text Align</Label>
                        <div className="flex gap-2">
                          {(["left", "center", "right"] as const).map((align) => (
                            <Button
                              key={align}
                              variant={selectedBlockData.styles?.textAlign === align ? "default" : "outline"}
                              size="sm"
                              className="flex-1"
                              onClick={() =>
                                updateBlock(selectedBlockData.id, {
                                  styles: { ...selectedBlockData.styles, textAlign: align },
                                })
                              }
                            >
                              {align}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Font Size</Label>
                        <Input
                          value={selectedBlockData.styles?.fontSize || "16px"}
                          onChange={(e) =>
                            updateBlock(selectedBlockData.id, {
                              styles: { ...selectedBlockData.styles, fontSize: e.target.value },
                            })
                          }
                          placeholder="16px"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Font Weight</Label>
                        <Select
                          value={selectedBlockData.styles?.fontWeight || "normal"}
                          onValueChange={(value) =>
                            updateBlock(selectedBlockData.id, {
                              styles: { ...selectedBlockData.styles, fontWeight: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="100">Thin</SelectItem>
                            <SelectItem value="200">Extra Light</SelectItem>
                            <SelectItem value="300">Light</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="500">Medium</SelectItem>
                            <SelectItem value="600">Semi Bold</SelectItem>
                            <SelectItem value="bold">Bold</SelectItem>
                            <SelectItem value="800">Extra Bold</SelectItem>
                            <SelectItem value="900">Black</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Font Family</Label>
                        <Select
                          value={selectedBlockData.styles?.fontFamily || "inherit"}
                          onValueChange={(value) =>
                            updateBlock(selectedBlockData.id, {
                              styles: { ...selectedBlockData.styles, fontFamily: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="inherit">Inherit</SelectItem>
                            <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                            <SelectItem value="Georgia, serif">Georgia</SelectItem>
                            <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                            <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                            <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                            <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                            <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                            <SelectItem value="'Palatino Linotype', serif">Palatino</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Line Height</Label>
                        <Input
                          value={selectedBlockData.styles?.lineHeight || ""}
                          onChange={(e) =>
                            updateBlock(selectedBlockData.id, {
                              styles: { ...selectedBlockData.styles, lineHeight: e.target.value },
                            })
                          }
                          placeholder="1.6"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Letter Spacing</Label>
                        <Input
                          value={selectedBlockData.styles?.letterSpacing || ""}
                          onChange={(e) =>
                            updateBlock(selectedBlockData.id, {
                              styles: { ...selectedBlockData.styles, letterSpacing: e.target.value },
                            })
                          }
                          placeholder="0px"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Text Transform</Label>
                        <Select
                          value={selectedBlockData.styles?.textTransform || "none"}
                          onValueChange={(value: "none" | "capitalize" | "uppercase" | "lowercase" | "initial" | "inherit") =>
                            updateBlock(selectedBlockData.id, {
                              styles: { ...selectedBlockData.styles, textTransform: value },
                            })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="uppercase">UPPERCASE</SelectItem>
                            <SelectItem value="lowercase">lowercase</SelectItem>
                            <SelectItem value="capitalize">Capitalize</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label>Text Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={selectedBlockData!.styles?.color || "#000000"}
                            onChange={(e) =>
                              updateBlock(selectedBlockData!.id, {
                                styles: { ...selectedBlockData!.styles, color: e.target.value },
                              })
                            }
                            className="w-16"
                          />
                          <Input
                            value={selectedBlockData.styles?.color || "#000000"}
                            onChange={(e) =>
                              updateBlock(selectedBlockData.id, {
                                styles: { ...selectedBlockData.styles, color: e.target.value },
                              })
                            }
                            placeholder="#000000"
                          />
                        </div>
                      </div>

                      {selectedBlockData.type === "button" && (
                        <div className="space-y-2">
                          <Label>Background Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={selectedBlockData.styles?.backgroundColor || "#000000"}
                              onChange={(e) =>
                                updateBlock(selectedBlockData.id, {
                                  styles: { ...selectedBlockData.styles, backgroundColor: e.target.value },
                                })
                              }
                              className="w-16"
                            />
                            <Input
                              value={selectedBlockData.styles?.backgroundColor || "#000000"}
                              onChange={(e) =>
                                updateBlock(selectedBlockData.id, {
                                  styles: { ...selectedBlockData.styles, backgroundColor: e.target.value },
                                })
                              }
                              placeholder="#000000"
                            />
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Border</Label>
                        <Input
                          value={selectedBlockData.styles?.border || ""}
                          onChange={(e) =>
                            updateBlock(selectedBlockData.id, {
                              styles: { ...selectedBlockData.styles, border: e.target.value },
                            })
                          }
                          placeholder="1px solid #ccc"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Border Radius</Label>
                        <Input
                          value={selectedBlockData.styles?.borderRadius || "0px"}
                          onChange={(e) =>
                            updateBlock(selectedBlockData.id, {
                              styles: { ...selectedBlockData.styles, borderRadius: e.target.value },
                            })
                          }
                          placeholder="4px"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Margin</Label>
                        <Input
                          value={selectedBlockData.styles?.margin || ""}
                          onChange={(e) =>
                            updateBlock(selectedBlockData.id, {
                              styles: { ...selectedBlockData.styles, margin: e.target.value },
                            })
                          }
                          placeholder="10px 0"
                        />
                      </div>

                      {selectedBlockData.type !== "image" && (
                        <div className="space-y-2">
                          <Label>Background Color</Label>
                          <div className="flex gap-2">
                            <Input
                              type="color"
                              value={selectedBlockData.styles?.backgroundColor || "#ffffff"}
                              onChange={(e) =>
                                updateBlock(selectedBlockData.id, {
                                  styles: { ...selectedBlockData.styles, backgroundColor: e.target.value },
                                })
                              }
                              className="w-16"
                            />
                            <Input
                              value={selectedBlockData.styles?.backgroundColor || ""}
                              onChange={(e) =>
                                updateBlock(selectedBlockData.id, {
                                  styles: { ...selectedBlockData.styles, backgroundColor: e.target.value },
                                })
                              }
                              placeholder="transparent"
                            />
                          </div>
                        </div>
                      )}

                      {selectedBlockData.type === "image" && (
                        <>
                          <div className="space-y-2">
                            <Label>Width</Label>
                            <Input
                              value={selectedBlockData.styles?.width || ""}
                              onChange={(e) =>
                                updateBlock(selectedBlockData.id, {
                                  styles: { ...selectedBlockData.styles, width: e.target.value },
                                })
                              }
                              placeholder="100%"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label>Height</Label>
                            <Input
                              value={selectedBlockData.styles?.height || ""}
                              onChange={(e) =>
                                updateBlock(selectedBlockData.id, {
                                  styles: { ...selectedBlockData.styles, height: e.target.value },
                                })
                              }
                              placeholder="auto"
                            />
                          </div>
                        </>
                      )}
                    </>
                  )}

                  <div className="space-y-2">
                    <Label>Padding</Label>
                    <Input
                      value={selectedBlockData.styles?.padding || ""}
                      onChange={(e) =>
                        updateBlock(selectedBlockData.id, {
                          styles: { ...selectedBlockData.styles, padding: e.target.value },
                        })
                      }
                      placeholder="16px 0"
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Select a block to edit its properties</p>
              )}
            </TabsContent>

            <TabsContent value="template" className="space-y-4">
              <div className="space-y-4">
                <div className="text-sm font-medium">Background</div>

                <div className="space-y-2">
                  <Label>Background Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={templateStyles.backgroundColor || "#f5f5f5"}
                      onChange={(e) => setTemplateStyles({ ...templateStyles, backgroundColor: e.target.value })}
                      className="w-16"
                    />
                    <Input
                      value={templateStyles.backgroundColor || "#f5f5f5"}
                      onChange={(e) => setTemplateStyles({ ...templateStyles, backgroundColor: e.target.value })}
                      placeholder="#f5f5f5"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Background Image URL</Label>
                  <Input
                    value={templateStyles.backgroundImage || ""}
                    onChange={(e) => setTemplateStyles({ ...templateStyles, backgroundImage: e.target.value })}
                    placeholder="https://example.com/background.jpg"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Background Presets</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplateStyles({
                        ...templateStyles,
                        backgroundImage: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                        backgroundColor: "#667eea"
                      })}
                    >
                      Purple Gradient
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplateStyles({
                        ...templateStyles,
                        backgroundImage: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
                        backgroundColor: "#f093fb"
                      })}
                    >
                      Pink Gradient
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplateStyles({
                        ...templateStyles,
                        backgroundImage: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
                        backgroundColor: "#4facfe"
                      })}
                    >
                      Blue Gradient
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplateStyles({
                        ...templateStyles,
                        backgroundImage: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
                        backgroundColor: "#43e97b"
                      })}
                    >
                      Green Gradient
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplateStyles({
                        ...templateStyles,
                        backgroundImage: "data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23e0e0e0' fill-opacity='0.1'%3E%3Ccircle cx='30' cy='30' r='4'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E",
                        backgroundColor: "#f8f9fa"
                      })}
                    >
                      Dots Pattern
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setTemplateStyles({
                        ...templateStyles,
                        backgroundImage: "",
                        backgroundColor: "#ffffff"
                      })}
                    >
                      Clear
                    </Button>
                  </div>
                </div>

                {templateStyles.backgroundImage && (
                  <>
                    <div className="space-y-2">
                      <Label>Background Size</Label>
                      <Select
                        value={templateStyles.backgroundSize || "cover"}
                        onValueChange={(value) => setTemplateStyles({ ...templateStyles, backgroundSize: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cover</SelectItem>
                          <SelectItem value="contain">Contain</SelectItem>
                          <SelectItem value="auto">Auto</SelectItem>
                          <SelectItem value="100% 100%">Stretch</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Background Position</Label>
                      <Select
                        value={templateStyles.backgroundPosition || "center"}
                        onValueChange={(value) => setTemplateStyles({ ...templateStyles, backgroundPosition: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="center">Center</SelectItem>
                          <SelectItem value="top">Top</SelectItem>
                          <SelectItem value="bottom">Bottom</SelectItem>
                          <SelectItem value="left">Left</SelectItem>
                          <SelectItem value="right">Right</SelectItem>
                          <SelectItem value="top left">Top Left</SelectItem>
                          <SelectItem value="top right">Top Right</SelectItem>
                          <SelectItem value="bottom left">Bottom Left</SelectItem>
                          <SelectItem value="bottom right">Bottom Right</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Background Repeat</Label>
                      <Select
                        value={templateStyles.backgroundRepeat || "no-repeat"}
                        onValueChange={(value) => setTemplateStyles({ ...templateStyles, backgroundRepeat: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="no-repeat">No Repeat</SelectItem>
                          <SelectItem value="repeat">Repeat</SelectItem>
                          <SelectItem value="repeat-x">Repeat X</SelectItem>
                          <SelectItem value="repeat-y">Repeat Y</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="text-sm font-medium">Typography</div>

                <div className="space-y-2">
                  <Label>Font Family</Label>
                  <Select
                    value={templateStyles.fontFamily || "Arial, sans-serif"}
                    onValueChange={(value) => setTemplateStyles({ ...templateStyles, fontFamily: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Arial, sans-serif">Arial</SelectItem>
                      <SelectItem value="Georgia, serif">Georgia</SelectItem>
                      <SelectItem value="'Courier New', monospace">Courier New</SelectItem>
                      <SelectItem value="'Times New Roman', serif">Times New Roman</SelectItem>
                      <SelectItem value="Verdana, sans-serif">Verdana</SelectItem>
                      <SelectItem value="Helvetica, sans-serif">Helvetica</SelectItem>
                      <SelectItem value="'Trebuchet MS', sans-serif">Trebuchet MS</SelectItem>
                      <SelectItem value="'Palatino Linotype', serif">Palatino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Base Font Size</Label>
                  <Input
                    value={templateStyles.fontSize || "16px"}
                    onChange={(e) => setTemplateStyles({ ...templateStyles, fontSize: e.target.value })}
                    placeholder="16px"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Line Height</Label>
                  <Input
                    value={templateStyles.lineHeight || "1.6"}
                    onChange={(e) => setTemplateStyles({ ...templateStyles, lineHeight: e.target.value })}
                    placeholder="1.6"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="text-sm font-medium">Layout</div>

                <div className="space-y-2">
                  <Label>Max Width</Label>
                  <Input
                    value={templateStyles.maxWidth || "600px"}
                    onChange={(e) => setTemplateStyles({ ...templateStyles, maxWidth: e.target.value })}
                    placeholder="600px"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Container Padding</Label>
                  <Input
                    value={templateStyles.padding || "20px"}
                    onChange={(e) => setTemplateStyles({ ...templateStyles, padding: e.target.value })}
                    placeholder="20px"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Container Border Radius</Label>
                  <Input
                    value={templateStyles.borderRadius || "0px"}
                    onChange={(e) => setTemplateStyles({ ...templateStyles, borderRadius: e.target.value })}
                    placeholder="0px"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t">
                <div className="text-sm font-medium">Colors</div>

                <div className="space-y-2">
                  <Label>Primary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={templateStyles.primaryColor || "#1a1a1a"}
                      onChange={(e) => setTemplateStyles({ ...templateStyles, primaryColor: e.target.value })}
                      className="w-16"
                    />
                    <Input
                      value={templateStyles.primaryColor || "#1a1a1a"}
                      onChange={(e) => setTemplateStyles({ ...templateStyles, primaryColor: e.target.value })}
                      placeholder="#1a1a1a"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Secondary Color</Label>
                  <div className="flex gap-2">
                    <Input
                      type="color"
                      value={templateStyles.secondaryColor || "#666666"}
                      onChange={(e) => setTemplateStyles({ ...templateStyles, secondaryColor: e.target.value })}
                      className="w-16"
                    />
                    <Input
                      value={templateStyles.secondaryColor || "#666666"}
                      onChange={(e) => setTemplateStyles({ ...templateStyles, secondaryColor: e.target.value })}
                      placeholder="#666666"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div >
  )
}
