from app.config import settings
from app.utils.llm_utils import get_llm_with_fallbacks

from app.tools.get_policy import get_policy

tools = [get_policy]

support_agent = get_llm_with_fallbacks(
    api_key=settings.DASHSCOPE_API_KEY_AGENT_2,
    tools=tools
)