export interface LlmClient {
  generate(input: {
    listingId: string;
    systemPrompt: string;
    userPrompt: string;
  }): Promise<string>;
}