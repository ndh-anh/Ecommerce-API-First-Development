

from app.tools.get_products import get_products
from app.tools.check_inventory_tool import check_inventory_tool

from app.config import settings
from app.utils.llm_utils import get_llm_with_fallbacks

tools = [get_products, check_inventory_tool]

product_agent = get_llm_with_fallbacks(
    api_key=settings.DASHSCOPE_API_KEY_AGENT_1,
    tools=tools
)