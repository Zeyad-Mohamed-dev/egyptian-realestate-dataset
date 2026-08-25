import { Injectable, Logger } from '@nestjs/common';
import Groq from 'groq-sdk';

import {
  LLMGenerateInput,
  LLMProvider,
} from './llm-provider.interface';

@Injectable()
export class GroqProvider implements LLMProvider {
  private readonly client: Groq;

  constructor() {
    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not configured');
    }

    this.client = new Groq({
      apiKey,
    });
  }

  async generate(
    input: LLMGenerateInput,
  ): Promise<string> {
    const response =
      await this.client.chat.completions.create({
        model:
          process.env.GROQ_MODEL ??
          'llama-3.3-70b-versatile',

        messages: [
          {
            role: 'system',
            content: input.systemPrompt,
          },
          {
            role: 'user',
            content: input.userPrompt,
          },
        ],

        temperature: 0,
      });

    const content =
      response.choices[0]?.message?.content;
    Logger.log(`Groq response: ${content}`, GroqProvider.name);
    if (!content) {
      throw new Error(
        'Groq returned an empty response',
      );
    }

    return content;
  }
}
import { from } from 'rxjs';
