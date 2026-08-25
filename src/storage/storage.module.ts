import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { StorageService } from './storage.service';
import { ExtractionEntity } from '../extract/database/extraction.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'data/housing.sqlite',
      entities: [ExtractionEntity],
      synchronize: true,
    }),
  ],

  providers: [StorageService],

  exports: [StorageService],
})
export class StorageModule {}