import { NestFactory } from '@nestjs/core';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { AppModule } from '../app.module';
import { GroupBService } from '../extract/group-b.service';
import { GroupAService } from '../extract/group-a.service';
import { ExtractionEntity } from '../extract/database/extraction.entity';

import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

const PARSED_JSON_DIR = 'data/parsed-json';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const groupB = app.get(GroupBService);
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
        // Check if Group A exists - Group B requires Group A
        let extraction = await repo.findOne({ where: { listingId } });

        if (!extraction || !extraction.groupA) {
          // Extract Group A first if needed
          if (!extraction) {
            const groupAResult = groupA.extract({
              listingId,
              sourceUrl: parsed.sourceUrl ?? null,
              jsonLd,
            });

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
          } else if (!extraction.groupA) {
            const groupAResult = groupA.extract({
              listingId,
              sourceUrl: parsed.sourceUrl ?? null,
              jsonLd,
            });
            extraction.groupA = groupAResult;
            extraction.groupAValid = true;
          }

          await repo.save(extraction);
        }

        // Build source text for Group B extraction
        const sourceText = buildSourceText(parsed, jsonLd);

        // Run Group B extraction
        const groupBResult = await groupB.extract({
          listingId,
          data: sourceText,
        });

        extraction.groupB = groupBResult;
        extraction.groupBValid = true;
        extraction.status = 'success';
        extraction.extractedAt = new Date();
        extraction.errors = [];

        await repo.save(extraction);
        processed++;

        console.log(`✓ ${listingId}: Group B extracted successfully`);
      } catch (error) {
        failures++;
        const reason = error instanceof Error ? error.message : String(error);
        console.error(`✗ ${listingId}: ${reason}`);
      }
    }

    console.log(`\nDone: ${processed} processed, ${skipped} skipped (no jsonLd), ${failures} failures`);
  } finally {
    await app.close();
  }
}

function buildSourceText(parsed: Record<string, unknown>, jsonLd: unknown[]): string {
  // Extract description from JSON-LD
  let description = '';

  for (const item of jsonLd) {
    if (item && typeof item === 'object' && '@graph' in item) {
      const graph = (item as Record<string, unknown>)['@graph'];
      if (Array.isArray(graph)) {
        for (const node of graph) {
          if (node && typeof node === 'object' && 'mainEntity' in node) {
            const entity = (node as Record<string, unknown>).mainEntity;
            if (entity && typeof entity === 'object' && 'description' in entity) {
              description = (entity as Record<string, unknown>).description as string;
              break;
            }
          }
        }
      }
    }
    if (description) break;
  }

  // Build source text with available data
  const parts: string[] = [];

  if (description) {
    parts.push(`Description: ${description}`);
  }

  if (parsed.sourceUrl) {
    parts.push(`URL: ${parsed.sourceUrl}`);
  }

  return parts.join('\n\n') || JSON.stringify(parsed);
}

bootstrap().catch(error => {
  console.error('Failed:', error);
  process.exit(1);
});
