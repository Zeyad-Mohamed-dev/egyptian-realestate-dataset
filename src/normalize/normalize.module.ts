import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { NormalizeService } from './normalize.service';
import { ExtractionEntity } from 'src/extract/database/extraction.entity';

@Module({
    imports: [
        TypeOrmModule.forFeature([ExtractionEntity]),
    ],
    providers: [NormalizeService],
    exports: [NormalizeService],
})
export class NormalizeModule {}