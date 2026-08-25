import { GroupA } from './group-a.types';
import { GroupB } from './group-b.types';

export interface ExtractionRecord {
  listingId: string;
  sourceUrl: string | null;

  groupA: GroupA | null;
  groupB: GroupB | null;

  extractedAt: string;

  groupAValid: boolean;
  groupBValid: boolean;

  status: 'success' | 'failed';
  errors: string[];
}