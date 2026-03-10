import Link from "next/link"
import Image from "next/image"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Star, ArrowRight } from "lucide-react"
import type { NewsArticle } from "@/types/news"

interface NewsListProps {
  articles: NewsArticle[]
}

export function NewsList({ articles }: NewsListProps) {
  return (
    <div className="space-y-6">
      {articles.map((article) => (
        <Link key={article.id} href={`/news/${article.id}`}>
          <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row">
                {article.images.length > 0 && (
                  <div className="relative md:w-80 h-48 md:h-auto overflow-hidden">
                    <img
                      src={article.images[0] || "/placeholder.svg"}
                      alt={article.title}
                      className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {article.featured && (
                      <div className="absolute top-3 left-3">
                        <Badge className="bg-rose-600 hover:bg-rose-700">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}
                  </div>
                )}
                <div className="flex-1 p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge variant="secondary" className="text-xs">
                      {article.category}
                    </Badge>
                    {article.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <h3 className="font-semibold text-xl mb-3 group-hover:text-rose-600 transition-colors line-clamp-2">
                    {article.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">{article.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        <span>{article.author}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        <span>{article.publishedAt?.toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-rose-600 group-hover:gap-2 transition-all">
                      <span className="text-sm font-medium">Read more</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
