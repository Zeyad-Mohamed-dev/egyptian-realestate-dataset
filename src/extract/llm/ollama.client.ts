import { Injectable, Logger } from '@nestjs/common';
import { LlmClient } from './llm.client';

@Injectable()
export class OllamaClient implements LlmClient {
  private readonly logger = new Logger(OllamaClient.name);

  private readonly baseUrl =
    process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434';

  private readonly model =
    process.env.OLLAMA_MODEL ?? 'qwen3:8b';

  async generate(input: {
    listingId: string;
    systemPrompt: string;
    userPrompt: string;
  }): Promise<string> {
    const response = await fetch(
      `${this.baseUrl}/api/chat`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,

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

          stream: false,

          // Ask Ollama for JSON output.
          format: 'json',

          options: {
            temperature: 0,
          },
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();

      throw new Error(
        `Ollama request failed (${response.status}): ${errorText}`,
      );
    }

    const result = await response.json();

    const content = result?.message?.content;

    if (typeof content !== 'string') {
      throw new Error(
        'Ollama returned no message content',
      );
    }

    return content.trim();
  }
}