import {
  Injectable,
  OnModuleInit,
  Inject,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import type { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom, Observable } from 'rxjs';
import {
  ChatRequest,
  ChatResponse,
  GetChatHistoryRequest,
  GetChatHistoryResponse,
} from '@/buf/generated/ai_assistant/v1/ai_assistant';

interface AiChatServiceClient {
  chat(request: ChatRequest): Observable<ChatResponse>;
  getChatHistory(
    request: GetChatHistoryRequest,
  ): Observable<GetChatHistoryResponse>;
}

@Injectable()
export class AiService implements OnModuleInit {
  private readonly logger = new Logger(AiService.name);
  private chatServiceClient!: AiChatServiceClient;

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
    try {
      const response = await firstValueFrom(
        this.chatServiceClient.chat({
          message,
          sessionId: sessionId || '',
          userId: userId || '',
          confirm: confirm,
        }),
      );
      return response;
    } catch (error: any) {
      this.logger.error(
        `Failed to process chat: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        error.details || 'Lỗi khi gọi dịch vụ AI (gRPC)',
      );
    }
  }

  async getChatHistory(sessionId: string, userId: string) {
    try {
      const response = await firstValueFrom(
        this.chatServiceClient.getChatHistory({
          sessionId,
          userId,
        }),
      );
      return response;
    } catch (error: any) {
      this.logger.error(
        `Failed to get chat history: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        error.details || 'Lỗi khi lấy lịch sử chat (gRPC)',
      );
    }
  }
}
