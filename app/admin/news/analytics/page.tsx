"use client"

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BarChart3, TrendingUp, Eye, Calendar, Star, Users, Clock, Tag } from "lucide-react"
import type { NewsArticle } from "@/types/news"
import { NewsService } from "@/admin-services/news-service"

export default function AnalyticsPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const allNews = await NewsService.getAllNews()
      setArticles(allNews)
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const publishedArticles = articles.filter((article) => article.published)
  const draftArticles = articles.filter((article) => !article.published)
  const featuredArticles = articles.filter((article) => article.featured)

  // Category distribution
  const categoryStats = articles.reduce(
    (acc, article) => {
      acc[article.category] = (acc[article.category] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Author distribution
  const authorStats = articles.reduce(
    (acc, article) => {
      acc[article.author] = (acc[article.author] || 0) + 1
      return acc
    },
    {} as Record<string, number>,
  )

  // Monthly publication stats
  const monthlyStats = publishedArticles.reduce(
    (acc, article) => {
      if (article.publishedAt) {
        const month = article.publishedAt.toLocaleDateString("en-US", { year: "numeric", month: "long" })
        acc[month] = (acc[month] || 0) + 1
      }
      return acc
    },
    {} as Record<string, number>,
  )

  // Recent activity (last 30 days)
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
  const recentArticles = articles.filter((article) => article.createdAt > thirtyDaysAgo)

  const stats = [
    {
      title: "Total Articles",
      value: articles.length,
      description: "All articles in system",
      icon: BarChart3,
      color: "text-blue-600",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
    },
    {
      title: "Published",
      value: publishedArticles.length,
      description: "Live articles",
      icon: Eye,
      color: "text-green-600",
      bgColor: "bg-green-100 dark:bg-green-900/20",
    },
    {
      title: "Drafts",
      value: draftArticles.length,
      description: "Unpublished articles",
      icon: Calendar,
      color: "text-orange-600",
      bgColor: "bg-orange-100 dark:bg-orange-900/20",
    },
    {
      title: "Featured",
      value: featuredArticles.length,
      description: "Featured articles",
      icon: Star,
      color: "text-rose-600",
      bgColor: "bg-rose-100 dark:bg-rose-900/20",
    },
  ]

  if (loading) {
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

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics</h1>
        <p className="text-gray-600 dark:text-gray-400">Insights into your content performance and trends</p>
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

      {/* Analytics Grid */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5" />
              Categories
            </CardTitle>
            <CardDescription>Distribution of articles by category</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(categoryStats).length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No categories yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(categoryStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">{category || "Uncategorized"}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-rose-600 h-2 rounded-full"
                            style={{ width: `${(count / articles.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Author Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Authors
            </CardTitle>
            <CardDescription>Articles by author</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(authorStats).length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No authors yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(authorStats)
                  .sort(([, a], [, b]) => b - a)
                  .map(([author, count]) => (
                    <div key={author} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                          <span className="text-sm font-medium">{author.charAt(0).toUpperCase()}</span>
                        </div>
                        <span className="font-medium">{author}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-orange-600 h-2 rounded-full"
                            style={{ width: `${(count / articles.length) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Publications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Publication Trend
            </CardTitle>
            <CardDescription>Articles published by month</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(monthlyStats).length === 0 ? (
              <p className="text-gray-600 dark:text-gray-400 text-center py-8">No published articles yet</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(monthlyStats)
                  .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
                  .slice(0, 6)
                  .map(([month, count]) => (
                    <div key={month} className="flex items-center justify-between">
                      <span className="font-medium">{month}</span>
                      <div className="flex items-center gap-2">
                        <div className="w-20 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{ width: `${(count / Math.max(...Object.values(monthlyStats))) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-medium w-8 text-right">{count}</span>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Articles created in the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-2xl font-bold text-gray-900 dark:text-white">{recentArticles.length}</span>
                <span className="text-sm text-gray-600 dark:text-gray-400">new articles</span>
              </div>
              {recentArticles.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">Latest articles:</p>
                  {recentArticles.slice(0, 3).map((article) => (
                    <div key={article.id} className="flex items-center justify-between text-sm">
                      <span className="line-clamp-1 flex-1">{article.title}</span>
                      <span className="text-gray-500 dark:text-gray-400 ml-2">
                        {article.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
