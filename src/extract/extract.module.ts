import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { ExtractorService } from './extract.service';
import { ExtractorRunnerService } from './exctractor-runner.service';
import { GroupAService } from './group-a.service';
import { GroupBService } from './group-b.service';

import { ExtractionEntity } from './database/extraction.entity';

import { LLM_PROVIDER } from './llm/llm-tokens';
import { GroqProvider } from './llm/groq.client';
import { GroupAReExtractionService } from './group-a-re-extraction';
import { OllamaClient } from './llm/ollama.client';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ExtractionEntity,
    ]),
  ],

  providers: [
    ExtractorService,
    ExtractorRunnerService,
    GroupAService,
    GroupBService,
    GroupAReExtractionService,
    GroqProvider,
    OllamaClient,

    {
      provide: LLM_PROVIDER,
      useExisting: OllamaClient,
    },
  ],

  exports: [
    ExtractorService,
    ExtractorRunnerService,
  ],
})
export class ExtractorModule {}