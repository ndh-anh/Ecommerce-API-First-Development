import { Injectable, OnModuleInit, Inject } from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ChatRequest,
  ChatResponse,
} from '@/buf/generated/ai_assistant/v1/ai_assistant';

interface AiChatServiceClient {
  chat(request: ChatRequest): Observable<ChatResponse>;
}

@Injectable()
export class AiService implements OnModuleInit {
  private chatServiceClient: AiChatServiceClient;

  constructor(
    @Inject('AI_ASSISTANT_SERVICE') private readonly client: ClientGrpc,
  ) {}

  onModuleInit() {
    this.chatServiceClient =
      this.client.getService<AiChatServiceClient>('ChatService');
  }

  async chat(
    message: string,
    sessionId?: string,
    userId?: string,
    confirm?: boolean,
  ) {
    const response = await firstValueFrom(
      this.chatServiceClient.chat({
        message,
        sessionId: sessionId || '',
        userId: userId || '',
        confirm: confirm,
      }),
    );
    return response;
  }
}
