import {
  Injectable,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Workbook } from 'exceljs';
import { access, readFile } from 'node:fs/promises';
import { ExtractionEntity } from '../extract/database/extraction.entity';
import { GroupA } from '../extract/types/group-a.types';
import { GroupB } from '../extract/types/group-b.types';

const OUTPUT_PATH = 'dataset.xlsx';

const COLUMNS: {
  key: string;
  header: string;
}[] = [
  { key: 'listing_id', header: 'listing_id' },
  { key: 'url', header: 'url' },
  { key: 'purpose', header: 'purpose' },
  { key: 'property_type', header: 'property_type' },
  { key: 'price', header: 'price' },
  { key: 'price_period', header: 'price_period' },
  { key: 'currency', header: 'currency' },
  { key: 'bedrooms', header: 'bedrooms' },
  { key: 'bathrooms', header: 'bathrooms' },
  { key: 'area_sqm', header: 'area_sqm' },
  { key: 'location_raw', header: 'location_raw' },
  { key: 'agency_name', header: 'agency_name' },
  { key: 'is_verified', header: 'is_verified' },
  { key: 'date_listed', header: 'date_listed' },
  { key: 'description_raw', header: 'description_raw' },
  { key: 'language', header: 'language' },
  { key: 'compound_name', header: 'compound_name' },
  { key: 'developer_name', header: 'developer_name' },
  { key: 'governorate', header: 'governorate' },
  { key: 'city', header: 'city' },
  { key: 'district', header: 'district' },
  { key: 'finishing_level', header: 'finishing_level' },
  { key: 'delivery_status', header: 'delivery_status' },
  { key: 'delivery_date', header: 'delivery_date' },
  { key: 'sale_type', header: 'sale_type' },
  { key: 'payment_type', header: 'payment_type' },
  { key: 'down_payment_amount', header: 'down_payment_amount' },
  { key: 'down_payment_pct', header: 'down_payment_pct' },
  { key: 'installment_years', header: 'installment_years' },
  { key: 'installment_amount', header: 'installment_amount' },
  { key: 'installment_frequency', header: 'installment_frequency' },
  { key: 'cash_discount_pct', header: 'cash_discount_pct' },
  { key: 'amenities', header: 'amenities' },
  { key: 'floor_number', header: 'floor_number' },
  { key: 'garden_area_sqm', header: 'garden_area_sqm' },
  { key: 'roof_area_sqm', header: 'roof_area_sqm' },
  { key: 'is_negotiable', header: 'is_negotiable' },
];

type FlatRow = Record<string, string | number | boolean | null>;

@Injectable()
export class ExportService {
  private readonly logger = new Logger(
    ExportService.name,
  );

  constructor(
    @InjectRepository(ExtractionEntity)
    private readonly repository: Repository<ExtractionEntity>,
  ) {}

  async exportToXlsx(): Promise<{
    exported: number;
    added: number;
    updated: number;
    unchanged: number;
    filePath: string;
  }> {
    const entities =
      await this.repository.find({
        order: { id: 'ASC' },
        take: 500,
      });

    this.logger.log(
      `Fetched ${entities.length} records from database`,
    );

    const dbRows = new Map<string, FlatRow>();

    for (const entity of entities) {
      const row = this.flatten(entity);

      if (!dbRows.has(row.listing_id as string)) {
        dbRows.set(
          row.listing_id as string,
          row,
        );
      }
    }

    const existingRows =
      await this.readExistingFile();

    let added = 0;
    let updated = 0;
    let unchanged = 0;

    const mergedRows = new Map<string, FlatRow>();

    for (const [listingId, dbRow] of dbRows) {
      const fileRow = existingRows.get(listingId);

      if (!fileRow) {
        mergedRows.set(listingId, dbRow);
        added++;
      } else if (
        JSON.stringify(dbRow) !==
        JSON.stringify(fileRow)
      ) {
        mergedRows.set(listingId, dbRow);
        updated++;
      } else {
        mergedRows.set(listingId, fileRow);
        unchanged++;
      }
    }

    for (const [listingId, fileRow] of existingRows) {
      if (!mergedRows.has(listingId)) {
        mergedRows.set(listingId, fileRow);
      }
    }

    const workbook = new Workbook();
    workbook.creator = 'egypt-housing-pipeline';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Dataset');

    sheet.columns = COLUMNS.map((col) => ({
      header: col.header,
      key: col.key,
      width: this.estimateWidth(col.key),
    }));

    const headerRow = sheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.alignment = {
      horizontal: 'center',
    };

    for (const [, row] of mergedRows) {
      sheet.addRow(row);
    }

    await workbook.xlsx.writeFile(OUTPUT_PATH);

    const result = {
      exported: mergedRows.size,
      added,
      updated,
      unchanged,
      filePath: OUTPUT_PATH,
    };

    this.logger.log(
      `Export complete: ${result.exported} total, ${result.added} added, ${result.updated} updated, ${result.unchanged} unchanged → ${result.filePath}`,
    );

    return result;
  }

  private flatten(
    entity: ExtractionEntity,
  ): FlatRow {
    const a: GroupA | null = entity.groupA;
    const b: GroupB | null = entity.groupB;

    return {
      listing_id: entity.listingId,
      url: entity.sourceUrl ?? null,
      purpose: a?.purpose ?? null,
      property_type: a?.propertyType ?? null,
      price: a?.price ?? null,
      price_period: a?.pricePeriod ?? null,
      currency: a?.currency ?? null,
      bedrooms: a?.bedrooms ?? null,
      bathrooms: a?.bathrooms ?? null,
      area_sqm: a?.areaSqm ?? null,
      location_raw: a?.location ?? null,
      agency_name: a?.agencyName ?? null,
      is_verified: a?.isVerified ?? null,
      date_listed: a?.dateListed ?? null,
      description_raw: b?.description ?? null,
      language: a?.language ?? null,
      compound_name: b?.compoundName ?? null,
      developer_name: b?.developerName ?? null,
      governorate: a?.governorate ?? null,
      city: a?.city ?? null,
      district: a?.district ?? null,
      finishing_level: b?.finishingLevel ?? null,
      delivery_status: b?.deliveryStatus ?? null,
      delivery_date: b?.deliveryDate ?? null,
      sale_type: b?.saleType ?? null,
      payment_type: b?.paymentType ?? null,
      down_payment_amount:
        b?.downPaymentAmount ?? null,
      down_payment_pct: b?.downPaymentPct ?? null,
      installment_years:
        b?.installmentYears ?? null,
      installment_amount:
        b?.installmentAmount ?? null,
      installment_frequency:
        b?.installmentFrequency ?? null,
      cash_discount_pct:
        b?.cashDiscountPct ?? null,
      amenities:
        b?.amenities && b.amenities.length > 0
          ? b.amenities.join(', ')
          : null,
      floor_number: b?.floorNumber ?? null,
      garden_area_sqm: b?.gardenAreaSqm ?? null,
      roof_area_sqm: b?.roofAreaSqm ?? null,
      is_negotiable: b?.isNegotiable ?? null,
    };
  }

  private async readExistingFile(): Promise<
    Map<string, FlatRow>
  > {
    const rows = new Map<string, FlatRow>();

    try {
      await access(OUTPUT_PATH);
    } catch {
      this.logger.log(
        'No existing file found, will create new',
      );
      return rows;
    }

    this.logger.log(
      'Reading existing file for merge',
    );

    const buffer = await readFile(OUTPUT_PATH);
    const workbook = new Workbook();
    await workbook.xlsx.load(buffer as any);

    const sheet = workbook.getWorksheet('Dataset');

    if (!sheet || sheet.rowCount < 2) {
      this.logger.log(
        'Existing file is empty, will create new',
      );
      return rows;
    }

    const headerMap = new Map<string, string>();

    const headerRow = sheet.getRow(1);

    headerRow.eachCell((cell, colNumber) => {
      const value = cell.value;

      if (typeof value === 'string') {
        const col = COLUMNS.find(
          (c) => c.header === value,
        );

        if (col) {
          const colId = String(colNumber);
          headerMap.set(colId, col.key);
        }
      }
    });

    for (let i = 2; i <= sheet.rowCount; i++) {
      const row = sheet.getRow(i);
      const flat: FlatRow = {};

      let listingId: string | null = null;

      row.eachCell(
        (cell, colNumber) => {
          const colKey = headerMap.get(
            String(colNumber),
          );

          if (!colKey) return;

          const raw = cell.value;

          let val: string | number | boolean | null;

          if (
            raw === null ||
            raw === undefined
          ) {
            val = null;
          } else if (
            typeof raw === 'object' &&
            'result' in raw
          ) {
            val = raw.result as
              | string
              | number
              | boolean
              | null;
          } else {
            val = raw as
              | string
              | number
              | boolean;
          }

          flat[colKey] = val;

          if (colKey === 'listing_id') {
            listingId = String(val);
          }
        },
      );

      if (listingId) {
        rows.set(listingId, flat);
      }
    }

    this.logger.log(
      `Read ${rows.size} rows from existing file`,
    );

    return rows;
  }

  private estimateWidth(key: string): number {
    const widths: Record<string, number> = {
      listing_id: 14,
      url: 45,
      purpose: 10,
      property_type: 14,
      price: 14,
      price_period: 13,
      currency: 9,
      bedrooms: 10,
      bathrooms: 11,
      area_sqm: 10,
      location_raw: 40,
      agency_name: 20,
      is_verified: 11,
      date_listed: 13,
      description_raw: 50,
      language: 10,
      compound_name: 25,
      developer_name: 20,
      governorate: 14,
      city: 14,
      district: 14,
      finishing_level: 16,
      delivery_status: 14,
      delivery_date: 14,
      sale_type: 11,
      payment_type: 14,
      down_payment_amount: 18,
      down_payment_pct: 16,
      installment_years: 16,
      installment_amount: 18,
      installment_frequency: 19,
      cash_discount_pct: 16,
      amenities: 40,
      floor_number: 12,
      garden_area_sqm: 15,
      roof_area_sqm: 14,
      is_negotiable: 13,
    };

    return widths[key] ?? 12;
  }
}
