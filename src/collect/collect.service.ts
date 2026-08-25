import { Injectable, Logger } from '@nestjs/common';

import { createHash } from 'node:crypto';
import {
  access,
  appendFile,
  mkdir,
  readdir,
  writeFile,
} from 'node:fs/promises';
import { dirname, join } from 'node:path';

import { chromium, type Page } from 'playwright';

export interface CollectionResult {
  discovered: number;
  saved: number;
  skipped: number;
  failures: Array<{ url: string; reason: string }>;
}

interface CollectionSource {
  name: string;
  url: string;
  quota: number;
}

@Injectable()
export class CollectService {
  private readonly logger = new Logger(CollectService.name);

  /**
   * Collect listings from multiple Bayut search sources.
   *
   * Default distribution per batch of 10:
   *
   * Cairo      -> 5
   * Alexandria -> 3
   * Other      -> 2
   *
   * The collector:
   * - resumes from existing HTML files
   * - skips already collected listings
   * - paginates search results
   * - preserves raw HTML
   * - records failures
   * - does not bypass CAPTCHAs or access challenges
   */
  async collectFromSearch(): Promise<CollectionResult> {
    this.assertAuthorized();

    const maxListings = this.readPositiveInteger(
      process.env.MAX_LISTINGS,
      10,
      'MAX_LISTINGS',
    );

    const delayMs = this.readPositiveInteger(
      process.env.REQUEST_DELAY_MS,
      1200,
      'REQUEST_DELAY_MS',
    );

    const rawHtmlDir =
      process.env.RAW_HTML_DIR ?? 'data/raw-html';

    await mkdir(rawHtmlDir, { recursive: true });

    const sources = this.getCollectionSources();

    let totalCollected =
      await this.countExistingListings(rawHtmlDir);

    this.logger.log(
      `Existing listings: ${totalCollected}/${maxListings}`,
    );

    if (totalCollected >= maxListings) {
      this.logger.log(
        `MAX_LISTINGS already reached. Nothing to collect.`,
      );

      return {
        discovered: 0,
        saved: 0,
        skipped: 0,
        failures: [],
      };
    }

    const browser = await chromium.launch({
      headless: false,
    });

    const result: CollectionResult = {
      discovered: 0,
      saved: 0,
      skipped: 0,
      failures: [],
    };

    try {
      const page = await browser.newPage();

      /*
       * We collect in rounds.
       *
       * For every round:
       *
       * Cairo      -> 5
       * Alexandria -> 3
       * Giza      -> 2
       *
       * The final round may contain fewer than 10 listings.
       */
      let round = 1;

      while (totalCollected < maxListings) {
        this.logger.log(`Starting collection round ${round}`);

        const remaining = maxListings - totalCollected;

        const roundSize = Math.min(10, remaining);

        /*
         * Keep the 5/3/2 distribution, but don't request
         * more listings than remain in the final round.
         */
        const roundQuotas = this.calculateRoundQuotas(
          roundSize,
          sources,
        );

        let madeProgress = false;

        for (let i = 0; i < sources.length; i++) {
          if (totalCollected >= maxListings) {
            break;
          }

          const source = sources[i];
          const quota = roundQuotas[i];

          if (quota <= 0) {
            continue;
          }

          this.logger.log(
            `Source ${source.name}: target ${quota} listings this round`,
          );

          const savedFromSource =
            await this.collectFromSource(
              page,
              source,
              quota,
              maxListings,
              totalCollected,
              rawHtmlDir,
              delayMs,
              result,
            );

          if (savedFromSource > 0) {
            madeProgress = true;
            totalCollected += savedFromSource;

            this.logger.log(
              `${source.name}: saved ${savedFromSource}. Total ${totalCollected}/${maxListings}`,
            );
          }
        }

        /*
         * If none of the sources produced anything, continuing
         * would create an infinite loop.
         */
        if (!madeProgress) {
          this.logger.warn(
            'No new listings were collected in this round. Stopping collection.',
          );
          break;
        }

        round++;
      }
    } finally {
      await browser.close();
    }

    this.logger.log(
      `Collection complete: ${totalCollected}/${maxListings} total listings.`,
    );

    return result;
  }

  /**
   * Defines the geographic collection sources.
   *
   * The quota is the desired proportion per 10-listing round.
   *
   * 5 Cairo
   * 3 Alexandria
   * 2 Giza/Other
   */
  private getCollectionSources(): CollectionSource[] {
    const cairoUrl = this.assertCollectionUrl(
      process.env.CAIRO_SEARCH_URL,
      'CAIRO_SEARCH_URL',
    );

    const alexandriaUrl = this.assertCollectionUrl(
      process.env.ALEXANDRIA_SEARCH_URL,
      'ALEXANDRIA_SEARCH_URL',
    );

    const gizaUrl = this.assertCollectionUrl(
      process.env.GIZA_SEARCH_URL,
      'GIZA_SEARCH_URL',
    );

    return [
      {
        name: 'Cairo',
        url: cairoUrl,
        quota: 5,
      },
      {
        name: 'Alexandria',
        url: alexandriaUrl,
        quota: 3,
      },
      {
        name: 'Giza',
        url: gizaUrl,
        quota: 2,
      },
    ];
  }

  /**
   * Calculate quotas for the current round.
   *
   * Normal round:
   * [5, 3, 2]
   *
   * Final smaller round gets a sensible reduced distribution.
   */
  private calculateRoundQuotas(
    roundSize: number,
    sources: CollectionSource[],
  ): number[] {
    const totalQuota = sources.reduce(
      (sum, source) => sum + source.quota,
      0,
    );

    if (roundSize >= totalQuota) {
      return sources.map((source) => source.quota);
    }

    const quotas = sources.map(() => 0);

    /*
     * Allocate one listing at a time according to the
     * desired quota proportions.
     *
     * For example:
     *
     * roundSize = 5
     * approximately:
     * Cairo      3
     * Alexandria 1
     * Other      1
     */
    const weighted = sources.map((source, index) => ({
      index,
      value: (source.quota / totalQuota) * roundSize,
    }));

    /*
     * First take the floor.
     */
    let allocated = 0;

    for (const item of weighted) {
      quotas[item.index] = Math.floor(item.value);
      allocated += quotas[item.index];
    }

    /*
     * Distribute remaining slots according to largest remainder.
     */
    const remaining = roundSize - allocated;

    weighted
      .sort(
        (a, b) =>
          b.value - Math.floor(b.value) -
          (a.value - Math.floor(a.value)),
      )
      .slice(0, remaining)
      .forEach((item) => {
        quotas[item.index]++;
      });

    return quotas;
  }

  /**
   * Collect a quota from one geographic search source.
   *
   * Automatically moves through search result pages:
   *
   * page 1 -> page 2 -> page 3 -> ...
   */
  private async collectFromSource(
    page: Page,
    source: CollectionSource,
    quota: number,
    maxListings: number,
    currentTotal: number,
    rawHtmlDir: string,
    delayMs: number,
    result: CollectionResult,
  ): Promise<number> {
    let saved = 0;
    let pageNumber = 1;

    const seenUrls = new Set<string>();

    while (saved < quota) {
      const searchUrl = this.buildPageUrl(
        source.url,
        pageNumber,
      );

      this.logger.log(
        `${source.name}: opening search page ${pageNumber}`,
      );

      try {
        await page.goto(searchUrl, {
          waitUntil: 'domcontentloaded',
          timeout: 45_000,
        });

        await this.assertNoAccessChallenge(page);
      } catch (error) {
        const reason =
          error instanceof Error
            ? error.message
            : String(error);

        this.logger.warn(
          `${source.name} search page ${pageNumber} failed: ${reason}`,
        );

        result.failures.push({
          url: searchUrl,
          reason,
        });

        break;
      }

      const listingUrls = await page
        .locator('a[href*="/property/details-"]')
        .evaluateAll((anchors) =>
          [
            ...new Set(
              anchors.map(
                (anchor) =>
                  (anchor as HTMLAnchorElement).href,
              ),
            ),
          ],
        );

      /*
       * Prevent infinite pagination if Bayut returns
       * the same listings again.
       */
      const newListingUrls = listingUrls.filter(
        (url) => !seenUrls.has(url),
      );

      for (const url of newListingUrls) {
        seenUrls.add(url);
      }

      result.discovered += newListingUrls.length;

      this.logger.log(
        `${source.name} page ${pageNumber}: discovered ${newListingUrls.length} new listing URLs`,
      );

      /*
       * No new listings means we've probably reached
       * the end of pagination.
       */
      if (newListingUrls.length === 0) {
        this.logger.log(
          `${source.name}: no new listings on page ${pageNumber}.`,
        );
        break;
      }

      for (const url of newListingUrls) {
        if (saved >= quota) {
          break;
        }

        if (currentTotal + saved >= maxListings) {
          break;
        }

        const listingUrl = this.assertCollectionUrl(
          url,
          'listing URL',
        );

        const listingId =
          this.listingIdFromUrl(listingUrl);

        const htmlPath = join(
          rawHtmlDir,
          `${listingId}.html`,
        );

        /*
         * Existing listing.
         *
         * This is what makes the collector resumable.
         */
        if (await this.fileExists(htmlPath)) {
          result.skipped++;

          this.logger.log(
            `${source.name}: skipping existing listing ${listingId}`,
          );

          continue;
        }

        try {
          await page.waitForTimeout(delayMs);

          await page.goto(listingUrl, {
            waitUntil: 'domcontentloaded',
            timeout: 45_000,
          });

          await this.assertNoAccessChallenge(page);

          const html = await page.content();

          await writeFile(
            htmlPath,
            html,
            'utf8',
          );

          await this.appendManifest(
            rawHtmlDir,
            {
              listingId,
              url: listingUrl,
              htmlPath,
            },
          );

          saved++;

          this.logger.log(
            `${source.name}: saved ${listingId} (${saved}/${quota} for source)`,
          );
        } catch (error) {
          const reason =
            error instanceof Error
              ? error.message
              : String(error);

          result.failures.push({
            url: listingUrl,
            reason,
          });

          this.logger.warn(
            `${source.name}: failed ${listingUrl}: ${reason}`,
          );
        }
      }

      pageNumber++;
    }

    return saved;
  }

  /**
   * Adds the Bayut pagination parameter.
   *
   * Example:
   *
   * page 1:
   * https://www.bayut.eg/en/...
   *
   * page 2:
   * https://www.bayut.eg/en/...?page=2
   */
  private buildPageUrl(
    baseUrl: string,
    pageNumber: number,
  ): string {
    const url = new URL(baseUrl);

    if (pageNumber > 1) {
      url.searchParams.set(
        'page',
        String(pageNumber),
      );
    }

    return url.toString();
  }

  private async countExistingListings(
    rawHtmlDir: string,
  ): Promise<number> {
    const files = await readdir(rawHtmlDir, {
      withFileTypes: true,
    });

    return files.filter(
      (entry) =>
        entry.isFile() &&
        entry.name.endsWith('.html'),
    ).length;
  }

  private assertAuthorized(): void {
    if (
      process.env.COLLECTION_AUTHORIZED?.toLowerCase() !==
      'true'
    ) {
      throw new Error(
        'Collection is disabled. Set COLLECTION_AUTHORIZED=true only after authorization is confirmed.',
      );
    }
  }

  private assertCollectionUrl(
    value: string | undefined,
    label: string,
  ): string {
    if (!value) {
      throw new Error(`${label} is required.`);
    }

    const url = new URL(value);

    const isBayut =
      url.protocol === 'https:' &&
      url.hostname.endsWith('bayut.eg');

    const isLocalTestServer =
      process.env.NODE_ENV === 'test' &&
      url.protocol === 'http:' &&
      (url.hostname === '127.0.0.1' ||
        url.hostname === 'localhost');

    if (!isBayut && !isLocalTestServer) {
      throw new Error(
        `${label} must be an https://*.bayut.eg URL.`,
      );
    }

    return url.toString();
  }

  private listingIdFromUrl(url: string): string {
    const match = url.match(
      /\/property\/details-(\d+)\.html/i,
    );

    return (
      match?.[1] ??
      createHash('sha256')
        .update(url)
        .digest('hex')
        .slice(0, 16)
    );
  }

  private readPositiveInteger(
    value: string | undefined,
    fallback: number,
    label: string,
  ): number {
    if (!value) {
      return fallback;
    }

    const parsed = Number.parseInt(value, 10);

    if (
      !Number.isSafeInteger(parsed) ||
      parsed <= 0
    ) {
      throw new Error(
        `${label} must be a positive integer.`,
      );
    }

    return parsed;
  }

  private async fileExists(
    path: string,
  ): Promise<boolean> {
    try {
      await access(path);
      return true;
    } catch {
      return false;
    }
  }

  private async appendManifest(
    rawHtmlDir: string,
    record: {
      listingId: string;
      url: string;
      htmlPath: string;
    },
  ): Promise<void> {
    const manifestPath = join(
      rawHtmlDir,
      'manifest.ndjson',
    );

    await mkdir(dirname(manifestPath), {
      recursive: true,
    });

    await appendFile(
      manifestPath,
      `${JSON.stringify({
        ...record,
        collectedAt:
          new Date().toISOString(),
      })}\n`,
      'utf8',
    );
  }

  private async assertNoAccessChallenge(
    page: Page,
  ): Promise<void> {
    const visibleText = await page
      .locator('body')
      .innerText()
      .catch(() => '');

    const pageText =
      `${await page.title()}\n${visibleText}`;

    if (
      /attention required|just a moment|verify you are human|captcha challenge/i.test(
        pageText,
      )
    ) {
      throw new Error(
        'Access challenge detected; collection stopped without attempting to bypass it.',
      );
    }
  }
}