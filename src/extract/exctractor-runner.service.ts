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

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { ExtractorService } from './extract.service';
import { ExtractionEntity } from './database/extraction.entity';
import { ParsedRawListing } from './types/parsed-listing.types';

@Injectable()
export class ExtractorRunnerService {
  private readonly logger =
    new Logger(ExtractorRunnerService.name);

  constructor(
    private readonly extractorService: ExtractorService,

    @InjectRepository(ExtractionEntity)
    private readonly repository: Repository<ExtractionEntity>,
  ) {}

  /**
   * Extract every parsed JSON listing that has not
   * already been successfully extracted.
   */
  async extractAll(
  parsedJsonDir = 'data/parsed-json',
): Promise<{
  found: number;
  processed: number;
  skipped: number;
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
  let skipped = 0;
  let failures = 0;

  for (const fileName of files) {
    const listingId = fileName.replace(
      /\.json$/i,
      '',
    );

    /*
     * Look for ANY existing extraction.
     *
     * If it is successful, skip it.
     * If it failed, retry it.
     */
    const existing = await this.repository.findOne({
      where: {
        listingId,
      },
    });

    if (existing?.status === 'success') {
      skipped++;

      this.logger.log(
        `Skipping already successfully extracted ${listingId}`,
      );

      continue;
    }

    try {
      const content = await readFile(
        join(parsedJsonDir, fileName),
        'utf8',
      );

      const listing =
        JSON.parse(content) as ParsedRawListing;

      const result =
        await this.extractorService.extract(listing);

      if (result.status === 'success') {
        processed++;

        this.logger.log(
          `Successfully extracted ${listingId}`,
        );
      } else {
        failures++;

        this.logger.error(
          `Extraction failed for ${listingId}`,
        );
      }
    } catch (error) {
      failures++;

      const reason =
        error instanceof Error
          ? error.message
          : String(error);

      this.logger.error(
        `Extraction failed for ${listingId}: ${reason}`,
      );
    }
  }

  return {
    found: files.length,
    processed,
    skipped,
    failures,
  };
}

  /**
   * Return all extraction records stored in SQLite.
   */
  async getAllListings(): Promise<ExtractionEntity[]> {
    return this.repository.find({
      order: {
        id: 'ASC',
      },
    });
  }
}