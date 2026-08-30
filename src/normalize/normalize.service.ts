import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractionEntity } from 'src/extract/database/extraction.entity';
import { In, Repository } from 'typeorm';

@Injectable()
export class NormalizeService {
    private readonly logger = new Logger(NormalizeService.name);

    constructor(
        @InjectRepository(
              ExtractionEntity,
            )
        private readonly repository: Repository<ExtractionEntity>,
    ) {}

    private async getAllListingsWithNoCompoundName(): Promise<ExtractionEntity[]> {
        return this.repository
            .createQueryBuilder('extraction')
            .where('extraction.groupB IS NOT NULL')
            .andWhere(
                `json_extract(extraction.groupB, '$.compoundName') IS NULL`,
            )
            .getMany();
    }

    private async normalizeCompoundNameEmpty(): Promise<void> {
        const listings = await this.getAllListingsWithNoCompoundName();

        this.logger.log(
            `Found ${listings.length} listings with no compound name.`,
        );

        for (const listing of listings) {
            if (listing.groupB) {
                listing.groupB.compoundName = 'Public District';

                await this.repository.save(listing);

                this.logger.log(
                    `Set compound name to "Public District" for listing ${listing.listingId}.`,
                );
            }
        }
    }

    private async normalizeCompoundName(): Promise<void> {
        const listings = await this.repository.find();

        for (const listing of listings) {
            const compoundName = listing.groupB?.compoundName;

            if (!compoundName) {
                continue;
            }

            const normalizedName = compoundName
                .replace(/\b(compound|project)\b/gi, '')
                .replace(/\s+/g, ' ')
                .trim();

            if (normalizedName !== compoundName) {
                listing.groupB!.compoundName = normalizedName;

                await this.repository.save(listing);

                this.logger.log(
                    `Normalized compound name for listing ${listing.listingId}: "${compoundName}" → "${normalizedName}"`,
                );
            }
        }
    }

    public async normalize(): Promise<void> {
        this.logger.log('Starting normalization...');

        await this.normalizeCompoundNameEmpty();
        await this.normalizeCompoundName();

        this.logger.log('Normalization completed.');
    }
}