import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class GeminiClient {
  private readonly client: GoogleGenerativeAI;
  private readonly modelName = 'gemini-3.6-flash';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error(
        'GEMINI_API_KEY environment variable is not configured.',
      );
    }

    this.client = new GoogleGenerativeAI(apiKey);
  }

  async generateStructured<T>(
    prompt: string,
  ): Promise<T> {
    const model = this.client.getGenerativeModel({
      model: this.modelName,

      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0,
      },
    });

    const result = await model.generateContent(prompt);

    const text =
      result.response.text().trim();

    if (!text) {
      throw new Error(
        'Gemini returned an empty response.',
      );
    }

    try {
      return JSON.parse(text) as T;
    } catch (error) {
      throw new Error(
        `Gemini returned invalid JSON: ${text}`,
      );
    }
  }
}