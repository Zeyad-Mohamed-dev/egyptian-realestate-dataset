import { Module } from '@nestjs/common';
import { AgentService } from './agent.service';
import { ExtractorModule } from 'src/extract/extract.module';
import { Chat } from 'groq-sdk/resources/index.js';
import { ChatModelProvider } from './llm/chat-model-provider';

@Module({
  imports: [ExtractorModule],
  providers: [AgentService, ChatModelProvider],
})
export class AgentModule {}
