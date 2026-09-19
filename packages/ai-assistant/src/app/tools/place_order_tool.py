from langchain_core.tools import tool
from langchain_core.runnables import RunnableConfig
from app.clients.order_client import order_client_manager
from app.buf.generated.order.v1 import order_pb2

@tool
def place_order_tool(product_id: str, quantity: int, customer_name: str, payment_method: str, shipping_address: str, phone_number: str, config: RunnableConfig) -> str:
    """
    Thực hiện đặt hàng (place order) sau khi đã thu thập ĐẦY ĐỦ thông tin.
    Tất cả các tham số đều là bắt buộc và không được tự bịa ra.
    
    Args:
        product_id: ID hoặc mã của sản phẩm (hoặc variant_id nếu có).
        quantity: Số lượng sản phẩm cần đặt.
        customer_name: Tên của khách hàng (người nhận hàng).
        payment_method: Phương thức thanh toán (ví dụ: COD, CREDIT_CARD).
        shipping_address: Địa chỉ giao hàng đầy đủ.
        phone_number: Số điện thoại liên hệ.
    """
    client = order_client_manager.get_client()
    try:
        user_id = config.get("configurable", {}).get("user_id", "")
        if not user_id or user_id == "default_user":
            # Nếu vì lý do nào đó config không có user_id, fallback dùng default_user hoặc customer_name
            user_id = customer_name
            
        full_address = f"Người nhận: {customer_name} - {shipping_address} - SĐT: {phone_number}"
        request = order_pb2.PlaceOrderRequest(
            customer_id=user_id,
            items=[order_pb2.OrderItem(product_id=product_id, quantity=quantity)],
            payment_method=payment_method,
            shipping_address=full_address
        )
        response = client.PlaceOrder(request)
        return f"Đặt hàng thành công. Mã đơn hàng: {response.order_id}, Trạng thái: {response.status}, Lời nhắn: {response.message}"
    except Exception as e:
        return f"Đã xảy ra lỗi khi đặt hàng: {str(e)}"
