// test/live-collect.e2e-spec.ts
// Live smoke test — hits the real site. Not for CI. Run manually:
//   COLLECTION_AUTHORIZED=true SEARCH_URL="https://www.bayut.eg/..." npx vitest run live-collect
import { describe, it, beforeAll, afterAll, expect } from 'vitest';
import { Test } from '@nestjs/testing';
import { readFile, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import { CollectService } from '../../collect/collect.service';
import { PipelineService } from '../pipeline.service';
import { PipelineModule } from '../pipeline.module';
import { CollectModule } from '../../collect/collect.module';

describe('LIVE collect -> pipeline -> parse (manual, hits real site)', () => {
  const rawHtmlDir = 'data/live-test-raw-html';
  const parsedJsonDir = 'data/live-test-parsed-json';

  let collectService: CollectService;
  let pipelineService: PipelineService;

  beforeAll(async () => {
    if (!process.env.SEARCH_URL || process.env.COLLECTION_AUTHORIZED !== 'true') {
      throw new Error(
        'Set SEARCH_URL and COLLECTION_AUTHORIZED=true to run this live test. ' +
          'It is intentionally not wired into normal CI.',
      );
    }
    process.env.RAW_HTML_DIR = rawHtmlDir;
    process.env.MAX_LISTINGS = process.env.MAX_LISTINGS ?? '3';
    process.env.REQUEST_DELAY_MS = process.env.REQUEST_DELAY_MS ?? '2000';

    const moduleRef = await Test.createTestingModule({
      imports: [CollectModule, PipelineModule],
    }).compile();

    collectService = moduleRef.get(CollectService);
    pipelineService = moduleRef.get(PipelineService);
  });

  afterAll(async () => {
    // Comment these in if you want cleanup instead of inspecting saved files
    // await rm(rawHtmlDir, { recursive: true, force: true }).catch(() => {});
    // await rm(parsedJsonDir, { recursive: true, force: true }).catch(() => {});
  });

  it('reports exactly what happened, success or failure', async () => {
    let collectResult;
    let collectError: Error | null = null;

    try {
      collectResult = await collectService.collectFromSearch();
    } catch (err) {
      collectError = err instanceof Error ? err : new Error(String(err));
    }

    if (collectError) {
      console.log('COLLECTION FAILED:', collectError.message);
      throw collectError;
    }

    console.log('COLLECTION RESULT:', JSON.stringify(collectResult, null, 2));

    const savedFiles = await readdir(rawHtmlDir).catch(() => []);
    console.log('SAVED HTML FILES:', savedFiles);

    if (collectResult!.saved === 0) {
      console.log('No listings saved — nothing to parse. Inspect raw-html dir / failures above.');
      return;
    }

    const pipelineResult = await pipelineService.processSavedHtml({ rawHtmlDir, parsedJsonDir });
    console.log('PIPELINE RESULT:', JSON.stringify(pipelineResult, null, 2));

    const parsedFiles = await readdir(parsedJsonDir).catch(() => []);
    for (const file of parsedFiles) {
      const content = await readFile(join(parsedJsonDir, file), 'utf8');
      console.log(`--- ${file} ---`);
      console.log(content);
    }

    expect(collectResult!.saved).toBeGreaterThan(0);
  }, 120_000);
});