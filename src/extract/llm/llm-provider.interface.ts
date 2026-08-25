export interface LLMGenerateInput {
  systemPrompt: string;
  userPrompt: string;
}

export interface LLMProvider {
  generate(input: LLMGenerateInput): Promise<string>;
}