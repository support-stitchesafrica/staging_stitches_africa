"use client"

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Sparkles } from "lucide-react"

interface TemplateLibraryProps
{
    open: boolean
    onOpenChange: (open: boolean) => void
    onSelectTemplate: (template: PrebuiltTemplate) => void
}
interface TemplateBlock
{
    id: string
    type: string
    content: string
    link?: string
    styles: { [key: string]: string }
    columnCount?: number
    columns?: TemplateBlock[][]
}
interface PrebuiltTemplate
{
    id: string
    name: string
    description: string
    category: string
    thumbnail: string
    layout: "grid" | "single"
    blocks: TemplateBlock[]
}

const prebuiltTemplates: PrebuiltTemplate[] = [
    {
        id: "luxury-wear-newsletter",
        name: "Luxury Wear Newsletter",
        description: "Elegant black and white fashion newsletter with trend highlights",
        category: "ready-to-wear",
        layout: "single",
        thumbnail: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=600&h=400&fit=crop",
        blocks: [
            {
                id: "1",
                type: "heading",
                content: "Luxury Wear",
                styles: {
                    textAlign: "center",
                    fontSize: "48px",
                    color: "#000000",
                    fontWeight: "700",
                    padding: "40px 0 8px 0",
                    fontFamily: "serif",
                    letterSpacing: "2px",
                },
            },
            {
                id: "2",
                type: "text",
                content: "WEEKLY NEWSLETTER",
                styles: {
                    textAlign: "center",
                    fontSize: "14px",
                    color: "#666666",
                    fontWeight: "400",
                    padding: "0 0 32px 0",
                    letterSpacing: "3px",
                },
            },
            {
                id: "3",
                type: "button",
                content: "AUTUMN COLLECTION",
                link: "#",
                styles: {
                    backgroundColor: "#000000",
                    color: "#ffffff",
                    padding: "8px 20px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "500",
                    margin: "0 8px",
                },
            },
            {
                id: "4",
                type: "button",
                content: "NEW PRODUCT",
                link: "#",
                styles: {
                    backgroundColor: "#666666",
                    color: "#ffffff",
                    padding: "8px 20px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "500",
                    margin: "0 8px",
                },
            },
            {
                id: "5",
                type: "button",
                content: "MORE",
                link: "#",
                styles: {
                    backgroundColor: "#666666",
                    color: "#ffffff",
                    padding: "8px 20px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "500",
                    margin: "0 8px",
                },
            },
            {
                id: "6",
                type: "spacer",
                content: "",
                styles: { padding: "24px 0" },
            },
            {
                id: "7",
                type: "columns",
                content: "",
                columnCount: 2,
                columns: [
                    [
                        {
                            id: "7-1",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop",
                            styles: { borderRadius: "8px", width: "100%" },
                        }
                    ],
                    [
                        {
                            id: "7-2",
                            type: "heading",
                            content: "LATEST TREND",
                            styles: {
                                fontSize: "32px",
                                color: "#000000",
                                fontWeight: "700",
                                padding: "0 0 16px 0",
                                fontFamily: "serif",
                            },
                        },
                        {
                            id: "7-3",
                            type: "text",
                            content: "2025 trends you can't miss",
                            styles: {
                                fontSize: "16px",
                                color: "#666666",
                                fontWeight: "600",
                                padding: "0 0 16px 0",
                            },
                        },
                        {
                            id: "7-4",
                            type: "text",
                            content: "Delivering newsletters through email is one of the best ways to build a strong relationship with your members and customers. Give them exclusive access to your latest collections, services, and limited offers while simultaneously improving the visibility of your brand.",
                            styles: {
                                fontSize: "14px",
                                color: "#333333",
                                lineHeight: "1.6",
                                padding: "0 0 16px 0",
                            },
                        }
                    ]
                ],
                styles: { padding: "0 0 32px 0" },
            },
            {
                id: "8",
                type: "text",
                content: "DID YOU KNOW?",
                styles: {
                    backgroundColor: "#000000",
                    color: "#ffffff",
                    padding: "16px 24px",
                    fontSize: "18px",
                    fontWeight: "700",
                    borderRadius: "8px 8px 0 0",
                },
            },
            {
                id: "9",
                type: "text",
                content: "Delivering newsletters through email is one of the best ways to build a strong relationship with your members and customers. Give them exclusive access to your latest collections, services, and limited offers while simultaneously improving the visibility of your brand.",
                styles: {
                    backgroundColor: "#f8f8f8",
                    color: "#333333",
                    padding: "16px 24px",
                    fontSize: "14px",
                    lineHeight: "1.6",
                    borderRadius: "0 0 8px 8px",
                },
            },
        ],
    },
    {
        id: "original-fashion-newsletter",
        name: "Original Fashion Newsletter",
        description: "Minimalist beige fashion newsletter with inspiration focus",
        category: "bespoke",
        layout: "single",
        thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop",
        blocks: [
            {
                id: "1",
                type: "text",
                content: "FASHION INSPIRATION",
                styles: {
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#8B7355",
                    fontWeight: "400",
                    padding: "32px 0 16px 0",
                    letterSpacing: "2px",
                },
            },
            {
                id: "2",
                type: "heading",
                content: "ORIGINAL",
                styles: {
                    textAlign: "center",
                    fontSize: "64px",
                    color: "#2D1810",
                    fontWeight: "700",
                    padding: "0 0 16px 0",
                    fontFamily: "serif",
                    letterSpacing: "4px",
                },
            },
            {
                id: "3",
                type: "text",
                content: "Because newsletters are easily sent online, you can weave all of your most important and latest services in one go.",
                styles: {
                    textAlign: "center",
                    fontSize: "16px",
                    color: "#5D4E37",
                    lineHeight: "1.6",
                    padding: "0 40px 32px 40px",
                    fontStyle: "italic",
                },
            },
            {
                id: "4",
                type: "image",
                content: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop",
                styles: {
                    borderRadius: "8px",
                    padding: "0 0 32px 0",
                    width: "100%",
                },
            },
            {
                id: "5",
                type: "columns",
                content: "",
                columnCount: 2,
                columns: [
                    [
                        {
                            id: "5-1",
                            type: "text",
                            content: "Email newsletters can also help you grow your company. After all, it only takes a few seconds for relevant information to reach your clients.",
                            styles: {
                                fontSize: "14px",
                                color: "#5D4E37",
                                lineHeight: "1.6",
                                padding: "0 16px 0 0",
                            },
                        },
                        {
                            id: "5-2",
                            type: "text",
                            content: "That's why it's important to have engaging content that will keep them subscribed for years to come.",
                            styles: {
                                fontSize: "14px",
                                color: "#5D4E37",
                                lineHeight: "1.6",
                                padding: "16px 16px 0 0",
                            },
                        }
                    ],
                    [
                        {
                            id: "5-3",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop",
                            styles: {
                                borderRadius: "8px",
                                width: "100%",
                            },
                        }
                    ]
                ],
                styles: { padding: "0 0 32px 0" },
            },
            {
                id: "6",
                type: "text",
                content: "Add your logos, photos, and other brand materials to make sure everything is clean and consistent.",
                styles: {
                    fontSize: "14px",
                    color: "#5D4E37",
                    lineHeight: "1.6",
                    padding: "0 0 24px 0",
                    textAlign: "center",
                },
            },
            {
                id: "7",
                type: "button",
                content: "read more",
                link: "#",
                styles: {
                    backgroundColor: "#8B7355",
                    color: "#ffffff",
                    padding: "12px 32px",
                    borderRadius: "4px",
                    fontSize: "14px",
                    fontWeight: "400",
                    textTransform: "lowercase",
                },
            },
        ],
    },
    {
        id: "fashion-pigeon-newsletter",
        name: "Fashion Pigeon Newsletter",
        description: "Modern magazine-style newsletter with multi-column layout",
        category: "ready-to-wear",
        layout: "grid",
        thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
        blocks: [
            {
                id: "1",
                type: "text",
                content: "NEWSLETTER",
                styles: {
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#666666",
                    fontWeight: "400",
                    padding: "24px 0 8px 0",
                    letterSpacing: "2px",
                },
            },
            {
                id: "2",
                type: "heading",
                content: "FASHION PIGEON",
                styles: {
                    textAlign: "center",
                    fontSize: "42px",
                    color: "#000000",
                    fontWeight: "800",
                    padding: "0 0 8px 0",
                    fontFamily: "sans-serif",
                    letterSpacing: "3px",
                },
            },
            {
                id: "3",
                type: "text",
                content: "SUMMER 2020",
                styles: {
                    textAlign: "center",
                    fontSize: "16px",
                    color: "#666666",
                    fontWeight: "400",
                    padding: "0 0 32px 0",
                    letterSpacing: "1px",
                },
            },
            {
                id: "4",
                type: "columns",
                content: "",
                columnCount: 2,
                columns: [
                    [
                        {
                            id: "4-1",
                            type: "heading",
                            content: "OFFICIISTRU",
                            styles: {
                                fontSize: "24px",
                                color: "#000000",
                                fontWeight: "700",
                                padding: "0 0 12px 0",
                            },
                        },
                        {
                            id: "4-2",
                            type: "text",
                            content: "Quis a et la et fugiat molestiae int quis aliquam, quam earum sequatur?",
                            styles: {
                                fontSize: "16px",
                                color: "#333333",
                                fontWeight: "600",
                                padding: "0 0 16px 0",
                            },
                        },
                        {
                            id: "4-3",
                            type: "text",
                            content: "Et aliquam, quidem nam voluptat ullam nulla dolor lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
                            styles: {
                                fontSize: "14px",
                                color: "#555555",
                                lineHeight: "1.6",
                                padding: "0 16px 0 0",
                            },
                        }
                    ],
                    [
                        {
                            id: "4-4",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=300&fit=crop",
                            styles: {
                                borderRadius: "8px",
                                width: "100%",
                            },
                        }
                    ]
                ],
                styles: { padding: "0 0 32px 0" },
            },
            {
                id: "5",
                type: "columns",
                content: "",
                columnCount: 2,
                columns: [
                    [
                        {
                            id: "5-1",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=400&fit=crop",
                            styles: {
                                borderRadius: "8px",
                                width: "100%",
                            },
                        }
                    ],
                    [
                        {
                            id: "5-2",
                            type: "text",
                            content: "Mi, volut im, et doluptat quibuscipisci voluptati demo consend",
                            styles: {
                                fontSize: "18px",
                                color: "#000000",
                                fontWeight: "600",
                                padding: "0 0 16px 0",
                            },
                        },
                        {
                            id: "5-3",
                            type: "text",
                            content: "Quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
                            styles: {
                                fontSize: "14px",
                                color: "#555555",
                                lineHeight: "1.6",
                                padding: "0 0 16px 0",
                            },
                        }
                    ]
                ],
                styles: { padding: "0 0 24px 0" },
            },
            {
                id: "6",
                type: "text",
                content: "Fashion Pigeon 1",
                styles: {
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#999999",
                    padding: "16px 0",
                },
            },
        ],
    },
    {
        id: "oliane-newsletter",
        name: "Oliane Fashion Newsletter",
        description: "Clean grid-based newsletter with product showcase layout",
        category: "bespoke",
        layout: "grid",
        thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop",
        blocks: [
            {
                id: "1",
                type: "heading",
                content: "OLIANE",
                styles: {
                    textAlign: "center",
                    fontSize: "48px",
                    color: "#000000",
                    fontWeight: "300",
                    padding: "32px 0 8px 0",
                    fontFamily: "serif",
                    letterSpacing: "8px",
                },
            },
            {
                id: "2",
                type: "text",
                content: "Fashion & Lifestyle",
                styles: {
                    textAlign: "center",
                    fontSize: "14px",
                    color: "#666666",
                    fontWeight: "400",
                    padding: "0 0 24px 0",
                    letterSpacing: "2px",
                },
            },
            {
                id: "3",
                type: "divider",
                content: "",
                styles: {
                    padding: "16px 0",
                    borderColor: "#E5E7EB",
                },
            },
            {
                id: "4",
                type: "text",
                content: "NEW COLLECTION",
                styles: {
                    fontSize: "24px",
                    color: "#000000",
                    fontWeight: "600",
                    padding: "24px 0 16px 0",
                    textAlign: "left",
                },
            },
            {
                id: "5",
                type: "image",
                content: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=300&fit=crop",
                styles: {
                    borderRadius: "4px",
                    width: "100%",
                    padding: "0 0 24px 0",
                },
            },
            {
                id: "6",
                type: "columns",
                content: "",
                columnCount: 2,
                columns: [
                    [
                        {
                            id: "6-1",
                            type: "text",
                            content: "SPORT",
                            styles: {
                                fontSize: "16px",
                                color: "#000000",
                                fontWeight: "600",
                                padding: "0 0 8px 0",
                            },
                        },
                        {
                            id: "6-2",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop",
                            styles: {
                                borderRadius: "4px",
                                width: "100%",
                                padding: "0 0 12px 0",
                            },
                        },
                        {
                            id: "6-3",
                            type: "text",
                            content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                            styles: {
                                fontSize: "12px",
                                color: "#666666",
                                lineHeight: "1.5",
                                padding: "0 8px 0 0",
                            },
                        },
                        {
                            id: "6-4",
                            type: "button",
                            content: "SHOP NOW",
                            link: "#",
                            styles: {
                                backgroundColor: "transparent",
                                color: "#000000",
                                padding: "8px 16px",
                                borderRadius: "0",
                                fontSize: "12px",
                                fontWeight: "600",
                                border: "1px solid #000000",
                                margin: "12px 0",
                            },
                        }
                    ],
                    [
                        {
                            id: "6-5",
                            type: "text",
                            content: "SPORT",
                            styles: {
                                fontSize: "16px",
                                color: "#000000",
                                fontWeight: "600",
                                padding: "0 0 8px 0",
                            },
                        },
                        {
                            id: "6-6",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=300&h=200&fit=crop",
                            styles: {
                                borderRadius: "4px",
                                width: "100%",
                                padding: "0 0 12px 0",
                            },
                        },
                        {
                            id: "6-7",
                            type: "text",
                            content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                            styles: {
                                fontSize: "12px",
                                color: "#666666",
                                lineHeight: "1.5",
                                padding: "0 0 0 8px",
                            },
                        },
                        {
                            id: "6-8",
                            type: "button",
                            content: "SHOP NOW",
                            link: "#",
                            styles: {
                                backgroundColor: "transparent",
                                color: "#000000",
                                padding: "8px 16px",
                                borderRadius: "0",
                                fontSize: "12px",
                                fontWeight: "600",
                                border: "1px solid #000000",
                                margin: "12px 0",
                            },
                        }
                    ]
                ],
                styles: { padding: "0 0 32px 0" },
            },
            {
                id: "7",
                type: "columns",
                content: "",
                columnCount: 2,
                columns: [
                    [
                        {
                            id: "7-1",
                            type: "text",
                            content: "CASUAL",
                            styles: {
                                fontSize: "16px",
                                color: "#000000",
                                fontWeight: "600",
                                padding: "0 0 8px 0",
                            },
                        },
                        {
                            id: "7-2",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300&h=200&fit=crop",
                            styles: {
                                borderRadius: "4px",
                                width: "100%",
                                padding: "0 0 12px 0",
                            },
                        },
                        {
                            id: "7-3",
                            type: "text",
                            content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                            styles: {
                                fontSize: "12px",
                                color: "#666666",
                                lineHeight: "1.5",
                                padding: "0 8px 0 0",
                            },
                        },
                        {
                            id: "7-4",
                            type: "button",
                            content: "SHOP NOW",
                            link: "#",
                            styles: {
                                backgroundColor: "transparent",
                                color: "#000000",
                                padding: "8px 16px",
                                borderRadius: "0",
                                fontSize: "12px",
                                fontWeight: "600",
                                border: "1px solid #000000",
                                margin: "12px 0",
                            },
                        }
                    ],
                    [
                        {
                            id: "7-5",
                            type: "text",
                            content: "LOOKS",
                            styles: {
                                fontSize: "16px",
                                color: "#000000",
                                fontWeight: "600",
                                padding: "0 0 8px 0",
                            },
                        },
                        {
                            id: "7-6",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=300&h=200&fit=crop",
                            styles: {
                                borderRadius: "4px",
                                width: "100%",
                                padding: "0 0 12px 0",
                            },
                        },
                        {
                            id: "7-7",
                            type: "text",
                            content: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
                            styles: {
                                fontSize: "12px",
                                color: "#666666",
                                lineHeight: "1.5",
                                padding: "0 0 0 8px",
                            },
                        },
                        {
                            id: "7-8",
                            type: "button",
                            content: "SHOP NOW",
                            link: "#",
                            styles: {
                                backgroundColor: "transparent",
                                color: "#000000",
                                padding: "8px 16px",
                                borderRadius: "0",
                                fontSize: "12px",
                                fontWeight: "600",
                                border: "1px solid #000000",
                                margin: "12px 0",
                            },
                        }
                    ]
                ],
                styles: { padding: "0 0 32px 0" },
            },
            {
                id: "8",
                type: "text",
                content: "FOLLOW US",
                styles: {
                    textAlign: "center",
                    fontSize: "14px",
                    color: "#000000",
                    fontWeight: "600",
                    padding: "24px 0 16px 0",
                    letterSpacing: "1px",
                },
            },
            {
                id: "9",
                type: "social",
                content: JSON.stringify([
                    { platform: "facebook", url: "https://facebook.com" },
                    { platform: "twitter", url: "https://twitter.com" },
                    { platform: "instagram", url: "https://instagram.com" },
                    { platform: "linkedin", url: "https://linkedin.com" },
                    { platform: "pinterest", url: "https://pinterest.com" }
                ]),
                styles: {
                    textAlign: "center",
                    padding: "0 0 24px 0",
                },
            },
            {
                id: "10",
                type: "text",
                content: "COMPANY.COM",
                styles: {
                    textAlign: "center",
                    fontSize: "12px",
                    color: "#999999",
                    padding: "16px 0",
                },
            },
        ],
    },
    {
        id: "back-in-stock-newsletter",
        name: "Back in Stock Newsletter",
        description: "Product restock announcement with artistic border design",
        category: "ready-to-wear",
        layout: "single",
        thumbnail: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop",
        blocks: [
            {
                id: "1",
                type: "heading",
                content: "BACK IN STOCK",
                styles: {
                    textAlign: "center",
                    fontSize: "42px",
                    color: "#000000",
                    fontWeight: "700",
                    padding: "40px 0 32px 0",
                    fontFamily: "sans-serif",
                    letterSpacing: "4px",
                },
            },
            {
                id: "2",
                type: "image",
                content: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600&h=400&fit=crop",
                styles: {
                    borderRadius: "8px",
                    width: "100%",
                    padding: "0 0 24px 0",
                },
            },
            {
                id: "3",
                type: "text",
                content: "You loved them & they are back in stock",
                styles: {
                    textAlign: "center",
                    fontSize: "18px",
                    color: "#000000",
                    fontWeight: "600",
                    padding: "0 0 8px 0",
                },
            },
            {
                id: "4",
                type: "text",
                content: "in case you missed them the first time round",
                styles: {
                    textAlign: "center",
                    fontSize: "16px",
                    color: "#666666",
                    fontWeight: "400",
                    padding: "0 0 32px 0",
                },
            },
            {
                id: "5",
                type: "columns",
                content: "",
                columnCount: 3,
                columns: [
                    [
                        {
                            id: "5-1",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=300&fit=crop",
                            styles: {
                                borderRadius: "4px",
                                width: "100%",
                            },
                        }
                    ],
                    [
                        {
                            id: "5-2",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=300&fit=crop",
                            styles: {
                                borderRadius: "4px",
                                width: "100%",
                            },
                        }
                    ],
                    [
                        {
                            id: "5-3",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=300&fit=crop",
                            styles: {
                                borderRadius: "4px",
                                width: "100%",
                            },
                        }
                    ]
                ],
                styles: { padding: "0 0 24px 0" },
            },
            {
                id: "6",
                type: "columns",
                content: "",
                columnCount: 3,
                columns: [
                    [
                        {
                            id: "6-1",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=200&h=300&fit=crop",
                            styles: {
                                borderRadius: "4px",
                                width: "100%",
                            },
                        }
                    ],
                    [
                        {
                            id: "6-2",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=200&h=300&fit=crop",
                            styles: {
                                borderRadius: "4px",
                                width: "100%",
                            },
                        }
                    ],
                    [
                        {
                            id: "6-3",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=200&h=300&fit=crop",
                            styles: {
                                borderRadius: "4px",
                                width: "100%",
                            },
                        }
                    ]
                ],
                styles: { padding: "0 0 32px 0" },
            },
            {
                id: "7",
                type: "button",
                content: "Find more back in stock",
                link: "#",
                styles: {
                    backgroundColor: "transparent",
                    color: "#000000",
                    padding: "12px 32px",
                    borderRadius: "0",
                    fontSize: "14px",
                    fontWeight: "400",
                    border: "1px solid #000000",
                },
            },
        ],
    },
    {
        id: "net-a-porter-newsletter",
        name: "Net-A-Porter Style Newsletter",
        description: "Luxury fashion newsletter with seasonal collections and editorial layout",
        category: "bespoke",
        layout: "grid",
        thumbnail: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop",
        blocks: [
            {
                id: "1",
                type: "text",
                content: "NET-A-PORTER",
                styles: {
                    textAlign: "center",
                    fontSize: "24px",
                    color: "#000000",
                    fontWeight: "400",
                    padding: "32px 0 16px 0",
                    letterSpacing: "8px",
                },
            },
            {
                id: "2",
                type: "text",
                content: "WHAT'S NEW | DESIGNERS | CLOTHING | SHOES | BAGS | ACCESSORIES | BEAUTY",
                styles: {
                    textAlign: "center",
                    fontSize: "10px",
                    color: "#ffffff",
                    backgroundColor: "#000000",
                    fontWeight: "400",
                    padding: "8px 16px",
                    letterSpacing: "1px",
                },
            },
            {
                id: "3",
                type: "heading",
                content: "WINTER is COMING",
                styles: {
                    textAlign: "center",
                    fontSize: "48px",
                    color: "#000000",
                    fontWeight: "400",
                    padding: "40px 0 16px 0",
                    fontFamily: "serif",
                },
            },
            {
                id: "4",
                type: "text",
                content: "Face the cold in fashion with the coats, knits and boots you need now",
                styles: {
                    textAlign: "center",
                    fontSize: "16px",
                    color: "#666666",
                    fontWeight: "400",
                    padding: "0 0 16px 0",
                },
            },
            {
                id: "5",
                type: "button",
                content: "Shop now",
                link: "#",
                styles: {
                    backgroundColor: "transparent",
                    color: "#000000",
                    padding: "8px 24px",
                    borderRadius: "0",
                    fontSize: "14px",
                    fontWeight: "400",
                    textDecoration: "underline",
                },
            },
            {
                id: "6",
                type: "spacer",
                content: "",
                styles: { padding: "24px 0" },
            },
            {
                id: "7",
                type: "columns",
                content: "",
                columnCount: 2,
                columns: [
                    [
                        {
                            id: "7-1",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop",
                            styles: {
                                borderRadius: "0",
                                width: "100%",
                            },
                        },
                        {
                            id: "7-2",
                            type: "text",
                            content: "YOUR Coat CALENDAR",
                            styles: {
                                position: "absolute",
                                bottom: "60px",
                                left: "20px",
                                fontSize: "32px",
                                color: "#ffffff",
                                fontWeight: "400",
                                fontFamily: "serif",
                            },
                        },
                        {
                            id: "7-3",
                            type: "text",
                            content: "Every style you need for the colder months",
                            styles: {
                                position: "absolute",
                                bottom: "40px",
                                left: "20px",
                                fontSize: "14px",
                                color: "#ffffff",
                                fontWeight: "400",
                            },
                        },
                        {
                            id: "7-4",
                            type: "button",
                            content: "Shop now",
                            link: "#",
                            styles: {
                                position: "absolute",
                                bottom: "20px",
                                left: "20px",
                                backgroundColor: "transparent",
                                color: "#ffffff",
                                padding: "4px 16px",
                                borderRadius: "0",
                                fontSize: "12px",
                                fontWeight: "400",
                                textDecoration: "underline",
                            },
                        }
                    ],
                    [
                        {
                            id: "7-5",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=250&fit=crop",
                            styles: {
                                borderRadius: "0",
                                width: "100%",
                                padding: "0 0 8px 0",
                            },
                        },
                        {
                            id: "7-6",
                            type: "text",
                            content: "Boot CAMP",
                            styles: {
                                fontSize: "28px",
                                color: "#ffffff",
                                fontWeight: "400",
                                fontFamily: "serif",
                                position: "absolute",
                                top: "20px",
                                right: "20px",
                            },
                        },
                        {
                            id: "7-7",
                            type: "text",
                            content: "Cowboy boots and slouchy shapes lead our new-season edit",
                            styles: {
                                fontSize: "14px",
                                color: "#ffffff",
                                fontWeight: "400",
                                position: "absolute",
                                top: "60px",
                                right: "20px",
                                width: "200px",
                            },
                        },
                        {
                            id: "7-8",
                            type: "button",
                            content: "Shop now",
                            link: "#",
                            styles: {
                                position: "absolute",
                                top: "100px",
                                right: "20px",
                                backgroundColor: "transparent",
                                color: "#ffffff",
                                padding: "4px 16px",
                                borderRadius: "0",
                                fontSize: "12px",
                                fontWeight: "400",
                                textDecoration: "underline",
                            },
                        },
                        {
                            id: "7-9",
                            type: "image",
                            content: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=250&fit=crop",
                            styles: {
                                borderRadius: "0",
                                width: "100%",
                            },
                        },
                        {
                            id: "7-10",
                            type: "text",
                            content: "Knitwear KNOW-HOW",
                            styles: {
                                fontSize: "28px",
                                color: "#ffffff",
                                fontWeight: "400",
                                fontFamily: "serif",
                                position: "absolute",
                                bottom: "60px",
                                right: "20px",
                            },
                        },
                        {
                            id: "7-11",
                            type: "text",
                            content: "Wrap up in everything from cable-knit sweaters to colorful cardigans",
                            styles: {
                                fontSize: "14px",
                                color: "#ffffff",
                                fontWeight: "400",
                                position: "absolute",
                                bottom: "40px",
                                right: "20px",
                                width: "200px",
                            },
                        },
                        {
                            id: "7-12",
                            type: "button",
                            content: "Get the look",
                            link: "#",
                            styles: {
                                position: "absolute",
                                bottom: "20px",
                                right: "20px",
                                backgroundColor: "transparent",
                                color: "#ffffff",
                                padding: "4px 16px",
                                borderRadius: "0",
                                fontSize: "12px",
                                fontWeight: "400",
                                textDecoration: "underline",
                            },
                        }
                    ]
                ],
                styles: { padding: "0 0 16px 0" },
            },
            {
                id: "8",
                type: "image",
                content: "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800&h=300&fit=crop",
                styles: {
                    borderRadius: "0",
                    width: "100%",
                },
            },
            {
                id: "9",
                type: "text",
                content: "FW18's Latest Arrivals",
                styles: {
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "48px",
                    color: "#ffffff",
                    fontWeight: "400",
                    fontFamily: "serif",
                    textAlign: "center",
                },
            },
            {
                id: "10",
                type: "text",
                content: "Runway styles from Saint Laurent, Gucci, Chloé, Stella McCartney and more",
                styles: {
                    position: "absolute",
                    top: "60%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    fontSize: "16px",
                    color: "#ffffff",
                    fontWeight: "400",
                    textAlign: "center",
                },
            },
            {
                id: "11",
                type: "button",
                content: "Shop now",
                link: "#",
                styles: {
                    position: "absolute",
                    top: "70%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    backgroundColor: "transparent",
                    color: "#ffffff",
                    padding: "8px 24px",
                    borderRadius: "0",
                    fontSize: "14px",
                    fontWeight: "400",
                    textDecoration: "underline",
                },
            },
        ],
    },
]

export function TemplateLibrary({ open, onOpenChange, onSelectTemplate }: TemplateLibraryProps)
{
    const [selectedCategory, setSelectedCategory] = useState<string>("all")

    const filteredTemplates = prebuiltTemplates.filter((template) =>
    {
        if (selectedCategory === "all") return true
        return template.category === selectedCategory
    })

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 font-serif text-2xl">
                        <Sparkles className="h-6 w-6 text-primary" />
                        Template Library
                    </DialogTitle>
                </DialogHeader>

                <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="all">All Templates</TabsTrigger>
                        <TabsTrigger value="ready-to-wear">Ready-to-Wear</TabsTrigger>
                        <TabsTrigger value="bespoke">Bespoke</TabsTrigger>
                        <TabsTrigger value="general">General</TabsTrigger>
                    </TabsList>

                    <TabsContent value={selectedCategory} className="mt-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {filteredTemplates.map((template) => (
                                <Card key={template.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                                    <CardContent className="p-0">
                                        <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg overflow-hidden">
                                            <img
                                                src={template.thumbnail}
                                                alt={template.name}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="p-4">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-lg">{template.name}</h3>
                                                <Badge variant="secondary" className="text-xs">
                                                    {template.category}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                                            <Button
                                                onClick={() => onSelectTemplate(template)}
                                                className="w-full"
                                                size="sm"
                                            >
                                                Use Template
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {filteredTemplates.length === 0 && (
                            <div className="text-center py-12">
                                <p className="text-muted-foreground">No templates found in this category.</p>
                            </div>
                        )}
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}