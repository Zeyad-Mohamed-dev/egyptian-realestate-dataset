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
      const found =
        this.findListing(input.jsonLd);

      const listing =
        found?.listing ?? null;

      const property =
        found?.property ?? null;

      const result: GroupA = {
        /*
         * =========================
         * EXISTING GROUP A FIELDS
         * =========================
         */

        title: this.readString(
          listing?.name ??
            property?.name,
        ),

        price: this.readNumber(
          property?.offers?.price ??
            property?.price ??
            listing?.offers?.price ??
            listing?.price,
        ),

        currency: this.readString(
          property?.offers?.priceCurrency ??
            property?.priceCurrency ??
            listing?.offers?.priceCurrency ??
            listing?.priceCurrency,
        ),

        propertyType:
          this.readPropertyType(
            property?.['@type'],
            property?.accommodationCategory,
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
         * =========================
         * NEW REQUIRED FIELDS
         * =========================
         */

        pricePeriod:
          this.readPricePeriod(
            listing,
            property,
          ),

        agencyName:
          this.readAgencyName(
            property,
            listing,
          ),

        isVerified:
          this.readIsVerified(
            property,
            listing,
          ),

        dateListed:
          this.readString(
            listing?.datePosted,
          ),

        language:
          this.readLanguage(
            input.sourceUrl,
          ),

        governorate:
          this.readGovernorate(
            property,
          ),

        city:
          this.readCity(
            property,
          ),

        district:
          this.readDistrict(
            property,
            listing,
          ),

        /*
         * =========================
         * CALCULATED FIELDS
         * =========================
         *
         * ExtractorService calculates
         * these after Group B.
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
   * Find both:
   *
   * 1. RealEstateListing
   * 2. mainEntity property
   */
  private findListing(
    jsonLd: unknown[],
  ): {
    listing: Record<string, any>;
    property: Record<string, any>;
  } | null {
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
       * =========================
       * @graph
       * =========================
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
           * Normal Bayut structure:
           *
           * RealEstateListing
           *    |
           *    +-- name
           *    +-- datePosted
           *    +-- mainEntity
           *             |
           *             +-- Apartment
           */
          if (
            graphRecord['@type'] ===
              'RealEstateListing' &&
            graphRecord.mainEntity &&
            typeof graphRecord.mainEntity ===
              'object'
          ) {
            return {
              listing:
                graphRecord,

              property:
                graphRecord.mainEntity,
            };
          }

          /*
           * Direct property in graph.
           */
          const property =
            this.getPropertyFromRecord(
              graphRecord,
            );

          if (property) {
            return {
              listing:
                graphRecord,

              property,
            };
          }
        }
      }

      /*
       * =========================
       * DIRECT OBJECT
       * =========================
       */

      if (
        record['@type'] ===
          'RealEstateListing' &&
        record.mainEntity &&
        typeof record.mainEntity ===
          'object'
      ) {
        return {
          listing: record,

          property:
            record.mainEntity,
        };
      }

      /*
       * Direct property.
       */
      const property =
        this.getPropertyFromRecord(
          record,
        );

      if (property) {
        return {
          listing: record,
          property,
        };
      }
    }

    return null;
  }

  private getPropertyFromRecord(
    record: Record<string, any>,
  ): Record<string, any> | null {
    const type =
      record['@type'];

    const propertyTypes = [
      'Apartment',
      'House',
      'Villa',
      'Chalet',
      'Duplex',
      'Townhouse',
      'Penthouse',
      'Studio',
      'Land',
      'Product',
    ];

    if (
      typeof type === 'string' &&
      propertyTypes.includes(type)
    ) {
      return record;
    }

    if (
      Array.isArray(type) &&
      type.some(
        (item) =>
          typeof item === 'string' &&
          propertyTypes.includes(item),
      )
    ) {
      return record;
    }

    return null;
  }

  /*
   * =========================
   * BASIC READERS
   * =========================
   */

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
      const parsed =
        Number(
          value
            .replace(/,/g, '')
            .trim(),
        );

      return Number.isFinite(parsed)
        ? parsed
        : null;
    }

    return null;
  }

  /*
   * =========================
   * PROPERTY TYPE
   * =========================
   */

  private readPropertyType(
    value: unknown,
    accommodationCategory?: string | null,
  ): string | null {
    const propertyTypes = [
      'Apartment',
      'Villa',
      'Chalet',
      'Townhouse',
      'Duplex',
      'Penthouse',
      'Studio',
      'Land',
      'House',
    ];

    if (
      typeof value === 'string'
    ) {
      const normalized =
        this.normalizePropertyType(
          value,
        );

      if (
        normalized !== 'other'
      ) {
        return normalized;
      }
    }

    if (
      Array.isArray(value)
    ) {
      const found =
        value.find(
          (item) =>
            typeof item === 'string' &&
            propertyTypes.includes(
              item,
            ),
        );

      if (
        typeof found === 'string'
      ) {
        const normalized =
          this.normalizePropertyType(
            found,
          );

        if (
          normalized !== 'other'
        ) {
          return normalized;
        }
      }
    }

    /*
     * Fallback: accommodationCategory
     * from Schema.org. Bayut sets this
     * to the human-readable type like
     * "Villa", "Apartment", "Duplex".
     *
     * This catches cases where @type
     * is ["House", "BuyAction"] —
     * "House" normalizes to "other"
     * but accommodationCategory says
     * "Villa".
     */
    if (
      typeof accommodationCategory ===
        'string' &&
      accommodationCategory.trim()
        .length > 0
    ) {
      return this.normalizePropertyType(
        accommodationCategory,
      );
    }

    return null;
  }

  private normalizePropertyType(
    value: string,
  ): string {
    switch (
      value.trim().toLowerCase()
    ) {
      case 'apartment':
        return 'apartment';

      case 'villa':
        return 'villa';

      case 'chalet':
        return 'chalet';

      case 'townhouse':
        return 'townhouse';

      case 'duplex':
        return 'duplex';

      case 'penthouse':
        return 'penthouse';

      case 'studio':
        return 'studio';

      case 'land':
        return 'land';

      case 'house':
        return 'other';

      default:
        return 'other';
    }
  }

  /*
   * =========================
   * PURPOSE
   * =========================
   */

  private readPurpose(
    value: unknown,
  ): string | null {
    if (
      typeof value === 'string'
    ) {
      if (
        value === 'BuyAction' ||
        value === 'SellAction'
      ) {
        return 'Sale';
      }

      if (
        value === 'RentAction'
      ) {
        return 'Rent';
      }

      return null;
    }

    if (
      !Array.isArray(value)
    ) {
      return null;
    }

    if (
      value.includes('BuyAction') ||
      value.includes('SellAction')
    ) {
      return 'Sale';
    }

    if (
      value.includes('RentAction')
    ) {
      return 'Rent';
    }

    return null;
  }

  /*
   * =========================
   * AREA
   * =========================
   */

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

    return this.readNumber(value);
  }

  /*
   * =========================
   * LOCATION
   * =========================
   */

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
      typeof address === 'string'
    ) {
      return address.trim();
    }

    if (
      address &&
      typeof address === 'object'
    ) {
      const parts = [
        address.streetAddress,
        address.addressLocality,
        address.addressRegion,
      ].filter(
        (
          value,
        ): value is string =>
          typeof value === 'string' &&
          value.trim().length > 0,
      );

      return parts.length > 0
        ? parts.join(', ')
        : null;
    }

    return null;
  }

  /*
   * =========================
   * price_period
   * =========================
   *
   * Only return it if Schema.org
   * explicitly provides a period.
   *
   * We do NOT assume "Sale" means
   * a particular price period.
   */

  private readPricePeriod(
    listing:
      | Record<string, any>
      | null,
    property:
      | Record<string, any>
      | null,
  ): string | null {
    const value =
      property?.offers?.priceSpecification
        ?.unitCode ??
      property?.offers?.priceSpecification
        ?.unitText ??
      property?.pricePeriod ??
      listing?.pricePeriod;

    return this.readString(value);
  }

  /*
   * =========================
   * agency_name
   * =========================
   *
   * Bayut example:
   *
   * mainEntity.seller.name
   */

  private readAgencyName(
    property:
      | Record<string, any>
      | null,
    listing:
      | Record<string, any>
      | null,
  ): string | null {
    const seller =
      property?.seller ??
      listing?.seller;

    if (
      seller &&
      typeof seller === 'object'
    ) {
      /*
       * Prefer the agency/organization name
       * from memberOf over the individual
       * agent name.
       */
      const agency =
        seller.memberOf?.name;

      if (
        this.readString(agency)
      ) {
        return agency.trim();
      }

      return this.readString(
        seller.name,
      );
    }

    return this.readString(seller);
  }

  /*
   * =========================
   * is_verified
   * =========================
   *
   * IMPORTANT:
   *
   * Do not assume that a seller/agent
   * is verified.
   *
   * Return only explicit evidence.
   */

  private readIsVerified(
    property:
      | Record<string, any>
      | null,
    listing:
      | Record<string, any>
      | null,
  ): boolean | null {
    const value =
      property?.isVerified ??
      property?.verified ??
      property?.seller?.isVerified ??
      property?.seller?.verified ??
      listing?.isVerified ??
      listing?.verified;

    if (
      typeof value === 'boolean'
    ) {
      return value;
    }

    return null;
  }

  /*
   * =========================
   * date_listed
   * =========================
   *
   * Bayut:
   *
   * RealEstateListing.datePosted
   */

  /*
   * Already extracted through:
   *
   * listing.datePosted
   *
   * in extract().
   */

  /*
   * =========================
   * language
   * =========================
   *
   * Bayut URL:
   *
   * /en/property/...
   *
   * /ar/property/...
   */

  private readLanguage(
    sourceUrl: string | null,
  ): string | null {
    if (!sourceUrl) {
      return null;
    }

    try {
      const url =
        new URL(sourceUrl);

      const firstPathSegment =
        url.pathname
          .split('/')
          .filter(Boolean)[0]
          ?.toLowerCase();

      if (
        firstPathSegment === 'en'
      ) {
        return 'en';
      }

      if (
        firstPathSegment === 'ar'
      ) {
        return 'ar';
      }

      return null;
    } catch {
      return null;
    }
  }

  /*
   * =========================
   * GOVERNORATE
   * =========================
   *
   * Schema.org:
   *
   * address.addressRegion
   *
   * Example:
   *
   * Alexandria
   */

  private readGovernorate(
    property:
      | Record<string, any>
      | null,
  ): string | null {
    const address =
      property?.address;

    if (
      !address ||
      typeof address !== 'object'
    ) {
      return null;
    }

    return this.readString(
      address.addressRegion,
    );
  }

  /*
   * =========================
   * CITY
   * =========================
   *
   * Schema.org:
   *
   * address.addressLocality
   *
   * Example:
   *
   * Sidi Beshr
   *
   * NOTE:
   * This is whatever Bayut explicitly
   * provides as addressLocality.
   *
   * We do NOT convert it into a
   * different city by assumption.
   */

  private readCity(
    property:
      | Record<string, any>
      | null,
  ): string | null {
    const address =
      property?.address;

    if (
      !address ||
      typeof address !== 'object'
    ) {
      return null;
    }

    return this.readString(
      address.addressLocality,
    );
  }

  /*
   * =========================
   * DISTRICT
   * =========================
   *
   * Bayut sometimes exposes the
   * more specific locality through
   * address fields.
   *
   * We only use an explicit field.
   */

  private readDistrict(
    property:
      | Record<string, any>
      | null,
    listing:
      | Record<string, any>
      | null,
  ): string | null {
    const address =
      property?.address;

    if (
      address &&
      typeof address === 'object'
    ) {
      const explicitDistrict =
        address.district ??
        address.addressDistrict ??
        address.neighborhood ??
        address.neighbourhood;

      const result =
        this.readString(
          explicitDistrict,
        );

      if (result) {
        return result;
      }
    }

    /*
     * Do not blindly use addressLocality
     * as district because the dataset
     * separately requires city.
     */

    return null;
  }
}