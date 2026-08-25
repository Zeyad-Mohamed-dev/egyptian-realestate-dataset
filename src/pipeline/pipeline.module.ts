import { Module } from '@nestjs/common';
import { ParseModule } from '../parse/parse.module';
import { PipelineService } from './pipeline.service';

@Module({ imports: [ParseModule], providers: [PipelineService], exports: [PipelineService] })
export class PipelineModule {}
