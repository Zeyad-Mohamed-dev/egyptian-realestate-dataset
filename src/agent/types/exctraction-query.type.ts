import { z } from 'zod';

export const extractionSearchSchema = z.object({
    property: z.object({
        propertyType: z.string().optional(),
        purpose: z.string().optional(),

        governorate: z.string().optional(),
        city: z.string().optional(),
        district: z.string().optional(),

        minPrice: z.number().optional(),
        maxPrice: z.number().optional(),

        minBedrooms: z.number().int().optional(),
        maxBedrooms: z.number().int().optional(),

        minBathrooms: z.number().int().optional(),
        maxBathrooms: z.number().int().optional(),

        minAreaSqm: z.number().optional(),
        maxAreaSqm: z.number().optional(),
    }).optional(),

    development: z.object({
        compoundName: z.string().optional(),
        developerName: z.string().optional(),

        finishingLevel: z.enum([
            'core & shell',
            'semi-finished',
            'fully finished',
            'super lux',
            'furnished',
            'unknown',
        ]).optional(),

        deliveryStatus: z.enum([
            'ready',
            'off-plan',
        ]).optional(),

        saleType: z.enum([
            'primary',
            'resale',
        ]).optional(),

        paymentType: z.enum([
            'cash',
            'installments',
            'both',
        ]).optional(),

        minInstallmentYears: z.number().optional(),
        maxInstallmentYears: z.number().optional(),

        maxDownPaymentPct: z.number().optional(),
        maxCashDiscountPct: z.number().optional(),

        isNegotiable: z.boolean().optional(),
    }).optional(),

    limit: z.number().int().positive().max(100).optional(),
});

export type ExtractionSearch = z.infer<
    typeof extractionSearchSchema
>;