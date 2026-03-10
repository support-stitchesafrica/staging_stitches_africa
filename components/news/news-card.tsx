import Link from "next/link"
import Image from "next/image"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Calendar, User, Star } from "lucide-react"
import type { NewsArticle } from "@/types/news"

interface NewsCardProps {
  article: NewsArticle
  variant?: "default" | "featured"
}

export function NewsCard({ article, variant = "default" }: NewsCardProps) {
  const isFeatured = variant === "featured" || article.featured

  return (
    <Link href={`/news/${article.id}`}>
      <Card
        className={`group hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden ${
          isFeatured ? "ring-2 ring-rose-200 dark:ring-rose-800" : ""
        }`}
      >
        <div className="relative">
          {article.images.length > 0 && (
            <div className={`relative overflow-hidden ${isFeatured ? "h-64" : "h-48"}`}>
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
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">
              {article.category}
            </Badge>
            {article.tags.slice(0, 2).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <h3
            className={`font-semibold line-clamp-2 group-hover:text-rose-600 transition-colors ${
              isFeatured ? "text-xl" : "text-lg"
            }`}
          >
            {article.title}
          </h3>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">{article.excerpt}</p>
          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-1">
              <User className="h-3 w-3" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{article.publishedAt?.toLocaleDateString()}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
