/**
 * Marketing Users Initialization Component
 * One-time setup component to initialize marketing user documents
 */

'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, AlertCircle } from 'lucide-react';

export default function InitializeUsers() {
  const [isInitializing, setIsInitializing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    stats?: any;
  } | null>(null);

  const handleInitialize = async () => {
    setIsInitializing(true);
    setResult(null);

    try {
      const response = await fetch('/api/marketing/setup/init-users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (response.ok) {
        setResult({
          success: true,
          message: data.message,
          stats: data.stats
        });
      } else {
        setResult({
          success: false,
          message: data.error || 'Failed to initialize users'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: 'Network error occurred while initializing users'
      });
    } finally {
      setIsInitializing(false);
    }
  };

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Initialize Marketing Users
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-gray-600">
          This will create marketing user documents for all company email accounts in Firebase Auth.
          This is a one-time setup process.
        </p>

        {result && (
          <div className={`p-3 rounded-lg ${
            result.success 
              ? 'bg-green-50 border border-green-200' 
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-2 mb-2">
              {result.success ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm font-medium ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}>
                {result.success ? 'Success' : 'Error'}
              </span>
            </div>
            <p className={`text-sm ${
              result.success ? 'text-green-700' : 'text-red-700'
            }`}>
              {result.message}
            </p>
            {result.stats && (
              <div className="mt-2 text-xs text-green-600">
                <p>Company users found: {result.stats.totalCompanyUsers}</p>
                <p>Documents created: {result.stats.documentsCreated}</p>
              </div>
            )}
          </div>
        )}

        <Button
          onClick={handleInitialize}
          disabled={isInitializing || (result?.success === true)}
          className="w-full"
        >
          {isInitializing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
              Initializing...
            </>
          ) : result?.success ? (
            'Initialization Complete'
          ) : (
            'Initialize Users'
          )}
        </Button>

        {result?.success && (
          <p className="text-xs text-gray-500 text-center">
            You can now refresh the page to access the marketing dashboard.
          </p>
        )}
      </CardContent>
    </Card>
  );
}