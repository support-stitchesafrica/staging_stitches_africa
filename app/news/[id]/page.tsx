"use client";

import { useState, useEffect } from "react";
import { use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
	ArrowLeft,
	Calendar,
	User,
	Share2,
	Star,
	ChevronLeft,
	ChevronRight,
} from "lucide-react";
import type { NewsArticle } from "@/types/news";
import { NewsService } from "@/admin-services/news-service";

interface NewsDetailPageProps {
	params: Promise<{
		id: string;
	}>;
}

export default function NewsDetailPage({ params }: NewsDetailPageProps) {
	const { id } = use(params);
	const router = useRouter();

	const [article, setArticle] = useState<NewsArticle | null>(null);
	const [relatedArticles, setRelatedArticles] = useState<NewsArticle[]>([]);
	const [currentImageIndex, setCurrentImageIndex] = useState(0);
	const [loading, setLoading] = useState(true);

	useEffect(() => {
		loadArticle();
	}, [id]);

	const loadArticle = async () => {
		try {
			const articleData = await NewsService.getNewsById(id);
			if (articleData && articleData.published) {
				setArticle(articleData);
				const allNews = await NewsService.getPublishedNews();
				const related = allNews
					.filter(
						(a) =>
							a.id !== articleData.id && a.category === articleData.category
					)
					.slice(0, 3);
				setRelatedArticles(related);
			} else {
				router.push("/news");
			}
		} catch (error) {
			console.error("Error loading article:", error);
			router.push("/news");
		} finally {
			setLoading(false);
		}
	};

	const handleShare = async () => {
		if (navigator.share && article) {
			try {
				await navigator.share({
					title: article.title,
					text: article.excerpt,
					url: window.location.href,
				});
			} catch {
				navigator.clipboard.writeText(window.location.href);
				alert("Article URL copied to clipboard!");
			}
		} else {
			navigator.clipboard.writeText(window.location.href);
			alert("Article URL copied to clipboard!");
		}
	};

	const nextImage = () => {
		if (article && article.images.length > 1) {
			setCurrentImageIndex((prev) => (prev + 1) % article.images.length);
		}
	};

	const prevImage = () => {
		if (article && article.images.length > 1) {
			setCurrentImageIndex(
				(prev) => (prev - 1 + article.images.length) % article.images.length
			);
		}
	};

	// ✅ Auto slideshow
	useEffect(() => {
		if (!article || article.images.length <= 1) return;

		const interval = setInterval(() => {
			setCurrentImageIndex((prev) => (prev + 1) % article.images.length);
		}, 5000); // 5 seconds

		return () => clearInterval(interval);
	}, [article]);

	const formatContent = (content: string) => {
		return content
			.split(/\n\n+/) // Split by double newlines for paragraphs
			.map((paragraph) => {
				let formatted = paragraph
					.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
					.replace(/\*(.*?)\*/g, "<em>$1</em>")
					.replace(/`(.*?)`/g, "<code>$1</code>")
					.replace(/^### (.*$)/gm, "<h3>$1</h3>")
					.replace(/^## (.*$)/gm, "<h2>$1</h2>")
					.replace(/^# (.*$)/gm, "<h1>$1</h1>")
					.replace(/^> (.*$)/gm, "<blockquote>$1</blockquote>");

				// Don't wrap headers or blockquotes in <p>
				if (formatted.match(/^<h[1-6]|<blockquote/)) {
					return formatted;
				}
				return `<p>${formatted.replace(/\n/g, "<br />")}</p>`;
			})
			.join("");
	};

	if (loading) {
		return (
			<div className="min-h-screen">
				<div className="container mx-auto px-4 py-8">
					<div className="animate-pulse space-y-8 max-w-4xl mx-auto">
						<div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
						<div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
						<div className="space-y-4">
							<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
							<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
							<div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-5/6"></div>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (!article) {
		return (
			<div className="min-h-screen">
				<div className="container max-w-7xl mx-auto px-4 py-16 text-center">
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
						Article Not Found
					</h1>
					<p className="text-gray-600 dark:text-gray-400 mb-6">
						The article you're looking for doesn't exist or is no longer
						available.
					</p>
					<Link href="/news">
						<Button className="bg-rose-600 hover:bg-rose-700">
							Back to News
						</Button>
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-white dark:bg-white">
			{/* Header */}
			<header className="flex flex-wrap items-center justify-between px-4 md:px-8 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 sticky top-0 z-50">
				<Link href="/" className="flex items-center space-x-2 flex-shrink-0">
					<Image
						src="/Stitches-Africa-Logo-06.png"
						alt="Stitches Africa"
						width={120}
						height={60}
						className=""
						priority
					/>
				</Link>
				<nav className="hidden md:flex items-center space-x-4 md:space-x-8 mt-4 md:mt-0">
					<Link
						href="/"
						className="text-gray-900 font-medium hover:text-rose-600 transition-colors"
					>
						Home
					</Link>
					<Link
						href="/featured"
						className="text-gray-900 font-medium hover:text-rose-600 transition-colors"
					>
						Featured
					</Link>
					<Link
						href="/contact"
						className="text-gray-900 font-medium hover:text-rose-600 transition-colors"
					>
						Contact Us
					</Link>
					<a
						href="/news"
						className="text-gray-900 font-medium hover:text-rose-600 transition-colors"
					>
						News
					</a>
				</nav>
			</header>

			<div className="container max-w-7xl mx-auto px-4 py-8">
				{/* Navigation */}
				<div className="mb-8">
					<Link href="/news">
						<Button variant="ghost" className="mb-4">
							<ArrowLeft className="h-4 w-4 mr-2" /> Back to News
						</Button>
					</Link>
				</div>

				{/* Article */}
				<article className="max-w-4xl mx-auto">
					{/* Header */}
					<header className="mb-8">
						<div className="flex flex-wrap items-center gap-2 mb-4">
							<Badge variant="secondary">{article.category}</Badge>
							{article.featured && (
								<Badge className="bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
									<Star className="h-3 w-3 mr-1" /> Featured
								</Badge>
							)}
							{article.tags.slice(0, 3).map((tag) => (
								<Badge key={tag} variant="outline" className="text-xs">
									{tag}
								</Badge>
							))}
						</div>

						<h1 className="text-3xl md:text-5xl font-bold text-black dark:text-black mb-6 leading-tight">
							{article.title}
						</h1>

						<p className="text-xl md:text-2xl text-black dark:text-black mb-6 leading-relaxed font-medium">
							{article.excerpt}
						</p>

						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-700">
							<div className="flex items-center gap-4 text-black dark:text-gray-300">
								<div className="flex items-center gap-2">
									<User className="h-4 w-4" />
									<span className="font-medium text-black dark:text-black">
										{article.author}
									</span>
								</div>
								<div className="flex items-center gap-2">
									<Calendar className="h-4 w-4" />
									<span className="font-medium text-black dark:text-black">
										{article.publishedAt?.toLocaleDateString()}
									</span>
								</div>
							</div>
							<Button variant="outline" size="sm" onClick={handleShare}>
								<Share2 className="h-4 w-4 mr-2" /> Share
							</Button>
						</div>
					</header>

					{/* Featured Image/Gallery */}
					{article.images.length > 0 && (
						<div className="mb-8">
							<div className="relative aspect-video rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
								<img
									src={article.images[currentImageIndex] || "/placeholder.svg"}
									alt={article.title}
									className="object-cover"
								/>
								{article.images.length > 1 && (
									<>
										<button
											onClick={prevImage}
											className="absolute left-2 md:left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
										>
											<ChevronLeft className="h-5 w-5" />
										</button>
										<button
											onClick={nextImage}
											className="absolute right-2 md:right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full"
										>
											<ChevronRight className="h-5 w-5" />
										</button>
										<div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2">
											{article.images.map((_, index) => (
												<button
													key={index}
													onClick={() => setCurrentImageIndex(index)}
													className={`w-2 h-2 rounded-full ${
														index === currentImageIndex
															? "bg-white"
															: "bg-white/50"
													}`}
												/>
											))}
										</div>
									</>
								)}
							</div>
							{article.images.length > 1 && (
								<p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
									Image {currentImageIndex + 1} of {article.images.length}
								</p>
							)}
						</div>
					)}

					{/* Content Card */}
					<div className="bg-white p-6 md:p-10 rounded-2xl shadow-sm border border-gray-100 mb-12">
						<div
							className="text-black leading-relaxed prose prose-lg max-w-none prose-headings:font-bold prose-headings:text-black prose-p:text-black prose-strong:text-black prose-a:text-rose-600 hover:prose-a:text-rose-700"
							dangerouslySetInnerHTML={{
								__html: formatContent(article.content),
							}}
						/>
					</div>

					{/* Footer */}
					<footer className="border-t border-gray-200 dark:border-gray-700 pt-8">
						<div className="flex flex-wrap items-center gap-2 mb-6">
							<span className="text-sm text-gray-600 dark:text-gray-400">
								Tags:
							</span>
							{article.tags.map((tag) => (
								<Badge key={tag} variant="outline" className="text-xs">
									{tag}
								</Badge>
							))}
						</div>
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div className="text-sm text-gray-600 dark:text-gray-400">
								Published on {article.publishedAt?.toLocaleDateString()} by{" "}
								{article.author}
							</div>
							<Button variant="outline" size="sm" onClick={handleShare}>
								<Share2 className="h-4 w-4 mr-2" /> Share Article
							</Button>
						</div>
					</footer>
				</article>

				{/* Related Articles */}
				{relatedArticles.length > 0 && (
					<section className="max-w-4xl mx-auto mt-16">
						<Separator className="mb-8" />
						<h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
							Related Articles
						</h2>
						<div className="grid gap-6 md:grid-cols-3">
							{relatedArticles.map((relatedArticle) => (
								<Link
									key={relatedArticle.id}
									href={`/news/${relatedArticle.id}`}
								>
									<Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 overflow-hidden">
										{relatedArticle.images.length > 0 && (
											<div className="relative h-40 md:h-48 overflow-hidden">
												<img
													src={relatedArticle.images[0] || "/placeholder.svg"}
													alt={relatedArticle.title}
													className="object-cover group-hover:scale-105 transition-transform duration-300"
												/>
											</div>
										)}
										<CardContent className="p-4">
											<div className="flex items-center gap-2 mb-2">
												<Badge variant="secondary" className="text-xs">
													{relatedArticle.category}
												</Badge>
												{relatedArticle.featured && (
													<Badge className="text-xs bg-rose-100 text-rose-700 dark:bg-rose-900/20 dark:text-rose-400">
														<Star className="h-3 w-3 mr-1" /> Featured
													</Badge>
												)}
											</div>
											<h3 className="font-semibold text-lg line-clamp-2 group-hover:text-rose-600 transition-colors mb-2">
												{relatedArticle.title}
											</h3>
											<p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">
												{relatedArticle.excerpt}
											</p>
											<div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
												<div className="flex items-center gap-1">
													<User className="h-3 w-3" />
													<span>{relatedArticle.author}</span>
												</div>
												<div className="flex items-center gap-1">
													<Calendar className="h-3 w-3" />
													<span>
														{relatedArticle.publishedAt?.toLocaleDateString()}
													</span>
												</div>
											</div>
										</CardContent>
									</Card>
								</Link>
							))}
						</div>
					</section>
				)}

				{/* Back to Top */}
				<div className="max-w-4xl mx-auto mt-12 text-center">
					<Link href="/news">
						<Button variant="outline" className="bg-transparent">
							<ArrowLeft className="h-4 w-4 mr-2" /> Back to All Articles
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}
