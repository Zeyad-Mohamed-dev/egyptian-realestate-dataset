import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StorageService } from './storage.service';
import { ExtractionEntity } from '../extract/database/extraction.entity';
import { PropertySearchEntity } from 'src/extract/database/property.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/database.sqlite',
      entities: [ExtractionEntity, PropertySearchEntity],
      synchronize: true,
    }),
  ],

  providers: [StorageService],

  exports: [StorageService],
})
export class StorageModule {}