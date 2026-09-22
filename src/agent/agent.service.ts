import { Injectable } from '@nestjs/common';

import { createAgent } from 'langchain';

import { ChatModelProvider } from './llm/chat-model-provider';
import { SearchExtractionsTool } from './tools/searchExtractionsTool';
import { PropertySearchService } from 'src/extract/services/searchable-property.service';

@Injectable()
export class AgentService {
  private readonly agent;

  constructor(
    private readonly modelProvider: ChatModelProvider,
    private readonly propertySearchService: PropertySearchService,
  ) {
    const searchTool =
      new SearchExtractionsTool(
        this.propertySearchService,
      ).create();

    const model =
      this.modelProvider.create();

    this.agent = createAgent({
      model,
      tools: [searchTool],
      systemPrompt: `
You are a real-estate property search assistant.

Use the search_extractions tool whenever
the user asks to find or filter property
listings.

Translate natural language requirements
into the structured search parameters
supported by the tool.

Do not invent search filters that are not
supported by the tool.

After receiving search results, explain
the relevant properties clearly.
      `,
    });
  }

  async processAgentRequest(
    request: string,
  ) {
    return this.agent.invoke({
      messages: [
        {
          role: 'user',
          content: request,
        },
      ],
    });
  }
}