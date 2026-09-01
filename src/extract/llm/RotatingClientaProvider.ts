import { Injectable } from "@nestjs/common";
import { GroqProvider } from "./groq.client";
import { LLMGenerateInput, LLMProvider } from "./llm-provider.interface";
import { MistralProvider } from "./mistral.client";

@Injectable()
export class RotatingLLMProvider implements LLMProvider {
  private providers: LLMProvider[];

  private currentIndex = 0;

  constructor(
    mistral: MistralProvider,
    groq: GroqProvider
  ) {
    this.providers = [
      mistral,
      groq
    ];
  }

  async generate(
    input: LLMGenerateInput,
  ): Promise<string> {
    const startIndex = this.currentIndex;

    for (
      let attempt = 0;
      attempt < this.providers.length;
      attempt++
    ) {
      const index =
        (startIndex + attempt) %
        this.providers.length;

      const provider = this.providers[index];

      try {
        const result =
          await provider.generate(input);

        this.currentIndex = index;

        return result;
      } catch (error) {
        if (this.isRateLimit(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new Error(
      'All LLM providers are rate limited',
    );
  }

  private isRateLimit(error: unknown): boolean {
    if (
      typeof error === 'object' &&
      error !== null &&
      'status' in error
    ) {
      return (
        (error as { status?: number }).status === 429
      );
    }

    return false;
  }
}