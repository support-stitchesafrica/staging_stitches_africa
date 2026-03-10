"use client";

import { useState, useEffect } from "react";
import { productRepository } from "@/lib/firestore";

interface CategoryDebugProps {
  category: string;
}

export function CategoryDebug({ category }: CategoryDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDebugInfo() {
      try {
        setLoading(true);
        
        // Get category-specific products
        const categoryProducts = await productRepository.getProductsByCategory(category);
        
        // Get all products for comparison
        const allProducts = await productRepository.getAllWithTailorInfo();
        
        // Analyze what we have
        const analysis = {
          categoryProducts: categoryProducts.length,
          totalProducts: allProducts.length,
          sampleTitles: allProducts.slice(0, 10).map(p => p.title),
          categoryMatches: allProducts.filter(product => {
            const title = (product.title || '').toLowerCase();
            const categoryLower = category.toLowerCase();
            
            switch (categoryLower) {
              case 'bags':
                return title.includes('bag') || title.includes('purse') || title.includes('handbag');
              case 'shoes':
                return title.includes('shoe') || title.includes('boot') || title.includes('sneaker');
              case 'clothing':
                return title.includes('dress') || title.includes('shirt') || title.includes('top') || title.includes('kaftan');
              case 'accessories':
                return title.includes('belt') || title.includes('scarf') || title.includes('hat') || title.includes('headwrap');
              case 'jewelry':
                return title.includes('necklace') || title.includes('earring') || title.includes('bracelet') || title.includes('bead');
              default:
                return false;
            }
          }).map(p => ({ title: p.title, category: p.category }))
        };
        
        setDebugInfo(analysis);
      } catch (error) {
        console.error('Debug error:', error);
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    }

    fetchDebugInfo();
  }, [category]);

  if (loading) {
    return <div className="p-4 bg-gray-100 rounded">Loading debug info...</div>;
  }

  if (!debugInfo) {
    return <div className="p-4 bg-red-100 rounded">No debug info available</div>;
  }

  return (
    <div className="p-4 bg-blue-50 rounded-lg text-sm">
      <h3 className="font-bold mb-2">Debug Info for {category}</h3>
      
      <div className="space-y-2">
        <p><strong>Category Products Found:</strong> {debugInfo.categoryProducts}</p>
        <p><strong>Total Products Available:</strong> {debugInfo.totalProducts}</p>
        
        {debugInfo.categoryMatches && (
          <div>
            <p><strong>Title-based Matches ({debugInfo.categoryMatches.length}):</strong></p>
            <ul className="list-disc list-inside ml-4 max-h-32 overflow-y-auto">
              {debugInfo.categoryMatches.map((match, index) => (
                <li key={index}>{match.title} (cat: {match.category || 'none'})</li>
              ))}
            </ul>
          </div>
        )}
        
        <div>
          <p><strong>Sample Product Titles:</strong></p>
          <ul className="list-disc list-inside ml-4 max-h-32 overflow-y-auto">
            {debugInfo.sampleTitles?.map((title, index) => (
              <li key={index}>{title}</li>
            ))}
          </ul>
        </div>
        
        {debugInfo.error && (
          <p className="text-red-600"><strong>Error:</strong> {debugInfo.error}</p>
        )}
      </div>
    </div>
  );
}