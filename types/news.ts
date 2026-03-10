export interface NewsArticle {
  id: string
  title: string
  content: string
  excerpt: string
  images: string[]
  author: string
  category: string
  tags: string[]
  featured: boolean
  published: boolean
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface CreateNewsArticle {
  title: string
  content: string
  excerpt: string
  images: string[]
  author: string
  category: string
  tags: string[]
  featured: boolean
  published: boolean
}

export type NewsViewMode = "grid" | "list"
