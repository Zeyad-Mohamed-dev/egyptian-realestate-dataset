import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { GroupAService } from '../extract/group-a.service';
import { ExtractionEntity } from '../extract/database/extraction.entity';

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const PARSED_JSON_DIR = 'data/parsed-json';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const groupA = app.get(GroupAService);
    const repo = app.get(getRepositoryToken(ExtractionEntity)) as Repository<ExtractionEntity>;

    const files = (await readdir(PARSED_JSON_DIR))
      .filter(f => f.endsWith('.json'));

    let processed = 0;
    let skipped = 0;
    let failures = 0;

    for (const file of files) {
      const listingId = file.replace(/\.json$/i, '');

      const content = await readFile(join(PARSED_JSON_DIR, file), 'utf8');
      const parsed = JSON.parse(content);
      const jsonLd: unknown[] = parsed.jsonLd ?? [];

      if (jsonLd.length === 0) {
        skipped++;
        continue;
      }

      try {
        const groupAResult = groupA.extract({
          listingId,
          sourceUrl: parsed.sourceUrl ?? null,
          jsonLd,
        });

        let extraction = await repo.findOne({ where: { listingId } });

        if (!extraction) {
          extraction = repo.create({
            listingId,
            sourceUrl: parsed.sourceUrl ?? null,
            groupA: groupAResult,
            groupB: null,
            extractedAt: new Date(),
            groupAValid: true,
            groupBValid: false,
            status: 'failed',
            errors: [],
          });
        } else {
          extraction.groupA = groupAResult;
          extraction.groupAValid = true;
          extraction.extractedAt = new Date();
          extraction.status = extraction.groupBValid ? 'success' : 'failed';
        }

        await repo.save(extraction);
        processed++;
      } catch (error) {
        failures++;
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`Failed ${listingId}: ${reason}`);
      }
    }

    console.log(`Done: ${processed} processed, ${skipped} skipped (no jsonLd), ${failures} failures`);
  } finally {
    await app.close();
  }
}

bootstrap().catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});
