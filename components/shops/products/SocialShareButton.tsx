"use client";

import { useState } from "react";
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Link2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SocialShareButtonProps {
  url: string;
  title: string;
  description?: string;
  image?: string;
  className?: string;
}

export function SocialShareButton({
  url,
  title,
  description,
  image,
  className = "",
}: SocialShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || title);

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedTitle}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    const shareUrl = shareLinks[platform];
    window.open(shareUrl, "_blank", "width=600,height=400");
    toast.success(`Sharing on ${platform.charAt(0).toUpperCase() + platform.slice(1)}`);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Failed to copy link");
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title,
          text: description,
          url,
        });
        toast.success("Shared successfully!");
      } catch (error) {
        // User cancelled or error occurred
        if ((error as Error).name !== 'AbortError') {
          toast.error("Failed to share");
        }
      }
    } else {
      // Fallback to copy link
      handleCopyLink();
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <span
          // variant="outline"
          // size="icon"
          className={`hover:bg-gray-100 ${className}`}
          title="Share product"
        >
          <Share2 className="h-5 w-5" />
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        {/* Native Share (Mobile) */}
        {typeof navigator !== 'undefined' && navigator.share && (
          <DropdownMenuItem onClick={handleNativeShare} className="cursor-pointer">
            <Share2 className="mr-2 h-4 w-4" />
            <span>Share...</span>
          </DropdownMenuItem>
        )}

        {/* Facebook */}
        <DropdownMenuItem
          onClick={() => handleShare("facebook")}
          className="cursor-pointer"
        >
          <Facebook className="mr-2 h-4 w-4 text-blue-600" />
          <span>Share on Facebook</span>
        </DropdownMenuItem>

        {/* Twitter */}
        <DropdownMenuItem
          onClick={() => handleShare("twitter")}
          className="cursor-pointer"
        >
          <Twitter className="mr-2 h-4 w-4 text-sky-500" />
          <span>Share on Twitter</span>
        </DropdownMenuItem>

        {/* LinkedIn */}
        <DropdownMenuItem
          onClick={() => handleShare("linkedin")}
          className="cursor-pointer"
        >
          <Linkedin className="mr-2 h-4 w-4 text-blue-700" />
          <span>Share on LinkedIn</span>
        </DropdownMenuItem>

        {/* WhatsApp */}
        <DropdownMenuItem
          onClick={() => handleShare("whatsapp")}
          className="cursor-pointer"
        >
          <MessageCircle className="mr-2 h-4 w-4 text-green-600" />
          <span>Share on WhatsApp</span>
        </DropdownMenuItem>

        {/* Telegram */}
        <DropdownMenuItem
          onClick={() => handleShare("telegram")}
          className="cursor-pointer"
        >
          <svg
            className="mr-2 h-4 w-4 text-blue-500"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.658-.537.818-1.084.508l-3-2.21-1.446 1.394c-.14.18-.357.295-.6.295-.002 0-.003 0-.005 0l.213-3.054 5.56-5.022c.24-.213-.054-.334-.373-.121l-6.869 4.326-2.96-.924c-.64-.203-.658-.64.135-.954l11.566-4.458c.538-.196 1.006.128.832.941z" />
          </svg>
          <span>Share on Telegram</span>
        </DropdownMenuItem>

        {/* Copy Link */}
        <DropdownMenuItem onClick={handleCopyLink} className="cursor-pointer">
          {copied ? (
            <>
              <Check className="mr-2 h-4 w-4 text-green-600" />
              <span className="text-green-600">Link copied!</span>
            </>
          ) : (
            <>
              <Link2 className="mr-2 h-4 w-4" />
              <span>Copy link</span>
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
