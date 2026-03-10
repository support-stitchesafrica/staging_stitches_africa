"use client";

import { useState, useRef } from 'react';
import { Upload, Download, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import { bogoMappingService } from '@/lib/bogo/mapping-service';
import type { BogoBulkImportResult } from '@/types/bogo';

interface BogoBulkImportProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function BogoBulkImport({ onSuccess, onCancel }: BogoBulkImportProps) {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<BogoBulkImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const fileExtension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (fileExtension === 'csv' || fileExtension === 'json') {
        setFile(selectedFile);
        setError(null);
        setResult(null);
      } else {
        setError('Please select a CSV or JSON file.');
        setFile(null);
      }
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fileContent = await file.text();
      const userId = localStorage.getItem('adminUID') || 'admin';
      
      let importResult: BogoBulkImportResult;
      
      if (file.name.endsWith('.csv')) {
        importResult = await bogoMappingService.importMappingsFromCSV(fileContent, userId);
      } else {
        importResult = await bogoMappingService.importMappingsFromJSON(fileContent, userId);
      }

      setResult(importResult);
      
      if (importResult.success && importResult.errorCount === 0) {
        // Auto-close after successful import with no errors
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      console.error('Failed to import mappings:', err);
      setError(err.userMessage || 'Failed to import mappings. Please check your file format and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadTemplate = (format: 'csv' | 'json') => {
    let content: string;
    let filename: string;
    let mimeType: string;

    if (format === 'csv') {
      content = [
        'Main Product ID,Free Product IDs,Promotion Start Date,Promotion End Date,Active,Auto Free Shipping,Promotion Name,Description,Max Redemptions',
        'main-product-123,"free-product-456;free-product-789",2024-12-01T00:00:00Z,2024-12-31T23:59:59Z,true,true,December BOGO,Buy one get one free promotion,1000',
        'main-product-456,free-product-101,2024-12-15T00:00:00Z,2025-01-15T23:59:59Z,true,true,Holiday Special,Special holiday promotion,'
      ].join('\n');
      filename = 'bogo-mappings-template.csv';
      mimeType = 'text/csv';
    } else {
      content = JSON.stringify({
        mappings: [
          {
            mainProductId: 'main-product-123',
            freeProductIds: ['free-product-456', 'free-product-789'],
            promotionStartDate: '2024-12-01T00:00:00Z',
            promotionEndDate: '2024-12-31T23:59:59Z',
            active: true,
            autoFreeShipping: true,
            promotionName: 'December BOGO',
            description: 'Buy one get one free promotion',
            maxRedemptions: 1000
          },
          {
            mainProductId: 'main-product-456',
            freeProductIds: ['free-product-101'],
            promotionStartDate: '2024-12-15T00:00:00Z',
            promotionEndDate: '2025-01-15T23:59:59Z',
            active: true,
            autoFreeShipping: true,
            promotionName: 'Holiday Special',
            description: 'Special holiday promotion'
          }
        ]
      }, null, 2);
      filename = 'bogo-mappings-template.json';
      mimeType = 'application/json';
    }

    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Bulk Import BOGO Mappings</h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 rounded-md"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
            <div className="text-red-800">{error}</div>
          </div>
        </div>
      )}

      {result && (
        <div className={`mb-6 border rounded-md p-4 ${
          result.success ? 'bg-green-50 border-green-200' : 'bg-yellow-50 border-yellow-200'
        }`}>
          <div className="flex">
            {result.success ? (
              <CheckCircle className="h-5 w-5 text-green-400 mr-2 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-yellow-400 mr-2 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className={`font-medium ${
                result.success ? 'text-green-800' : 'text-yellow-800'
              }`}>
                Import {result.success ? 'Completed' : 'Completed with Issues'}
              </h3>
              <div className={`mt-2 text-sm ${
                result.success ? 'text-green-700' : 'text-yellow-700'
              }`}>
                <p>Total processed: {result.totalProcessed}</p>
                <p>Successfully imported: {result.successCount}</p>
                {result.errorCount > 0 && <p>Errors: {result.errorCount}</p>}
                {result.warnings.length > 0 && <p>Warnings: {result.warnings.length}</p>}
              </div>

              {result.errors.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                  <div className="space-y-1">
                    {result.errors.slice(0, 5).map((error, index) => (
                      <p key={index} className="text-sm text-red-700">
                        Row {error.row}: {error.error}
                      </p>
                    ))}
                    {result.errors.length > 5 && (
                      <p className="text-sm text-red-600">
                        ... and {result.errors.length - 5} more errors
                      </p>
                    )}
                  </div>
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="mt-3">
                  <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                  <div className="space-y-1">
                    {result.warnings.slice(0, 3).map((warning, index) => (
                      <p key={index} className="text-sm text-yellow-700">
                        Row {warning.row}: {warning.warning}
                      </p>
                    ))}
                    {result.warnings.length > 3 && (
                      <p className="text-sm text-yellow-600">
                        ... and {result.warnings.length - 3} more warnings
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-6">
        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
          <h3 className="font-medium text-blue-900 mb-2">Import Instructions</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Upload a CSV or JSON file containing BOGO mapping data</li>
            <li>• CSV files should have headers matching the template format</li>
            <li>• JSON files should contain a "mappings" array with mapping objects</li>
            <li>• Free product IDs in CSV should be separated by semicolons (;)</li>
            <li>• Dates should be in ISO format (YYYY-MM-DDTHH:mm:ssZ)</li>
          </ul>
        </div>

        {/* Template Downloads */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Download Templates</h3>
          <div className="flex space-x-3">
            <button
              onClick={() => handleDownloadTemplate('csv')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Download className="h-4 w-4 mr-2" />
              CSV Template
            </button>
            <button
              onClick={() => handleDownloadTemplate('json')}
              className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <Download className="h-4 w-4 mr-2" />
              JSON Template
            </button>
          </div>
        </div>

        {/* File Upload */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-3">Upload File</h3>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="mb-4">
                <label htmlFor="file-upload" className="cursor-pointer">
                  <span className="text-purple-600 hover:text-purple-500 font-medium">
                    Click to upload a file
                  </span>
                  <span className="text-gray-600"> or drag and drop</span>
                </label>
                <input
                  ref={fileInputRef}
                  id="file-upload"
                  type="file"
                  accept=".csv,.json"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500">CSV or JSON files only</p>
              
              {file && (
                <div className="mt-4 p-3 bg-gray-50 rounded-md">
                  <div className="flex items-center justify-center">
                    <FileText className="h-5 w-5 text-gray-600 mr-2" />
                    <span className="text-sm font-medium text-gray-900">{file.name}</span>
                    <button
                      onClick={() => {
                        setFile(null);
                        if (fileInputRef.current) {
                          fileInputRef.current.value = '';
                        }
                      }}
                      className="ml-2 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3 pt-6 border-t border-gray-200">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Import Mappings
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}