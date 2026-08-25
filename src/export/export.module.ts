import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExportService } from './export.service';
import { ExtractionEntity } from '../extract/database/extraction.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([ExtractionEntity]),
  ],
  providers: [ExportService],
  exports: [ExportService],
})
export class ExportModule {}
