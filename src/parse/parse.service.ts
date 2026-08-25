import { Injectable } from '@nestjs/common';

export interface ParsedRawListing {
  listingId: string;
  sourceUrl: string | null;
  parsedAt: string;
  groupA: Record<string, null>;
  jsonLd: unknown[];
}

@Injectable()
export class ParseService {
  /**
   * Converts a saved page into a JSON-ready intermediate record.
   * Group A selectors are deliberately added later after inspecting real saved pages.
   */
  parseRawHtml(input: { listingId: string; sourceUrl: string | null; html: string }): ParsedRawListing {
    return {
      listingId: input.listingId,
      sourceUrl: input.sourceUrl,
      parsedAt: new Date().toISOString(),
      groupA: {},
      jsonLd: this.readJsonLd(input.html),
    };
  }

  private readJsonLd(html: string): unknown[] {
    const scripts = html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi);
    const values: unknown[] = [];

    for (const match of scripts) {
      if (!/type\s*=\s*["']application\/ld\+json["']/i.test(match[1])) continue;
      try {
        values.push(JSON.parse(match[2].trim()));
      } catch {
        // Keep processing other valid JSON-LD blocks; malformed page metadata is not fatal.
      }
    }

    return values;
  }
}
