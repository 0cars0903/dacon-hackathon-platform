import { type ClassValue, clsx } from "clsx";

/**
 * 클래스명 병합 유틸리티 (clsx 기반, tailwind-merge 없이 경량 구현)
 */
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * 날짜 포맷팅 (한국어)
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 날짜+시간 포맷팅
 */
export function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * D-day 계산
 */
export function getDday(dateStr: string): string {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));

  if (diff > 0) return `D-${diff}`;
  if (diff === 0) return "D-Day";
  return `D+${Math.abs(diff)}`;
}

/**
 * 금액 포맷팅 (원)
 */
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR").format(amount) + "원";
}

/**
 * 상태 배지 색상
 */
export function getStatusColor(status: string): string {
  switch (status) {
    case "ongoing":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
    case "ended":
      return "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
    case "upcoming":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
    default:
      return "bg-gray-100 text-gray-600";
  }
}

/**
 * 상태 한글 변환
 */
export function getStatusLabel(status: string): string {
  switch (status) {
    case "ongoing":
      return "진행중";
    case "ended":
      return "종료";
    case "upcoming":
      return "예정";
    default:
      return status;
  }
}

/**
 * 종료된 해커톤이 2주 이내인지 확인
 */
export function isWithinTwoWeeks(endDateStr: string): boolean {
  const endDate = new Date(endDateStr).getTime();
  const twoWeeksMs = 14 * 24 * 60 * 60 * 1000;
  return Date.now() - endDate <= twoWeeksMs;
}

/**
 * 상대적 시간 표시 ("3시간 전", "2일 전")
 */
export function timeAgo(dateStr: string): string {
  const now = Date.now();
  const past = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - past) / 1000);

  if (diffSec < 60) return "방금 전";
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}분 전`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}시간 전`;
  if (diffSec < 604800) return `${Math.floor(diffSec / 86400)}일 전`;
  return formatDate(dateStr);
}
