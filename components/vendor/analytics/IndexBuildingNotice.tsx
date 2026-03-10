'use client';

import React from 'react';
import { AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface IndexBuildingNoticeProps {
  onRetry?: () => void;
  isRetrying?: boolean;
}

export const IndexBuildingNotice: React.FC<IndexBuildingNoticeProps> = ({
  onRetry,
  isRetrying = false
}) => {
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 mx-4 my-6">
      <div className="flex items-start space-x-3">
        <div className="flex-shrink-0">
          <Clock className="h-6 w-6 text-amber-600" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-amber-800 mb-2">
            Analytics Data Loading
          </h3>
          <p className="text-amber-700 mb-4">
            We're currently building your analytics database indexes to provide you with 
            comprehensive insights. This process typically takes a few minutes and only 
            happens once.
          </p>
          <div className="bg-amber-100 rounded-md p-3 mb-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-sm text-amber-800 font-medium">
                What's happening?
              </span>
            </div>
            <p className="text-sm text-amber-700 mt-1">
              Firebase is creating optimized indexes for your shop activities data. 
              This ensures fast and accurate analytics reporting.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div className="text-sm text-amber-600">
              <span className="font-medium">Estimated completion:</span> 2-5 minutes
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                disabled={isRetrying}
                className="inline-flex items-center px-3 py-2 border border-amber-300 shadow-sm text-sm leading-4 font-medium rounded-md text-amber-700 bg-white hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRetrying ? (
                  <>
                    <RefreshCw className="animate-spin -ml-0.5 mr-2 h-4 w-4" />
                    Checking...
                  </>
                ) : (
                  <>
                    <RefreshCw className="-ml-0.5 mr-2 h-4 w-4" />
                    Check Again
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default IndexBuildingNotice;