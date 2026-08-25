# Egyptian Housing Dataset Pipeline

NestJS + Playwright project blueprint for the ECES Junior AI/Data Engineer take-home. This repository currently contains **structure only**: no scraper, extractor, database implementation, or API logic has been written.

## Technology choices

- NestJS + TypeScript: clear module boundaries and dependency injection
- Playwright: authorized browser collection
- TypeORM + SQLite: durable checkpoints, deduplication, and raw-page metadata
- Zod: schemas at module boundaries
- ExcelJS: final XLSX workbook
- Vitest: unit/integration test framework

## Collection authorization

Before building or running any automated collector, obtain authorization for this assessment. Set `COLLECTION_AUTHORIZED=true` only after that confirmation. Do not use CAPTCHA bypasses, proxy rotation, or access-evasion techniques.

## Planned commands

```powershell
npm install
npm run collect
npm run extract
npm run evaluate
npm run export
```

The scripts are placeholders until implementation begins.

## Live collection smoke test

This test uses the real Bayut search page and saves one real listing only to a temporary folder. It is skipped by normal `npm test` runs. After recording authorization in `.env`, run it explicitly in PowerShell:

```powershell
$env:RUN_LIVE_BAYUT_TEST = 'true'
npm test -- test/collect.live.e2e.spec.ts
```

## Module map

| Module | Responsibility |
| --- | --- |
| `collect` | Discover listing URLs, capture authorized pages, and checkpoint each attempt |
| `pipeline` | Coordinate asynchronous processing of saved raw HTML without re-fetching pages |
| `parse` | Read Group A values from structured listing-page content |
| `extract` | Extract Group B values only when explicitly stated in `description_raw` |
| `normalize` | Normalize Arabic/English terms, numeric formats, categories, and locations |
| `storage` | TypeORM entities, repositories, resume state, and deduplication |
| `evaluate` | Compare predictions with the 25-listing gold set; report accuracy and hallucination rate |
| `export` | Create the required XLSX, failure summary, and report inputs |
| `common` | Shared field definitions, null rules, configuration, and error contracts |

## Intended data flow

`collect → raw HTML + SQLite checkpoint → parse (Group A) → extract (Group B) → normalize/validate → evaluate → XLSX export`

Keep raw HTML and source URLs immutable. Make parsing and extraction rerunnable from stored data so extraction improvements do not trigger a re-collection.

`PipelineService.processSavedHtml()` is the first local processing step: it reads `data/raw-html/*.html` asynchronously and writes JSON intermediates to `data/parsed-json/`. It makes no browser or network requests.
