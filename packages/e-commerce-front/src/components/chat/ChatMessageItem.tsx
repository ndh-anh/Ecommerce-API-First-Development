import React from "react";
import { Box, Typography, Button, Paper } from "@mui/material";
import type { Message } from "./types";
import ChatProductCard from "./ChatProductCard";

interface ChatMessageItemProps {
  msg: Message;
  onSendMessage: (text: string, confirm?: boolean) => void;
}

const JSON_INDENT = 2;

const ChatMessageItem: React.FC<ChatMessageItemProps> = ({
  msg,
  onSendMessage,
}) => {
  const isUser = msg.sender === "user";

  const renderData = () => {
    if (!msg.data) return null;

    let productList: any[] = [];
    if (Array.isArray(msg.data)) {
      productList = msg.data;
    } else if (msg.data.data && Array.isArray(msg.data.data)) {
      productList = msg.data.data;
    } else {
      productList = [msg.data];
    }

    const hasProducts = productList.some((item) => item && item.productName);

    if (hasProducts) {
      return (
        <Box
          sx={{
            mt: 1.5,
            display: "flex",
            flexDirection: "column",
            gap: 1,
            minWidth: 200,
          }}
        >
          {productList
            .filter((p) => p && p.productName)
            .map((product: any, idx: number) => (
              <ChatProductCard
                key={idx}
                product={product}
                onOrder={(name) =>
                  onSendMessage(`Tôi muốn đặt mua sản phẩm: ${name}`)
                }
              />
            ))}
        </Box>
      );
    }

    return (
      <Box
        sx={{
          mt: 1,
          p: 1,
          bgcolor: "grey.50",
          borderRadius: 1,
          border: "1px solid",
          borderColor: "grey.200",
          overflowX: "auto",
        }}
      >
        <Typography
          variant="regularXs"
          component="pre"
          sx={{
            fontFamily: "monospace",
            color: "text.secondary",
            whiteSpace: "pre-wrap",
          }}
        >
          {JSON.stringify(msg.data, null, JSON_INDENT)}
        </Typography>
      </Box>
    );
  };

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        mb: 2,
      }}
    >
      <Paper
        elevation={isUser ? 0 : 1}
        sx={{
          maxWidth: "80%",
          px: 2,
          py: 1,
          borderRadius: 2,
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          borderTopRightRadius: isUser ? 2 : 16,
          // eslint-disable-next-line @typescript-eslint/no-magic-numbers
          borderTopLeftRadius: isUser ? 16 : 2,
          bgcolor: isUser ? "common.black" : "common.white",
          color: isUser ? "common.white" : "text.primary",
          border: isUser ? "none" : "1px solid",
          borderColor: "grey.100",
        }}
      >
        <Typography variant="regularM">{msg.text}</Typography>

        {!isUser && msg.text.toLowerCase().includes("vui lòng xác nhận") && (
          <Box sx={{ display: "flex", gap: 1, mt: 1.5 }}>
            <Button
              variant="contained"
              size="small"
              onClick={() => onSendMessage("Xác nhận", true)}
              sx={{
                flex: 1,
                bgcolor: "common.black",
                "&:hover": { bgcolor: "grey.800" },
                textTransform: "none",
              }}
            >
              Xác nhận
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => onSendMessage("Từ chối", false)}
              sx={{
                flex: 1,
                bgcolor: "grey.200",
                color: "text.primary",
                "&:hover": { bgcolor: "grey.300" },
                textTransform: "none",
                boxShadow: "none",
              }}
            >
              Từ chối
            </Button>
          </Box>
        )}

        {!isUser && renderData()}
      </Paper>
    </Box>
  );
};

export default ChatMessageItem;
