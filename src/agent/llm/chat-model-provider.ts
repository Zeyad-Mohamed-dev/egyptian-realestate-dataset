import { Injectable } from '@nestjs/common';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { ChatMistralAI } from '@langchain/mistralai';

@Injectable()
export class ChatModelProvider {
  create(): BaseChatModel {
    return new ChatMistralAI({
      model: process.env.MISTRAL_MODEL ?? 'mistral-small-latest',
      temperature: 0,
    });
  }
}