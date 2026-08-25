export interface ParsedRawListing {
  listingId: string;
  sourceUrl: string | null;
  parsedAt: string;

  groupA: Record<string, null>;

  jsonLd: unknown[];
}