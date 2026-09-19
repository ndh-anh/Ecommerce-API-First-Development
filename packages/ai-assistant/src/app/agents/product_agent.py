

from app.tools.get_products import get_products
from app.tools.check_inventory_tool import check_inventory_tool

from app.config import settings
from langchain_openai import ChatOpenAI


llm = ChatOpenAI(
    model=settings.DEFAULT_MODEL,
    temperature=settings.TEMPERATURE,
    api_key=settings.DASHSCOPE_API_KEY_AGENT_1,
    base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
)

tools = [get_products, check_inventory_tool]

product_agent = llm.bind_tools(tools)