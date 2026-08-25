# Egyptian Real Estate Dataset Pipeline

A complete pipeline for scraping, parsing, and extracting structured data from Egyptian real estate listings on Bayut.eg.

## Overview

This project collects property listings from Bayut.eg (Egypt's largest real estate portal), extracts structured data, and exports to a standardized Excel format. The pipeline handles both Arabic and English listings with LLM-powered data extraction.

### Pipeline Stages

1. **Collect** (`npm run collect`) - Scrapes raw HTML from Bayut search pages using Playwright
2. **Parse** (`npm run parse`) - Extracts JSON-LD structured data from HTML files
3. **Extract** (`npm run extract`) - Uses LLM to extract Group B fields (compound, developer, finishing, etc.)
4. **Export** (`npm run export`) - Exports structured data to `dataset.xlsx`

## Dataset

**Output**: `dataset.xlsx` at project root

**Records**: 500 Egyptian property listings

**Columns**: 36 standardized fields including:
- Listing ID, URL, Property Type, Price, Area
- Location (Governorate, City, District)
- Property Details (Bedrooms, Bathrooms, Finishing Level)
- Developer/Compound Information
- Payment Terms, Amenities

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- Playwright (for scraping)
- LLM provider (Groq or Ollama)

### Installation
```bash
npm install
npx playwright install chromium
```

### Configuration
Create `.env` file:
```env
# Scraper settings
MAX_LISTINGS=500
REQUEST_DELAY_MS=2000

# LLM settings (for Group B extraction)
LLM_PROVIDER=ollama  # or groq
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.1-8b-instant
```

### Usage
```bash
# Run full pipeline
npm run collect
npm run parse
npm run extract
npm run export

# Or run individual stages
npm run extract:group-a  # Extract only Group A fields
npm run export           # Export to Excel
```

## Data Structure

### Group A Fields (from JSON-LD)
- `listing_id`, `url`, `purpose`, `property_type`
- `price`, `price_period`, `currency`
- `bedrooms`, `bathrooms`, `area_sqm`
- `location_raw`, `agency_name`, `is_verified`
- `date_listed`

### Group B Fields (from LLM extraction)
- `compound_name`, `developer_name`
- `governorate`, `city`, `district`
- `finishing_level`, `delivery_status`, `delivery_date`
- `sale_type`, `payment_type`
- `down_payment_amount`, `installment_years`, `installment_amount`
- `amenities` (comma-separated list)

## Project Structure

```
dataset-eg/
├── src/
│   ├── collect/          # Playwright scraper
│   ├── parse/            # HTML to JSON-LD parser
│   ├── extract/          # LLM-based data extraction
│   │   ├── group-a.service.ts    # Group A extraction
│   │   ├── group-b.service.ts    # Group B extraction (LLM)
│   │   └── llm/                 # LLM providers
│   ├── export/           # Excel export
│   └── cli/              # Command-line interfaces
├── data/
│   ├── raw-html/         # Scraped HTML files
│   ├── parsed-json/      # Extracted JSON-LD
│   └── database.sqlite   # SQLite database
├── dataset.xlsx          # Output dataset
├── CLEAN_FAILURES.md     # Scraping issues documented
├── report.md             # Data analysis report
└── README.md             # This file
```

## Key Features

### Multi-Language Support
Handles both Arabic and English listings with automatic language detection.

### LLM-Powered Extraction
Uses Groq (Llama 3.1) or Ollama for intelligent field extraction from unstructured descriptions.

### Incremental Updates
Re-running the pipeline updates changed rows, adds new rows, and preserves file-only rows.

### Data Validation
- Deduplication by listing ID
- Price normalization to EGP
- Compound name standardization

## Limitations

- **Rate Limiting**: Bayut may block rapid requests. Use `REQUEST_DELAY_MS=2000+`
- **Bot Detection**: Some pages return challenge pages instead of content but in other runs they will eventually be captured
- **Group B Population**: not all of the listings extracted due to limits on llm api. 94 listings has been exctracted while the 
rest remain empty.
- **Language Variations**: Arabic descriptions may use different terminology

## Performance

- **Scraping**: ~2-3 seconds per listing (with delays)
- **Parsing**: <1 second per file
- **Extraction**: ~3-5 seconds per listing (LLM dependent)
- **Export**: <10 seconds for 500 rows

## Troubleshooting

### Empty Dataset
1. Check `.env` has correct `MAX_LISTINGS` value
2. Verify Playwright is installed: `npx playwright install chromium`
3. Check `data/raw-html/` for scraped files

### Missing Group B Data
1. Ensure LLM provider is configured in `.env`
2. Check `npm run extract` completed successfully
3. Review logs for extraction errors

### Export Errors
1. Verify `data/database.sqlite` exists
2. Check `dataset.xlsx` isn't open in another program
3. Run `npm run extract:group-a` first if database is empty

## Development

### Adding New Fields
1. Update `src/extract/types/group-b.types.ts`
2. Modify extraction logic in `src/extract/group-b.service.ts`
3. Update `src/export/export.service.ts` flattening

### Changing LLM Provider
1. Implement provider in `src/extract/llm/`
2. Update `src/extract/extract.module.ts` provider selection
3. Set `LLM_PROVIDER` in `.env`

## License

MIT

## Acknowledgments

- Bayut.eg for the data source
- Groq for fast LLM inference
- Playwright for browser automation
