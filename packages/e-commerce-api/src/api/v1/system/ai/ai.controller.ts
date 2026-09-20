import { ClsService } from '@/common/services/cls/cls.service';

import { AiService } from './ai.service';
import { BaseAiControllerInterface } from '@generated-controller/system/ai/base-ai.controller.interface';
import {
  PostAiChat200Response,
  PostAiChatBody,
  GetAiChatHistory200Response,
} from '@e-commerce/api-validation/types/system';
import { Injectable } from '@nestjs/common';

@Injectable()
export class AiController implements BaseAiControllerInterface {
  constructor(
    private readonly aiService: AiService,
    private readonly clsService: ClsService,
  ) {}

  async postAiChat(
    requestBody: PostAiChatBody,
  ): Promise<PostAiChat200Response> {
    const userId = this.clsService.userId;
    const grpcResponse = await this.aiService.chat(
      requestBody.message,
      requestBody.sessionId,
      userId,
      requestBody.confirm,
    );

    return {
      message: grpcResponse.message,
      data: grpcResponse.data ? JSON.parse(grpcResponse.data) : null,
      sessionId: grpcResponse.sessionId,
      type: grpcResponse.type,
    };
  }

  async getAiChatHistory(): Promise<GetAiChatHistory200Response> {
    const userId = this.clsService.userId;
    const sessionId = 'default_session'; // For now we use default session

    const grpcResponse = await this.aiService.getChatHistory(
      sessionId,
      userId ?? '',
    );

    return {
      messages: grpcResponse.messages
        ? grpcResponse.messages.map((m: any) => ({
            id: m.id,
            sender: m.sender,
            text: m.text,
            data: m.data ? JSON.parse(m.data) : null,
          }))
        : [],
    };
  }
}
