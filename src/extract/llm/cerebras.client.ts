import { Injectable } from '@nestjs/common';
import Cerebras from '@cerebras/cerebras_cloud_sdk';

import {
  LLMGenerateInput,
  LLMProvider,
} from './llm-provider.interface';

@Injectable()
export class CerebrasProvider
  implements LLMProvider
{
  private readonly client: Cerebras;

  constructor() {
    const apiKey =
      process.env.CEREBRAS_API_KEY;

    if (!apiKey) {
      throw new Error(
        'CEREBRAS_API_KEY is not configured',
      );
    }

    this.client = new Cerebras({
      apiKey,
    });
  }

  async generate(
    input: LLMGenerateInput,
  ): Promise<string> {
    const response =
      await this.client.chat.completions.create({
        model:
          process.env.CEREBRAS_MODEL ??
          'gpt-oss-120b',

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

        /*
         * Explicitly disable streaming.
         */
        stream: false,
      });

    /*
     * The Cerebras SDK types create() as a union
     * containing error/streaming responses.
     *
     * We explicitly narrow to the normal completion
     * response here.
     */
    if (
      !('choices' in response) ||
      !Array.isArray(response.choices)
    ) {
      throw new Error(
        'Cerebras returned an invalid completion response',
      );
    }

    const choice =
      response.choices[0];

    if (
      !choice ||
      !('message' in choice)
    ) {
      throw new Error(
        'Cerebras returned an invalid choice',
      );
    }

    const content =
      choice.message?.content;

    if (
      typeof content !== 'string' ||
      content.trim().length === 0
    ) {
      throw new Error(
        'Cerebras returned an empty response',
      );
    }

    return content;
  }
}