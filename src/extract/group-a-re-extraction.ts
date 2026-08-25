import {
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  mkdir,
  readdir,
  readFile,
} from 'node:fs/promises';

import { join } from 'node:path';

import { ExtractorService } from './extract.service';

import { ParsedRawListing } from './types/parsed-listing.types';

@Injectable()
export class GroupAReExtractionService {
  private readonly logger =
    new Logger(GroupAReExtractionService.name);

  constructor(
    private readonly extractorService: ExtractorService,
  ) {}

  async run(
    parsedJsonDir = 'data/parsed-json',
  ): Promise<{
    found: number;
    processed: number;
    failures: number;
  }> {
    await mkdir(parsedJsonDir, {
      recursive: true,
    });

    const files = (
      await readdir(parsedJsonDir, {
        withFileTypes: true,
      })
    )
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith('.json'),
      )
      .map((entry) => entry.name);

    let processed = 0;
    let failures = 0;

    for (const fileName of files) {
      const listingId = fileName.replace(
        /\.json$/i,
        '',
      );

      try {
        const content = await readFile(
          join(parsedJsonDir, fileName),
          'utf8',
        );

        const listing =
          JSON.parse(content) as ParsedRawListing;

        await this.extractorService.reExtractGroupA(
          listing,
        );

        processed++;

        this.logger.log(
          `Group A re-extracted successfully: ${listingId}`,
        );
      } catch (error) {
        failures++;

        const reason =
          error instanceof Error
            ? error.message
            : String(error);

        this.logger.error(
          `Group A re-extraction failed for ${listingId}: ${reason}`,
        );
      }
    }

    return {
      found: files.length,
      processed,
      failures,
    };
  }
}