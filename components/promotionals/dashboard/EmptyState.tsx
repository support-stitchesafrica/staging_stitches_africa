'use client';

import { Tag } from 'lucide-react';
import Link from 'next/link';

export function EmptyState()
{
    return (
        <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Tag className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No promotional events yet
            </h3>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Get started by creating your first promotional event. Add products with discounts and create engaging banners.
            </p>
            <Link
                href="/promotionals/create"
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
                <Tag className="w-5 h-5" />
                Create Promotional Event
            </Link>
        </div>
    );
}
