# Architecture decisions

## Stable identity

Use the site-native listing ID when present. Otherwise record a deterministic canonical-URL hash. Enforce uniqueness in the checkpoint store.

## Storage blueprint

Use TypeORM with a local SQLite database at `data/pipeline.db`. The first entity should be `ListingCheckpoint`, with a unique `listingId`, canonical URL, collection status, attempt count, raw HTML path, error message, and timestamps. Add a separate output entity only if extraction results need to be versioned.

## Null policy

`null` means the relevant value is absent or incomplete for one particular listing. It is never a reason to drop the listing. Group B extractors must not produce inferred values.

## Derived fields

- `price_per_sqm`: `price / area_sqm`; `null` if price or area is unavailable.
- `total_installment_cost`: `down_payment + installment_amount × payments_per_year × years`; `null` unless all inputs are stated. Frequency factors are monthly=12, quarterly=4, annual=1.

## Evidence and evaluation

Persist source URL, raw description, and extraction provenance. Label 25 listings manually before calculating field-level exact-match accuracy and hallucination rate (`truth=null`, prediction non-null).
