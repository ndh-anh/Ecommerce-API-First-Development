"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

import ChatIcon from "@mui/icons-material/Chat";
import CloseIcon from "@mui/icons-material/Close";
import SendIcon from "@mui/icons-material/Send";
import {
  Fab,
  Box,
  Typography,
  IconButton,
  Paper,
  InputBase,
  CircularProgress,
} from "@mui/material";

import { usePostAiChat } from "@e-commerce/api-client/endpoints/system";
import { useQuery } from "@tanstack/react-query";
import { getGetAiChatHistorySuspenseQueryOptions } from "@e-commerce/api-client/endpoints/system";

import type { Message } from "./types";
import ChatMessageItem from "./ChatMessageItem";

const ChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { token, isInitialized } = useAuth();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      sender: "ai",
      text: "Xin chào! Tôi có thể giúp gì cho bạn?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = usePostAiChat();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { data: historyData } = useQuery({
    ...getGetAiChatHistorySuspenseQueryOptions(),
    enabled: Boolean(token && isInitialized && isOpen),
  });

  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false);

  if (
    historyData?.messages &&
    historyData.messages.length > 0 &&
    !isHistoryLoaded
  ) {
    setIsHistoryLoaded(true);
    setMessages(historyData.messages as any[]);
  }

  const sendMessage = async (text: string, confirm?: boolean) => {
    if (!text.trim() || chatMutation.isPending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: text,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const payload: any = { message: userMessage.text };
      if (confirm !== undefined) {
        payload.confirm = confirm;
      }

      const response = await chatMutation.mutateAsync({
        data: payload,
      });

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: response.message,
        data: response.data,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error("Chat error", error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "Xin lỗi, đã có lỗi xảy ra. Vui lòng thử lại sau.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const textToSend = inputValue;
    setInputValue("");
    await sendMessage(textToSend);
  };

  if (!isInitialized) return null;

  return (
    <Box sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 9999 }}>
      {!isOpen && (
        <Fab
          aria-label="chat"
          onClick={() => setIsOpen(true)}
          sx={{
            backgroundColor: "#000",
            color: "#fff",
            boxShadow: "0 4px 14px 0 rgba(0,0,0,0.39)",
            "&:hover": {
              backgroundColor: "#333",
              boxShadow: "0 6px 20px rgba(0,0,0,0.23)",
            },
          }}
        >
          <ChatIcon />
        </Fab>
      )}

      {isOpen && (
        <Paper
          elevation={12}
          sx={{
            width: { xs: 350, sm: 400 },
            height: 500,
            maxHeight: "80vh",
            display: "flex",
            flexDirection: "column",
            borderRadius: 4,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "grey.100",
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: "common.black",
              color: "common.white",
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <ChatIcon />
              <Typography variant="boldL">AI Assistant</Typography>
            </Box>
            <IconButton
              size="small"
              onClick={() => setIsOpen(false)}
              sx={{
                color: "rgba(255,255,255,0.8)",
                "&:hover": { color: "common.white" },
              }}
            >
              <CloseIcon />
            </IconButton>
          </Box>

          {/* Body */}
          <Box sx={{ flex: 1, bgcolor: "grey.50", overflowY: "auto", p: 2 }}>
            {!token ? (
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "text.secondary",
                  px: 2,
                  textAlign: "center",
                }}
              >
                <ChatIcon sx={{ fontSize: 48, color: "grey.400", mb: 2 }} />
                <Typography variant="regularM">
                  Bạn phải đăng nhập để thực hiện chức năng này
                </Typography>
              </Box>
            ) : (
              <>
                {messages.map((msg) => (
                  <ChatMessageItem
                    key={msg.id}
                    msg={msg}
                    onSendMessage={sendMessage}
                  />
                ))}
                {chatMutation.isPending && (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "flex-start",
                      mb: 2,
                    }}
                  >
                    <CircularProgress
                      size={20}
                      sx={{ color: "grey.500", ml: 2 }}
                    />
                  </Box>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </Box>

          {/* Footer */}
          {token && (
            <Box
              sx={{
                p: 1.5,
                bgcolor: "common.white",
                borderTop: "1px solid",
                borderColor: "grey.100",
              }}
            >
              <Box
                component="form"
                onSubmit={handleSend}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  bgcolor: "grey.50",
                  borderRadius: 8,
                  pr: 0.5,
                  pl: 2,
                  py: 0.5,
                }}
              >
                <InputBase
                  sx={{ flex: 1, typography: "regularM" }}
                  placeholder="Nhập tin nhắn..."
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={chatMutation.isPending}
                />
                <IconButton
                  type="submit"
                  disabled={!inputValue.trim() || chatMutation.isPending}
                  sx={{
                    bgcolor: "common.black",
                    color: "common.white",
                    width: 32,
                    height: 32,
                    "&:hover": { bgcolor: "grey.800" },
                    "&.Mui-disabled": {
                      opacity: 0.5,
                      bgcolor: "common.black",
                      color: "common.white",
                    },
                  }}
                >
                  <SendIcon sx={{ fontSize: 16, ml: "2px" }} />
                </IconButton>
              </Box>
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
};

export default ChatWidget;
