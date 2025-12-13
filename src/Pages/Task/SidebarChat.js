import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HubConnectionBuilder, LogLevel } from "@microsoft/signalr";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { API_WEB_URLS } from "../../constants/constAPI";
import { Fn_AddEditData, Fn_FillListData } from "../../store/Functions";


const formatDate = (dateString) => {
  if (!dateString) return "none";
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffTime / (1000 * 60));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const useChat = (taskId, userId) => {
  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    formData: {},
    OtherDataScore: [],
    isProgress: true,
  });

  const [connection, setConnection] = useState(null);
  const [messages, setMessages] = useState([]);
  const dispatch = useDispatch();
  const API_URL = `${API_WEB_URLS.MASTER}/0/token/MessageFiles`;

  useEffect(() => {
    const connect = new HubConnectionBuilder()
      .withUrl(`${API_WEB_URLS.BASE_CHAT}chatHub`, {
        skipNegotiation: true,
        transport: 1,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Information)
      .build();

    setConnection(connect);
  }, []);

  useEffect(() => {
    if (!connection) return;

    let isMounted = true;

    connection.on("ReceiveMessage", (messageObj) => {
      if (isMounted) {
        setMessages((prev) => [...prev, messageObj]);
      }
    });

    connection.on("LoadOldMessages", async (oldMessages) => {
      if (isMounted && Array.isArray(oldMessages)) {
        const processedMessages = [];

        for (let index = 0; index < oldMessages.length; index += 1) {
          const message = oldMessages[index];

          if (message.IsFiles === true) {
            try {
              const res = await Fn_FillListData(
                dispatch,
                setState,
                "FillArray",
                `${API_URL}/Id/${message.Id}`
              );

              if (res && Array.isArray(res)) {
                const messageFiles = res.map((file) => ({
                  F_MessageMaster: file.F_MessageMaster,
                  FileName: file.FileName,
                  DateOfCreation: file.DateOfCreation,
                  FileUrl: `${API_WEB_URLS.IMAGEURL}${file.FileName}`,
                }));

                processedMessages.push({
                  ...message,
                  fileDetails: res,
                  messageFiles,
                });
              } else {
                processedMessages.push({
                  ...message,
                  fileDetails: res,
                  messageFiles: [],
                });
              }
            } catch (error) {
              console.error("Error fetching file details for message:", message.Id, error);
              processedMessages.push(message);
            }
          } else {
            processedMessages.push(message);
          }
        }

        setMessages(processedMessages);
      }
    });

    connection.on("ReloadChat", () => {
      if (isMounted) {
        connection.invoke("JoinTaskGroup", taskId, false).catch((err) => {
          console.error("Error rejoining task group:", err);
        });
      }
    });

    const connectToSignalR = async () => {
      try {
        await connection.start();
        await connection.invoke("JoinTaskGroup", taskId, false);
      } catch (err) {
        console.error("Connection failed:", err);
      }
    };

    connectToSignalR();

    return () => {
      isMounted = false;
      connection.off("ReceiveMessage");
      connection.off("LoadOldMessages");
      connection.off("ReloadChat");
      connection
        .invoke("LeaveTaskGroup", taskId)
        .catch(() => {})
        .finally(() => {
          connection.stop().catch(() => {});
        });
    };
  }, [connection, dispatch, taskId]);

  const sendMessage = async (messageText) => {
    if (connection && messageText.trim() !== "") {
      try {
        const userData = JSON.parse(localStorage.getItem("authUser")) || {};

        await connection.invoke(
          "SendMessageToTaskGroup",
          Number(taskId),
          Number(userId),
          messageText,
          userData.username || "User"
        );
      } catch (err) {
        console.error("Send failed:", err);
      }
    }
  };

  return { messages, sendMessage, connection };
};

const MessageBubble = React.memo(({ chat, currentUserId }) => {
  let messageData;
  let messageUserId;
  let timeStamp;
  let senderName;

  if (chat.f_UserMaster !== undefined) {
    messageData = chat.message;
    messageUserId = Number(chat.f_UserMaster);
    timeStamp = chat.MessageDate || chat.timeStamp || chat.timestamp || chat.createdAt || new Date();
    senderName = chat.Name || chat.username || `User ${messageUserId}`;
  } else if (chat.F_UserMaster !== undefined) {
    messageData = chat.Message || chat.message;
    messageUserId = Number(chat.F_UserMaster);
    timeStamp = chat.MessageDate || chat.timeStamp || chat.timestamp || chat.createdAt;
    senderName = chat.Name || chat.Username || `User ${messageUserId}`;
  } else if (chat.messenger) {
    messageData = chat.message;
    messageUserId = Number(chat.messenger.Id);
    timeStamp = chat.timeStamp || chat.timestamp || chat.createdAt || new Date();
    senderName = chat.messenger.username || chat.Name || `User ${messageUserId}`;
  } else {
    messageData = chat.message || chat.text || chat.content;
    messageUserId = Number(chat.Id || chat.userId || chat.senderId);
    timeStamp = chat.timeStamp || chat.timestamp || chat.createdAt || new Date();
    senderName = chat.Name || chat.username || `User ${messageUserId}`;
  }

  const isCurrentUser = messageUserId === currentUserId;

  return (
    <div className={`sidebar-chat__message ${isCurrentUser ? "sidebar-chat__message--self" : ""}`}>
      {!isCurrentUser && <small className="sidebar-chat__author">{senderName}</small>}

      <div className="sidebar-chat__bubble">
        <p className="mb-1">{messageData}</p>

        {chat.messageFiles && chat.messageFiles.length > 0 && (
          <div className="sidebar-chat__files">
            {chat.messageFiles.map((file, idx) => {
              const handleDownload = async (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (!file.FileUrl || !file.FileName) {
                  console.warn('File URL or FileName missing:', file);
                  return;
                }

                console.log('Downloading file:', file.FileName, 'from:', file.FileUrl);

                try {
                  // Method 1: Try fetch with blob
                  const response = await fetch(file.FileUrl, {
                    method: 'GET',
                    mode: 'cors',
                    credentials: 'include',
                    cache: 'no-cache'
                  });

                  if (response.ok) {
                    const blob = await response.blob();
                    console.log('File blob created, size:', blob.size);
                    
                    const blobUrl = URL.createObjectURL(blob);
                    const downloadLink = document.createElement('a');
                    downloadLink.href = blobUrl;
                    downloadLink.download = file.FileName;
                    downloadLink.style.display = 'none';
                    downloadLink.setAttribute('download', file.FileName);
                    
                    document.body.appendChild(downloadLink);
                    downloadLink.click();
                    
                    // Cleanup
                    setTimeout(() => {
                      document.body.removeChild(downloadLink);
                      URL.revokeObjectURL(blobUrl);
                    }, 200);
                    
                    console.log('Download initiated via blob');
                    return;
                  } else {
                    console.warn('Fetch response not OK:', response.status, response.statusText);
                    throw new Error(`HTTP ${response.status}`);
                  }
                } catch (error) {
                  console.warn('Fetch download failed, trying direct download:', error);
                  
                  // Method 2: Direct download with download attribute
                  try {
                    const link = document.createElement('a');
                    link.href = file.FileUrl;
                    link.download = file.FileName;
                    link.setAttribute('download', file.FileName);
                    link.setAttribute('target', '_blank');
                    link.style.display = 'none';
                    document.body.appendChild(link);
                    link.click();
                    setTimeout(() => {
                      document.body.removeChild(link);
                    }, 200);
                    console.log('Download attempted via direct link');
                  } catch (directError) {
                    console.error('Direct download failed:', directError);
                    // Method 3: Last resort - open in new tab
                    window.open(file.FileUrl, '_blank');
                  }
                }
              };

              return (
                <div className="sidebar-chat__file" key={`${file.FileName}-${idx}`}>
                  <div className="sidebar-chat__file-icon">
                    <i className="bx bx-file" />
                  </div>
                  <div style={{ flex: 1, cursor: "pointer" }} onClick={handleDownload}>
                    <p className="sidebar-chat__file-name" style={{ marginBottom: "2px", fontWeight: 600 }}>
                      {file.FileName}
                    </p>
                    <small style={{ fontSize: "11px", color: "#6b7280" }}>{formatDate(file.DateOfCreation)}</small>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(e);
                    }}
                    className="sidebar-chat__file-download"
                    style={{ 
                      cursor: "pointer", 
                      background: "transparent", 
                      border: "none", 
                      padding: "6px 10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginLeft: "8px",
                      borderRadius: "6px",
                      transition: "background 0.2s"
                    }}
                    onMouseEnter={(e) => e.target.style.background = "rgba(0,0,0,0.05)"}
                    onMouseLeave={(e) => e.target.style.background = "transparent"}
                    title="Download file"
                  >
                    <i className="bx bx-download" style={{ fontSize: "18px" }} />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <small className="sidebar-chat__time">{formatDate(timeStamp)}</small>
      </div>
    </div>
  );
});

const SidebarChat = ({ openSidebar, setOpenSidebar, taskName, taskId }) => {
  const [state, setState] = useState({
    id: 0,
    FillArray: [],
    FillArray1: [],
    formData: {},
    OtherDataScore: [],
    isProgress: true,
  });
  const [message, setMessage] = useState("");
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [composerExpanded, setComposerExpanded] = useState(false);
  const messagesEndRef = useRef(null);
  const messageInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const authUser = JSON.parse(localStorage.getItem("authUser")) || {};
  const Id = authUser.Id || 0;
  const username = authUser.username || "User";

  const { messages, sendMessage: sendChatMessage, connection } = useChat(taskId, Id);

  const normalizedMessages = useMemo(() => messages ?? [], [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [normalizedMessages]);

  useEffect(() => {
    if (openSidebar && messageInputRef.current) {
      messageInputRef.current.focus();
    }
  }, [openSidebar]);

  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === "Escape") {
        setOpenSidebar(null);
      }
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [setOpenSidebar]);

  const sendMessageHandler = useCallback(async () => {
    const messageText = message.trim();
    if (!messageText && selectedFiles.length === 0) return;

    if (selectedFiles.length > 0) {
      await uploadFiles(!!messageText);
      return;
    }

    setMessage("");
    await sendChatMessage(messageText);
  }, [message, selectedFiles.length, sendChatMessage]);

  const handleKeyPress = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessageHandler();
    }
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;
    setSelectedFiles((prev) => [...prev, ...files]);
    setComposerExpanded(true);
  };

  const removeFile = (index) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const uploadFiles = async (withMessage = false) => {
    if (selectedFiles.length === 0) return;

    setIsUploading(true);

    try {
      const messageFormData = new FormData();
      messageFormData.append("F_UserMaster", Id);
      messageFormData.append("F_TaskMaster", taskId);

      if (withMessage && message.trim()) {
        messageFormData.append("message", message.trim());
      }

      const messageResponse = await Fn_AddEditData(
        dispatch,
        setState,
        { arguList: { id: state.id, formData: messageFormData } },
        "AddChatMessage/0/Token",
        true,
        "memberid",
        navigate,
        "#"
      );

      const createdMessageId = messageResponse?.data?.data?.id;

      if (createdMessageId > 0) {
        for (let index = 0; index < selectedFiles.length; index += 1) {
          const file = selectedFiles[index];
          const fileFormData = new FormData();
          fileFormData.append("Files", file);
          fileFormData.append("Id", createdMessageId);

          await Fn_AddEditData(
            dispatch,
            setState,
            { arguList: { id: state.id, formData: fileFormData } },
            "MessageFiles/0/Token",
            true,
            "memberid",
            navigate,
            "#"
          );
        }

        if (connection) {
          await connection.invoke("JoinTaskGroup", taskId, true);
        }
      }
    } catch (error) {
      console.error("Error in upload process:", error);
    }

    setSelectedFiles([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    if (withMessage) {
      setMessage("");
    }

    setIsUploading(false);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${parseFloat((bytes / Math.pow(1024, index)).toFixed(2))} ${sizes[index]}`;
  };

  const taskInitial = useMemo(() => (taskName ? taskName.charAt(0).toUpperCase() : "T"), [taskName]);

  if (!openSidebar) {
    return null;
  }

  return (
    <aside className={`sidebar-chat ${openSidebar ? "sidebar-chat--open" : ""}`}>
      <style>
        {`
          .sidebar-chat {
            position: fixed;
            inset: 0 0 0 auto;
            width: 420px;
            background: #f7f8fc;
            border-left: 1px solid rgba(15,23,42,0.08);
            box-shadow: -20px 0 60px rgba(15, 23, 42, 0.18);
            display: flex;
            flex-direction: column;
            z-index: 1050;
            transform: translateX(100%);
            transition: transform 0.35s cubic-bezier(0.76, 0, 0.24, 1);
          }
          .sidebar-chat--open {
            transform: translateX(0);
          }
          .sidebar-chat__header {
            padding: 18px 24px;
            background: #ffffff;
            border-bottom: 1px solid rgba(15, 23, 42, 0.08);
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 12px;
          }
          .sidebar-chat__task {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .sidebar-chat__avatar {
            width: 44px;
            height: 44px;
            border-radius: 18px;
            background: linear-gradient(145deg, #4f46e5, #7c3aed);
            color: #fff;
            font-weight: 700;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            box-shadow: 0 12px 24px rgba(79, 70, 229, 0.3);
          }
          .sidebar-chat__task h6 {
            margin: 0;
            font-weight: 600;
            color: #111827;
          }
          .sidebar-chat__task small {
            color: #6b7280;
          }
          .sidebar-chat__body {
            flex: 1;
            padding: 24px 24px 12px;
            overflow-y: auto;
            background: radial-gradient(circle at top right, rgba(79, 70, 229, 0.18), transparent 50%),
                        linear-gradient(180deg, #f7f8fc 0%, #fff 40%);
          }
          .sidebar-chat__body::-webkit-scrollbar {
            width: 6px;
          }
          .sidebar-chat__body::-webkit-scrollbar-thumb {
            background: rgba(79, 70, 229, 0.3);
            border-radius: 999px;
          }
          .sidebar-chat__message {
            display: flex;
            flex-direction: column;
            margin-bottom: 18px;
            max-width: 90%;
            padding: 2px;
          }
          .sidebar-chat__message--self {
            align-self: flex-end;
            text-align: right;
          }
          .sidebar-chat__message--self .sidebar-chat__bubble {
            background: #4f46e5;
            color: #fff;
            border-radius: 16px 6px 16px 16px;
            box-shadow: 0 20px 40px rgba(79,70,229,0.35);
          }
          .sidebar-chat__message:not(.sidebar-chat__message--self) .sidebar-chat__bubble {
            background: #ffffff;
            color: #1f2937;
            border-radius: 6px 16px 16px 16px;
            border: 1px solid rgba(15, 23, 42, 0.08);
            box-shadow: 0 15px 35px rgba(15,23,42,0.08);
          }
          .sidebar-chat__bubble {
            padding: 14px 16px;
            position: relative;
            animation: bubble-in 0.25s ease;
            backdrop-filter: blur(6px);
          }
          @keyframes bubble-in {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .sidebar-chat__author {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            color: rgba(79,70,229,0.9);
            letter-spacing: 0.6px;
            margin-bottom: 4px;
          }
          .sidebar-chat__files {
            margin-top: 10px;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
          .sidebar-chat__file {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 10px 12px;
            border-radius: 14px;
            background: rgba(255,255,255,0.14);
            border: 1px solid rgba(255,255,255,0.25);
          }
          .sidebar-chat__message:not(.sidebar-chat__message--self) .sidebar-chat__file {
            background: #f8f9ff;
            border-color: rgba(79,70,229,0.12);
          }
          .sidebar-chat__file-icon {
            width: 32px;
            height: 32px;
            border-radius: 10px;
            background: rgba(79,70,229,0.12);
            display: flex;
            align-items: center;
            justify-content: center;
            color: #4f46e5;
          }
          .sidebar-chat__message--self .sidebar-chat__file-icon {
            background: rgba(255,255,255,0.2);
            color: #fff;
          }
          .sidebar-chat__file-name {
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 0;
          }
          .sidebar-chat__file-download {
            margin-left: auto;
            color: inherit;
            opacity: 0.7;
            cursor: pointer;
            transition: opacity 0.2s ease, transform 0.2s ease;
          }
          .sidebar-chat__file-download:hover {
            opacity: 1;
            transform: scale(1.1);
          }
          .sidebar-chat__time {
            display: block;
            margin-top: 10px;
            font-size: 11px;
            opacity: 0.7;
            letter-spacing: 0.4px;
          }
          .sidebar-chat__composer {
            padding: 18px 24px 20px;
            background: #ffffff;
            border-top: 1px solid rgba(15, 23, 42, 0.08);
            box-shadow: 0 -18px 45px rgba(15,23,42,0.08);
          }
          .sidebar-chat__composer-inner {
            border: 1px solid rgba(79,70,229,0.25);
            border-radius: 18px;
            padding: 10px 16px;
            background: #f6f5ff;
            transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
          }
          .sidebar-chat__composer-inner:focus-within {
            border-color: #4f46e5;
            background: #fff;
            box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
          }
          .sidebar-chat__textarea {
            width: 100%;
            border: none;
            background: transparent;
            resize: none;
            outline: none;
            font-size: 14px;
            color: #1f2937;
          }
          .sidebar-chat__toolbar {
            display: flex;
            align-items: center;
            justify-content: space-between;
            margin-top: 14px;
            gap: 12px;
            flex-wrap: wrap;
          }
          .sidebar-chat__toolbar button,
          .sidebar-chat__toolbar label {
            border: none;
            background: transparent;
            color: #4f46e5;
            cursor: pointer;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            gap: 6px;
            padding: 6px 12px;
            border-radius: 999px;
            transition: background 0.2s ease;
          }
          .sidebar-chat__toolbar button:hover,
          .sidebar-chat__toolbar label:hover {
            background: rgba(79,70,229,0.1);
          }
          .sidebar-chat__toolbar button:disabled {
            opacity: 0.4;
            cursor: not-allowed;
          }
          .sidebar-chat__attachments {
            margin-bottom: 16px;
            border: 1px dashed rgba(79,70,229,0.3);
            border-radius: 18px;
            padding: 12px;
            background: rgba(79,70,229,0.04);
            max-height: 180px;
            overflow-y: auto;
          }
          .sidebar-chat__attachment-item {
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 12px;
            background: #fff;
            border-radius: 12px;
            border: 1px solid rgba(15,23,42,0.08);
            margin-bottom: 8px;
          }
          .sidebar-chat__attachment-meta {
            display: flex;
            flex-direction: column;
            font-size: 12px;
            margin-left: 10px;
          }
          .sidebar-chat__status-pill {
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: rgba(34,197,94,0.12);
            color: #15803d;
            border-radius: 999px;
            padding: 4px 10px;
            font-size: 12px;
            font-weight: 600;
          }
          .sidebar-chat__close {
            width: 40px;
            height: 40px;
            border: none;
            border-radius: 14px;
            background: rgba(15,23,42,0.05);
            color: #111827;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-shadow: 0 10px 25px rgba(15,23,42,0.12);
            transition: background 0.2s ease, transform 0.2s ease;
          }
          .sidebar-chat__close:hover {
            background: rgba(79,70,229,0.12);
            transform: translateY(-1px);
          }
          .sidebar-chat__close-icon {
            font-size: 22px;
            line-height: 1;
            font-weight: 600;
          }
          @media (max-width: 480px) {
            .sidebar-chat {
              width: 100%;
            }
          }
        `}
      </style>

      <header className="sidebar-chat__header">
        <div className="sidebar-chat__task">
          <div className="sidebar-chat__avatar">{taskInitial}</div>
          <div>
            <h6>{taskName || "Task Discussion"}</h6>
            <small>Task ID #{taskId}</small>
            <div className="mt-2 d-flex align-items-center gap-2 flex-wrap">
              <span className="sidebar-chat__status-pill">
                <span
                  className="d-inline-block rounded-circle"
                  style={{ width: 8, height: 8, background: connection ? "#22c55e" : "#ef4444" }}
                />
                {connection ? "Live sync" : "Offline"}
              </span>
              <small className="text-muted">You are signed in as {username}</small>
            </div>
          </div>
        </div>
        <button className="sidebar-chat__close" onClick={() => setOpenSidebar(null)} aria-label="Close chat panel">
          <span className="sidebar-chat__close-icon">&times;</span>
        </button>
      </header>

      <section className="sidebar-chat__body">
        {normalizedMessages.length === 0 && (
          <div className="text-center text-muted py-5">
            <i className="bx bx-message-square-dots display-6 mb-2" />
            <p className="fw-semibold">No messages yet</p>
            <small>Start the conversation to keep everyone aligned.</small>
          </div>
        )}

        {normalizedMessages.map((chat, index) => (
          <MessageBubble key={`chat-${taskId}-${index}`} chat={chat} currentUserId={Number(Id)} />
        ))}

        <div ref={messagesEndRef} />
      </section>

      <footer className="sidebar-chat__composer">
        {selectedFiles.length > 0 && (
          <div className="sidebar-chat__attachments">
            <div className="d-flex justify-content-between mb-2">
              <strong className="text-primary d-flex align-items-center gap-2">
                <i className="bx bx-paperclip" />
                {selectedFiles.length} file{selectedFiles.length > 1 ? "s" : ""} queued
              </strong>
              <button className="btn btn-sm btn-outline-danger rounded-pill" onClick={() => setSelectedFiles([])}>
                Clear all
              </button>
            </div>

            {selectedFiles.map((file, index) => (
              <div className="sidebar-chat__attachment-item" key={`attach-${index}`}>
                <div className="d-flex align-items-center flex-grow-1">
                  <div className="sidebar-chat__file-icon">
                    <i className="bx bx-file" />
                  </div>
                  <div className="sidebar-chat__attachment-meta">
                    <span className="fw-semibold text-dark">{file.name}</span>
                    <small className="text-muted">{formatFileSize(file.size)}</small>
                  </div>
                </div>
                <button
                  type="button"
                  className="btn btn-link text-danger p-0 ms-2"
                  onClick={() => removeFile(index)}
                >
                  <i className="bx bx-x fs-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="sidebar-chat__composer-inner" onFocus={() => setComposerExpanded(true)}>
          <textarea
            ref={messageInputRef}
            className="sidebar-chat__textarea"
            placeholder="Share an update, link, or attach a file…"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyPress={handleKeyPress}
            rows={composerExpanded ? 3 : 2}
          />
        </div>

        <div className="sidebar-chat__toolbar">
          <div className="d-flex gap-3">
            <label htmlFor="chat-attachment-input" className="mb-0">
              <i className="bx bx-paperclip" /> Attach
            </label>

          </div>
          <div>
            <button
              type="button"
              className="btn btn-primary rounded-pill px-4"
              onClick={sendMessageHandler}
              disabled={isUploading || (!message.trim() && selectedFiles.length === 0)}
            >
              {isUploading ? (
                <>
                  <i className="bx bx-loader-alt bx-spin me-2" />
                  Uploading…
                </>
              ) : (
                <>
                  <i className="bx bx-send me-2" />
                  Send
                </>
              )}
            </button>
          </div>
        </div>

        <input
          ref={fileInputRef}
          id="chat-attachment-input"
          type="file"
          multiple
          style={{ display: "none" }}
          onChange={handleFileSelect}
          accept="*/*"
        />


      </footer>
    </aside>
  );
};

export default SidebarChat;
