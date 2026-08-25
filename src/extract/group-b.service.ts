import {
  Injectable,
  Logger,
  Inject,
} from '@nestjs/common';

import { GroupB } from './types/group-b.types';
import { LLMProvider } from './llm/llm-provider.interface';
import { LLM_PROVIDER } from './llm/llm-tokens';

@Injectable()
export class GroupBService {
  private readonly logger =
    new Logger(GroupBService.name);

  constructor(
    @Inject(LLM_PROVIDER)
    private readonly llmProvider: LLMProvider,
  ) {}

  async extract(input: {
    listingId: string;
    data: unknown;
  }): Promise<GroupB> {
    try {
      const sourceText = this.buildSourceText(input.data);

      const prompt = `
You are extracting structured data from an Egyptian real-estate
listing.

Your task is to extract ONLY Group B fields.

CRITICAL RULE:

A value may ONLY be returned if it is explicitly supported by
the supplied listing data.

DO NOT use common real-estate assumptions.

DO NOT infer information from the property type.

DO NOT infer information because an Egyptian compound usually has
that feature.

DO NOT invent amenities.

For every field, if the information is not explicitly present,
return null.

========================
STRICT EXTRACTION RULES
========================

1. description

Return the original listing description, or a concise faithful
representation of it.

Do not add facts.

2. compoundName

Return the explicitly mentioned compound/project name.

Examples:

"Sun Capital"
"Fifth Square Compound"
"Hyde Park"

If no compound is explicitly mentioned:

null

3. developerName

Return the developer only if explicitly stated.

Do NOT infer the developer from the compound name.

4. finishingLevel

Allowed values:

"core & shell"
"semi-finished"
"fully finished"
"super lux"
"furnished"
"unknown"
null

Only return a finishing level when explicitly stated.

Examples:

"نصف تشطيب" -> "semi-finished"

"تشطيب كامل" -> "fully finished"

"fully finished" -> "fully finished"

If the listing does not explicitly describe finishing:

"unknown"

5. deliveryStatus

Allowed values:

"ready"
"off-plan"
null

Examples:

"استلام فوري"
"جاهز للسكن"
"جاهز للمعيشة"
"immediate delivery"

-> "ready"

"under construction"
"off-plan"
"تحت الإنشاء"

-> "off-plan"

Do not infer readiness from the compound.

6. deliveryDate

Return the explicitly stated delivery year or year-quarter.

Examples:

"2027" -> "2027"

"Q3 2027" -> "2027-Q3"

If no explicit delivery date exists:

null

7. saleType

Allowed values:

"primary"
"resale"
null

Return "primary" only when the listing explicitly indicates
a developer/primary sale.

Return "resale" only when the listing explicitly indicates
resale/secondary market.

Do NOT infer this from the wording "for sale".

8. paymentType

Allowed values:

"cash"
"installments"
"both"
null

Rules:

If the listing explicitly says cash payment only:

"cash"

If it explicitly says installments only:

"installments"

If it explicitly mentions BOTH a cash payment option AND
an installment option:

"both"

If there is only a normal sale price and no payment-plan
information:

null

IMPORTANT:

A property having a price does NOT mean paymentType="cash".

9. downPaymentAmount

Return only an explicitly stated down payment amount.

Example:

"down payment 1,000,000"

-> 1000000

Otherwise:

null

10. downPaymentPct

Return only an explicitly stated percentage.

Do NOT calculate it.

If not explicitly stated:

null

11. installmentYears

Return only an explicitly stated installment duration.

Example:

"over 10 years"

-> 10

Otherwise:

null

12. installmentAmount

Return only an explicitly stated installment amount.

Do NOT calculate it.

Otherwise:

null

13. installmentFrequency

Allowed values:

"monthly"
"quarterly"
"annual"
null

Only return it when explicitly stated.

14. cashDiscountPct

Return only an explicitly advertised cash discount.

Example:

"42% cash discount"

-> 42

Do NOT calculate discounts.

Otherwise:

null

15. amenities

This is extremely important.

Return ONLY amenities explicitly mentioned in the supplied
listing data.

DO NOT add generic amenities.

DO NOT assume that a compound has security, swimming pools,
parking, gyms, gardens, elevators, pets allowed, etc.

For example, if the description says:

"private garage"

you may return:

["Covered parking"]

If the description does NOT mention parking, do NOT return
"Covered parking".

If the description does NOT mention pets, do NOT return
"Pets Allowed".

If the description does NOT mention a swimming pool, do NOT
return "Swimming Pool".

16. floorNumber

Return only an explicitly stated floor number.

Otherwise:

null

17. gardenAreaSqm

Return only an explicitly stated garden area.

Do NOT infer it from the existence of a garden.

Otherwise:

null

18. roofAreaSqm

Return only an explicitly stated roof area.

Otherwise:

null

19. isNegotiable

Return true only if the listing explicitly says the price is
negotiable.

Return false only if the listing explicitly says the price is
not negotiable.

Otherwise:

null

========================
IMPORTANT
========================

The following are NOT valid reasons to infer a value:

- common compound amenities
- property type
- location
- compound name
- developer reputation
- typical Egyptian real-estate practices
- assumptions about payment plans
- assumptions about finishing
- assumptions about delivery
- assumptions about resale

If the evidence is missing, return null.

Return ONLY valid JSON.

Do not use markdown.

The JSON must have exactly this structure:

{
  "description": string | null,
  "compoundName": string | null,
  "developerName": string | null,
  "finishingLevel": "core & shell" | "semi-finished" | "fully finished" | "super lux" | "furnished" | "unknown" | null,
  "deliveryStatus": "ready" | "off-plan" | null,
  "deliveryDate": string | null,
  "saleType": "primary" | "resale" | null,
  "paymentType": "cash" | "installments" | "both" | null,
  "downPaymentAmount": number | null,
  "downPaymentPct": number | null,
  "installmentYears": number | null,
  "installmentAmount": number | null,
  "installmentFrequency": "monthly" | "quarterly" | "annual" | null,
  "cashDiscountPct": number | null,
  "amenities": string[],
  "floorNumber": number | null,
  "gardenAreaSqm": number | null,
  "roofAreaSqm": number | null,
  "isNegotiable": boolean | null
}

Listing ID:
${input.listingId}

SOURCE LISTING DATA:
${sourceText}
`;

      const rawResponse =
        await this.llmProvider.generate({
          systemPrompt:
            `
You are a high-precision real-estate data extraction
system.

Precision is more important than recall.

Never hallucinate.

If evidence is missing, use null.

Never create amenities that are not explicitly supported
by the source listing.

Return JSON only.
            `.trim(),

          userPrompt: prompt,
        });

      let raw: unknown;

      try {
        raw = JSON.parse(
          this.cleanJsonResponse(rawResponse),
        );
      } catch {
        throw new Error(
          'LLM returned invalid JSON',
        );
      }

      const validated = this.validate(raw);

      /*
       * Apply deterministic safety rules after the LLM.
       */
      const cleaned =
        this.applyEvidenceRules(
          validated,
          sourceText,
        );

      this.logger.log(
        `Group B extracted successfully: ${input.listingId}`,
      );

      return cleaned;
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : String(error);

      this.logger.error(
        `Group B extraction failed for ${input.listingId}: ${reason}`,
      );

      throw error;
    }
  }

  private buildSourceText(
    data: unknown,
  ): string {
    if (
      data === null ||
      data === undefined
    ) {
      return '';
    }

    if (typeof data === 'string') {
      return data;
    }

    return JSON.stringify(data);
  }

  private cleanJsonResponse(
    response: string,
  ): string {
    let value = response.trim();

    /*
     * Handle models that still return:
     *
     * ```json
     * {...}
     * ```
     */

    if (value.startsWith('```')) {
      value = value
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();
    }

    return value;
  }

  private validate(
    value: unknown,
  ): GroupB {
    if (
      value === null ||
      typeof value !== 'object' ||
      Array.isArray(value)
    ) {
      throw new Error(
        'LLM returned an invalid Group B object',
      );
    }

    const data =
      value as Record<string, unknown>;

    /*
     * DESCRIPTION
     */

    if (
      data.description !== null &&
      typeof data.description !== 'string'
    ) {
      throw new Error(
        'Group B description must be string or null',
      );
    }

    /*
     * COMPOUND
     */

    if (
      data.compoundName !== null &&
      typeof data.compoundName !== 'string'
    ) {
      throw new Error(
        'Group B compoundName must be string or null',
      );
    }

    /*
     * DEVELOPER
     */

    if (
      data.developerName !== null &&
      typeof data.developerName !== 'string'
    ) {
      throw new Error(
        'Group B developerName must be string or null',
      );
    }

    /*
     * FINISHING
     */

    const finishingLevels = [
      'core & shell',
      'semi-finished',
      'fully finished',
      'super lux',
      'furnished',
      'unknown',
    ];

    if (
      data.finishingLevel !== null &&
      !finishingLevels.includes(
        data.finishingLevel as string,
      )
    ) {
      throw new Error(
        'Invalid Group B finishingLevel',
      );
    }

    /*
     * DELIVERY STATUS
     */

    if (
      data.deliveryStatus !== null &&
      data.deliveryStatus !== 'ready' &&
      data.deliveryStatus !== 'off-plan'
    ) {
      throw new Error(
        'Invalid Group B deliveryStatus',
      );
    }

    /*
     * DELIVERY DATE
     */

    if (
      data.deliveryDate !== null &&
      typeof data.deliveryDate !== 'string'
    ) {
      throw new Error(
        'Group B deliveryDate must be string or null',
      );
    }

    /*
     * SALE TYPE
     */

    if (
      data.saleType !== null &&
      data.saleType !== 'primary' &&
      data.saleType !== 'resale'
    ) {
      throw new Error(
        'Invalid Group B saleType',
      );
    }

    /*
     * PAYMENT TYPE
     */

    if (
      data.paymentType !== null &&
      data.paymentType !== 'cash' &&
      data.paymentType !== 'installments' &&
      data.paymentType !== 'both'
    ) {
      throw new Error(
        'Invalid Group B paymentType',
      );
    }

    /*
     * NUMERIC FIELDS
     */

    const numericFields = [
      'downPaymentAmount',
      'downPaymentPct',
      'installmentYears',
      'installmentAmount',
      'cashDiscountPct',
      'floorNumber',
      'gardenAreaSqm',
      'roofAreaSqm',
    ];

    for (const field of numericFields) {
      const fieldValue = data[field];

      if (
        fieldValue !== null &&
        typeof fieldValue !== 'number'
      ) {
        throw new Error(
          `Group B ${field} must be number or null`,
        );
      }
    }

    /*
     * INSTALLMENT FREQUENCY
     */

    if (
      data.installmentFrequency !== null &&
      data.installmentFrequency !== 'monthly' &&
      data.installmentFrequency !== 'quarterly' &&
      data.installmentFrequency !== 'annual'
    ) {
      throw new Error(
        'Invalid Group B installmentFrequency',
      );
    }

    /*
     * AMENITIES
     */

    if (!Array.isArray(data.amenities)) {
      throw new Error(
        'Group B amenities must be an array',
      );
    }

    if (
      !data.amenities.every(
        (item) => typeof item === 'string',
      )
    ) {
      throw new Error(
        'Group B amenities must contain only strings',
      );
    }

    /*
     * NEGOTIABLE
     */

    if (
      data.isNegotiable !== null &&
      typeof data.isNegotiable !== 'boolean'
    ) {
      throw new Error(
        'Group B isNegotiable must be boolean or null',
      );
    }

    return {
      description:
        data.description as string | null,

      compoundName:
        data.compoundName as string | null,

      developerName:
        data.developerName as string | null,

      finishingLevel:
        data.finishingLevel as GroupB['finishingLevel'],

      deliveryStatus:
        data.deliveryStatus as GroupB['deliveryStatus'],

      deliveryDate:
        data.deliveryDate as string | null,

      saleType:
        data.saleType as GroupB['saleType'],

      paymentType:
        data.paymentType as GroupB['paymentType'],

      downPaymentAmount:
        data.downPaymentAmount as number | null,

      downPaymentPct:
        data.downPaymentPct as number | null,

      installmentYears:
        data.installmentYears as number | null,

      installmentAmount:
        data.installmentAmount as number | null,

      installmentFrequency:
        data.installmentFrequency as GroupB['installmentFrequency'],

      cashDiscountPct:
        data.cashDiscountPct as number | null,

      amenities:
        data.amenities as string[],

      floorNumber:
        data.floorNumber as number | null,

      gardenAreaSqm:
        data.gardenAreaSqm as number | null,

      roofAreaSqm:
        data.roofAreaSqm as number | null,

      isNegotiable:
        data.isNegotiable as boolean | null,
    };
  }

  private applyEvidenceRules(
    groupB: GroupB,
    sourceText: string,
  ): GroupB {
    const text =
      sourceText.toLowerCase();

    /*
     * PAYMENT TYPE
     *
     * Never accept "both" unless there is evidence
     * of an installment/payment plan AND a cash option.
     */

    const installmentEvidence =
      this.containsAny(text, [
        'installment',
        'installments',
        'قسط',
        'أقساط',
        'تقسيط',
        'سنوات',
        'years',
      ]);

    const cashEvidence =
      this.containsAny(text, [
        'cash price',
        'cash payment',
        'cash discount',
        'cash',
        'كاش',
        'نقدي',
        'دفع نقدي',
      ]);

    if (
      groupB.paymentType === 'both' &&
      !(
        installmentEvidence &&
        cashEvidence
      )
    ) {
      groupB.paymentType =
        installmentEvidence
          ? 'installments'
          : cashEvidence
            ? 'cash'
            : null;
    }

    if (
      groupB.paymentType === 'installments' &&
      !installmentEvidence
    ) {
      groupB.paymentType = null;
    }

    if (
      groupB.paymentType === 'cash' &&
      !cashEvidence
    ) {
      groupB.paymentType = null;
    }

    /*
     * DOWN PAYMENT
     *
     * If the source contains no indication of a
     * down payment, remove the LLM value.
     */

    const downPaymentEvidence =
      this.containsAny(text, [
        'down payment',
        'downpayment',
        'مقدم',
        'دفعة أولى',
        'دفعة مقدمة',
      ]);

    if (!downPaymentEvidence) {
      groupB.downPaymentAmount = null;
      groupB.downPaymentPct = null;
    }

    /*
     * INSTALLMENT YEARS
     */

    if (!installmentEvidence) {
      groupB.installmentYears = null;
      groupB.installmentAmount = null;
      groupB.installmentFrequency = null;
    }

    /*
     * CASH DISCOUNT
     */

    const discountEvidence =
      this.containsAny(text, [
        'cash discount',
        'discount',
        'خصم',
        'خصم كاش',
      ]);

    if (!discountEvidence) {
      groupB.cashDiscountPct = null;
    }

    return groupB;
  }

  private containsAny(
    text: string,
    values: string[],
  ): boolean {
    return values.some(
      (value) =>
        text.includes(value.toLowerCase()),
    );
  }
}