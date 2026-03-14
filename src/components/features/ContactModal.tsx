"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  contactUrl: string;
  contactType?: string;
}

export function ContactModal({ isOpen, onClose, teamName, contactUrl }: ContactModalProps) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const isKakao = contactUrl.includes("kakao");
  const linkLabel = isKakao ? "카카오톡 오픈채팅방" : "외부 링크";
  const linkEmoji = isKakao ? "💬" : "🔗";

  const handleCopyLink = () => {
    navigator.clipboard.writeText(contactUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSendMessage = () => {
    const messages = JSON.parse(localStorage.getItem("dacon_messages") || "[]");
    messages.push({
      id: Date.now().toString(),
      teamName,
      message,
      sentAt: new Date().toISOString(),
    });
    localStorage.setItem("dacon_messages", JSON.stringify(messages));
    setSent(true);
    setTimeout(() => {
      setSent(false);
      setMessage("");
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md animate-fade-in-up rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-900"
        onClick={(e) => e.stopPropagation()}
      >
        {sent ? (
          <div className="py-8 text-center">
            <p className="mb-2 text-3xl">✅</p>
            <p className="font-semibold text-gray-900 dark:text-white">메시지를 전송했습니다!</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{teamName}에게 연락이 전달됩니다.</p>
          </div>
        ) : (
          <>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {teamName} 참여하기
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                ✕
              </button>
            </div>

            {/* 오픈채팅방 링크 영역 */}
            <div className="mb-5 rounded-xl border-2 border-blue-100 bg-blue-50/50 p-4 dark:border-blue-900/40 dark:bg-blue-900/20">
              <div className="mb-2 flex items-center gap-2">
                <span className="text-lg">{linkEmoji}</span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">{linkLabel}</span>
              </div>
              <p className="mb-3 text-xs text-gray-500 dark:text-gray-400">
                {isKakao
                  ? "팀장이 등록한 카카오톡 오픈채팅방에 참여하여 팀원들과 소통할 수 있습니다."
                  : "팀장이 등록한 외부 링크를 통해 팀에 참여할 수 있습니다."}
              </p>

              <div className="flex gap-2">
                <a
                  href={contactUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-blue-700"
                >
                  {isKakao ? "💬 오픈채팅방 참여" : "🔗 링크 열기"}
                </a>
                <button
                  onClick={handleCopyLink}
                  className="rounded-lg border border-gray-200 px-3 py-2.5 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
                >
                  {copied ? "✓ 복사됨" : "📋 복사"}
                </button>
              </div>
            </div>

            {/* 구분선 */}
            <div className="relative my-5">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200 dark:border-gray-700" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-2 text-gray-400 dark:bg-gray-900">또는 메시지 보내기</span>
              </div>
            </div>

            {/* 메시지 폼 */}
            <div className="mb-4">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="팀에게 보낼 메시지를 작성하세요 (자기소개, 보유 역할 등)..."
                rows={3}
                className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={onClose} className="flex-1 !bg-gray-100 !text-gray-700 hover:!bg-gray-200 dark:!bg-gray-800 dark:!text-gray-300">
                닫기
              </Button>
              <Button onClick={handleSendMessage} disabled={!message.trim()} className="flex-1">
                메시지 보내기
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
