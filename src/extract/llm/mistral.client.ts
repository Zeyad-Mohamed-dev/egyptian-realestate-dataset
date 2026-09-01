import { Logger } from "@nestjs/common";
import { LLMGenerateInput, LLMProvider } from "./llm-provider.interface";
import { Mistral } from '@mistralai/mistralai';

export class MistralProvider implements LLMProvider {
    private mistral: Mistral
    
    constructor() {
        const apiKey = process.env.MISTRAL_API_KEY;
    
        if (!apiKey) {
          throw new Error('MISTRAL_API_KEY is not configured');
        }

        this.mistral = new Mistral({
            apiKey: apiKey
        })
    }

    async generate(input: LLMGenerateInput): Promise<string> {
  try {
    const response = await this.mistral.chat.complete({
      model: 'mistral-small-latest',
      messages: [
        {
          role: 'user',
          content: input.userPrompt,
        },
        {
            role: 'system',
            content: input.systemPrompt
        }
      ],
    });
    Logger.log("Mistral result: ", response.choices[0].message?.content)
    return response.choices[0].message?.content as string;
  } catch (error) {
    const message =
    error instanceof Error
      ? error.message
      : String(error);
    Logger.error("Mistral api calling produced an error ", message);
    throw new Error(`Mistral API error: ${message}`);
  }
}
    
    


}