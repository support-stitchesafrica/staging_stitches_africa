"use client"

import type React from "react"
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { RichTextEditor } from "@/components/editor/rich-text-editor"
import { ImageUpload } from "@/components/editor/image-upload"
import { ArrowLeft, Save, Eye, Loader2, X, Trash2, ExternalLink } from "lucide-react"
import Link from "next/link"
import type { CreateNewsArticle, NewsArticle } from "@/types/news"
import { NewsService } from "@/admin-services/news-service"

// ✅ Helper: safely convert Firestore timestamp or Date to JS Date
function toDate(value: any): Date {
  if (!value) return new Date()
  if (value instanceof Date) return value
  if (value.seconds) return new Date(value.seconds * 1000)
  return new Date(value)
}

export default function EditNewsPage() {
  const router = useRouter()
  const params = useParams() // { id: string }
  const id = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [article, setArticle] = useState<NewsArticle | null>(null)
  const [formData, setFormData] = useState<CreateNewsArticle>({
    title: "",
    content: "",
    excerpt: "",
    images: [],
    author: "",
    category: "",
    tags: [],
    featured: false,
    published: false,
  })
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    if (id) loadArticle()
  }, [id])

  const loadArticle = async () => {
    try {
      const articleData = await NewsService.getNewsById(id as string)
      if (articleData) {
        setArticle(articleData)
        setFormData({
          title: articleData.title,
          content: articleData.content,
          excerpt: articleData.excerpt,
          images: articleData.images,
          author: articleData.author,
          category: articleData.category,
          tags: articleData.tags,
          featured: articleData.featured,
          published: articleData.published,
        })
      } else {
        router.push("/admin/news")
      }
    } catch (error) {
      console.error("Error loading article:", error)
      router.push("/admin/news")
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateNewsArticle, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const addTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      handleInputChange("tags", [...formData.tags, tagInput.trim()])
      setTagInput("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    handleInputChange(
      "tags",
      formData.tags.filter((tag) => tag !== tagToRemove),
    )
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault()
      addTag()
    }
  }

  const handleSave = async (publish?: boolean) => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.author.trim()) {
      alert("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      const updateData = { ...formData }
      if (publish !== undefined) {
        updateData.published = publish
      }
      await NewsService.updateNews(id as string, updateData)
      await loadArticle()
      alert("Article updated successfully!")
    } catch (error) {
      console.error("Error updating article:", error)
      alert("Error updating article. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await NewsService.deleteNews(id as string)
      router.push("/admin/news")
    } catch (error) {
      console.error("Error deleting article:", error)
      alert("Error deleting article. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    )
  }

  if (!article) {
    return (
      <div className="p-6 max-w-4xl mx-auto text-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Article Not Found</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">The article you're looking for doesn't exist.</p>
        <Link href="/admin/news">
          <Button>Back to Articles</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/news">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Articles
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Article</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Last updated: {toDate(article.updatedAt).toLocaleDateString()} at {toDate(article.updatedAt).toLocaleTimeString()}
            </p>
          </div>
        </div>
        <div className="flex gap-3">
          {article.published && (
            <Link href={`/news/${article.id}`} target="_blank">
              <Button variant="outline" size="sm">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Live
              </Button>
            </Link>
          )}
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700 bg-transparent">
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Article</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete "{article.title}"? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                  {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                  Delete Article
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
          <Button variant="outline" onClick={() => handleSave()} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Changes
          </Button>
          {formData.published ? (
            <Button onClick={() => handleSave(false)} disabled={saving} variant="outline">
              Unpublish
            </Button>
          ) : (
            <Button onClick={() => handleSave(true)} disabled={saving} className="bg-rose-600 hover:bg-rose-700">
              {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
              Publish
            </Button>
          )}
        </div>
      </div>

      {/* Status Banner */}
      <div className="flex items-center gap-2">
        {formData.published ? (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <Eye className="h-3 w-3 mr-1" />
            Published
          </Badge>
        ) : (
          <Badge variant="secondary">Draft</Badge>
        )}
        {formData.featured && (
          <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">Featured</Badge>
        )}
        <span className="text-sm text-gray-500 dark:text-gray-400">
          Created: {toDate(article.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* ... Keep your remaining UI (Content Editor, Images, Sidebar, etc.) unchanged ... */}
    </div>
  )
}
