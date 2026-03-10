"use client"

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { RichTextEditor } from '@/components/editor/rich-text-editor'
import { ImageUpload } from '@/components/editor/image-upload'
import { ArrowLeft, Save, Eye, Loader2, X, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { BlogService } from '@/lib/blog-admin/blog-service'
import { useBlogAuth } from '@/contexts/BlogAuthContext'
import { AuthGuard } from '@/components/blog-admin/auth/AuthGuard'
import type { BlogPost, CreateBlogPost } from '@/types/blog-admin'

function EditPostPageContent() {
  const { user, canEditPost, canDeletePost } = useBlogAuth()
  const router = useRouter()
  const params = useParams()
  const postId = params.id as string
  
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [formData, setFormData] = useState<CreateBlogPost>({
    title: "",
    content: "",
    excerpt: "",
    images: [],
    authorId: "",
    authorName: "",
    category: "",
    tags: [],
    featured: false,
    published: false,
  })
  const [tagInput, setTagInput] = useState("")

  useEffect(() => {
    loadPost()
  }, [postId])

  const loadPost = async () => {
    try {
      const postData = await BlogService.getPost(postId)
      if (!postData) {
        router.push('/blog-admin/news')
        return
      }

      // Check if user can edit this post
      if (!canEditPost(postData.authorId)) {
        router.push('/blog-admin/news')
        return
      }

      setPost(postData)
      setFormData({
        title: postData.title,
        content: postData.content,
        excerpt: postData.excerpt,
        images: postData.images,
        authorId: postData.authorId,
        authorName: postData.authorName,
        category: postData.category,
        tags: postData.tags,
        featured: postData.featured,
        published: postData.published,
      })
    } catch (error) {
      console.error("Error loading post:", error)
      router.push('/blog-admin/news')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof CreateBlogPost, value: any) => {
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

  const handleSave = async (publish = false) => {
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Please fill in all required fields")
      return
    }

    setSaving(true)
    try {
      const updateData = { ...formData, published: publish }
      await BlogService.updatePost(postId, updateData)
      
      // Reload post data
      await loadPost()
      
      alert(publish ? "Post published successfully!" : "Post saved successfully!")
    } catch (error) {
      console.error("Error saving post:", error)
      alert("Error saving post. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!post || !canDeletePost(post.authorId)) {
      alert("You don't have permission to delete this post")
      return
    }

    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return
    }

    setDeleting(true)
    try {
      await BlogService.deletePost(postId)
      router.push('/blog-admin/news')
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Error deleting post. Please try again.")
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading post...</p>
        </div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Post Not Found</h1>
          <p className="text-gray-600 mb-6">The post you're looking for doesn't exist or you don't have permission to edit it.</p>
          <Link href="/blog-admin/news">
            <Button className="bg-black hover:bg-gray-800 text-white">Back to Posts</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/blog-admin/news">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Posts
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Edit Post</h1>
            <p className="text-gray-600 dark:text-gray-400">Update your blog content</p>
          </div>
        </div>
        <div className="flex gap-3">
          {canDeletePost(post.authorId) && (
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={deleting || saving}
            >
              {deleting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Delete
            </Button>
          )}
          <Button variant="outline" onClick={() => handleSave(false)} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Save Draft
          </Button>
          <Button onClick={() => handleSave(true)} disabled={saving} className="bg-black hover:bg-gray-800 text-white">
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Eye className="h-4 w-4 mr-2" />}
            {formData.published ? 'Update & Publish' : 'Publish'}
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Post Details</CardTitle>
              <CardDescription>Basic information about your post</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => handleInputChange("title", e.target.value)}
                  placeholder="Enter post title..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="excerpt">Excerpt *</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange("excerpt", e.target.value)}
                  placeholder="Brief description of the post..."
                  rows={3}
                  className="mt-1"
                />
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Content *</CardTitle>
              <CardDescription>Write your post content using the rich text editor</CardDescription>
            </CardHeader>
            <CardContent>
              <RichTextEditor
                content={formData.content}
                onChange={(content) => handleInputChange("content", content)}
                placeholder="Start writing your post..."
              />
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle>Images</CardTitle>
              <CardDescription>
                Upload images for your post. The first image will be the featured image.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload images={formData.images} onChange={(images) => handleInputChange("images", images)} />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Publishing Options */}
          <Card>
            <CardHeader>
              <CardTitle>Publishing</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="featured">Featured Post</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Highlight this post</p>
                </div>
                <Switch
                  id="featured"
                  checked={formData.featured}
                  onCheckedChange={(checked) => handleInputChange("featured", checked)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="published">Published</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Make post public</p>
                </div>
                <Switch
                  id="published"
                  checked={formData.published}
                  onCheckedChange={(checked) => handleInputChange("published", checked)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Post Meta */}
          <Card>
            <CardHeader>
              <CardTitle>Post Meta</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="author">Author</Label>
                <Input
                  id="author"
                  value={formData.authorName}
                  disabled
                  className="mt-1 bg-gray-50 dark:bg-gray-800"
                />
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => handleInputChange("category", e.target.value)}
                  placeholder="e.g., Fashion Trends, Designer Spotlight..."
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="tags">Tags</Label>
                <div className="mt-1 space-y-2">
                  <div className="flex gap-2">
                    <Input
                      id="tags"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleKeyPress}
                      placeholder="Add a tag..."
                      className="flex-1"
                    />
                    <Button type="button" onClick={addTag} size="sm" className="bg-black hover:bg-gray-800 text-white">
                      Add
                    </Button>
                  </div>
                  {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          {tag}
                          <button type="button" onClick={() => removeTag(tag)} className="ml-1 hover:text-red-600">
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Post Info */}
          <Card>
            <CardHeader>
              <CardTitle>Post Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">Created:</span>
                <p className="text-gray-600 dark:text-gray-400">{post.createdAt.toLocaleDateString()}</p>
              </div>
              <div>
                <span className="font-medium">Last Updated:</span>
                <p className="text-gray-600 dark:text-gray-400">{post.updatedAt.toLocaleDateString()}</p>
              </div>
              {post.publishedAt && (
                <div>
                  <span className="font-medium">Published:</span>
                  <p className="text-gray-600 dark:text-gray-400">{post.publishedAt.toLocaleDateString()}</p>
                </div>
              )}
              <div>
                <span className="font-medium">Status:</span>
                <Badge variant={post.published ? "default" : "secondary"} className="ml-2">
                  {post.published ? "Published" : "Draft"}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

export default function EditPostPage() {
  return (
    <AuthGuard>
      <EditPostPageContent />
    </AuthGuard>
  )
}