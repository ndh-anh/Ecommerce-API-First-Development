
from app.graph.states.state import AgentState
from app.agents.order_agent import order_agent
from langchain_core.messages import SystemMessage

ORDER_SYSTEM_PROMPT = """Bạn là chuyên viên xử lý đơn hàng.
Nhiệm vụ: Sử dụng công cụ để tạo đơn, hủy đơn hoặc cập nhật thông tin đơn hàng cho khách.
Chỉ tập trung vào thao tác đơn hàng và xác nhận trạng thái."""

def order_node(state: AgentState) -> dict:
    sys_message = SystemMessage(content=ORDER_SYSTEM_PROMPT)
        
    # Ghép system message vào đầu danh sách messages gửi cho LLM
    response = order_agent.invoke([sys_message] + list(state["messages"])[-10:])
    
    return {
        "messages": [response]
    }