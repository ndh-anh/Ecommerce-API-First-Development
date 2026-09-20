import "@typespec/http";
import "@typespec/openapi";
import "../../common/models/errors.tsp";
import "./models.tsp";

using TypeSpec.Http;
using TypeSpec.OpenAPI;

@route("/ai")
namespace System.AI {
  @doc("Chat with the AI Assistant")
  @post
  @route("/chat")
  @tag("ai")
  @summary("Chat with AI")
  @operationId("postAiChat")
  op postAiChat(@body request: ChatRequest):
    | Chat200Response
    | UnauthorizedError
    | BadRequestError
    | InternalServerError;

  @doc("Get chat history for the current user session")
  @get
  @route("/chat/history")
  @tag("ai")
  @summary("Get Chat History")
  @operationId("getAiChatHistory")
  op getAiChatHistory():
    | ChatHistory200Response
    | UnauthorizedError
    | InternalServerError;
}
