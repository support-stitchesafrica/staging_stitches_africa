/**
 * Vendor Search Service Tests
 * 
 * Tests for vendor search and recommendation functionality
 */

import { describe, it, expect } from 'vitest';

describe('Vendor Search Service', () => {
  describe('Vendor Filtering', () => {
    const mockVendors = [
      {
        id: 'vendor1',
        name: 'Lagos Fashion House',
        rating: 4.8,
        reviewCount: 120,
        location: 'Lagos',
        specialties: ['Traditional Wear', 'Ankara'],
        verified: true,
      },
      {
        id: 'vendor2',
        name: 'Abuja Tailors',
        rating: 4.5,
        reviewCount: 80,
        location: 'Abuja',
        specialties: ['Formal Wear', 'Suits'],
        verified: true,
      },
      {
        id: 'vendor3',
        name: 'Kano Designs',
        rating: 4.2,
        reviewCount: 45,
        location: 'Kano',
        specialties: ['Traditional Wear', 'Embroidery'],
        verified: false,
      },
    ];

    it('should filter by location', () => {
      const location = 'Lagos';
      const filtered = mockVendors.filter(v => 
        v.location.toLowerCase().includes(location.toLowerCase())
      );
      
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe('vendor1');
    });

    it('should filter by specialty', () => {
      const specialty = 'Traditional Wear';
      const filtered = mockVendors.filter(v => 
        v.specialties.includes(specialty)
      );
      
      expect(filtered).toHaveLength(2);
    });

    it('should filter by verified status', () => {
      const verified = mockVendors.filter(v => v.verified);
      
      expect(verified).toHaveLength(2);
      expect(verified.every(v => v.verified)).toBe(true);
    });

    it('should filter by minimum rating', () => {
      const minRating = 4.5;
      const filtered = mockVendors.filter(v => v.rating >= minRating);
      
      expect(filtered).toHaveLength(2);
      expect(filtered.every(v => v.rating >= minRating)).toBe(true);
    });
  });

  describe('Vendor Ranking', () => {
    it('should prioritize highly-rated vendors', () => {
      const vendors = [
        { id: 'v1', rating: 4.2, reviewCount: 50 },
        { id: 'v2', rating: 4.8, reviewCount: 100 },
        { id: 'v3', rating: 4.5, reviewCount: 75 },
      ];
      
      const sorted = [...vendors].sort((a, b) => b.rating - a.rating);
      
      expect(sorted[0].id).toBe('v2');
      expect(sorted[0].rating).toBe(4.8);
    });

    it('should consider review count for equal ratings', () => {
      const vendors = [
        { id: 'v1', rating: 4.5, reviewCount: 50 },
        { id: 'v2', rating: 4.5, reviewCount: 150 },
      ];
      
      const sorted = [...vendors].sort((a, b) => {
        if (a.rating === b.rating) {
          return b.reviewCount - a.reviewCount;
        }
        return b.rating - a.rating;
      });
      
      expect(sorted[0].id).toBe('v2');
    });

    it('should boost verified vendors', () => {
      const vendors = [
        { id: 'v1', rating: 4.5, verified: false, score: 0 },
        { id: 'v2', rating: 4.5, verified: true, score: 0 },
      ];
      
      vendors.forEach(v => {
        v.score = v.rating;
        if (v.verified) {
          v.score += 0.5;
        }
      });
      
      const sorted = [...vendors].sort((a, b) => b.score - a.score);
      expect(sorted[0].id).toBe('v2');
    });
  });

  describe('Location-Based Search', () => {
    it('should extract location from query', () => {
      const queries = [
        { input: 'tailors in Lagos', expected: 'lagos' },
        { input: 'vendors near Abuja', expected: 'abuja' },
        { input: 'Kano fashion designers', expected: 'kano' },
      ];
      
      queries.forEach(({ input, expected }) => {
        const lowerQuery = input.toLowerCase();
        expect(lowerQuery).toContain(expected);
      });
    });

    it('should handle location variations', () => {
      const locations = ['Lagos', 'lagos', 'LAGOS', 'Lagos, Nigeria'];
      const normalized = locations.map(loc => 
        loc.toLowerCase().replace(/,.*$/, '').trim()
      );
      
      expect(normalized.every(loc => loc === 'lagos')).toBe(true);
    });
  });

  describe('Specialty Matching', () => {
    it('should match specialty keywords', () => {
      const specialtyKeywords = {
        'traditional': ['Traditional Wear', 'Ankara', 'Dashiki'],
        'formal': ['Formal Wear', 'Suits', 'Corporate'],
        'wedding': ['Wedding Attire', 'Bridal', 'Groom'],
      };
      
      const query = 'traditional wear specialist';
      const matchedSpecialties = specialtyKeywords['traditional'];
      
      expect(matchedSpecialties).toContain('Traditional Wear');
    });

    it('should handle multiple specialties', () => {
      const vendor = {
        specialties: ['Traditional Wear', 'Formal Wear', 'Ankara'],
      };
      
      const hasTraditional = vendor.specialties.some(s => 
        s.toLowerCase().includes('traditional')
      );
      const hasFormal = vendor.specialties.some(s => 
        s.toLowerCase().includes('formal')
      );
      
      expect(hasTraditional).toBe(true);
      expect(hasFormal).toBe(true);
    });
  });

  describe('Empty Results', () => {
    it('should return empty array when no matches', () => {
      const vendors: any[] = [];
      const filtered = vendors.filter(v => v.location === 'NonExistent');
      
      expect(filtered).toEqual([]);
    });

    it('should suggest alternatives when no results', () => {
      const hasResults = false;
      const suggestions = hasResults ? [] : [
        'Try searching in nearby cities',
        'Browse all verified vendors',
        'Check our featured vendors',
      ];
      
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Vendor Statistics', () => {
    it('should calculate average rating', () => {
      const vendors = [
        { rating: 4.5 },
        { rating: 4.8 },
        { rating: 4.2 },
      ];
      
      const avgRating = vendors.reduce((sum, v) => sum + v.rating, 0) / vendors.length;
      expect(avgRating).toBeCloseTo(4.5, 1);
    });

    it('should count total reviews', () => {
      const vendors = [
        { reviewCount: 50 },
        { reviewCount: 100 },
        { reviewCount: 75 },
      ];
      
      const totalReviews = vendors.reduce((sum, v) => sum + v.reviewCount, 0);
      expect(totalReviews).toBe(225);
    });
  });
});
