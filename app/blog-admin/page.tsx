"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Newspaper, Eye, TrendingUp, Plus, Calendar, Star, BarChart3, AlertTriangle, ExternalLink } from "lucide-react"
import Link from "next/link"

import { BlogService } from "@/lib/blog-admin/blog-service"
import { useBlogAuth } from "@/contexts/BlogAuthContext"
import type { BlogPost } from "@/types/blog-admin"

const mockArticles: BlogPost[] = [
  {
    id: "1",
    title: "Spring Fashion Trends 2024: Bold Colors and Sustainable Fabrics",
    excerpt:
      "Discover the latest spring fashion trends featuring vibrant colors and eco-friendly materials that are taking the fashion world by storm.",
    content: "This season brings exciting new trends...",
    category: "Trends",
    tags: ["spring", "2024", "sustainable", "colors"],
    images: ["/placeholder.svg?height=400&width=600"],
    published: true,
    featured: true,
    authorId: "mock-author-1",
    authorName: "Fashion Editor",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    title: "Behind the Scenes: Crafting Bespoke Evening Wear",
    excerpt:
      "Take a look at the meticulous process of creating custom evening wear, from initial sketches to the final fitting.",
    content: "The art of bespoke tailoring...",
    category: "Behind the Scenes",
    tags: ["bespoke", "evening wear", "craftsmanship"],
    images: ["/placeholder.svg?height=400&width=600"],
    published: true,
    featured: false,
    authorId: "mock-author-2",
    authorName: "Design Team",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "3",
    title: "Sustainable Fashion: The Future of Luxury",
    excerpt:
      "Exploring how luxury fashion brands are embracing sustainability without compromising on quality and style.",
    content: "Sustainability in fashion...",
    category: "Sustainability",
    tags: ["sustainability", "luxury", "eco-friendly"],
    images: ["/placeholder.svg?height=400&width=600"],
    published: false,
    featured: false,
    authorId: "mock-author-3",
    authorName: "Sustainability Expert",
    createdAt: new Date("2024-01-05"),
    updatedAt: new Date("2024-01-05"),
  },
]

export default function AdminDashboard() {
  const { user, hasPermission, loading: authLoading } = useBlogAuth()
  const [articles, setArticles] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [usingMockData, setUsingMockData] = useState(false) // Track if using mock data

  useEffect(() => {
    if (user) {
      loadDashboardData()
    }
  }, [user])

  const loadDashboardData = async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setError(null)
      setLoading(true)
      setUsingMockData(false) // Reset mock data flag
      
      // Load posts based on user role
      let allNews: BlogPost[]
      if (user.role === 'admin' || user.role === 'editor') {
        // Admins and editors can see all posts
        allNews = await BlogService.getAllPosts()
      } else {
        // Authors can only see their own posts
        const authorName = `${user.firstName} ${user.lastName}`
        allNews = await BlogService.getPostsByAuthor(user.uid, authorName)
      }
      setArticles(allNews)
    } catch (error: any) {
      console.error("Error loading dashboard data:", error)

      // More specific error detection
      if (
        error.code === "permission-denied" ||
        error.message?.includes("permissions") ||
        error.message?.includes("Missing or insufficient permissions")
      ) {
        setError("firebase-permissions")
      } else if (error.code === "unavailable" || error.message?.includes("network")) {
        setError("network")
      } else {
        setError("general")
      }
    } finally {
      setLoading(false)
    }
  }

  const loadMockData = () => {
    setArticles(mockArticles)
    setUsingMockData(true)
    setError(null)
  }

  const publishedCount = articles.filter((article) => article.published).length
  const draftCount = articles.filter((article) => !article.published).length
  const featuredCount = articles.filter((article) => article.featured).length
  const recentArticles = articles.slice(0, 5)

  const stats = [
    {
      title: "Total Articles",
      value: articles.length,
      description: "All articles in system",
      icon: Newspaper,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Published",
      value: publishedCount,
      description: "Live articles",
      icon: Eye,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Drafts",
      value: draftCount,
      description: "Unpublished articles",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Featured",
      value: featuredCount,
      description: "Featured articles",
      icon: Star,
      color: "text-rose-600",
      bgColor: "bg-rose-100 dark:bg-rose-900/20",
    },
  ]

  if (authLoading || loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error === "firebase-permissions") {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Permission Error</h1>
          <p className="text-gray-600 dark:text-gray-400">Unable to access blog data</p>
        </div>

        <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-900/20">
          <Star className="h-4 w-4 text-blue-600" />
          <AlertTitle className="text-blue-800 dark:text-blue-400">Try Demo Mode</AlertTitle>
          <AlertDescription className="text-blue-700 dark:text-blue-300">
            <p className="mb-3">
              Want to see how the dashboard works while troubleshooting? Click below to load sample data and explore
              the interface.
            </p>
            <Button
              onClick={loadMockData}
              className="bg-black hover:bg-gray-800 text-white"
            >
              <Eye className="h-4 w-4 mr-2" />
              Load Demo Data
            </Button>
          </AlertDescription>
        </Alert>

        <Alert className="border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <AlertTriangle className="h-4 w-4 text-orange-600" />
          <AlertTitle className="text-orange-800 dark:text-orange-400">Firestore Permission Denied</AlertTitle>
          <AlertDescription className="text-orange-700 dark:text-orange-300 mt-2">
            <p className="mb-4 font-medium">
              Access to the blog collections is being denied. This could be due to:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-sm mb-4">
              <li>Firestore security rules need to be deployed</li>
              <li>Your user account doesn't have the required permissions</li>
              <li>The news collection doesn't exist yet</li>
            </ul>

            <div className="space-y-3">
              <p className="font-medium">Troubleshooting Steps:</p>
              <div className="grid gap-3">
                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                    1
                  </div>
                  <div>
                    <p className="font-medium">Deploy Firestore Rules</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Run: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">firebase deploy --only firestore:rules</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                    2
                  </div>
                  <div>
                    <p className="font-medium">Create Blog Admin User</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Run: <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">npx tsx scripts/setup-blog-admin.ts</code>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded-lg border">
                  <div className="flex-shrink-0 w-6 h-6 bg-orange-100 dark:bg-orange-900/20 text-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                    3
                  </div>
                  <div>
                    <p className="font-medium">Check Firebase Console</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Verify the blog_users and news collections exist
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </AlertDescription>
        </Alert>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={loadDashboardData} className="bg-black hover:bg-gray-800 text-white">
            <TrendingUp className="h-4 w-4 mr-2" />
            Retry Connection
          </Button>
          <Button variant="outline" asChild>
            <a
              href={`https://console.firebase.google.com/project/stitches-africa/firestore/data`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Open Firebase Console
            </a>
          </Button>
        </div>
      </div>
    )
  }

  if (error === "network") {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Connection Error</h1>
          <p className="text-gray-600 dark:text-gray-400">Unable to reach Firebase</p>
        </div>

        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-400">Network Connection Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">
            <p className="mb-3">Unable to connect to Firebase. This could be due to:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Internet connection issues</li>
              <li>Firebase service temporarily unavailable</li>
              <li>Firewall or network restrictions</li>
            </ul>
          </AlertDescription>
        </Alert>

        <Button onClick={loadDashboardData} className="bg-black hover:bg-gray-800 text-white">
          <TrendingUp className="h-4 w-4 mr-2" />
          Retry Connection
        </Button>
      </div>
    )
  }

  if (error === "general") {
    return (
      <div className="p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Connection error</p>
        </div>

        <Alert className="border-red-200 bg-red-50 dark:bg-red-900/20">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertTitle className="text-red-800 dark:text-red-400">Connection Error</AlertTitle>
          <AlertDescription className="text-red-700 dark:text-red-300">
            Unable to connect to Firebase. Please check your internet connection and Firebase configuration.
          </AlertDescription>
        </Alert>

        <Button onClick={loadDashboardData} className="bg-black hover:bg-gray-800 text-white">
          Retry Connection
        </Button>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
     

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back! Here's what's happening with your content.</p>
        </div>
        <div className="flex gap-3">
          {hasPermission('create_post') && (
            <Link href="/blog-admin/news/create">
              <Button className="bg-black hover:bg-gray-800 text-white">
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">{stat.title}</CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <p className="text-xs text-gray-600 dark:text-gray-400">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Articles and Quick Actions */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent Articles */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Newspaper className="h-5 w-5" />
                Recent Articles
              </CardTitle>
              <CardDescription>Your latest content updates</CardDescription>
            </CardHeader>
            <CardContent>
              {recentArticles.length === 0 ? (
                <div className="text-center py-8">
                  <Newspaper className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 dark:text-gray-400">No articles yet</p>
                  {hasPermission('create_post') && (
                    <Link href="/blog-admin/news/create">
                      <Button className="bg-black hover:bg-gray-800 text-white">Create Your First Post</Button>
                    </Link>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {recentArticles.map((article) => (
                    <div
                      key={article.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm line-clamp-1">{article.title}</h4>
                          <div className="flex gap-1">
                            {article.published ? (
                              <Badge
                                variant="default"
                                className="text-xs bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400"
                              >
                                Published
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-xs">
                                Draft
                              </Badge>
                            )}
                            {article.featured && (
                              <Badge
                                variant="default"
                                className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400"
                              >
                                Featured
                              </Badge>
                            )}
                          </div>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {article.category} • {article.authorName} • {article.createdAt.toLocaleDateString()}
                        </p>
                      </div>
                      <Link href={`/blog-admin/news/${article.id}/edit`}>
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                      </Link>
                    </div>
                  ))}
                  <div className="pt-2">
                    <Link href="/blog-admin/news">
                      <Button variant="outline" className="w-full bg-transparent">
                        View All Posts
                      </Button>
                    </Link>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {hasPermission('create_post') && (
                <Link href="/blog-admin/news/create">
                  <Button className="bg-black hover:bg-gray-800 text-white w-full mb-2">
                    <Plus className="h-4 w-4 mr-2" />
                    Create New Post
                  </Button>
                </Link>
              )}
              <Link href="/blog-admin/news">
                <Button variant="outline" className="w-full mb-2 justify-start bg-transparent">
                  <Newspaper className="h-4 w-4 mr-2" />
                  Manage Posts
                </Button>
              </Link>
              {hasPermission('view_analytics') && (
                <Link href="/blog-admin/analytics">
                  <Button variant="outline" className="w-full justify-start mb-2 bg-transparent">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Analytics
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Content Tips
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <p className="font-medium text-blue-900 dark:text-blue-400 mb-1">SEO Tip</p>
                <p className="text-blue-700 dark:text-blue-300">
                  Use descriptive titles and include relevant keywords in your articles.
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <p className="font-medium text-green-900 dark:text-green-400 mb-1">Engagement</p>
                <p className="text-green-700 dark:text-green-300">
                  Add high-quality images to increase reader engagement.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
