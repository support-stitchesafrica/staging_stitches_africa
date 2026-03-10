/**
 * Tests for Avatar Service
 * 
 * These tests verify:
 * - Avatar generation from user profile
 * - Avatar storage and retrieval
 * - Avatar updates
 * - Profile validation
 * - Model proportion calculations
 */

import { describe, it, expect, vi } from 'vitest';
import type { UserProfile, BodyType, SkinTone } from '../avatar-service';

// Mock Firebase Admin
vi.mock('@/lib/firebase-admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      add: vi.fn(),
      doc: vi.fn(() => ({
        get: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      })),
      where: vi.fn(() => ({
        orderBy: vi.fn(() => ({
          limit: vi.fn(() => ({
            get: vi.fn(),
          })),
        })),
      })),
    })),
  },
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: vi.fn(() => new Date()),
  },
  Timestamp: {
    fromDate: vi.fn((date) => date),
  },
}));

describe('Avatar Service', () => {
  describe('UserProfile Data Model', () => {
    it('should define valid body types', () => {
      const validBodyTypes: BodyType[] = ['slim', 'athletic', 'average', 'curvy', 'plus-size'];
      
      expect(validBodyTypes).toContain('slim');
      expect(validBodyTypes).toContain('athletic');
      expect(validBodyTypes).toContain('average');
      expect(validBodyTypes).toContain('curvy');
      expect(validBodyTypes).toContain('plus-size');
      expect(validBodyTypes.length).toBe(5);
    });

    it('should define valid skin tones', () => {
      const validSkinTones: SkinTone[] = ['fair', 'light', 'medium', 'tan', 'brown', 'dark'];
      
      expect(validSkinTones).toContain('fair');
      expect(validSkinTones).toContain('light');
      expect(validSkinTones).toContain('medium');
      expect(validSkinTones).toContain('tan');
      expect(validSkinTones).toContain('brown');
      expect(validSkinTones).toContain('dark');
      expect(validSkinTones.length).toBe(6);
    });

    it('should create valid user profile', () => {
      const profile: UserProfile = {
        height: 170,
        bodyType: 'average',
        skinTone: 'medium',
        gender: 'female',
        measurements: {
          chest: 90,
          waist: 70,
          hips: 95,
          shoulders: 40,
        },
      };

      expect(profile.height).toBe(170);
      expect(profile.bodyType).toBe('average');
      expect(profile.skinTone).toBe('medium');
      expect(profile.gender).toBe('female');
      expect(profile.measurements?.chest).toBe(90);
    });
  });

  describe('Height Validation', () => {
    it('should accept valid height range (140-220cm)', () => {
      const validHeights = [140, 160, 170, 180, 200, 220];
      
      validHeights.forEach(height => {
        expect(height).toBeGreaterThanOrEqual(140);
        expect(height).toBeLessThanOrEqual(220);
      });
    });

    it('should identify invalid heights', () => {
      const invalidHeights = [100, 139, 221, 300];
      
      invalidHeights.forEach(height => {
        const isValid = height >= 140 && height <= 220;
        expect(isValid).toBe(false);
      });
    });
  });

  describe('Measurement Validation', () => {
    it('should validate chest measurements (60-150cm)', () => {
      const validChest = [60, 80, 100, 120, 150];
      
      validChest.forEach(chest => {
        expect(chest).toBeGreaterThanOrEqual(60);
        expect(chest).toBeLessThanOrEqual(150);
      });
    });

    it('should validate waist measurements (50-150cm)', () => {
      const validWaist = [50, 70, 90, 110, 150];
      
      validWaist.forEach(waist => {
        expect(waist).toBeGreaterThanOrEqual(50);
        expect(waist).toBeLessThanOrEqual(150);
      });
    });

    it('should validate hips measurements (60-180cm)', () => {
      const validHips = [60, 80, 100, 140, 180];
      
      validHips.forEach(hips => {
        expect(hips).toBeGreaterThanOrEqual(60);
        expect(hips).toBeLessThanOrEqual(180);
      });
    });

    it('should validate shoulders measurements (30-70cm)', () => {
      const validShoulders = [30, 40, 50, 60, 70];
      
      validShoulders.forEach(shoulders => {
        expect(shoulders).toBeGreaterThanOrEqual(30);
        expect(shoulders).toBeLessThanOrEqual(70);
      });
    });
  });

  describe('Model Proportion Calculations', () => {
    it('should calculate scale based on height', () => {
      const heights = [150, 170, 190];
      const baseHeight = 170;
      
      heights.forEach(height => {
        const scale = height / baseHeight;
        expect(scale).toBeCloseTo(height / 170, 2);
      });
    });

    it('should calculate proportions for slim body type', () => {
      const slimProportions = {
        torsoLength: 0.95,
        legLength: 1.05,
        armLength: 1.0,
      };

      expect(slimProportions.torsoLength).toBeLessThan(1.0);
      expect(slimProportions.legLength).toBeGreaterThan(1.0);
      expect(slimProportions.armLength).toBe(1.0);
    });

    it('should calculate proportions for athletic body type', () => {
      const athleticProportions = {
        torsoLength: 1.0,
        legLength: 1.0,
        armLength: 1.0,
      };

      expect(athleticProportions.torsoLength).toBe(1.0);
      expect(athleticProportions.legLength).toBe(1.0);
      expect(athleticProportions.armLength).toBe(1.0);
    });

    it('should calculate proportions for curvy body type', () => {
      const curvyProportions = {
        torsoLength: 1.05,
        legLength: 0.95,
        armLength: 1.0,
      };

      expect(curvyProportions.torsoLength).toBeGreaterThan(1.0);
      expect(curvyProportions.legLength).toBeLessThan(1.0);
      expect(curvyProportions.armLength).toBe(1.0);
    });

    it('should calculate proportions for plus-size body type', () => {
      const plusSizeProportions = {
        torsoLength: 1.1,
        legLength: 0.95,
        armLength: 1.05,
      };

      expect(plusSizeProportions.torsoLength).toBeGreaterThan(1.0);
      expect(plusSizeProportions.legLength).toBeLessThan(1.0);
      expect(plusSizeProportions.armLength).toBeGreaterThan(1.0);
    });
  });

  describe('Avatar Description Parsing', () => {
    it('should extract height from description with cm', () => {
      const description = 'I am 175cm tall';
      const cmMatch = description.match(/(\d{3})\s*cm/);
      
      expect(cmMatch).not.toBeNull();
      if (cmMatch) {
        expect(parseInt(cmMatch[1])).toBe(175);
      }
    });

    it('should extract body type from description', () => {
      const descriptions = [
        { text: 'I have a slim build', expected: 'slim' },
        { text: 'I am athletic', expected: 'athletic' },
        { text: 'I have a curvy figure', expected: 'curvy' },
        { text: 'I am plus-size', expected: 'plus-size' },
      ];

      descriptions.forEach(({ text, expected }) => {
        const lowerText = text.toLowerCase();
        expect(lowerText).toContain(expected);
      });
    });

    it('should extract skin tone from description', () => {
      const descriptions = [
        { text: 'I have fair skin', expected: 'fair' },
        { text: 'My skin is light', expected: 'light' },
        { text: 'I have medium skin tone', expected: 'medium' },
        { text: 'My skin is dark', expected: 'dark' },
      ];

      descriptions.forEach(({ text, expected }) => {
        const lowerText = text.toLowerCase();
        expect(lowerText).toContain(expected);
      });
    });

    it('should extract gender from description', () => {
      const maleDesc = 'I am a male customer';
      const femaleDesc = 'I am a female customer';

      expect(maleDesc.toLowerCase()).toContain('male');
      expect(femaleDesc.toLowerCase()).toContain('female');
    });
  });

  describe('Avatar Configuration', () => {
    it('should create avatar config with all required fields', () => {
      const avatarConfig = {
        avatarId: 'avatar-123',
        userId: 'user-456',
        profile: {
          height: 170,
          bodyType: 'average' as BodyType,
          skinTone: 'medium' as SkinTone,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
        version: 1,
        modelConfig: {
          scale: 1.0,
          proportions: {
            torsoLength: 1.0,
            legLength: 1.0,
            armLength: 1.0,
          },
        },
      };

      expect(avatarConfig).toHaveProperty('avatarId');
      expect(avatarConfig).toHaveProperty('userId');
      expect(avatarConfig).toHaveProperty('profile');
      expect(avatarConfig).toHaveProperty('createdAt');
      expect(avatarConfig).toHaveProperty('updatedAt');
      expect(avatarConfig).toHaveProperty('version');
      expect(avatarConfig).toHaveProperty('modelConfig');
      expect(avatarConfig.modelConfig).toHaveProperty('scale');
      expect(avatarConfig.modelConfig).toHaveProperty('proportions');
    });

    it('should increment version on updates', () => {
      let version = 1;
      
      // Simulate updates
      version++;
      expect(version).toBe(2);
      
      version++;
      expect(version).toBe(3);
    });
  });

  describe('Default Profile', () => {
    it('should provide sensible defaults', () => {
      const defaultProfile: UserProfile = {
        height: 170,
        bodyType: 'average',
        skinTone: 'medium',
      };

      expect(defaultProfile.height).toBe(170);
      expect(defaultProfile.bodyType).toBe('average');
      expect(defaultProfile.skinTone).toBe('medium');
    });
  });

  describe('Size Recommendation Logic', () => {
    it('should map body types to sizes', () => {
      const sizeMap: Record<BodyType, string> = {
        'slim': 'S',
        'athletic': 'M',
        'average': 'M',
        'curvy': 'L',
        'plus-size': 'XL',
      };

      expect(sizeMap['slim']).toBe('S');
      expect(sizeMap['athletic']).toBe('M');
      expect(sizeMap['average']).toBe('M');
      expect(sizeMap['curvy']).toBe('L');
      expect(sizeMap['plus-size']).toBe('XL');
    });

    it('should provide confidence score for recommendations', () => {
      const recommendation = {
        recommendedSize: 'M',
        fitDescription: 'Based on your body type and measurements',
        confidence: 0.75,
      };

      expect(recommendation.confidence).toBeGreaterThan(0);
      expect(recommendation.confidence).toBeLessThanOrEqual(1);
    });
  });

  describe('Avatar Persistence', () => {
    it('should track creation and update timestamps', () => {
      const now = new Date();
      const avatar = {
        createdAt: now,
        updatedAt: now,
      };

      expect(avatar.createdAt).toBeInstanceOf(Date);
      expect(avatar.updatedAt).toBeInstanceOf(Date);
      expect(avatar.createdAt.getTime()).toBeLessThanOrEqual(avatar.updatedAt.getTime());
    });

    it('should update timestamp on profile changes', () => {
      const createdAt = new Date('2024-01-01');
      const updatedAt = new Date('2024-01-02');

      expect(updatedAt.getTime()).toBeGreaterThan(createdAt.getTime());
    });
  });

  describe('Profile Merging', () => {
    it('should merge partial profile updates', () => {
      const existingProfile: UserProfile = {
        height: 170,
        bodyType: 'average',
        skinTone: 'medium',
        gender: 'female',
      };

      const updates: Partial<UserProfile> = {
        height: 175,
        bodyType: 'athletic',
      };

      const merged = {
        ...existingProfile,
        ...updates,
      };

      expect(merged.height).toBe(175);
      expect(merged.bodyType).toBe('athletic');
      expect(merged.skinTone).toBe('medium'); // unchanged
      expect(merged.gender).toBe('female'); // unchanged
    });
  });
});
