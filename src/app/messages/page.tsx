"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/features/AuthProvider";
import {
  getConversationList,
  getConversation,
  sendMessage,
  markMessagesRead,
  getUnreadMessageCount,
  getInvitationsForUser,
  acceptInvitation,
  rejectInvitation,
  addNotification,
  logActivity,
} from "@/lib/data";
import type { DirectMessage, Conversation, TeamInvitation } from "@/types";

export default function MessagesPage() {
  const { user, getAllProfiles } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [activeTab, setActiveTab] = useState<"messages" | "invitations">("messages");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const loadData = useCallback(() => {
    if (!user) return;
    setConversations(getConversationList(user.id));
    setInvitations(getInvitationsForUser(user.id).filter((i) => i.status === "pending"));
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData, refreshKey]);

  // 5초마다 새 메시지 확인
  useEffect(() => {
    const interval = setInterval(() => setRefreshKey((k) => k + 1), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!user || !selectedPartnerId) return;
    setMessages(getConversation(user.id, selectedPartnerId));
    markMessagesRead(user.id, selectedPartnerId);
    // 대화 목록 새로고침 (읽음 처리 반영)
    setConversations(getConversationList(user.id));
  }, [user, selectedPartnerId, refreshKey]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (!user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <p className="text-gray-500 dark:text-gray-400">로그인이 필요합니다.</p>
      </div>
    );
  }

  const profiles = getAllProfiles().filter((p) => p.id !== user.id);
  const filteredProfiles = searchQuery
    ? profiles.filter(
        (p) =>
          p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.nickname.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const selectedPartner = selectedPartnerId
    ? profiles.find((p) => p.id === selectedPartnerId) ||
      conversations.find((c) => c.partnerId === selectedPartnerId)
    : null;
  const partnerName =
    selectedPartner && "name" in selectedPartner
      ? selectedPartner.name
      : selectedPartner && "partnerName" in selectedPartner
        ? selectedPartner.partnerName
        : "";

  const handleSend = () => {
    if (!newMessage.trim() || !selectedPartnerId) return;
    sendMessage(user.id, user.name, selectedPartnerId, partnerName, newMessage.trim());
    setNewMessage("");
    setMessages(getConversation(user.id, selectedPartnerId));
    setConversations(getConversationList(user.id));
  };

  const handleStartChat = (partnerId: string) => {
    setSelectedPartnerId(partnerId);
    setShowNewChat(false);
    setSearchQuery("");
  };

  const handleAcceptInvite = (inv: TeamInvitation) => {
    const success = acceptInvitation(inv.id, user.id, user.name);
    if (success) {
      addNotification(inv.inviterId, {
        message: `${user.name}님이 ${inv.teamName} 팀 초대를 수락했습니다.`,
        timestamp: new Date().toISOString(),
        type: "success",
        link: `/camp`,
      });
      logActivity({
        type: "team_created",
        message: `${user.name}님이 ${inv.teamName} 팀 초대를 수락하여 합류했습니다.`,
        timestamp: new Date().toISOString(),
        hackathonSlug: inv.hackathonSlug,
      });
    }
    loadData();
  };

  const handleRejectInvite = (inv: TeamInvitation) => {
    rejectInvitation(inv.id);
    addNotification(inv.inviterId, {
      message: `${user.name}님이 ${inv.teamName} 팀 초대를 거절했습니다.`,
      timestamp: new Date().toISOString(),
      type: "warning",
    });
    loadData();
  };

  const totalUnread = getUnreadMessageCount(user.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">메시지</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalUnread > 0 ? `읽지 않은 메시지 ${totalUnread}개` : "모든 메시지를 확인했습니다"}
          </p>
        </div>
        <button
          onClick={() => setShowNewChat(!showNewChat)}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          새 대화
        </button>
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-800">
        <button
          onClick={() => setActiveTab("messages")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "messages"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          대화 {totalUnread > 0 && <span className="ml-1 rounded-full bg-blue-600 px-2 py-0.5 text-xs text-white">{totalUnread}</span>}
        </button>
        <button
          onClick={() => setActiveTab("invitations")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "invitations"
              ? "bg-white text-gray-900 shadow dark:bg-gray-700 dark:text-white"
              : "text-gray-500 hover:text-gray-700 dark:text-gray-400"
          }`}
        >
          팀 초대 {invitations.length > 0 && <span className="ml-1 rounded-full bg-orange-500 px-2 py-0.5 text-xs text-white">{invitations.length}</span>}
        </button>
      </div>

      {activeTab === "invitations" && (
        <div className="space-y-3">
          {invitations.length === 0 ? (
            <div className="rounded-xl border border-gray-200 py-12 text-center dark:border-gray-700">
              <p className="text-4xl">📬</p>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">받은 팀 초대가 없습니다.</p>
            </div>
          ) : (
            invitations.map((inv) => (
              <div
                key={inv.id}
                className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {inv.inviterName}님이 <span className="text-blue-600 dark:text-blue-400">{inv.teamName}</span> 팀에 초대했습니다
                    </p>
                    <p className="mt-1 text-xs text-gray-500">
                      만료: {new Date(inv.expiresAt).toLocaleString("ko-KR")}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptInvite(inv)}
                      className="rounded-lg bg-green-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                    >
                      수락
                    </button>
                    <button
                      onClick={() => handleRejectInvite(inv)}
                      className="rounded-lg bg-gray-200 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300"
                    >
                      거절
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "messages" && (
        <div className="flex h-[calc(100vh-280px)] min-h-[500px] overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
          {/* Sidebar - Conversation List */}
          <div className="w-80 flex-shrink-0 border-r border-gray-200 dark:border-gray-700">
            {showNewChat && (
              <div className="border-b border-gray-200 p-3 dark:border-gray-700">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="사용자 검색..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  autoFocus
                />
                {filteredProfiles.length > 0 && (
                  <div className="mt-2 max-h-48 space-y-1 overflow-y-auto">
                    {filteredProfiles.slice(0, 8).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => handleStartChat(p.id)}
                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                          {p.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{p.name}</p>
                          <p className="text-xs text-gray-500">{p.skills.slice(0, 2).join(", ")}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <div className="overflow-y-auto" style={{ height: showNewChat ? "calc(100% - 120px)" : "100%" }}>
              {conversations.length === 0 ? (
                <div className="flex h-full items-center justify-center p-4">
                  <p className="text-center text-sm text-gray-400">대화가 없습니다. &quot;새 대화&quot;를 시작해보세요.</p>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setSelectedPartnerId(conv.partnerId)}
                    className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors dark:border-gray-800 ${
                      selectedPartnerId === conv.partnerId
                        ? "bg-blue-50 dark:bg-blue-900/20"
                        : "hover:bg-gray-50 dark:hover:bg-gray-800"
                    }`}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                      {conv.partnerName.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{conv.partnerName}</p>
                        <span className="text-xs text-gray-400">
                          {formatTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {conv.lastMessage}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="ml-2 flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs font-medium text-white">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex flex-1 flex-col">
            {selectedPartnerId ? (
              <>
                {/* Chat Header */}
                <div className="flex items-center gap-3 border-b border-gray-200 px-6 py-4 dark:border-gray-700">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-600 dark:bg-blue-900 dark:text-blue-400">
                    {partnerName.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{partnerName}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 space-y-3 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <div className="flex h-full items-center justify-center">
                      <p className="text-sm text-gray-400">첫 메시지를 보내보세요!</p>
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isMine = msg.senderId === user.id;
                      return (
                        <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 ${
                              isMine
                                ? "bg-blue-600 text-white"
                                : "bg-gray-100 text-gray-900 dark:bg-gray-800 dark:text-white"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            <p
                              className={`mt-1 text-right text-xs ${
                                isMine ? "text-blue-200" : "text-gray-400"
                              }`}
                            >
                              {formatTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="border-t border-gray-200 p-4 dark:border-gray-700">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                      placeholder="메시지를 입력하세요..."
                      className="flex-1 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                    <button
                      onClick={handleSend}
                      disabled={!newMessage.trim()}
                      className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      전송
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <p className="text-5xl">💬</p>
                  <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">대화를 선택하거나 새 대화를 시작하세요</p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function formatTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "방금";
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay}일 전`;

  return date.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}
