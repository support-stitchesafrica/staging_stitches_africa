"use client"

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation"
import { Calendar, User, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { NewsArticle } from "@/types/news"
import { NewsService } from "@/admin-services/news-service"

export function BlogSection() {
  const [posts, setPosts] = useState<NewsArticle[]>([])
  const router = useRouter()

  useEffect(() => {
    const fetchNews = async () => {
      const published = await NewsService.getPublishedNews()
      setPosts(published.slice(0, 3)) // only 3 latest
    }
    fetchNews()
  }, [])

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold mb-4 text-balance">Fashion Insights & Stories</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
            Stay informed with the latest trends, designer interviews, and cultural insights from the world of African fashion
          </p>
        </div>

        {/* Posts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {posts.map((post) => (
            <Card
              key={post.id}
              className="group hover:shadow-lg transition-shadow duration-300 cursor-pointer"
              onClick={() => router.push(`/news/${post.id}`)}
            >
              <CardContent className="p-0">
                {/* Image */}
                <div className="aspect-[5/3] overflow-hidden rounded-t-lg">
                  <img
                    src={post.images?.[0] || "/placeholder.svg"}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-[#E2725B] bg-[#E2725B]/10 px-2 py-1 rounded">
                      {post.category || "General"}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-3 text-balance group-hover:text-[#E2725B] transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4 text-pretty">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <User className="w-3 h-3 mr-1" />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="w-3 h-3 mr-1" />
                      <span>
                        {post.publishedAt
                          ? new Date(post.publishedAt).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* View All Button */}
        <div className="text-center">
          <Button
            variant="outline"
            size="lg"
            className="group bg-transparent"
            onClick={() => router.push("/news")}
          >
            View All Articles
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  )
}
