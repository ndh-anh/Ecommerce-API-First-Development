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
                    except Exception:
                        data = messages[i].content
                    break

        return {
            "message": final_message,
            "data": data,
            "type": data_type or ""
        }