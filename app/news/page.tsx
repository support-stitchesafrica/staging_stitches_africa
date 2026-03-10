"use client"

import { useState, useEffect } from "react";
import { NewsGrid } from "@/components/news/news-grid"
import { NewsList } from "@/components/news/news-list"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BracketsIcon, CompassIcon, Grid, List, Menu, Newspaper, Phone, Search, Star, UserPlus } from "lucide-react"
import type { NewsArticle, NewsViewMode } from "@/types/news"
import { NewsService } from "@/admin-services/news-service"
import Link from "next/link"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import Image from "next/image"

export default function NewsPage()
{
  const [articles, setArticles] = useState<NewsArticle[]>([])
  const [filteredArticles, setFilteredArticles] = useState<NewsArticle[]>([])
  const [viewMode, setViewMode] = useState<NewsViewMode>("grid")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() =>
  {
    loadNews()
  }, [])

  useEffect(() =>
  {
    filterArticles()
  }, [articles, searchQuery, selectedCategory])

  const loadNews = async () =>
  {
    try
    {
      const publishedNews = await NewsService.getPublishedNews()
      setArticles(publishedNews)
    } catch (error)
    {
      console.error("Error loading news:", error)
    } finally
    {
      setLoading(false)
    }
  }

  const filterArticles = () =>
  {
    let filtered = articles

    if (searchQuery)
    {
      filtered = filtered.filter(
        (article) =>
          article.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
          article.tags.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    }

    if (selectedCategory)
    {
      filtered = filtered.filter((article) => article.category === selectedCategory)
    }

    setFilteredArticles(filtered)
  }

  const categories = Array.from(new Set(articles.map((article) => article.category)))

  if (loading)
  {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-8">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="hidden md:flex items-center justify-between px-8 border-b border-gray-200">
        {/* Logo */}
        <Link href="/shops" className="flex items-center space-x-2 flex-shrink-0">
          <Image
            src="/Stitches-Africa-Logo-06.png"
            alt="Stitches Africa"
            width={120}
            height={50}
            className=""
            priority
          />
        </Link>

        {/* Desktop Nav */}
        <nav className="flex items-center space-x-8">
          <Link
            href="/"
            className="text-gray-700 hover:text-black transition-colors"
          >
            Home
          </Link>
          <Link
            href="/about"
            className="text-gray-700 hover:text-black transition-colors"
          >
            About
          </Link>
          <Link
            href="/featured"
            className="text-gray-700 hover:text-black transition-colors"
          >
            Featured
          </Link>
          <Link
            href="/brand"
            className="text-gray-700 hover:text-black transition-colors font-semibold"
          >
            Brands
          </Link>
          <Link
            href="/contact"
            className="text-gray-700 hover:text-black transition-colors"
          >
            Contact Us
          </Link>
          <Link
            href="/news"
            className="text-gray-700 hover:text-black transition-colors"
          >
            News
          </Link>
          <Link
            href="/vendor"
            className="text-gray-700 hover:text-black transition-colors"
          >
            Sign up
          </Link>
        </nav>
      </header>

      {/* Mobile Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-md md:hidden">
        <div className="flex justify-around items-center py-2">
          <Link href="/" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <img src="/Stitches-Africa-Logo-06.png" alt="logo" className="w-10 h-10" />
          </Link>
          <Link href="/about" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <CompassIcon className="h-5 w-5" />
            <span className="text-xs mt-1">About</span>
          </Link>
          <Link href="/featured" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <Star className="h-5 w-5" />
            <span className="text-xs mt-1">Featured</span>
          </Link>
          <Link href="/brand" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <BracketsIcon className="h-5 w-5" />
            <span className="text-xs mt-1">Brands</span>
          </Link>

          <Link href="/news" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <Newspaper className="h-5 w-5" />
            <span className="text-xs mt-1">News</span>
          </Link>
          <Link href="/vendor" className="flex flex-col items-center text-gray-700 hover:text-black transition-colors">
            <UserPlus className="h-5 w-5" />
            <span className="text-xs mt-1">Sign Up</span>
          </Link>
        </div>
      </nav>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">Fashion News</h1>
          <p className="text-gray-600 dark:text-gray-300">Stay updated with the latest in bespoke fashion</p>
        </div>

        {/* Filters and Controls */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search articles..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedCategory === "" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory("")}
                  className="bg-rose-600 hover:bg-rose-700"
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="bg-rose-600 hover:bg-rose-700"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing {filteredArticles.length} of {articles.length} articles
          </p>
        </div>

        {/* News Display */}
        {filteredArticles.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No articles found</h3>
            <p className="text-gray-600 dark:text-gray-400">Try adjusting your search or filter criteria</p>
          </div>
        ) : viewMode === "grid" ? (
          <NewsGrid articles={filteredArticles} />
        ) : (
          <NewsList articles={filteredArticles} />
        )}
      </div>
    </div>
  )
}
