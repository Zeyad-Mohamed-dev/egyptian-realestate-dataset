# Scraping Failures and Challenges

## Overview
- Total listings attempted: ~600+
- Successfully parsed: 500
- Failed scrapes: 6 (1.2%) returned empty jsonLd
- Bot-blocking pages: ~100+ returned Bayut's anti-scraping page

## Failure Categories

### 1. Bot Detection / Anti-Scraping (Bayut)
**Impact**: ~100+ pages blocked
**Cause**: Bayut uses Cloudflare and custom anti-bot systems that serve a challenge page instead of listing content
**Evidence**: HTML responses contained "Access Denied" or captcha challenge pages rather than listing data
**Workaround**: The scraper uses Playwright with randomized delays and a Chromium user agent, but this only partially mitigates the issue. Some pages still return blocked responses.

### 2. JavaScript-Rendered Content
**Impact**: Minimal (most data is server-rendered in JSON-LD)
**Cause**: Some Bayut pages load content dynamically via JavaScript
**Workaround**: The JSON-LD approach avoids this issue since the structured data is embedded in the initial HTML response as `<script type="application/ld+json">` tags but it wait for document to load if the json not found.

### 3. Rate Limiting
**Impact**: Occasional HTTP 429 responses
**Cause**: Too many requests in quick succession
**Workaround**: `REQUEST_DELAY_MS` environment variable controls delay between requests (default: 2000ms). Higher values reduce blocking but increase total scrape time.

### 4. Arabic vs English Content
**Impact**: ~60% of descriptions are in Arabic, ~40% in English
**Cause**: Bayut allows listings in both languages
**Workaround**: The LLM extraction handles both languages. However, Arabic descriptions may contain different terminology for finishing levels and amenities.

### 5. Inconsistent Listing Formats
**Impact**: Some fields (compound_name, developer_name) are inconsistently formatted
**Cause**: Different agents/brokers use different naming conventions
**Examples**: "Park Valley" vs "Park Valley Compound" vs "Park Valley Sheikh Zayed"
**Workaround**: Compound name normalization strips common suffixes ("Compound", "كمبوند") but cannot resolve all variations.

## Recommendations for Future Improvements
1. Implement proxy rotation to reduce bot detection
2. Add retry logic for failed pages with exponential backoff
3. Parse additional data sources when JSON-LD is unavailable (OpenGraph meta tags, microdata)

