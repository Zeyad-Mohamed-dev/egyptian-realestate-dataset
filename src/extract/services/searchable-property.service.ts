import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { PropertySearchEntity } from '../database/property.entity';
import {
  ExtractionSearch } from '../../agent/types/exctraction-query.type';

@Injectable()
export class PropertySearchService {
  private readonly logger =
    new Logger(PropertySearchService.name);

  constructor(
    @InjectRepository(PropertySearchEntity)
    private readonly repository:
      Repository<PropertySearchEntity>,
  ) {}

  async search(
    input: ExtractionSearch,
  ): Promise<PropertySearchEntity[]> {
    const qb =
      this.repository.createQueryBuilder('property');

    const { property, development } = input;

    // -------------------------
    // Property
    // -------------------------

    if (property?.propertyType !== undefined) {
      qb.andWhere(
        'property.propertyType = :propertyType',
        {
          propertyType: property.propertyType,
        },
      );
    }

    if (property?.purpose !== undefined) {
      qb.andWhere(
        'property.purpose = :purpose',
        {
          purpose: property.purpose,
        },
      );
    }

    if (property?.governorate !== undefined) {
      qb.andWhere(
        'property.governorate = :governorate',
        {
          governorate: property.governorate,
        },
      );
    }

    if (property?.city !== undefined) {
      qb.andWhere(
        'property.city = :city',
        {
          city: property.city,
        },
      );
    }

    if (property?.district !== undefined) {
      qb.andWhere(
        'property.district = :district',
        {
          district: property.district,
        },
      );
    }

    // -------------------------
    // Price
    // -------------------------

    if (property?.minPrice !== undefined) {
      qb.andWhere(
        'property.price >= :minPrice',
        {
          minPrice: property.minPrice,
        },
      );
    }

    if (property?.maxPrice !== undefined) {
      qb.andWhere(
        'property.price <= :maxPrice',
        {
          maxPrice: property.maxPrice,
        },
      );
    }

    // -------------------------
    // Bedrooms
    // -------------------------

    if (property?.minBedrooms !== undefined) {
      qb.andWhere(
        'property.bedrooms >= :minBedrooms',
        {
          minBedrooms: property.minBedrooms,
        },
      );
    }

    if (property?.maxBedrooms !== undefined) {
      qb.andWhere(
        'property.bedrooms <= :maxBedrooms',
        {
          maxBedrooms: property.maxBedrooms,
        },
      );
    }

    // -------------------------
    // Bathrooms
    // -------------------------

    if (property?.minBathrooms !== undefined) {
      qb.andWhere(
        'property.bathrooms >= :minBathrooms',
        {
          minBathrooms: property.minBathrooms,
        },
      );
    }

    if (property?.maxBathrooms !== undefined) {
      qb.andWhere(
        'property.bathrooms <= :maxBathrooms',
        {
          maxBathrooms: property.maxBathrooms,
        },
      );
    }

    // -------------------------
    // Area
    // -------------------------

    if (property?.minAreaSqm !== undefined) {
      qb.andWhere(
        'property.areaSqm >= :minAreaSqm',
        {
          minAreaSqm: property.minAreaSqm,
        },
      );
    }

    if (property?.maxAreaSqm !== undefined) {
      qb.andWhere(
        'property.areaSqm <= :maxAreaSqm',
        {
          maxAreaSqm: property.maxAreaSqm,
        },
      );
    }

    // -------------------------
    // Development
    // -------------------------

    if (development?.compoundName !== undefined) {
      qb.andWhere(
        'property.compoundName = :compoundName',
        {
          compoundName: development.compoundName,
        },
      );
    }

    if (development?.developerName !== undefined) {
      qb.andWhere(
        'property.developerName = :developerName',
        {
          developerName: development.developerName,
        },
      );
    }

    if (development?.finishingLevel !== undefined) {
      qb.andWhere(
        'property.finishingLevel = :finishingLevel',
        {
          finishingLevel:
            development.finishingLevel,
        },
      );
    }

    if (development?.deliveryStatus !== undefined) {
      qb.andWhere(
        'property.deliveryStatus = :deliveryStatus',
        {
          deliveryStatus:
            development.deliveryStatus,
        },
      );
    }

    if (development?.saleType !== undefined) {
      qb.andWhere(
        'property.saleType = :saleType',
        {
          saleType: development.saleType,
        },
      );
    }

    if (development?.paymentType !== undefined) {
      qb.andWhere(
        'property.paymentType = :paymentType',
        {
          paymentType:
            development.paymentType,
        },
      );
    }

    // -------------------------
    // Installments
    // -------------------------

    if (
      development?.minInstallmentYears !==
      undefined
    ) {
      qb.andWhere(
        'property.installmentYears >= :minInstallmentYears',
        {
          minInstallmentYears:
            development.minInstallmentYears,
        },
      );
    }

    if (
      development?.maxInstallmentYears !==
      undefined
    ) {
      qb.andWhere(
        'property.installmentYears <= :maxInstallmentYears',
        {
          maxInstallmentYears:
            development.maxInstallmentYears,
        },
      );
    }

    // -------------------------
    // Down payment
    // -------------------------

    if (
      development?.maxDownPaymentPct !==
      undefined
    ) {
      qb.andWhere(
        'property.downPaymentPct <= :maxDownPaymentPct',
        {
          maxDownPaymentPct:
            development.maxDownPaymentPct,
        },
      );
    }

    // -------------------------
    // Cash discount
    // -------------------------

    if (
      development?.maxCashDiscountPct !==
      undefined
    ) {
      qb.andWhere(
        'property.cashDiscountPct <= :maxCashDiscountPct',
        {
          maxCashDiscountPct:
            development.maxCashDiscountPct,
        },
      );
    }

    // -------------------------
    // Negotiability
    // -------------------------

    if (
      development?.isNegotiable !==
      undefined
    ) {
      qb.andWhere(
        'property.isNegotiable = :isNegotiable',
        {
          isNegotiable:
            development.isNegotiable,
        },
      );
    }

    // -------------------------
    // Limit
    // -------------------------

    qb.take(input.limit ?? 20);

    const results = await qb.getMany();

    this.logger.log(
      `Search returned ${results.length} properties`,
    );

    return results;
  }
}