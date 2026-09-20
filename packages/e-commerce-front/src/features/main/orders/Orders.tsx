"use client";

import React from "react";
import { useGetOrdersSuspense } from "@e-commerce/api-client/endpoints/order";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Stack from "@mui/material/Stack";
import Paper from "@mui/material/Paper";
import ReceiptIcon from "@mui/icons-material/Receipt";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import Link from "next/link";
import CircularProgress from "@mui/material/CircularProgress";
import { useUser } from "@/providers/UserProvider/UserProvider";
import Grid from "@mui/material/Grid";
import Chip from "@mui/material/Chip";

const Orders = () => {
  const { userId, isInitialized } = useUser();

  if (!isInitialized) {
    return (
      <Container maxWidth="lg" sx={{ py: 8 }}>
        <Stack alignItems="center" justifyContent="center" height="50vh">
          <CircularProgress />
          <Typography variant="regularM" color="text.secondary" mt={2}>
            Đang tải danh sách đơn hàng...
          </Typography>
        </Stack>
      </Container>
    );
  }

  if (!userId) {
    return (
      <Container maxWidth="md" sx={{ py: 8 }}>
        <Paper
          sx={{
            p: 6,
            textAlign: "center",
            borderRadius: 4,
            border: "1px solid",
            borderColor: "divider",
            boxShadow: "none",
          }}
        >
          <ReceiptIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
          <Typography variant="title" mb={1} sx={{ fontWeight: 700 }}>
            Bạn chưa đăng nhập
          </Typography>
          <Typography
            variant="regularM"
            color="text.secondary"
            mb={4}
            sx={{ display: "block" }}
          >
            Vui lòng đăng nhập tài khoản của bạn để xem danh sách đơn hàng.
          </Typography>
          <Link href="/auth/login">
            <Button variant="contained">Đăng nhập ngay</Button>
          </Link>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Typography variant="header" sx={{ fontWeight: 800, mb: 4 }}>
        Đơn hàng của tôi
      </Typography>

      <React.Suspense
        fallback={
          <Stack alignItems="center" justifyContent="center" height="30vh">
            <CircularProgress />
          </Stack>
        }
      >
        <OrdersLoader userId={userId} />
      </React.Suspense>
    </Container>
  );
};

const getStatusConfig = (status: string) => {
  switch (status.toUpperCase()) {
    case "PENDING":
      return { label: "Chờ xử lý", color: "warning" as const };
    case "COMPLETED":
      return { label: "Hoàn thành", color: "success" as const };
    case "CANCELLED":
      return { label: "Đã hủy", color: "error" as const };
    default:
      return { label: status, color: "default" as const };
  }
};

const OrdersLoader = ({ userId }: { userId: string }) => {
  const { data: ordersResponse } = useGetOrdersSuspense({ userId });
  const orders = ordersResponse?.orders || [];

  if (orders.length === 0) {
    return (
      <Paper
        sx={{
          p: 6,
          textAlign: "center",
          borderRadius: 4,
          border: "1px solid",
          borderColor: "divider",
          boxShadow: "none",
        }}
      >
        <ReceiptIcon sx={{ fontSize: 60, color: "text.secondary", mb: 2 }} />
        <Typography variant="title" mb={1} sx={{ fontWeight: 700 }}>
          Chưa có đơn hàng nào
        </Typography>
        <Typography
          variant="regularM"
          color="text.secondary"
          mb={4}
          sx={{ display: "block" }}
        >
          Bạn chưa thực hiện bất kỳ đơn hàng nào. Hãy mua sắm ngay nhé!
        </Typography>
        <Link href="/product">
          <Button variant="contained" startIcon={<ArrowBackIcon />}>
            Quay lại cửa hàng
          </Button>
        </Link>
      </Paper>
    );
  }

  return (
    <Stack spacing={3}>
      {orders.map((order) => {
        const statusConfig = getStatusConfig(order.status);
        return (
          <Paper
            key={order.orderId}
            sx={{
              p: 4,
              borderRadius: 3,
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "none",
            }}
          >
            <Grid container spacing={3} alignItems="center">
              <Grid item size={{ xs: 12, md: 6 }}>
                <Typography variant="boldM" fontWeight="bold">
                  Mã đơn: #{order.orderId.split("-")[0].toUpperCase()}
                </Typography>
                <Typography variant="regularM" color="text.secondary" mt={0.5}>
                  Ngày đặt:{" "}
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </Typography>
              </Grid>
              <Grid item xs={12} md={3} sx={{ textAlign: { md: "center" } }}>
                <Chip
                  label={statusConfig.label}
                  color={statusConfig.color}
                  size="small"
                />
              </Grid>
              <Grid item xs={12} md={3} sx={{ textAlign: { md: "right" } }}>
                <Typography
                  variant="boldL"
                  color="error.main"
                  fontWeight="bold"
                >
                  {new Intl.NumberFormat("vi-VN", {
                    style: "currency",
                    currency: "VND",
                  }).format(order.finalAmount)}
                </Typography>
              </Grid>
            </Grid>
          </Paper>
        );
      })}
    </Stack>
  );
};

export default Orders;
