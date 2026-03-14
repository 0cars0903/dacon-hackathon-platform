// ============================================================
// Supabase Realtime Hooks — Polling 대체
// ============================================================
"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "./client";
import type { TeamChatMessage, DirectMessage } from "@/types";
import type { RealtimeChannel } from "@supabase/supabase-js";

function supabase() {
  return createClient();
}

// ============================================================
// useTeamChat — 팀 채팅 실시간 구독
// ============================================================
export function useTeamChat(teamCode: string | null) {
  const [messages, setMessages] = useState<TeamChatMessage[]>([]);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // 초기 메시지 로드
  useEffect(() => {
    if (!teamCode) return;

    const load = async () => {
      const { data } = await supabase()
        .from("team_chat_messages")
        .select("*")
        .eq("team_code", teamCode)
        .order("created_at", { ascending: true })
        .limit(200);

      setMessages(
        (data ?? []).map(m => ({
          id: m.id,
          teamCode: m.team_code,
          senderId: m.sender_id,
          senderName: m.sender_name,
          content: m.content,
          createdAt: m.created_at,
        }))
      );
    };
    load();
  }, [teamCode]);

  // Realtime 구독
  useEffect(() => {
    if (!teamCode) return;

    const channel = supabase()
      .channel(`team-chat-${teamCode}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "team_chat_messages",
          filter: `team_code=eq.${teamCode}`,
        },
        (payload) => {
          const m = payload.new as Record<string, string>;
          setMessages(prev => [
            ...prev,
            {
              id: m.id,
              teamCode: m.team_code,
              senderId: m.sender_id,
              senderName: m.sender_name,
              content: m.content,
              createdAt: m.created_at,
            },
          ]);
        }
      )
      .subscribe();

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
    };
  }, [teamCode]);

  const sendMessage = useCallback(
    async (senderId: string, senderName: string, content: string) => {
      if (!teamCode) return;
      await supabase().from("team_chat_messages").insert({
        team_code: teamCode,
        sender_id: senderId,
        sender_name: senderName,
        content,
      });
    },
    [teamCode]
  );

  return { messages, sendMessage };
}

// ============================================================
// useDirectMessages — DM 실시간 구독
// ============================================================
export function useDirectMessages(userId: string | null, partnerId: string | null) {
  const [messages, setMessages] = useState<DirectMessage[]>([]);

  // 초기 로드
  useEffect(() => {
    if (!userId || !partnerId) return;

    const load = async () => {
      const { data } = await supabase()
        .from("direct_messages")
        .select("*")
        .or(
          `and(sender_id.eq.${userId},receiver_id.eq.${partnerId}),and(sender_id.eq.${partnerId},receiver_id.eq.${userId})`
        )
        .order("created_at", { ascending: true })
        .limit(200);

      setMessages(
        (data ?? []).map(m => ({
          id: m.id,
          senderId: m.sender_id,
          senderName: m.sender_name,
          receiverId: m.receiver_id,
          receiverName: m.receiver_name,
          content: m.content,
          read: m.read,
          createdAt: m.created_at,
        }))
      );

      // 읽음 처리
      await supabase()
        .from("direct_messages")
        .update({ read: true })
        .eq("sender_id", partnerId)
        .eq("receiver_id", userId)
        .eq("read", false);
    };
    load();
  }, [userId, partnerId]);

  // Realtime 구독
  useEffect(() => {
    if (!userId || !partnerId) return;

    const channel = supabase()
      .channel(`dm-${[userId, partnerId].sort().join("-")}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "direct_messages",
        },
        (payload) => {
          const m = payload.new as Record<string, unknown>;
          // 이 대화에 관련된 메시지만 추가
          const isRelevant =
            (m.sender_id === userId && m.receiver_id === partnerId) ||
            (m.sender_id === partnerId && m.receiver_id === userId);
          if (!isRelevant) return;

          setMessages(prev => [
            ...prev,
            {
              id: m.id as string,
              senderId: m.sender_id as string,
              senderName: m.sender_name as string,
              receiverId: m.receiver_id as string,
              receiverName: m.receiver_name as string,
              content: m.content as string,
              read: m.read as boolean,
              createdAt: m.created_at as string,
            },
          ]);

          // 상대방 메시지 자동 읽음 처리
          if (m.sender_id === partnerId) {
            supabase()
              .from("direct_messages")
              .update({ read: true })
              .eq("id", m.id as string)
              .then(() => {});
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId, partnerId]);

  const sendMessage = useCallback(
    async (senderName: string, receiverName: string, content: string) => {
      if (!userId || !partnerId) return;
      await supabase().from("direct_messages").insert({
        sender_id: userId,
        sender_name: senderName,
        receiver_id: partnerId,
        receiver_name: receiverName,
        content,
      });
    },
    [userId, partnerId]
  );

  return { messages, sendMessage };
}

// ============================================================
// useNotifications — 알림 실시간 구독
// ============================================================
export function useNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<
    Array<{ id: string; message: string; read: boolean; timestamp: string; link?: string; type?: string }>
  >([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!userId) return;

    const load = async () => {
      const { data } = await supabase()
        .from("notifications")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);

      const mapped = (data ?? []).map(n => ({
        id: n.id,
        message: n.message,
        read: n.read,
        timestamp: n.created_at,
        link: n.link ?? undefined,
        type: n.type ?? undefined,
      }));
      setNotifications(mapped);
      setUnreadCount(mapped.filter(n => !n.read).length);
    };
    load();

    // Realtime
    const channel = supabase()
      .channel(`notifications-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const n = payload.new as Record<string, unknown>;
          const newNotif = {
            id: n.id as string,
            message: n.message as string,
            read: false,
            timestamp: n.created_at as string,
            link: n.link as string | undefined,
            type: n.type as string | undefined,
          };
          setNotifications(prev => [newNotif, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [userId]);

  const markRead = useCallback(async (notificationId: string) => {
    await supabase().from("notifications").update({ read: true }).eq("id", notificationId);
    setNotifications(prev =>
      prev.map(n => (n.id === notificationId ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllRead = useCallback(async () => {
    if (!userId) return;
    await supabase()
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false);
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  }, [userId]);

  return { notifications, unreadCount, markRead, markAllRead };
}
