# app/graph/nodes/supervisor_node.py
from typing import Literal
from pydantic import BaseModel, Field
from langchain_core.messages import SystemMessage
from langchain_openai import ChatOpenAI
from app.config import settings
from app.graph.states.state import AgentState

from app.utils.llm_utils import get_llm_with_fallbacks

class SupervisorDecision(BaseModel):
    next_node: Literal["product", "order", "support", "FINISH"] = Field(
        description="Chọn agent tiếp theo cần thực thi, hoặc 'FINISH' nếu đã hoàn thành toàn bộ yêu cầu của khách."
    )

supervisor_llm = get_llm_with_fallbacks(
    api_key=settings.DASHSCOPE_API_KEY_AGENT_1,
    temperature=0.0,
    structured_output=SupervisorDecision
)

def supervisor_node(state: AgentState) -> dict:
    sys_prompt = SystemMessage(
        content=(
            "Bạn là Supervisor điều phối trung tâm. Khách hàng có thể hỏi gộp nhiều việc trong 1 câu.\n"
            "Dựa vào toàn bộ lịch sử trao đổi, hãy kiểm tra xem còn tác vụ nào chưa được hoàn thành:\n"
            "- 'product': Nếu khách hỏi thông tin/giá sản phẩm và CHƯA có dữ liệu tra cứu.\n"
            "- 'order': Nếu khách muốn đặt/hủy/sửa đơn hàng và CHƯA được thực thi.\n"
            "- 'support': Nếu khách hỏi chính sách/bảo hành/sự cố và CHƯA được giải đáp.\n"
            "- 'FINISH': Khi TẤT CẢ các ý của khách đã được xử lý xong, HOẶC NẾU tin nhắn cuối cùng là của hệ thống (AI) đang đặt câu hỏi/yêu cầu khách hàng cung cấp thêm thông tin. (BẮT BUỘC CHỌN FINISH ĐỂ CHỜ KHÁCH TRẢ LỜI, TRÁNH VÒNG LẶP VÔ HẠN)."
        )
    )
    decision = supervisor_llm.invoke([sys_prompt] + list(state["messages"])[-10:])
    return {"next_node": decision.next_node}