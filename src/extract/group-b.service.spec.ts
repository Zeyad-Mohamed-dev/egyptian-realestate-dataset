import { describe, it, expect, beforeEach } from 'vitest';
import { GroupBService } from './group-b.service';

describe('GroupBService Amenities Validation', () => {
  let service: GroupBService;

  beforeEach(() => {
    service = new GroupBService({} as any);
  });

  describe('validateAmenities', () => {
    it('should keep amenities explicitly mentioned in source', () => {
      const amenities = ['Swimming Pool', 'Gym'];
      const sourceText = 'property has a swimming pool and gym facilities';
      
      const result = (service as any).validateAmenities(amenities, sourceText);
      expect(result).toEqual(['Swimming Pool', 'Gym']);
    });

    it('should remove amenities NOT mentioned in source', () => {
      const amenities = ['Covered parking', 'Pets Allowed', 'Electricity Meter'];
      const sourceText = 'property with sea view';
      
      const result = (service as any).validateAmenities(amenities, sourceText);
      expect(result).toEqual([]);
    });

    it('should handle Arabic variations', () => {
      const amenities = ['Swimming Pool', 'Security Staff'];
      const sourceText = 'فيلا مع مسبح وأمن على مدار الساعة';
      
      const result = (service as any).validateAmenities(amenities, sourceText);
      expect(result).toEqual(['Swimming Pool', 'Security Staff']);
    });

    it('should handle mixed Arabic and English', () => {
      const amenities = ['Covered parking', 'Natural Gas'];
      const sourceText = 'شقة مع جراج وغاز طبيعي';
      
      const result = (service as any).validateAmenities(amenities, sourceText);
      expect(result).toEqual(['Covered parking', 'Natural Gas']);
    });

    it('should remove all amenities when none are mentioned', () => {
      const amenities = ['Swimming Pool', 'Gym', 'Security Staff', 'CCTV Security'];
      const sourceText = 'apartment for sale in new cairo';
      
      const result = (service as any).validateAmenities(amenities, sourceText);
      expect(result).toEqual([]);
    });

    it('should keep amenities that match exactly', () => {
      const amenities = ['Balcony or Terrace'];
      const sourceText = 'property with balcony';
      
      const result = (service as any).validateAmenities(amenities, sourceText);
      expect(result).toEqual(['Balcony or Terrace']);
    });

    it('should keep amenities with related terms in source', () => {
      const amenities = ['Covered parking'];
      const sourceText = 'property with parking space';
      
      const result = (service as any).validateAmenities(amenities, sourceText);
      // "parking" is a variation that matches "parking space"
      expect(result).toEqual(['Covered parking']);
    });

    it('should remove amenities when source has unrelated text', () => {
      const amenities = ['Swimming Pool', 'Gym'];
      const sourceText = 'property with sea view and garden';
      
      const result = (service as any).validateAmenities(amenities, sourceText);
      expect(result).toEqual([]);
    });
  });
});
