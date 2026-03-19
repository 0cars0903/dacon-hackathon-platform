"use client";

import { useState, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { followUser, unfollowUser, isFollowing, getFollowCounts, addNotification } from "@/lib/supabase/data";

interface FollowButtonProps {
  targetUserId: string;
  targetUserName: string;
  size?: "sm" | "md";
  onFollowChange?: () => void;
}

export function FollowButton({ targetUserId, targetUserName, size = "md", onFollowChange }: FollowButtonProps) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      const load = async () => {
        const result = await isFollowing(user.id, targetUserId);
        setFollowing(result);
      };
      load();
    }
  }, [user, targetUserId]);

  if (!user || user.id === targetUserId) return null;

  const handleToggle = async () => {
    setLoading(true);
    if (following) {
      await unfollowUser(user.id, targetUserId);
      setFollowing(false);
    } else {
      await followUser(user.id, targetUserId);
      setFollowing(true);
      await addNotification(targetUserId, {
        message: `${user.name}님이 회원님을 팔로우하기 시작했습니다.`,
        type: "info",
        link: `/users/${user.id}`,
      });
    }
    onFollowChange?.();
    setLoading(false);
  };

  const sizeClasses = size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-2 text-sm";

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={`rounded-lg font-medium transition-colors ${sizeClasses} ${
        following
          ? "border border-slate-300 bg-white text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-300 dark:hover:border-red-500 dark:hover:text-red-400"
          : "bg-indigo-600 text-white hover:bg-indigo-700"
      } disabled:opacity-50`}
    >
      {following ? "팔로잉" : "팔로우"}
    </button>
  );
}

interface FollowStatsProps {
  userId: string;
  className?: string;
}

export function FollowStats({ userId, className = "" }: FollowStatsProps) {
  const [counts, setCounts] = useState({ followers: 0, following: 0 });

  useEffect(() => {
    const load = async () => {
      const result = await getFollowCounts(userId);
      setCounts(result);
    };
    load();
  }, [userId]);

  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <div className="text-center">
        <p className="text-lg font-bold text-slate-900 dark:text-white">{counts.followers}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">팔로워</p>
      </div>
      <div className="text-center">
        <p className="text-lg font-bold text-slate-900 dark:text-white">{counts.following}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">팔로잉</p>
      </div>
    </div>
  );
}
