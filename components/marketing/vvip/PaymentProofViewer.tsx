"use client";

import React, { useState, useEffect } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCw, FileText, Image as ImageIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { PaymentProofViewerProps } from '@/types/vvip';

/**
 * PaymentProofViewer Component
 * 
 * Modal component for viewing uploaded payment proof files (images and PDFs).
 * Supports zoom, rotation, and download functionality.
 */
export function PaymentProofViewer({ 
  proofUrl, 
  orderId, 
  onClose 
}: PaymentProofViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fileType, setFileType] = useState<'image' | 'pdf' | 'unknown'>('unknown');
  const [zoom, setZoom] = useState(100);
  const [rotation, setRotation] = useState(0);

  // Determine file type from URL
  useEffect(() => {
    if (proofUrl) {
      const url = proofUrl.toLowerCase();
      if (url.includes('.pdf') || url.includes('application/pdf')) {
        setFileType('pdf');
      } else if (url.includes('.jpg') || url.includes('.jpeg') || url.includes('.png') || 
                 url.includes('image/')) {
        setFileType('image');
      } else {
        setFileType('unknown');
      }
    }
  }, [proofUrl]);

  // Handle image load
  const handleImageLoad = () => {
    setIsLoading(false);
    setError(null);
  };

  // Handle image error
  const handleImageError = () => {
    setIsLoading(false);
    setError('Failed to load payment proof image');
  };

  // Handle zoom controls
  const handleZoomIn = () => setZoom(prev => Math.min(prev + 25, 200));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 25, 50));
  const handleResetZoom = () => setZoom(100);

  // Handle rotation
  const handleRotate = () => setRotation(prev => (prev + 90) % 360);

  // Handle download
  const handleDownload = async () => {
    try {
      const response = await fetch(proofUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `payment-proof-${orderId}.${fileType === 'pdf' ? 'pdf' : 'jpg'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center space-x-2">
              {fileType === 'pdf' ? (
                <FileText className="w-5 h-5" />
              ) : (
                <ImageIcon className="w-5 h-5" />
              )}
              <span>Payment Proof - Order #{orderId.slice(-8)}</span>
            </DialogTitle>
            
            <div className="flex items-center space-x-2">
              {/* Zoom Controls for Images */}
              {fileType === 'image' && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomOut}
                    disabled={zoom <= 50}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground min-w-[50px] text-center">
                    {zoom}%
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleZoomIn}
                    disabled={zoom >= 200}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRotate}
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </>
              )}
              
              {/* Download Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4" />
              </Button>
              
              {/* Close Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={onClose}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-auto p-6 pt-4">
          {isLoading && (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2 text-muted-foreground">Loading payment proof...</span>
            </div>
          )}

          {error && (
            <div className="flex flex-col items-center justify-center h-96 space-y-4">
              <div className="text-red-500 text-center">
                <FileText className="w-12 h-12 mx-auto mb-2" />
                <p className="font-medium">Failed to load payment proof</p>
                <p className="text-sm text-muted-foreground">{error}</p>
              </div>
              <Button variant="outline" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Try Download Instead
              </Button>
            </div>
          )}

          {!isLoading && !error && (
            <div className="flex justify-center">
              {fileType === 'image' ? (
                <div 
                  className="transition-transform duration-200"
                  style={{
                    transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                    transformOrigin: 'center'
                  }}
                >
                  <img
                    src={proofUrl}
                    alt={`Payment proof for order ${orderId}`}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    className="max-w-full h-auto rounded-lg shadow-lg"
                    style={{ maxHeight: '70vh' }}
                  />
                </div>
              ) : fileType === 'pdf' ? (
                <div className="w-full h-96 border rounded-lg overflow-hidden">
                  <iframe
                    src={`${proofUrl}#toolbar=1&navpanes=1&scrollbar=1`}
                    className="w-full h-full"
                    title={`Payment proof PDF for order ${orderId}`}
                    onLoad={() => setIsLoading(false)}
                    onError={() => {
                      setIsLoading(false);
                      setError('Failed to load PDF. Please try downloading the file.');
                    }}
                  />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-96 space-y-4">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="font-medium">Unsupported file type</p>
                    <p className="text-sm text-muted-foreground">
                      Cannot preview this file type in the browser
                    </p>
                  </div>
                  <Button onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer with file info */}
        <div className="border-t p-4 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div>
              File Type: {fileType.toUpperCase()} • Order: #{orderId.slice(-8)}
            </div>
            {fileType === 'image' && (
              <div className="flex items-center space-x-4">
                <button
                  onClick={handleResetZoom}
                  className="hover:text-foreground transition-colors"
                >
                  Reset View
                </button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}