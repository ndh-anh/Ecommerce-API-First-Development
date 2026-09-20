import Orders from "@/features/main/orders/Orders";
import SuspenseWrapper from "@/components/feedback/SuspenseWrapper/SuspenseWrapper";

const OrderPage = () => {
  return (
    <SuspenseWrapper>
      <Orders />
    </SuspenseWrapper>
  );
};

export default OrderPage;
