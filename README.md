# Egyptian Real Estate Dataset Pipeline

A complete pipeline for scraping, parsing, extracting, validating, and exporting structured data from Egyptian real estate listings on Bayut.eg.

## Overview

This project collects property listings from Bayut.eg, extracts structured data from the listings, uses an LLM for fields that require semantic interpretation, validates the extracted values, and exports the final dataset to Excel.

The pipeline supports both Arabic and English listings.

## Pipeline Stages

The pipeline is executed in the following order:

1. **Collect** (`npm run collect`) — Scrapes raw listing HTML from Bayut search pages using Playwright.
2. **Parse** (`npm run parse`) — Extracts structured JSON-LD data from the saved HTML.
3. **Extract** (`npm run extract`) — Uses an LLM to extract Group B fields from unstructured listing descriptions.
4. **Export** (`npm run export`) — Combines the extracted data and exports it to `dataset.xlsx`.

The stages should normally be executed in this order because each stage depends on data produced by the previous stage.

## Dataset

**Output:** `dataset.xlsx` at the project root.

**Collected listings:** Approximately 500 Egyptian property listings.

**Columns:** 36 standardized fields, including:

* Listing ID, URL, property type, price, and area
* Location (Governorate, City, District)
* Property details (Bedrooms, Bathrooms, Finishing Level)
* Developer and compound information
* Payment terms
* Amenities
* Delivery information

## Quick Start

### Prerequisites

* Node.js 18+
* npm
* Internet connection
* A Groq API key **or** a local Ollama installation

### 1. Install Dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Configure Environment Variables

Create a `.env` file in the project root.

#### Recommended: Groq

```env
MAX_LISTINGS=500
REQUEST_DELAY_MS=2000

LLM_PROVIDER=groq
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.1-8b-instant
```

The Groq API key is only required when using Groq as the LLM provider.

#### Alternative: Ollama

If using Ollama instead of Groq:

```env
MAX_LISTINGS=500
REQUEST_DELAY_MS=2000

LLM_PROVIDER=ollama
OLLAMA_MODEL=your_ollama_model
```

When using Ollama, make sure that:

1. Ollama is installed.
2. The selected model has been downloaded.
3. Ollama is running before starting the extraction stage.

### 3. Run the Pipeline

Run the stages in order:

```bash
npm run collect
npm run parse
npm run extract
npm run export
```

The pipeline flow is:

```text
Bayut search pages
       ↓
    Collect
       ↓
data/raw-html/
       ↓
     Parse
       ↓
data/parsed-json/
       ↓
SQLite database
       ↓
Group B LLM extraction
       ↓
   Validation
       ↓
     Export
       ↓
 dataset.xlsx
```

### 4. Output

After a successful export, the main dataset is available at:

```text
dataset.xlsx
```

The SQLite database is stored at:

```text
data/database.sqlite
```

The raw and intermediate data are stored under:

```text
data/raw-html/
data/parsed-json/
```

### Running Individual Stages

Individual stages can be rerun when their required input data already exists:

```bash
npm run collect
npm run parse
npm run extract
npm run export
```

## What to Expect

The submitted run contains approximately **500 collected property listings**.

Group A fields are extracted primarily from structured listing data such as JSON-LD.

Group B fields require semantic extraction from the listing description using an LLM. Because of LLM API/rate limits, **94 listings were successfully populated with Group B data in the submitted run**. The remaining listings are preserved in the dataset with their unavailable Group B fields left empty/null rather than being populated with inferred values.

The dataset can still be exported when some Group B extractions fail.

## Data Structure

### Group A Fields

Group A fields are extracted from structured listing data and include:

* `listing_id`
* `url`
* `purpose`
* `property_type`
* `price`
* `price_period`
* `currency`
* `bedrooms`
* `bathrooms`
* `area_sqm`
* `location_raw`
* `agency_name`
* `is_verified`
* `date_listed`
* `language`
* `governorate`
* `city`
* `district`
* `price_per_sqm`
* `total_installment_cost`

### Group B Fields

Group B fields are extracted from unstructured listing descriptions using the configured LLM:

* `compound_name`
* `developer_name`
* `finishing_level`
* `delivery_status`
* `delivery_date`
* `sale_type`
* `payment_type`
* `down_payment_amount`
* `down_payment_pct`
* `installment_years`
* `installment_amount`
* `installment_frequency`
* `cash_discount_pct`
* `amenities`
* `floor_number`
* `garden_area_sqm`
* `roof_area_sqm`
* `is_negotiable`

The extraction process applies deterministic validation after the LLM response to reduce hallucinated values and reject unsupported information.


## Key Features

### Multi-Language Support

The pipeline handles both Arabic and English property listings.

### LLM-Powered Extraction

LLMs are used only for fields that require semantic interpretation from unstructured descriptions, such as:

* Compound names
* Developers
* Finishing level
* Delivery information
* Payment plans
* Amenities

The extraction layer supports multiple providers through a common `LLMProvider` interface.

### Deterministic Validation

LLM output is validated before being stored.

The validation layer checks:

* JSON structure
* Allowed enum values
* Numeric fields
* Payment evidence
* Down-payment evidence
* Installment evidence
* Cash-discount evidence
* Explicit amenity evidence

This reduces the risk of storing unsupported LLM-generated values.

### Incremental Updates

Rerunning the pipeline can update existing listings and add newly collected listings while preserving previously available data according to the pipeline's database/export logic.

### Deduplication

Listings are identified using their listing ID to prevent duplicate records.

### Price Normalization

Price-per-square-meter values are calculated from the listing price and property area when the required Group A data is available.

## Limitations

### Rate Limiting

Bayut may limit or block rapid requests.

The default request delay is:

```env
REQUEST_DELAY_MS=2000
```

Increase this value if the website begins returning challenge pages or requests fail repeatedly.

### Bot Detection

Some Bayut pages may return challenge pages instead of the expected listing content. Consequently, collection results can vary between runs.

The project documents known collection issues in:

```text
CLEAN_FAILURES.md
```

### Group B Population

Group B depends on an external or local LLM.

In the submitted run, **94 of approximately 500 listings were successfully populated with Group B data** due to LLM API/rate limitations.

Listings that could not be processed remain in the dataset with empty/null Group B fields rather than being filled using unsupported assumptions.

### Language Variations

Arabic real-estate descriptions can use different terminology, spelling, transliteration, and naming conventions.

For example, the same project may appear as:

* `Park Valley`
* `Park Valley Compound`
* `Park Valley Sheikh Zayed`

The current pipeline does not attempt aggressive entity resolution between these variations because doing so could incorrectly merge distinct projects.

### LLM Extraction

LLM extraction is probabilistic and may fail to extract information from particularly long, ambiguous, or unusual descriptions.

The application therefore uses deterministic validation and evidence rules after the LLM response.

## Performance

Approximate performance observed during development:

* **Scraping:** ~2–3 seconds per listing, depending on delays and website response time
* **Parsing:** <1 second per file
* **LLM extraction:** ~3–5 seconds per listing, depending on provider and model
* **Export:** <10 seconds for approximately 500 rows

Actual performance depends on network conditions, Bayut response times, and the selected LLM provider.

## Troubleshooting

### Empty Dataset

1. Check that `.env` contains the correct `MAX_LISTINGS` value.
2. Verify Playwright is installed:

```bash
npx playwright install chromium
```

3. Check whether HTML files were created:

```text
data/raw-html/
```

4. Check the application logs for collection errors.

### Missing Group B Data

1. Verify the configured LLM provider.
2. If using Groq, verify `GROQ_API_KEY`.
3. If using Ollama, verify that Ollama is running and the selected model is available.
4. Check that the extraction stage completed:

```bash
npm run extract
```

5. Review the application logs for LLM/API errors.

### Export Errors

1. Verify that:

```text
data/database.sqlite
```

exists.

2. Make sure `dataset.xlsx` is not open in Excel or another program.
3. Check the export logs for database or file-system errors.

## Development

### Adding New Fields

To add a new Group B field:

1. Update:

```text
src/extract/types/group-b.types.ts
```

2. Modify the extraction prompt and validation logic in:

```text
src/extract/group-b.service.ts
```

3. Update the export flattening logic in:

```text
src/export/export.service.ts
```

### Changing the LLM Provider

To add another LLM provider:

1. Implement the `LLMProvider` interface in:

```text
src/extract/llm/
```

2. Register the provider in:

```text
src/extract/extract.module.ts
```

3. Configure the provider using:

```env
LLM_PROVIDER=...
```

## License

MIT

## Acknowledgments

* Bayut.eg — data source
* Groq — LLM inference provider
* Playwright — browser automation
* NestJS — application framework
* SQLite — local database
* ExcelJS — Excel export
