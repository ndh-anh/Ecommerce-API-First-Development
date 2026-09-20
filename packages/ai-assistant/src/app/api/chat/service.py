from langchain_core.messages import HumanMessage


class ChatService:
    def __init__(self, agent):
        self.agent = agent

    def process_query(self, message: str, session_id: str = "default_session", user_id: str = "default_user", confirm: bool = None) -> dict:
        config = {"configurable": {"thread_id": session_id, "user_id": user_id}}
        
        state = self.agent.get_state(config)
        is_suspended = state.next and "sensitive_order_tools" in state.next
        
        if is_suspended:
            if confirm is True:
                # Resume graph execution
                result = self.agent.invoke(None, config=config)
            elif confirm is False:
                # Cancel the tool call by faking a tool message response
                from langchain_core.messages import ToolMessage
                last_message = state.values["messages"][-1]
                tool_calls = last_message.tool_calls if hasattr(last_message, "tool_calls") else []
                cancel_messages = []
                for tc in tool_calls:
                    cancel_messages.append(ToolMessage(
                        tool_call_id=tc["id"], 
                        name=tc["name"], 
                        content="User rejected the confirmation."
                    ))
                result = self.agent.invoke({"messages": cancel_messages}, config=config)
            else:
                # confirm is None but we are suspended, shouldn't happen normally unless frontend bugs out
                # Just return CONFIRMATION_REQUIRED again
                return {
                    "message": "Vui lòng xác nhận thực hiện hành động này.",
                    "data": None,
                    "type": "CONFIRMATION_REQUIRED"
                }
        else:
            result = self.agent.invoke(
                {"messages": [HumanMessage(content=message)]},
                config=config,
            )
            
        new_state = self.agent.get_state(config)
        if new_state.next and "sensitive_order_tools" in new_state.next:
            snapshot_data = None
            data_type = None
            messages_list = new_state.values.get("messages", [])
            if messages_list:
                last_message = messages_list[-1]
                if hasattr(last_message, "tool_calls") and len(last_message.tool_calls) > 0:
                    snapshot_data = last_message.tool_calls[0].get("args", {})
                    data_type = last_message.tool_calls[0].get("name", "")
                    
            return {
                "message": "Hệ thống chuẩn bị gọi lệnh. Bạn vui lòng kiểm tra lại thông tin dưới đây và xác nhận nhé?",
                "data": snapshot_data,
                "type": f"CONFIRM_{data_type}" if data_type else "CONFIRMATION_REQUIRED"
            }
        
        messages = result.get("messages", [])
        
        if messages and messages[-1].type == "human":
            from app.utils.llm_utils import get_llm_with_fallbacks
            from langchain_core.messages import SystemMessage
            from app.config import settings
            
            fallback_llm = get_llm_with_fallbacks(
                api_key=settings.DASHSCOPE_API_KEY_AGENT_1,
                temperature=0.7
            )
            fallback_response = fallback_llm.invoke([
                SystemMessage(content="Bạn là trợ lý ảo hỗ trợ khách hàng. Hãy trả lời câu hỏi của khách hàng một cách thân thiện và tự nhiên. Nếu khách hỏi về sản phẩm, hãy hỏi lại chi tiết để tra cứu."),
                messages[-1]
            ])
            self.agent.update_state(config, {"messages": [fallback_response]})
            final_message = fallback_response.content
            # Re-fetch messages since we updated state
            messages = self.agent.get_state(config).values.get("messages", [])
        else:
            final_message = messages[-1].content
        data = None
        data_type = None
        
        # Find the last HumanMessage index to only look at tools called in this turn
        last_human_idx = -1
        for i in range(len(messages) - 1, -1, -1):
            if messages[i].type == "human":
                last_human_idx = i
                break
                
        # Extract data from the last ToolMessage in this turn
        if last_human_idx != -1:
            for i in range(len(messages) - 1, last_human_idx, -1):
                if messages[i].type == "tool":
                    data_type = messages[i].name
                    import json
                    try:
                        data = json.loads(messages[i].content)
                        if data_type == "get_products" and isinstance(data, dict) and "data" in data and isinstance(data["data"], list) and len(data["data"]) > 0:
                            from app.utils.llm_utils import get_llm_with_fallbacks
                            from app.config import settings
                            import re
                            
                            filter_llm = get_llm_with_fallbacks(
                                api_key=settings.DASHSCOPE_API_KEY_AGENT_1,
                                temperature=0
                            )
                            user_msg = messages[last_human_idx].content
                            ai_msg = messages[-1].content if messages[-1].type == "ai" else ""
                            prompt = f"""Khách hàng yêu cầu: "{user_msg}"
AI phản hồi: "{ai_msg}"

Dưới đây là danh sách các sản phẩm thô từ CSDL:
{json.dumps([{ 'id': p['productId'], 'name': p['productName'] } for p in data["data"]], ensure_ascii=False)}

Dựa vào yêu cầu của khách và câu trả lời của AI, hãy chọn ra các 'id' sản phẩm THỰC SỰ LÀ CÂU TRẢ LỜI ĐÚNG và BỎ QUA các sản phẩm không liên quan (ví dụ tìm "sách về nhà" thì bỏ qua "sách nhân gian đáng giá").
Trả về ĐÚNG 1 mảng JSON chứa các ID hợp lệ, ví dụ: ["id1", "id2"]. KHÔNG xuất thêm bất kỳ văn bản nào khác. Nếu không có cái nào phù hợp, trả về []."""
                            try:
                                filter_resp = filter_llm.invoke(prompt).content.strip()
                                match = re.search(r'\[.*\]', filter_resp, re.DOTALL)
                                if match:
                                    valid_ids = json.loads(match.group(0))
                                    if isinstance(valid_ids, list):
                                        filtered = [p for p in data["data"] if p["productId"] in valid_ids]
                                        if len(filtered) > 0:
                                            data["data"] = filtered
                                        else:
                                            data = None
                            except Exception:
                                pass
                    except Exception:
                        data = messages[i].content
                    break

        return {
            "message": final_message,
            "data": data,
            "type": data_type or ""
        }

    def get_chat_history(self, session_id: str, user_id: str) -> list:
        config = {"configurable": {"thread_id": session_id, "user_id": user_id}}
        try:
            state_snapshot = self.agent.get_state(config)
            messages = state_snapshot.values.get("messages", [])
        except Exception:
            messages = []
            
        history = []
        import json
        
        for i, msg in enumerate(messages):
            if msg.type == "human":
                history.append({
                    "id": msg.id or f"msg_{i}",
                    "sender": "user",
                    "text": msg.content,
                    "data": ""
                })
            elif msg.type == "ai":
                if msg.content:
                    # Look back for the last tool message before this AI message to attach its data
                    data_payload = ""
                    for j in range(i - 1, -1, -1):
                        prev_msg = messages[j]
                        if prev_msg.type == "human":
                            break
                        if prev_msg.type == "tool":
                            try:
                                parsed = json.loads(prev_msg.content)
                                # Only attach tool data if it looks like a dictionary with 'data'
                                if isinstance(parsed, dict) and "data" in parsed:
                                    data_payload = json.dumps(parsed)
                                else:
                                    data_payload = prev_msg.content
                            except Exception:
                                data_payload = prev_msg.content
                            break
                            
                    history.append({
                        "id": msg.id or f"msg_{i}",
                        "sender": "ai",
                        "text": msg.content,
                        "data": data_payload
                    })
        return history