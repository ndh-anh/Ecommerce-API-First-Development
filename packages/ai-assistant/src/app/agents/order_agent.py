from app.tools.place_order_tool import place_order_tool
from app.tools.check_order_tool import check_order_tool
from app.tools.cancel_order_tool import cancel_order_tool
from app.tools.check_inventory_tool import check_inventory_tool
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI
from app.config import settings

prompt = ChatPromptTemplate.from_messages(
    [
        (
            "system",
            "Bạn là trợ lý ảo hỗ trợ xử lý đơn hàng. "
            "Sử dụng các tool được cung cấp để thực hiện quy trình sau (TUYỆT ĐỐI TUÂN THỦ TỪNG BƯỚC):\n"
            "1. Khi người dùng muốn đặt một sản phẩm, HÃY DÙNG `check_inventory_tool` để kiểm tra tồn kho và các biến thể (variants).\n"
            "2. NẾU sản phẩm có biến thể hoặc người dùng chưa chọn số lượng, BẮT BUỘC HỎI người dùng để chọn phân loại và số lượng.\n"
            "3. Khi đã chốt số lượng và biến thể, BẮT BUỘC HỎI người dùng tên người nhận (để làm customer_name), địa chỉ giao hàng và số điện thoại liên hệ (nếu họ chưa cung cấp).\n"
            "4. KHÔNG ĐƯỢC tự bịa ra thông tin. Chỉ gọi `place_order_tool` khi đã CÓ ĐẦY ĐỦ các thông tin trên.\n"
            "5. Bạn cũng có thể dùng `check_order_tool` hoặc `cancel_order_tool` nếu người dùng yêu cầu tương ứng."
        ),
        ("placeholder", "{messages}"),
    ]
)

llm = ChatOpenAI(
    model=settings.DEFAULT_MODEL,
    temperature=settings.TEMPERATURE,
    api_key=settings.DASHSCOPE_API_KEY_AGENT_1,
    base_url="https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
)

tools = [check_inventory_tool, place_order_tool, check_order_tool, cancel_order_tool]

order_agent = llm.bind_tools(tools)