import {
  Injectable,
  Logger,
} from '@nestjs/common';

import { GroupA } from './types/group-a.types';

@Injectable()
export class GroupAService {
  private readonly logger =
    new Logger(GroupAService.name);

  extract(input: {
    listingId: string;
    sourceUrl: string | null;
    jsonLd: unknown[];
  }): GroupA {
    try {
      const property =
        this.findProperty(input.jsonLd);

      const result: GroupA = {
        title: this.readString(
          property?.name,
        ),

        price: this.readNumber(
          property?.offers?.price ??
            property?.price,
        ),

        currency: this.readString(
          property?.offers?.priceCurrency ??
            property?.priceCurrency,
        ),

        propertyType:
          this.readPropertyType(
            property?.['@type'],
          ),

        purpose: this.readPurpose(
          property?.['@type'],
        ),

        bedrooms: this.readNumber(
          property?.numberOfBedrooms,
        ),

        bathrooms: this.readNumber(
          property?.numberOfBathroomsTotal ??
            property?.numberOfBathrooms,
        ),

        areaSqm:
          this.readArea(property),

        location:
          this.readLocation(property),

        latitude: this.readNumber(
          property?.geo?.latitude,
        ),

        longitude: this.readNumber(
          property?.geo?.longitude,
        ),

        sourceUrl:
          input.sourceUrl,

        /*
         * These are calculated later by
         * ExtractorService after Group B
         * has also been successfully extracted.
         */
        pricePerSqm: null,

        totalInstallmentCost: null,
      };

      this.logger.log(
        `Group A extracted: ${input.listingId}`,
      );

      return result;
    } catch (error) {
      const reason =
        error instanceof Error
          ? error.message
          : String(error);

      this.logger.error(
        `Group A extraction failed for ${input.listingId}: ${reason}`,
      );

      throw error;
    }
  }

  /**
   * Find the actual property object.
   *
   * Bayut structure:
   *
   * @graph
   *   -> RealEstateListing
   *      -> mainEntity
   *         -> Apartment / House
   */
  private findProperty(
    jsonLd: unknown[],
  ): Record<string, any> | null {
    for (const item of jsonLd) {
      if (
        !item ||
        typeof item !== 'object'
      ) {
        continue;
      }

      const record =
        item as Record<string, any>;

      /*
       * Handle @graph
       */
      if (
        Array.isArray(
          record['@graph'],
        )
      ) {
        for (
          const graphItem of
            record['@graph']
        ) {
          if (
            !graphItem ||
            typeof graphItem !==
              'object'
          ) {
            continue;
          }

          const graphRecord =
            graphItem as Record<
              string,
              any
            >;

          /*
           * RealEstateListing contains
           * the actual property in
           * mainEntity.
           */
          if (
            graphRecord['@type'] ===
              'RealEstateListing' &&
            graphRecord.mainEntity &&
            typeof graphRecord.mainEntity ===
              'object'
          ) {
            return graphRecord.mainEntity;
          }

          /*
           * Direct property object.
           */
          const property =
            this.getPropertyFromRecord(
              graphRecord,
            );

          if (property) {
            return property;
          }
        }
      }

      /*
       * Handle JSON-LD without @graph.
       */
      const property =
        this.getPropertyFromRecord(
          record,
        );

      if (property) {
        return property;
      }
    }

    return null;
  }

  /**
   * Find a property when the object itself
   * represents the property.
   */
  private getPropertyFromRecord(
    record: Record<string, any>,
  ): Record<string, any> | null {
    const type =
      record['@type'];

    if (
      type === 'Apartment' ||
      type === 'House' ||
      type === 'Product'
    ) {
      return record;
    }

    /*
     * Sometimes @type is an array:
     *
     * ["Apartment", "BuyAction"]
     */
    if (
      Array.isArray(type)
    ) {
      if (
        type.includes(
          'Apartment',
        ) ||
        type.includes('House') ||
        type.includes('Product')
      ) {
        return record;
      }
    }

    return null;
  }

  private readString(
    value: unknown,
  ): string | null {
    if (
      typeof value === 'string' &&
      value.trim().length > 0
    ) {
      return value.trim();
    }

    return null;
  }

  private readNumber(
    value: unknown,
  ): number | null {
    if (
      typeof value === 'number' &&
      Number.isFinite(value)
    ) {
      return value;
    }

    if (
      typeof value === 'string'
    ) {
      const cleaned =
        value
          .replace(/,/g, '')
          .trim();

      const parsed =
        Number(cleaned);

      return Number.isFinite(
        parsed,
      )
        ? parsed
        : null;
    }

    return null;
  }

  private readPropertyType(
    value: unknown,
  ): string | null {
    if (
      typeof value === 'string'
    ) {
      return this.readString(
        value,
      );
    }

    if (
      Array.isArray(value)
    ) {
      /*
       * ["Apartment", "BuyAction"]
       *
       * We want "Apartment",
       * not "BuyAction".
       */
      const propertyType =
        value.find(
          (item) =>
            item === 'Apartment' ||
            item === 'House' ||
            item === 'Villa' ||
            item === 'Chalet' ||
            item === 'Duplex' ||
            item === 'Townhouse',
        );

      if (
        typeof propertyType ===
        'string'
      ) {
        return propertyType;
      }

      const firstString =
        value.find(
          (item) =>
            typeof item ===
            'string',
        );

      return typeof firstString ===
        'string'
        ? firstString
        : null;
    }

    return null;
  }

  private readPurpose(
    value: unknown,
  ): string | null {
    if (
      !Array.isArray(value)
    ) {
      return null;
    }

    /*
     * BuyAction means Sale.
     */
    if (
      value.includes(
        'BuyAction',
      )
    ) {
      return 'Sale';
    }

    /*
     * SellAction can also
     * indicate sale.
     */
    if (
      value.includes(
        'SellAction',
      )
    ) {
      return 'Sale';
    }

    /*
     * RentAction means rental.
     */
    if (
      value.includes(
        'RentAction',
      )
    ) {
      return 'Rent';
    }

    return null;
  }

  private readArea(
    property:
      | Record<string, any>
      | null,
  ): number | null {
    if (!property) {
      return null;
    }

    const value =
      property.floorSize
        ?.value ??
      property.floorSize ??
      property.area;

    return this.readNumber(
      value,
    );
  }

  private readLocation(
    property:
      | Record<string, any>
      | null,
  ): string | null {
    if (!property) {
      return null;
    }

    const address =
      property.address;

    if (
      typeof address ===
      'string'
    ) {
      return address;
    }

    if (
      address &&
      typeof address ===
        'object'
    ) {
      const parts = [
        address.streetAddress,
        address.addressLocality,
        address.addressRegion,
      ].filter(
        (
          value,
        ): value is string =>
          typeof value ===
            'string' &&
          value.trim().length >
            0,
      );

      return parts.length > 0
        ? parts.join(', ')
        : null;
    }

    return null;
  }
}