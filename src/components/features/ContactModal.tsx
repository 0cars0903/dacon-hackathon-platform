"use client";

import { useState } from "react";
import { Button } from "@/components/common/Button";

interface ContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamName: string;
  contactUrl: string;
}

export function ContactModal({ isOpen, onClose, teamName, contactUrl }: ContactModalProps) {
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);

  if (!isOpen) return null;

  const handleSend = () => {
    // 데모: localStorage에 메시지 저장
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
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {teamName}에 연락하기
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                ✕
              </button>
            </div>

            <div className="mb-4 rounded-lg bg-blue-50 p-3 dark:bg-blue-900/20">
              <p className="text-xs text-blue-600 dark:text-blue-400">
                💡 팀의 외부 연락처로도 접근할 수 있습니다:
              </p>
              <a
                href={contactUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {contactUrl.includes("kakao") ? "🔗 오픈 카카오톡" : "🔗 외부 링크"} →
              </a>
            </div>

            <div className="mb-4">
              <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300">
                메시지
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="팀에게 보낼 메시지를 작성하세요..."
                rows={4}
                className="w-full rounded-lg border border-gray-200 p-3 text-sm focus:border-blue-500 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={onClose} className="flex-1 !bg-gray-100 !text-gray-700 hover:!bg-gray-200 dark:!bg-gray-800 dark:!text-gray-300">
                취소
              </Button>
              <Button onClick={handleSend} disabled={!message.trim()} className="flex-1">
                메시지 보내기
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
