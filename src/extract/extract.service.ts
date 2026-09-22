import {
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { GroupAService } from './group-a.service';
import { GroupBService } from './group-b.service';

import { ExtractionEntity } from './database/extraction.entity';
import { ParsedRawListing } from './types/parsed-listing.types';
import { GroupA } from './types/group-a.types';
import { GroupB } from './types/group-b.types';
import { ExtractionSearch } from 'src/agent/types/exctraction-query.type';
import { PropertySearchEntity } from './database/property.entity';

@Injectable()
export class ExtractorService {
  private readonly logger =
    new Logger(
      ExtractorService.name,
    );

  constructor(
    @Inject(GroupAService)
    private readonly groupAService: GroupAService,

    @Inject(GroupBService)
    private readonly groupBService: GroupBService,
    @InjectRepository(PropertySearchEntity)
    private readonly propertySearchRepository:
      Repository<PropertySearchEntity>,

    @InjectRepository(
      ExtractionEntity,
    )
    private readonly repository:
      Repository<ExtractionEntity>,
  ) { }

  /**
   * Full extraction.
   *
   * Runs:
   *
   * 1. Group A
   * 2. Group B
   * 3. Deterministic calculations
   *
   * Group A and Group B are both replaced
   * when performing a normal full extraction.
   */
  async extract(
    listing: ParsedRawListing,
  ): Promise<ExtractionEntity> {
    const listingId =
      String(listing.listingId);

    let extraction =
      await this.repository.findOne(
        {
          where: {
            listingId,
          },
        },
      );

    /*
     * Create a new extraction if
     * this listing has never been
     * extracted.
     */
    if (!extraction) {
      extraction =
        this.repository.create({
          listingId,

          sourceUrl:
            listing.sourceUrl ??
            null,

          groupA: null,

          groupB: null,

          extractedAt:
            new Date(),

          groupAValid: false,

          groupBValid: false,

          status: 'failed',

          errors: [],
        });
    } else {
      /*
       * Full extraction retry.
       *
       * This resets both groups.
       *
       * The Group A-only command uses
       * reExtractGroupA() instead.
       */
      extraction.sourceUrl =
        listing.sourceUrl ??
        extraction.sourceUrl;

      extraction.groupA = null;

      extraction.groupB = null;

      extraction.groupAValid =
        false;

      extraction.groupBValid =
        false;

      extraction.status =
        'failed';

      extraction.errors = [];

      extraction.extractedAt =
        new Date();
    }

    try {
      /*
       * =========================
       * GROUP A
       * =========================
       */
      const groupA =
        await this.groupAService.extract(
          {
            listingId,

            sourceUrl:
              listing.sourceUrl,

            jsonLd:
              listing.jsonLd,
          },
        );

      extraction.groupA =
        groupA;

      extraction.groupAValid =
        true;

      /*
       * =========================
       * GROUP B
       * =========================
       */
      const groupB =
        await this.groupBService.extract(
          {
            listingId,

            data: listing,
          },
        );

      extraction.groupB =
        groupB;

      extraction.groupBValid =
        true;

      /*
       * =========================
       * DETERMINISTIC FIELDS
       * =========================
       *
       * Calculate these only after
       * both groups are valid.
       */
      extraction.groupA =
        this.calculateDerivedFields(
          groupA,
          groupB,
        );

      /*
       * =========================
       * SUCCESS
       * =========================
       */
      extraction.status =
        'success';

      extraction.errors = [];

      extraction.extractedAt =
        new Date();

      const saved =
        await this.repository.save(
          extraction,
        );

      this.logger.log(
        `Extraction saved: ${listingId} (success)`,
      );
      await this.savePropertySearch(
        saved,
      );

      this.logger.log(
        `Extraction saved: ${listingId} (success)`,
      );
      return saved;
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : String(error);

      extraction.status =
        'failed';

      extraction.errors = [
        reason,
      ];

      extraction.extractedAt =
        new Date();

      const saved =
        await this.repository.save(
          extraction,
        );

      this.logger.error(
        `Extraction saved: ${listingId} (failed): ${reason}`,
      );

      return saved;
    }
  }

  /**
   * Re-extract ONLY Group A.
   *
   * Group B is never called and never
   * overwritten.
   *
   * Derived fields are recalculated
   * using the newly extracted Group A
   * and the existing Group B.
   */
  async reExtractGroupA(
    listing: ParsedRawListing,
  ): Promise<ExtractionEntity> {
    const listingId =
      String(listing.listingId);

    const extraction =
      await this.repository.findOne(
        {
          where: {
            listingId,
          },
        },
      );

    if (!extraction) {
      throw new Error(
        `No extraction found for listing ${listingId}`,
      );
    }

    try {
      /*
       * =========================
       * RE-EXTRACT GROUP A
       * =========================
       */
      const groupA =
        await this.groupAService.extract(
          {
            listingId,

            sourceUrl:
              listing.sourceUrl,

            jsonLd:
              listing.jsonLd,
          },
        );

      /*
       * =========================
       * RECALCULATE DERIVED FIELDS
       * =========================
       *
       * Existing Group B is used.
       */
      const calculatedGroupA =
        this.calculateDerivedFields(
          groupA,
          extraction.groupB,
        );

      extraction.groupA =
        calculatedGroupA;

      extraction.groupAValid =
        true;

      extraction.sourceUrl =
        listing.sourceUrl ??
        extraction.sourceUrl;

      /*
       * IMPORTANT:
       *
       * Group B is untouched.
       */
      extraction.groupB =
        extraction.groupB;

      extraction.groupBValid =
        extraction.groupBValid;

      /*
       * Successful only when both
       * groups are valid.
       */
      extraction.status =
        extraction.groupAValid &&
          extraction.groupBValid
          ? 'success'
          : 'failed';

      extraction.errors = [];

      extraction.extractedAt =
        new Date();

      const saved =
        await this.repository.save(
          extraction,
        );

      this.logger.log(
        `Group A re-extracted: ${listingId}`,
      );

      return saved;
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : String(error);

      /*
       * Do not wipe either group if
       * Group A re-extraction fails.
       */
      extraction.errors = [
        ...(extraction.errors ?? []),
        `Group A re-extraction: ${reason}`,
      ];

      /*
       * If both groups were already
       * valid, don't unnecessarily
       * destroy the successful status.
       */
      if (
        !extraction.groupAValid ||
        !extraction.groupBValid
      ) {
        extraction.status =
          'failed';
      }

      extraction.extractedAt =
        new Date();

      const saved =
        await this.repository.save(
          extraction,
        );

      this.logger.error(
        `Group A re-extraction failed for ${listingId}: ${reason}`,
      );

      return saved;
    }
  }

  /**
   * Calculate deterministic fields.
   *
   * pricePerSqm:
   *
   *   price / areaSqm
   *
   * totalInstallmentCost:
   *
   *   down payment +
   *   (installment amount *
   *    payments per year *
   *    installment years)
   */
  private calculateDerivedFields(
    groupA: GroupA,
    groupB: GroupB | null,
  ): GroupA {
    /*
     * =========================
     * PRICE PER SQM
     * =========================
     */
    let pricePerSqm:
      number | null = null;

    if (
      groupA.price !== null &&
      groupA.areaSqm !== null &&
      groupA.areaSqm > 0
    ) {
      pricePerSqm =
        groupA.price /
        groupA.areaSqm;
    }

    /*
     * =========================
     * TOTAL INSTALLMENT COST
     * =========================
     */
    let totalInstallmentCost:
      number | null = null;

    if (groupB) {
      const {
        downPaymentAmount,
        installmentAmount,
        installmentFrequency,
        installmentYears,
      } = groupB;

      let paymentsPerYear:
        | number
        | null = null;

      switch (
      installmentFrequency
      ) {
        case 'monthly':
          paymentsPerYear = 12;
          break;

        case 'quarterly':
          paymentsPerYear = 4;
          break;

        case 'annual':
          paymentsPerYear = 1;
          break;

        default:
          paymentsPerYear = null;
      }

      /*
       * The installment plan is
       * incomplete unless all required
       * values are available.
       */
      if (
        downPaymentAmount !== null &&
        installmentAmount !== null &&
        installmentYears !== null &&
        paymentsPerYear !== null &&
        downPaymentAmount >= 0 &&
        installmentAmount >= 0 &&
        installmentYears > 0
      ) {
        totalInstallmentCost =
          downPaymentAmount +
          installmentAmount *
          paymentsPerYear *
          installmentYears;
      }
    }

    return {
      ...groupA,

      pricePerSqm,

      totalInstallmentCost,
    };
  }

  private async savePropertySearch(
    extraction: ExtractionEntity,
  ): Promise<void> {
    if (
      extraction.status !== 'success' ||
      !extraction.groupA ||
      !extraction.groupB
    ) {
      return;
    }

    const existing =
      await this.propertySearchRepository.findOne({
        where: {
          listingId: extraction.listingId,
        },
      });

    if (existing) {
      return;
    }

    const groupA = extraction.groupA;
    const groupB = extraction.groupB;

    const property =
      this.propertySearchRepository.create({
        listingId: extraction.listingId,

        // Group A
        title: groupA.title,
        price: groupA.price,
        currency: groupA.currency,
        propertyType: groupA.propertyType,
        purpose: groupA.purpose,
        bedrooms: groupA.bedrooms,
        bathrooms: groupA.bathrooms,
        areaSqm: groupA.areaSqm,
        location: groupA.location,
        latitude: groupA.latitude,
        longitude: groupA.longitude,
        sourceUrl: groupA.sourceUrl,
        pricePerSqm: groupA.pricePerSqm,
        totalInstallmentCost:
          groupA.totalInstallmentCost,
        pricePeriod: groupA.pricePeriod,
        agencyName: groupA.agencyName,
        isVerified: groupA.isVerified,
        dateListed: groupA.dateListed,
        language: groupA.language,
        governorate: groupA.governorate,
        city: groupA.city,
        district: groupA.district,

        // Group B
        description: groupB.description,
        compoundName: groupB.compoundName,
        developerName: groupB.developerName,
        finishingLevel: groupB.finishingLevel,
        deliveryStatus: groupB.deliveryStatus,
        deliveryDate: groupB.deliveryDate,
        saleType: groupB.saleType,
        paymentType: groupB.paymentType,
        downPaymentAmount:
          groupB.downPaymentAmount,
        downPaymentPct:
          groupB.downPaymentPct,
        installmentYears:
          groupB.installmentYears,
        installmentAmount:
          groupB.installmentAmount,
        installmentFrequency:
          groupB.installmentFrequency,
        cashDiscountPct:
          groupB.cashDiscountPct,
        floorNumber: groupB.floorNumber,
        gardenAreaSqm:
          groupB.gardenAreaSqm,
        roofAreaSqm:
          groupB.roofAreaSqm,
        isNegotiable:
          groupB.isNegotiable,
      });

    await this.propertySearchRepository.save(
      property,
    );

    this.logger.log(
      `Property search saved: ${extraction.listingId}`,
    );
  }

  async buildSearchableProperties(): Promise<void> {
  const extractions =
    await this.repository.find({
      where: {
        status: 'success',
      },
    });

  this.logger.log(
    `Found ${extractions.length} successful extractions`,
  );

  const searchableProperties =
    extractions
      .filter(
        (extraction) =>
          extraction.groupA &&
          extraction.groupB,
      )
      .map((extraction) => {
        const groupA =
          extraction.groupA!;

        const groupB =
          extraction.groupB!;

        return {
          listingId:
            extraction.listingId,

          title: groupA.title,
          price: groupA.price,
          currency: groupA.currency,
          propertyType:
            groupA.propertyType,
          purpose: groupA.purpose,
          bedrooms: groupA.bedrooms,
          bathrooms: groupA.bathrooms,
          areaSqm: groupA.areaSqm,
          location: groupA.location,
          latitude: groupA.latitude,
          longitude: groupA.longitude,
          sourceUrl: groupA.sourceUrl,
          pricePerSqm:
            groupA.pricePerSqm,
          totalInstallmentCost:
            groupA.totalInstallmentCost,
          pricePeriod:
            groupA.pricePeriod,
          agencyName:
            groupA.agencyName,
          isVerified:
            groupA.isVerified,
          dateListed:
            groupA.dateListed,
          language:
            groupA.language,
          governorate:
            groupA.governorate,
          city: groupA.city,
          district: groupA.district,

          description:
            groupB.description,
          compoundName:
            groupB.compoundName,
          developerName:
            groupB.developerName,
          finishingLevel:
            groupB.finishingLevel,
          deliveryStatus:
            groupB.deliveryStatus,
          deliveryDate:
            groupB.deliveryDate,
          saleType:
            groupB.saleType,
          paymentType:
            groupB.paymentType,
          downPaymentAmount:
            groupB.downPaymentAmount,
          downPaymentPct:
            groupB.downPaymentPct,
          installmentYears:
            groupB.installmentYears,
          installmentAmount:
            groupB.installmentAmount,
          installmentFrequency:
            groupB.installmentFrequency,
          cashDiscountPct:
            groupB.cashDiscountPct,
          floorNumber:
            groupB.floorNumber,
          gardenAreaSqm:
            groupB.gardenAreaSqm,
          roofAreaSqm:
            groupB.roofAreaSqm,
          isNegotiable:
            groupB.isNegotiable,
        };
      });

  if (searchableProperties.length === 0) {
    this.logger.log(
      'No searchable properties to create',
    );

    return;
  }

  await this.propertySearchRepository.upsert(
    searchableProperties,
    ['listingId'],
  );

  this.logger.log(
    `Created/updated ${searchableProperties.length} searchable properties`,
  );
}

  public search(input: ExtractionSearch) {

  }
}