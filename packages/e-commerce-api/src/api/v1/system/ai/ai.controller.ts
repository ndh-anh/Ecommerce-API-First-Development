import { ClsService } from '@/common/services/cls/cls.service';

import { AiService } from './ai.service';
import { BaseAiControllerInterface } from '@generated-controller/system/ai/base-ai.controller.interface';
import {
  PostAiChat200Response,
  PostAiChatBody,
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
}
