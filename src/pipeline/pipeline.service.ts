import { Inject, Injectable, Logger } from '@nestjs/common';
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ParseService } from '../parse/parse.service';

interface ManifestRecord {
  listingId: string;
  url: string;
  htmlPath: string;
}

export interface RawHtmlPipelineResult {
  found: number;
  processed: number;
  skipped: number;
  failures: Array<{ listingId: string; reason: string }>;
}

@Injectable()
export class PipelineService {
  private readonly logger = new Logger(PipelineService.name);

  constructor(@Inject(ParseService) private readonly parseService: ParseService) {}
  

  /**
   * Reads locally saved HTML pages and writes a JSON intermediate for each one.
   * This never opens a browser or makes network requests.
   */
  async processSavedHtml(options?: {
    rawHtmlDir?: string;
    parsedJsonDir?: string;
    concurrency?: number;
  }): Promise<RawHtmlPipelineResult> {
    const rawHtmlDir = options?.rawHtmlDir ?? process.env.RAW_HTML_DIR ?? 'data/raw-html';
    const parsedJsonDir = options?.parsedJsonDir ?? 'data/parsed-json';
    const concurrency = this.readConcurrency(options?.concurrency ?? 4);

    await mkdir(parsedJsonDir, { recursive: true });
    const sourceUrls = await this.readManifest(rawHtmlDir);
    const files = (await readdir(rawHtmlDir, { withFileTypes: true }))
      .filter((entry) => entry.isFile() && entry.name.endsWith('.html'))
      .map((entry) => entry.name);
    const result: RawHtmlPipelineResult = { found: files.length, processed: 0, skipped: 0, failures: [] };
    let nextFile = 0;

    const worker = async (): Promise<void> => {
      while (nextFile < files.length) {
        const fileName = files[nextFile++];
        const listingId = fileName.replace(/\.html$/i, '');
        const outputPath = join(parsedJsonDir, `${listingId}.json`);

        try {
          if (await this.fileExists(outputPath)) {
            result.skipped += 1;
            continue;
          }

          const html = await readFile(join(rawHtmlDir, fileName), 'utf8');
          const parsed = this.parseService.parseRawHtml({
            listingId,
            sourceUrl: sourceUrls.get(listingId) ?? null,
            html,
          });
          await writeFile(outputPath, `${JSON.stringify(parsed, null, 2)}\n`, 'utf8');
          result.processed += 1;
          this.logger.log(`Parsed ${listingId}`);
        } catch (error) {
          const reason = error instanceof Error ? error.message : String(error);
          result.failures.push({ listingId, reason });
          this.logger.warn(`Failed ${listingId}: ${reason}`);
        }
      }
    };

    await Promise.all(Array.from({ length: Math.min(concurrency, files.length) }, worker));
    return result;
  }

  private async readManifest(rawHtmlDir: string): Promise<Map<string, string>> {
    const manifestPath = join(rawHtmlDir, 'manifest.ndjson');
    try {
      const content = await readFile(manifestPath, 'utf8');
      return new Map(
        content
          .split(/\r?\n/)
          .filter(Boolean)
          .map((line) => JSON.parse(line) as ManifestRecord)
          .map((record) => [record.listingId, record.url]),
      );
    } catch {
      return new Map();
    }
  }

  private readConcurrency(value: number): number {
    if (!Number.isSafeInteger(value) || value < 1) {
      throw new Error('Pipeline concurrency must be a positive integer.');
    }
    return value;
  }

  private async fileExists(path: string): Promise<boolean> {
    try {
      await readFile(path);
      return true;
    } catch {
      return false;
    }
  }
}
