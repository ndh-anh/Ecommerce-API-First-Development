
from app.graph.states.state import AgentState
from app.agents.support_agent import support_agent
from langchain_core.messages import SystemMessage

SUPPORT_SYSTEM_PROMPT = """Bạn là chuyên viên chăm sóc khách hàng và giải đáp chính sách.
Nhiệm vụ: Tra cứu và giải đáp các quy định về bảo hành, đổi trả hàng, hỗ trợ sự cố kỹ thuật."""

def support_node(state: AgentState) -> dict:
    sys_message = SystemMessage(content=SUPPORT_SYSTEM_PROMPT)
           
    # Ghép system message vào đầu danh sách messages gửi cho LLM
    response = support_agent.invoke([sys_message] + list(state["messages"])[-10:])
       
    return {
        "messages": [response]
    }