# Clean Failure Log Summary

* **JavaScript-rendered listing data:** Some listing information was not reliably available from the initial HTML response because the website renders parts of the page dynamically. I handled this by using the page's structured JSON-LD data where available and parsing the saved listing content rather than relying only on static HTML selectors.

* **Inconsistent listing structures:** Listings did not always expose the same fields or JSON-LD structure. Some pages contained the property directly, while others nested it inside `@graph` / `RealEstateListing.mainEntity`. The extraction pipeline was made tolerant of these structural differences and falls back to `null` when a field is unavailable.

* **Missing structured fields:** Some listings did not provide certain values such as delivery information, payment plans, finishing level, or floor number in structured data. These were not treated as errors; the pipeline leaves unsupported values as `null` rather than inferring them.

* **LLM rate limiting:** The cloud LLM provider returned HTTP 429 rate-limit responses during extraction. The pipeline recorded the affected listings as failed instead of silently producing incomplete records. Extraction could then be retried after the provider's rate limit reset.

* **LLM output variability:** Some model responses did not conform to the expected JSON schema or returned values with unexpected types. The pipeline validates the returned Group B object and records the listing as failed when the response cannot be safely validated, preventing malformed data from entering the final dataset.

* **Extraction retries:** Failed listings were retained in the extraction database with their failure reason, allowing successful listings to be skipped on subsequent runs and failed listings to be retried without unnecessarily repeating successful extraction work.

* **Evidence-constrained extraction:** Real-estate listings frequently omit information that might normally be expected from the property type or compound. The Group B extraction therefore treats missing information as `null` and applies deterministic evidence checks to reduce unsupported payment-plan and discount values.

Overall, the main scraping challenge was the inconsistency of information available across listings rather than a single blocking mechanism. The pipeline was designed to preserve these differences rather than fill missing values with assumptions.
