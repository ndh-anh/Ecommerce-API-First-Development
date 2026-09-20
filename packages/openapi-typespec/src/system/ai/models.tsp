import "@typespec/http";
import "@typespec/openapi";

using TypeSpec.Http;

namespace System;

model ChatRequest {
  @doc("The message from the user")
  message: string;

  @doc("The optional session ID for continuity")
  sessionId?: string;

  @doc("The optional boolean to confirm HIL interruption")
  confirm?: boolean;
}

model ChatResponse {
  @doc("The response message from the AI")
  message: string;

  @doc("The data payload from the AI as a JSON object")
  data: unknown;

  @doc("The session ID used for this conversation")
  sessionId: string;

  @doc("The type of data returned (e.g. tool name) for casting")
  type?: string;
}

model Chat200Response {
  @statusCode _: 200;
  @body body: ChatResponse;
}

model ChatMessage {
  @doc("Message ID")
  id: string;

  @doc("Sender type")
  sender: string;

  @doc("Text content")
  text: string;

  @doc("Optional data payload")
  data?: unknown;
}

model ChatHistoryResponse {
  @doc("List of messages in the session")
  messages: ChatMessage[];
}

model ChatHistory200Response {
  @statusCode _: 200;
  @body body: ChatHistoryResponse;
}
