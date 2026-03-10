"use client"

import { useState, useEffect } from "react";
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Plus, Search, MoreVertical, Edit, Trash2, Eye, Calendar, User, Star } from "lucide-react"
import type { NewsArticle } from "@/types/news"
import { NewsService } from "@/admin-services/news-service"

export default function AdminNewsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string>("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadArticles()
  }, [])

  useEffect(() => {
    filterArticles()
  }, [articles, searchQuery, selectedStatus])

  const loadArticles = async () => {
    try {
      const allNews = await NewsService.getAllNews()
      setArticles(allNews)
    } catch (error) {
      console.error("Error loading articles:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterArticles = () => {
    let filtered = articles

    if (searchQuery) {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.category.toLowerCase().includes(searchQuery.toLowerCase()),
      )
    }

    if (selectedStatus !== "all") {
      if (selectedStatus === "published") {
        filtered = filtered.filter((article) => article.published)
      } else if (selectedStatus === "draft") {
        filtered = filtered.filter((article) => !article.published)
      } else if (selectedStatus === "featured") {
        filtered = filtered.filter((article) => article.featured)
      }
    }

    setFilteredArticles(filtered)
  }

  const handleDeleteArticle = async (id: string) => {
    if (confirm("Are you sure you want to delete this article?")) {
      try {
        await NewsService.deleteNews(id)
        setArticles(articles.filter((article) => article.id !== id))
      } catch (error) {
        console.error("Error deleting article:", error)
      }
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Articles</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your fashion news content</p>
        </div>
        <Link href="/admin/news/news/create">
          <Button className="bg-purple-600 dark:bg-purple-900 text-white dark:text-purple-400 text-sm font-medium">
            <Plus className="h-4 w-4 mr-2" />
            Create Article
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedStatus === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("all")}
                className="bg-rose-600 hover:bg-rose-700"
              >
                All ({articles.length})
              </Button>
              <Button
                variant={selectedStatus === "published" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("published")}
                className="bg-green-600 hover:bg-green-700"
              >
                Published ({articles.filter((a) => a.published).length})
              </Button>
              <Button
                variant={selectedStatus === "draft" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("draft")}
                className="bg-orange-600 hover:bg-orange-700"
              >
                Drafts ({articles.filter((a) => !a.published).length})
              </Button>
              <Button
                variant={selectedStatus === "featured" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedStatus("featured")}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Featured ({articles.filter((a) => a.featured).length})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Articles List */}
      {filteredArticles.length === 0 ? (
        <Card>
          <CardContent className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No articles found</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {searchQuery || selectedStatus !== "all"
                ? "Try adjusting your search or filter criteria"
                : "Get started by creating your first article"}
            </p>
            {!searchQuery && selectedStatus === "all" && (
              <Link href="/admin/news/news/create">
                <Button className="bg-purple-600 dark:bg-purple-900 text-white dark:text-purple-400 text-sm font-medium">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Article
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredArticles.map((article) => (
            <Card key={article.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-0">
                <div className="flex flex-col md:flex-row">
                  {article.images.length > 0 && (
                    <div className="relative md:w-48 h-32 md:h-auto overflow-hidden">
                      <Image
                        src={article.images[0] || "/placeholder.svg"}
                        alt={article.title}
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                  <div className="flex-1 p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="secondary" className="text-xs">
                            {article.category}
                          </Badge>
                          {article.published ? (
                            <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs">
                              Draft
                            </Badge>
                          )}
                          {article.featured && (
                            <Badge className="text-xs bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400">
                              <Star className="h-3 w-3 mr-1" />
                              Featured
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{article.title}</h3>
                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-3 line-clamp-2">{article.excerpt}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span>{article.author}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <span>{article.createdAt.toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {article.published && (
                            <DropdownMenuItem asChild>
                              <Link href={`/news/news/${article.id}`}>
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Link>
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem asChild>
                            <Link href={`/admin/news/news/${article.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDeleteArticle(article.id)}
                            className="text-purple-600 dark:text-purple-400"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
