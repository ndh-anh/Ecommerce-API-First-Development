from typing import Literal
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage
from app.utils.llm_utils import get_llm_with_fallbacks
from app.config import settings
from app.graph.states.state import AgentState

class RouteDecision(BaseModel):
    next_node: Literal["product", "order", "support"] = Field(
        description="Chọn agent: 'product' (hỏi giá/sản phẩm), 'order' (đặt/hủy đơn), 'support' (chính sách/khiếu nại/sự cố)."
    )

router_llm = get_llm_with_fallbacks(
    api_key=settings.DASHSCOPE_API_KEY_AGENT_1,
    temperature=0.0,
    structured_output=RouteDecision
)

def router_node(state: AgentState) -> dict:
    sys_prompt = SystemMessage(
        content="Bạn là bộ định tuyến. Dựa vào nội dung trao đổi, hãy phân loại yêu cầu của khách hàng vào đúng 1 trong 3 agent: 'product', 'order', hoặc 'support'."
    )
    decision = router_llm.invoke([sys_prompt] + list(state["messages"])[-10:])
    return {"next_node": decision.next_node}