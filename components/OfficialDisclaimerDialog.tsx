"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

export function OfficialDisclaimerDialog() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already accepted the disclaimer
    const hasAccepted = localStorage.getItem("stitches_disclaimer_accepted");
    if (!hasAccepted) {
      // Show disclaimer after a short delay to ensure page is loaded
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    // Save acceptance to localStorage
    localStorage.setItem("stitches_disclaimer_accepted", "true");
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 rounded-full bg-red-100">
              <ShieldAlert className="w-8 h-8 text-red-600" />
            </div>
          </div>
          <DialogTitle className="text-2xl font-bold text-center text-gray-900">
            Official Disclaimer
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded">
            <p className="text-red-700 font-semibold">
              Please be informed that the only official website for Stitches Africa Limited is:
            </p>
            <p className="text-red-800 font-bold text-lg mt-2 text-center">
              👉 www.stitchesafrica.com
            </p>
          </div>
          
          <div className="space-y-3 text-gray-700">
            <p>
              We do not operate, endorse, or authorize any other websites, social media pages, or online stores to sell our products. Any platform outside our official website is not affiliated with Stitches Africa Limited and may be fraudulent.
            </p>
            
            <p className="font-semibold bg-yellow-50 p-3 rounded border border-yellow-200">
              Customers are strongly advised to make all purchases exclusively through www.stitchesafrica.com to ensure authenticity, quality, secure payments, and proper customer support.
            </p>
            
            <p>
              Stitches Africa Limited will not be responsible for any transactions or losses incurred through unauthorized websites or third-party sellers.
            </p>
            
            <p className="text-center font-medium">
              Please shop safely and stay informed.
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Button 
            onClick={handleAccept}
            className="w-full bg-black hover:bg-gray-800 text-white py-3 font-semibold"
          >
            I Understand and Accept
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}