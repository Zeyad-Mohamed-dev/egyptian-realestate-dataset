import { Module } from '@nestjs/common';
import { CollectModule } from './collect/collect.module';
import { CommonModule } from './common/common.module';
import { EvaluateModule } from './evaluate/evaluate.module';
import { ExportModule } from './export/export.module';
import { ExtractorModule } from './extract/extract.module';
import { NormalizeModule } from './normalize/normalize.module';
import { ParseModule } from './parse/parse.module';
import { PipelineModule } from './pipeline/pipeline.module';
import { StorageModule } from './storage/storage.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CommonModule,
    StorageModule,
    CollectModule,
    PipelineModule,
    ParseModule,
    ExtractorModule,
    NormalizeModule,
    EvaluateModule,
    ExportModule,
  ],
})
export class AppModule {}
