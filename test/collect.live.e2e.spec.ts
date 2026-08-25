import 'dotenv/config';
import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CollectService } from '../src/collect/collect.service';

const runLiveTest = process.env.RUN_LIVE_BAYUT_TEST === 'true';
const liveTest = runLiveTest ? it : it.skip;

describe('CollectService (live Bayut smoke test)', () => {
  let outputDir: string;
  let originalEnvironment: NodeJS.ProcessEnv;

  beforeAll(async () => {
    originalEnvironment = { ...process.env };
    outputDir = await mkdtemp(join(tmpdir(), 'housing-collector-live-'));
    process.env.RAW_HTML_DIR = outputDir;
    process.env.MAX_LISTINGS = '1';
    process.env.REQUEST_DELAY_MS = '1200';
  });

  afterAll(async () => {
    await rm(outputDir, { recursive: true, force: true });
    process.env = originalEnvironment;
  });

  liveTest(
    'collects one real listing and saves its HTML',
    async () => {
      expect(process.env.COLLECTION_AUTHORIZED).toBe('true');

      const result = await new CollectService().collectFromSearch();

      expect(result.discovered).toBeGreaterThan(0);
      expect(result.failures).toEqual([]);
      expect(result.saved + result.skipped).toBe(1);
      expect((await readdir(outputDir)).some((file) => file.endsWith('.html'))).toBe(true);
    },
    60_000,
  );
});
